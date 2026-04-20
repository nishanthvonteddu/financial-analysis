from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.category import Category
from src.models.payment_method import PaymentMethod
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.calendar import CalendarDay, CalendarRenewalItem, CalendarRenewalResponse

logger = get_logger(__name__)


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _last_day_of_month(year: int, month: int) -> int:
    next_month = date(year + (1 if month == 12 else 0), 1 if month == 12 else month + 1, 1)
    return (next_month - timedelta(days=1)).day


def _shift_months(value: date, offset: int) -> date:
    month_index = (value.year * 12 + value.month - 1) + offset
    year = month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, _last_day_of_month(year, month))
    return date(year, month, day)


def _next_for_cadence(value: date, cadence: str) -> date:
    normalized = cadence.lower()
    if normalized == "weekly":
        return value + timedelta(days=7)
    if normalized == "quarterly":
        return _shift_months(value, 3)
    if normalized == "yearly":
        return _shift_months(value, 12)
    return _shift_months(value, 1)


def _renewal_dates_for_period(
    subscription: Subscription,
    *,
    period_start: date,
    period_end: date,
) -> list[date]:
    if (
        subscription.next_charge_date is None
        or subscription.status != "active"
        or not subscription.auto_renew
    ):
        return []

    lower_bound = max(period_start, subscription.start_date)
    upper_bound = period_end
    if subscription.end_date is not None:
        upper_bound = min(upper_bound, subscription.end_date)
    if lower_bound > upper_bound or subscription.next_charge_date > upper_bound:
        return []

    cursor = subscription.next_charge_date
    while cursor < lower_bound:
        next_cursor = _next_for_cadence(cursor, subscription.cadence)
        if next_cursor <= cursor:
            return []
        cursor = next_cursor

    renewal_dates: list[date] = []
    while cursor <= upper_bound:
        renewal_dates.append(cursor)
        next_cursor = _next_for_cadence(cursor, subscription.cadence)
        if next_cursor <= cursor:
            break
        cursor = next_cursor

    return renewal_dates


async def get_calendar_renewals(
    session: AsyncSession,
    *,
    user: User,
    year: int,
    month: int,
) -> CalendarRenewalResponse:
    period_start = date(year, month, 1)
    period_end = date(year, month, _last_day_of_month(year, month))

    subscriptions = list(
        (
            await session.scalars(
                select(Subscription)
                .where(
                    Subscription.user_id == user.id,
                    Subscription.status == "active",
                    Subscription.auto_renew.is_(True),
                    Subscription.next_charge_date.is_not(None),
                )
                .order_by(Subscription.next_charge_date.asc(), Subscription.id.asc())
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
    payment_method_ids = sorted(
        {
            subscription.payment_method_id
            for subscription in subscriptions
            if subscription.payment_method_id is not None
        }
    )

    categories = (
        list(
            (
                await session.scalars(
                    select(Category).where(
                        Category.user_id == user.id,
                        Category.id.in_(category_ids),
                    )
                )
            ).all()
        )
        if category_ids
        else []
    )
    payment_methods = (
        list(
            (
                await session.scalars(
                    select(PaymentMethod).where(
                        PaymentMethod.user_id == user.id,
                        PaymentMethod.id.in_(payment_method_ids),
                    )
                )
            ).all()
        )
        if payment_method_ids
        else []
    )
    category_map = {category.id: category.name for category in categories}
    payment_method_map = {
        payment_method.id: payment_method.label for payment_method in payment_methods
    }

    items_by_date: dict[date, list[CalendarRenewalItem]] = {
        period_start + timedelta(days=offset): []
        for offset in range((period_end - period_start).days + 1)
    }

    for subscription in subscriptions:
        for renewal_date in _renewal_dates_for_period(
            subscription,
            period_start=period_start,
            period_end=period_end,
        ):
            category_name = (
                category_map.get(subscription.category_id)
                if subscription.category_id is not None
                else "Uncategorized"
            ) or "Uncategorized"
            items_by_date[renewal_date].append(
                CalendarRenewalItem(
                    subscription_id=subscription.id,
                    name=subscription.name,
                    vendor=subscription.vendor,
                    amount=_quantize_money(Decimal(subscription.amount)),
                    currency=subscription.currency,
                    cadence=subscription.cadence,
                    status=subscription.status,
                    renewal_date=renewal_date,
                    category_id=subscription.category_id,
                    category_name=category_name,
                    payment_method_id=subscription.payment_method_id,
                    payment_method_label=(
                        payment_method_map.get(subscription.payment_method_id)
                        if subscription.payment_method_id is not None
                        else None
                    ),
                )
            )

    days = [
        CalendarDay(
            date=day,
            day=day.day,
            total_amount=_quantize_money(
                sum((Decimal(item.amount) for item in renewals), Decimal("0.00"))
            ),
            renewals=sorted(
                renewals,
                key=lambda item: (item.name.lower(), item.subscription_id),
            ),
        )
        for day, renewals in sorted(items_by_date.items())
    ]
    total_renewals = sum(len(day.renewals) for day in days)
    logger.info(
        "calendar.renewals_listed",
        user_id=user.id,
        year=year,
        month=month,
        total_renewals=total_renewals,
    )
    return CalendarRenewalResponse(
        year=year,
        month=month,
        period_start=period_start,
        period_end=period_end,
        total_renewals=total_renewals,
        days=days,
    )
