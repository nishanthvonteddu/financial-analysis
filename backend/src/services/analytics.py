from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.category import Category
from src.models.payment_history import PaymentHistory
from src.models.payment_method import PaymentMethod
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.analytics import (
    AnalyticsCategoryItem,
    AnalyticsFrequencyItem,
    AnalyticsPaymentMethodItem,
    AnalyticsRangeKey,
    AnalyticsResponse,
    AnalyticsSummary,
    AnalyticsTrendCategoryItem,
    AnalyticsTrendPoint,
    AnalyticsWindow,
)

logger = get_logger(__name__)

WINDOW_CONFIG: dict[AnalyticsRangeKey, dict[str, int | str]] = {
    "90d": {"days": 90, "label": "Last 90 days", "projection_months": 3},
    "180d": {"days": 180, "label": "Last 180 days", "projection_months": 6},
    "365d": {"days": 365, "label": "Last 365 days", "projection_months": 12},
}
CADENCE_LABELS = {
    "weekly": "Weekly cadence",
    "monthly": "Monthly cadence",
    "quarterly": "Quarterly cadence",
    "yearly": "Yearly cadence",
}
CADENCE_ORDER = {"monthly": 0, "quarterly": 1, "yearly": 2, "weekly": 3}
TREND_CATEGORY_LIMIT = 4


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _monthly_equivalent(subscription: Subscription) -> Decimal:
    cadence = subscription.cadence.lower()
    amount = Decimal(subscription.amount)

    if cadence == "weekly":
        return _quantize_money((amount * Decimal(52)) / Decimal(12))
    if cadence == "quarterly":
        return _quantize_money(amount / Decimal(3))
    if cadence == "yearly":
        return _quantize_money(amount / Decimal(12))
    return _quantize_money(amount)


def _month_start(value: date) -> date:
    return value.replace(day=1)


def _shift_months(value: date, offset: int) -> date:
    month_index = (value.year * 12 + value.month - 1) + offset
    year = month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def _category_name(subscription: Subscription, category_map: dict[int, str]) -> str:
    if subscription.category_id is None:
        return "Uncategorized"
    return category_map.get(subscription.category_id, "Uncategorized")


def _payment_method_key(
    payment_method_id: int | None,
    payment_method_map: dict[int, PaymentMethod],
) -> tuple[int | None, str, str | None]:
    if payment_method_id is None:
        return (None, "Unassigned", None)

    payment_method = payment_method_map.get(payment_method_id)
    if payment_method is None:
        return (payment_method_id, f"Method #{payment_method_id}", None)

    provider = payment_method.provider.strip() or None
    provider_prefix = f"{provider} " if provider else ""
    last4 = payment_method.last4.strip() if payment_method.last4 else ""
    suffix = f" ending {last4}" if last4 else ""
    return (
        payment_method.id,
        f"{provider_prefix}{payment_method.label}{suffix}".strip(),
        provider,
    )


async def get_expense_analytics(
    session: AsyncSession,
    *,
    user: User,
    range_key: AnalyticsRangeKey,
) -> AnalyticsResponse:
    config = WINDOW_CONFIG[range_key]
    today = date.today()
    window_days = int(config["days"])
    projection_months = Decimal(str(config["projection_months"]))
    window_start = today - timedelta(days=window_days - 1)
    window_start_at = datetime.combine(window_start, datetime.min.time(), tzinfo=UTC)
    window_end_at = datetime.combine(today + timedelta(days=1), datetime.min.time(), tzinfo=UTC)

    subscriptions = list(
        (
            await session.scalars(
                select(Subscription)
                .where(Subscription.user_id == user.id)
                .order_by(Subscription.id.asc())
            )
        ).all()
    )
    active_subscriptions = [
        subscription for subscription in subscriptions if subscription.status == "active"
    ]

    category_ids = sorted(
        {
            subscription.category_id
            for subscription in subscriptions
            if subscription.category_id is not None
        }
    )
    categories = (
        list((await session.scalars(select(Category).where(Category.id.in_(category_ids)))).all())
        if category_ids
        else []
    )
    category_map = {category.id: category.name for category in categories}

    payment_rows = list(
        (
            await session.execute(
                select(PaymentHistory, Subscription)
                .join(Subscription, Subscription.id == PaymentHistory.subscription_id)
                .where(
                    Subscription.user_id == user.id,
                    PaymentHistory.paid_at >= window_start_at,
                    PaymentHistory.paid_at < window_end_at,
                )
                .order_by(PaymentHistory.paid_at.asc(), PaymentHistory.id.asc())
            )
        ).all()
    )

    payment_method_ids = sorted(
        {
            payment_method_id
            for payment_method_id in (
                *(subscription.payment_method_id for subscription in subscriptions),
                *(
                    payment.payment_method_id or subscription.payment_method_id
                    for payment, subscription in payment_rows
                ),
            )
            if payment_method_id is not None
        }
    )
    payment_methods = (
        list(
            (
                await session.scalars(
                    select(PaymentMethod).where(PaymentMethod.id.in_(payment_method_ids))
                )
            ).all()
        )
        if payment_method_ids
        else []
    )
    payment_method_map = {payment_method.id: payment_method for payment_method in payment_methods}

    category_spend_totals: dict[tuple[int | None, str], Decimal] = defaultdict(
        lambda: Decimal("0.00")
    )
    method_spend_totals: dict[tuple[int | None, str, str | None], Decimal] = defaultdict(
        lambda: Decimal("0.00")
    )
    trend_totals: dict[date, Decimal] = defaultdict(lambda: Decimal("0.00"))
    trend_category_totals: dict[tuple[date, str], Decimal] = defaultdict(
        lambda: Decimal("0.00")
    )
    total_spend = Decimal("0.00")

    for payment, subscription in payment_rows:
        amount = _quantize_money(abs(Decimal(payment.amount)))
        total_spend += amount

        category_name = _category_name(subscription, category_map)
        category_key = (subscription.category_id, category_name)
        category_spend_totals[category_key] += amount

        payment_method_key = _payment_method_key(
            payment.payment_method_id or subscription.payment_method_id,
            payment_method_map,
        )
        method_spend_totals[payment_method_key] += amount

        paid_at = payment.paid_at.astimezone(UTC) if payment.paid_at.tzinfo else payment.paid_at
        month_key = _month_start(paid_at.date())
        trend_totals[month_key] += amount
        trend_category_totals[(month_key, category_name)] += amount

    category_projection: dict[tuple[int | None, str], dict[str, Decimal | int]] = defaultdict(
        lambda: {
            "active_subscriptions": 0,
            "projected_monthly_savings": Decimal("0.00"),
        }
    )
    payment_method_projection: dict[
        tuple[int | None, str, str | None], dict[str, int]
    ] = defaultdict(lambda: {"active_subscriptions": 0})
    frequency_totals: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {
            "subscription_count": 0,
            "monthly_equivalent": Decimal("0.00"),
        }
    )

    for subscription in active_subscriptions:
        monthly_equivalent = _monthly_equivalent(subscription)
        category_key = (
            subscription.category_id,
            _category_name(subscription, category_map),
        )
        category_projection_entry = category_projection[category_key]
        category_projection_entry["active_subscriptions"] = (
            int(category_projection_entry["active_subscriptions"]) + 1
        )
        category_projection_entry["projected_monthly_savings"] = Decimal(
            category_projection_entry["projected_monthly_savings"]
        ) + monthly_equivalent

        payment_method_projection_entry = payment_method_projection[
            _payment_method_key(subscription.payment_method_id, payment_method_map)
        ]
        payment_method_projection_entry["active_subscriptions"] = (
            int(payment_method_projection_entry["active_subscriptions"]) + 1
        )

        cadence = subscription.cadence.lower()
        frequency_entry = frequency_totals[cadence]
        frequency_entry["subscription_count"] = int(frequency_entry["subscription_count"]) + 1
        frequency_entry["monthly_equivalent"] = Decimal(
            frequency_entry["monthly_equivalent"]
        ) + monthly_equivalent

    projected_monthly_savings = _quantize_money(
        sum(
            (
                Decimal(entry["projected_monthly_savings"])
                for entry in category_projection.values()
            ),
            Decimal("0.00"),
        )
    )
    projected_range_savings = _quantize_money(projected_monthly_savings * projection_months)

    categories_payload = [
        AnalyticsCategoryItem(
            category_id=category_id,
            category_name=category_name,
            total_spend=_quantize_money(category_spend_totals[(category_id, category_name)]),
            active_subscriptions=int(
                category_projection[(category_id, category_name)]["active_subscriptions"]
            ),
            projected_monthly_savings=_quantize_money(
                Decimal(
                    category_projection[(category_id, category_name)]["projected_monthly_savings"]
                )
            ),
            projected_range_savings=_quantize_money(
                Decimal(
                    category_projection[(category_id, category_name)]["projected_monthly_savings"]
                )
                * projection_months
            ),
        )
        for category_id, category_name in sorted(
            set(category_spend_totals) | set(category_projection),
            key=lambda item: (
                Decimal(category_projection[item]["projected_monthly_savings"]),
                category_spend_totals[item],
                item[1].lower(),
            ),
            reverse=True,
        )
    ]

    payment_methods_payload = [
        AnalyticsPaymentMethodItem(
            payment_method_id=payment_method_id,
            payment_method_label=payment_method_label,
            provider=provider,
            total_spend=_quantize_money(
                method_spend_totals[(payment_method_id, payment_method_label, provider)]
            ),
            active_subscriptions=int(
                payment_method_projection[
                    (payment_method_id, payment_method_label, provider)
                ]["active_subscriptions"]
            ),
        )
        for payment_method_id, payment_method_label, provider in sorted(
            set(method_spend_totals) | set(payment_method_projection),
            key=lambda item: (
                method_spend_totals[item],
                payment_method_projection[item]["active_subscriptions"],
                item[1].lower(),
            ),
            reverse=True,
        )
    ]

    frequency_distribution = [
        AnalyticsFrequencyItem(
            cadence=cadence,
            label=CADENCE_LABELS.get(cadence, cadence.capitalize()),
            subscription_count=int(values["subscription_count"]),
            monthly_equivalent=_quantize_money(Decimal(values["monthly_equivalent"])),
        )
        for cadence, values in sorted(
            frequency_totals.items(),
            key=lambda item: (
                CADENCE_ORDER.get(item[0], 99),
                item[0],
            ),
        )
    ]

    trend_categories = [
        category.category_name
        for category in sorted(
            categories_payload,
            key=lambda item: (
                item.total_spend,
                item.projected_monthly_savings,
                item.category_name.lower(),
            ),
            reverse=True,
        )[:TREND_CATEGORY_LIMIT]
    ]

    trend_points: list[AnalyticsTrendPoint] = []
    cursor = _month_start(window_start)
    final_month = _month_start(today)
    show_year = cursor.year != final_month.year
    while cursor <= final_month:
        trend_points.append(
            AnalyticsTrendPoint(
                period_start=cursor,
                label=cursor.strftime("%b %y" if show_year else "%b"),
                total_spend=_quantize_money(trend_totals[cursor]),
                category_totals=[
                    AnalyticsTrendCategoryItem(
                        category_name=category_name,
                        total_spend=_quantize_money(
                            trend_category_totals[(cursor, category_name)]
                        ),
                    )
                    for category_name in trend_categories
                ],
            )
        )
        cursor = _shift_months(cursor, 1)

    response = AnalyticsResponse(
        window=AnalyticsWindow(
            key=range_key,
            label=str(config["label"]),
            start_date=window_start,
            end_date=today,
        ),
        summary=AnalyticsSummary(
            total_spend=_quantize_money(total_spend),
            average_monthly_spend=_quantize_money(
                total_spend / projection_months if projection_months else Decimal("0.00")
            ),
            active_subscriptions=len(active_subscriptions),
            projected_monthly_savings=projected_monthly_savings,
            projected_range_savings=projected_range_savings,
        ),
        categories=categories_payload,
        payment_methods=payment_methods_payload,
        frequency_distribution=frequency_distribution,
        trends=trend_points,
        trend_categories=trend_categories,
    )
    logger.info(
        "analytics.summary.loaded",
        user_id=user.id,
        range_key=range_key,
        active_subscriptions=response.summary.active_subscriptions,
        categories=len(response.categories),
        payment_methods=len(response.payment_methods),
    )
    return response
