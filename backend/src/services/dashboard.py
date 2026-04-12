from datetime import UTC, date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.category import Category
from src.models.dashboard_layout import DashboardLayout
from src.models.payment_history import PaymentHistory
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.dashboard import (
    DashboardActiveSubscriptionItem,
    DashboardCategoryBreakdownItem,
    DashboardLayoutResponse,
    DashboardLayoutUpdate,
    DashboardLayoutWidget,
    DashboardMonthlySpendPoint,
    DashboardRecentlyEndedItem,
    DashboardSummaryResponse,
    DashboardSummaryStats,
    DashboardUpcomingRenewalItem,
)

logger = get_logger(__name__)

UPCOMING_WINDOW_DAYS = 30
RECENTLY_ENDED_WINDOW_DAYS = 90
MONTHLY_SPEND_MONTHS = 6

DEFAULT_DASHBOARD_LAYOUT = DashboardLayoutUpdate(
    widgets=[
        DashboardLayoutWidget(id="active-subscriptions", column="primary"),
        DashboardLayoutWidget(id="monthly-spend", column="primary"),
        DashboardLayoutWidget(id="recently-ended", column="primary"),
        DashboardLayoutWidget(id="category-breakdown", column="secondary"),
        DashboardLayoutWidget(id="upcoming-renewals", column="secondary"),
    ]
)


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


async def get_dashboard_summary(
    session: AsyncSession,
    *,
    user: User,
) -> DashboardSummaryResponse:
    today = date.today()
    upcoming_cutoff = today + timedelta(days=UPCOMING_WINDOW_DAYS)
    recent_cutoff = today - timedelta(days=RECENTLY_ENDED_WINDOW_DAYS)

    subscriptions = list(
        (
            await session.scalars(
                select(Subscription)
                .where(Subscription.user_id == user.id)
                .order_by(Subscription.id.asc())
            )
        ).all()
    )
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

    active_subscriptions = [
        subscription for subscription in subscriptions if subscription.status == "active"
    ]
    cancelled_subscriptions = [
        subscription for subscription in subscriptions if subscription.status == "cancelled"
    ]
    upcoming_renewals = sorted(
        [
            subscription
            for subscription in active_subscriptions
            if subscription.next_charge_date is not None
            and today <= subscription.next_charge_date <= upcoming_cutoff
        ],
        key=lambda subscription: (subscription.next_charge_date, subscription.id),
    )
    recently_ended = sorted(
        [
            subscription
            for subscription in cancelled_subscriptions
            if subscription.end_date is not None and recent_cutoff <= subscription.end_date <= today
        ],
        key=lambda subscription: (subscription.end_date, subscription.id),
        reverse=True,
    )

    total_monthly_spend = _quantize_money(
        sum(
            (_monthly_equivalent(subscription) for subscription in active_subscriptions),
            Decimal("0.00"),
        )
    )

    category_totals: dict[tuple[int | None, str], dict[str, Decimal | int]] = {}
    for subscription in active_subscriptions:
        category_name = (
            category_map.get(subscription.category_id)
            if subscription.category_id is not None
            else "Uncategorized"
        ) or "Uncategorized"
        category_key = (
            subscription.category_id,
            category_name,
        )
        entry = category_totals.setdefault(
            category_key,
            {"subscriptions": 0, "total_monthly_spend": Decimal("0.00")},
        )
        entry["subscriptions"] = int(entry["subscriptions"]) + 1
        entry["total_monthly_spend"] = Decimal(entry["total_monthly_spend"]) + _monthly_equivalent(
            subscription
        )

    month_totals: dict[str, Decimal] = {}
    month_points: list[DashboardMonthlySpendPoint] = []
    current_month = _month_start(today)
    start_month = _shift_months(current_month, -(MONTHLY_SPEND_MONTHS - 1))
    end_month = _shift_months(current_month, 1)
    cursor = start_month
    while cursor < end_month:
        key = cursor.strftime("%Y-%m")
        month_totals[key] = Decimal("0.00")
        month_points.append(
            DashboardMonthlySpendPoint(
                month=key,
                label=cursor.strftime("%b"),
                total=Decimal("0.00"),
            )
        )
        cursor = _shift_months(cursor, 1)

    payment_history_rows = list(
        (
            await session.scalars(
                select(PaymentHistory)
                .join(Subscription, Subscription.id == PaymentHistory.subscription_id)
                .where(
                    Subscription.user_id == user.id,
                    PaymentHistory.paid_at
                    >= datetime.combine(
                        start_month,
                        datetime.min.time(),
                        tzinfo=UTC,
                    ),
                    PaymentHistory.paid_at
                    < datetime.combine(
                        end_month,
                        datetime.min.time(),
                        tzinfo=UTC,
                    ),
                )
                .order_by(PaymentHistory.paid_at.asc())
            )
        ).all()
    )

    for payment in payment_history_rows:
        paid_at = payment.paid_at.astimezone(UTC) if payment.paid_at.tzinfo else payment.paid_at
        key = paid_at.strftime("%Y-%m")
        if key in month_totals:
            month_totals[key] += Decimal(payment.amount)

    monthly_spend = [
        DashboardMonthlySpendPoint(
            month=point.month,
            label=point.label,
            total=_quantize_money(month_totals[point.month]),
        )
        for point in month_points
    ]

    response = DashboardSummaryResponse(
        summary=DashboardSummaryStats(
            total_monthly_spend=total_monthly_spend,
            active_subscriptions=len(active_subscriptions),
            upcoming_renewals=len(upcoming_renewals),
            cancelled_subscriptions=len(cancelled_subscriptions),
        ),
        active_subscriptions=[
            DashboardActiveSubscriptionItem(
                subscription_id=subscription.id,
                name=subscription.name,
                vendor=subscription.vendor,
                amount=_quantize_money(Decimal(subscription.amount)),
                currency=subscription.currency,
                cadence=subscription.cadence,
                category_name=(
                    category_map.get(subscription.category_id)
                    if subscription.category_id is not None
                    else "Uncategorized"
                )
                or "Uncategorized",
                next_charge_date=subscription.next_charge_date,
            )
            for subscription in sorted(
                active_subscriptions,
                key=lambda subscription: (
                    subscription.next_charge_date is None,
                    subscription.next_charge_date or date.max,
                    subscription.name.lower(),
                    subscription.id,
                ),
            )[:6]
        ],
        monthly_spend=monthly_spend,
        category_breakdown=[
            DashboardCategoryBreakdownItem(
                category_id=category_id,
                category_name=category_name,
                subscriptions=int(values["subscriptions"]),
                total_monthly_spend=_quantize_money(Decimal(values["total_monthly_spend"])),
            )
            for (category_id, category_name), values in sorted(
                category_totals.items(),
                key=lambda item: (
                    Decimal(item[1]["total_monthly_spend"]),
                    item[0][1].lower(),
                ),
                reverse=True,
            )
        ],
        upcoming_renewals=[
            DashboardUpcomingRenewalItem(
                subscription_id=subscription.id,
                name=subscription.name,
                vendor=subscription.vendor,
                amount=_quantize_money(Decimal(subscription.amount)),
                currency=subscription.currency,
                next_charge_date=subscription.next_charge_date,
                days_until_charge=(subscription.next_charge_date - today).days,
            )
            for subscription in upcoming_renewals[:6]
            if subscription.next_charge_date is not None
        ],
        recently_ended=[
            DashboardRecentlyEndedItem(
                subscription_id=subscription.id,
                name=subscription.name,
                vendor=subscription.vendor,
                amount=_quantize_money(Decimal(subscription.amount)),
                currency=subscription.currency,
                end_date=subscription.end_date,
            )
            for subscription in recently_ended[:6]
            if subscription.end_date is not None
        ],
    )
    logger.info(
        "dashboard.summary.loaded",
        user_id=user.id,
        active_subscriptions=response.summary.active_subscriptions,
        upcoming_renewals=response.summary.upcoming_renewals,
    )
    return response


async def get_dashboard_layout(
    session: AsyncSession,
    *,
    user: User,
) -> DashboardLayoutResponse:
    layout = await session.scalar(select(DashboardLayout).where(DashboardLayout.user_id == user.id))
    if layout is None:
        return DashboardLayoutResponse(
            widgets=DEFAULT_DASHBOARD_LAYOUT.widgets,
            version=1,
            updated_at=None,
        )

    return DashboardLayoutResponse(
        widgets=DashboardLayoutUpdate.model_validate(layout.layout).widgets,
        version=layout.version,
        updated_at=layout.updated_at,
    )


async def update_dashboard_layout(
    session: AsyncSession,
    *,
    user: User,
    payload: DashboardLayoutUpdate,
) -> DashboardLayoutResponse:
    layout = await session.scalar(select(DashboardLayout).where(DashboardLayout.user_id == user.id))
    payload_data = payload.model_dump()

    if layout is None:
        layout = DashboardLayout(user_id=user.id, layout=payload_data, version=1)
        session.add(layout)
    else:
        layout.layout = payload_data
        layout.version += 1

    await session.commit()
    await session.refresh(layout)
    logger.info("dashboard.layout.updated", user_id=user.id, version=layout.version)
    return DashboardLayoutResponse(
        widgets=payload.widgets,
        version=layout.version,
        updated_at=layout.updated_at,
    )
