import csv
import io
import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.category import Category
from src.models.payment_history import PaymentHistory
from src.models.payment_method import PaymentMethod
from src.models.subscription import Subscription
from src.models.user import User
from src.services.calendar import _renewal_dates_for_period

logger = get_logger(__name__)
ExportFormat = Literal["csv", "json", "ics"]


@dataclass(frozen=True)
class ExportPayload:
    content: str
    content_type: str
    filename: str


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _iso_datetime(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def _json_default(value: object) -> str:
    if isinstance(value, Decimal):
        return str(_quantize_money(value))
    if isinstance(value, date | datetime):
        return value.isoformat()
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _escape_ical_text(value: object) -> str:
    text = str(value)
    return (
        text.replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )


def _shift_months(value: date, offset: int) -> date:
    month_index = (value.year * 12 + value.month - 1) + offset
    year = month_index // 12
    month = month_index % 12 + 1
    next_month = date(year + (1 if month == 12 else 0), 1 if month == 12 else month + 1, 1)
    last_day = (next_month - date.resolution).day
    return date(year, month, min(value.day, last_day))


async def _load_export_data(
    session: AsyncSession,
    *,
    user: User,
    active_only: bool,
    include_payment_history: bool,
) -> tuple[
    list[Subscription],
    dict[int, str],
    dict[int, str],
    dict[int, list[PaymentHistory]],
]:
    conditions = [Subscription.user_id == user.id]
    if active_only:
        conditions.append(Subscription.status == "active")

    subscriptions = list(
        (
            await session.scalars(
                select(Subscription)
                .where(*conditions)
                .order_by(Subscription.name.asc(), Subscription.id.asc())
            )
        ).all()
    )
    subscription_ids = [subscription.id for subscription in subscriptions]
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

    category_map = {
        category.id: category.name
        for category in (
            (
                await session.scalars(
                    select(Category).where(
                        Category.user_id == user.id,
                        Category.id.in_(category_ids),
                    )
                )
            ).all()
            if category_ids
            else []
        )
    }
    payment_method_map = {
        payment_method.id: payment_method.label
        for payment_method in (
            (
                await session.scalars(
                    select(PaymentMethod).where(
                        PaymentMethod.user_id == user.id,
                        PaymentMethod.id.in_(payment_method_ids),
                    )
                )
            ).all()
            if payment_method_ids
            else []
        )
    }

    payments_by_subscription: dict[int, list[PaymentHistory]] = defaultdict(list)
    if include_payment_history and subscription_ids:
        payments = list(
            (
                await session.scalars(
                    select(PaymentHistory)
                    .where(PaymentHistory.subscription_id.in_(subscription_ids))
                    .order_by(PaymentHistory.paid_at.desc(), PaymentHistory.id.desc())
                )
            ).all()
        )
        for payment in payments:
            payments_by_subscription[payment.subscription_id].append(payment)

    return subscriptions, category_map, payment_method_map, payments_by_subscription


def _subscription_payment_summary(
    payments: list[PaymentHistory],
) -> tuple[int, Decimal, str | None]:
    total_paid = _quantize_money(
        sum((Decimal(payment.amount) for payment in payments), Decimal("0.00"))
    )
    latest_payment_at = _iso_datetime(payments[0].paid_at) if payments else None
    return len(payments), total_paid, latest_payment_at


def _build_csv_export(
    subscriptions: list[Subscription],
    category_map: dict[int, str],
    payment_method_map: dict[int, str],
    payments_by_subscription: dict[int, list[PaymentHistory]],
) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "subscription_id",
            "name",
            "vendor",
            "status",
            "cadence",
            "amount",
            "currency",
            "start_date",
            "next_charge_date",
            "end_date",
            "auto_renew",
            "category",
            "payment_method",
            "payment_count",
            "total_paid",
            "latest_payment_at",
            "notes",
        ],
    )
    writer.writeheader()

    for subscription in subscriptions:
        payments = payments_by_subscription.get(subscription.id, [])
        payment_count, total_paid, latest_payment_at = _subscription_payment_summary(payments)
        writer.writerow(
            {
                "subscription_id": subscription.id,
                "name": subscription.name,
                "vendor": subscription.vendor,
                "status": subscription.status,
                "cadence": subscription.cadence,
                "amount": str(_quantize_money(Decimal(subscription.amount))),
                "currency": subscription.currency,
                "start_date": subscription.start_date.isoformat(),
                "next_charge_date": (
                    subscription.next_charge_date.isoformat()
                    if subscription.next_charge_date
                    else ""
                ),
                "end_date": subscription.end_date.isoformat() if subscription.end_date else "",
                "auto_renew": str(subscription.auto_renew).lower(),
                "category": (
                    category_map.get(subscription.category_id)
                    if subscription.category_id is not None
                    else "Uncategorized"
                ),
                "payment_method": (
                    payment_method_map.get(subscription.payment_method_id)
                    if subscription.payment_method_id is not None
                    else ""
                ),
                "payment_count": payment_count,
                "total_paid": str(total_paid),
                "latest_payment_at": latest_payment_at or "",
                "notes": subscription.notes or "",
            }
        )

    return output.getvalue()


def _build_json_export(
    subscriptions: list[Subscription],
    category_map: dict[int, str],
    payment_method_map: dict[int, str],
    payments_by_subscription: dict[int, list[PaymentHistory]],
    *,
    generated_at: datetime,
    active_only: bool,
    include_payment_history: bool,
) -> str:
    exported_subscriptions: list[dict[str, Any]] = []
    payload: dict[str, Any] = {
        "metadata": {
            "generated_at": generated_at,
            "active_only": active_only,
            "include_payment_history": include_payment_history,
            "subscription_count": len(subscriptions),
        },
        "subscriptions": exported_subscriptions,
    }

    for subscription in subscriptions:
        payments = payments_by_subscription.get(subscription.id, [])
        item = {
            "id": subscription.id,
            "name": subscription.name,
            "vendor": subscription.vendor,
            "description": subscription.description,
            "website_url": subscription.website_url,
            "amount": _quantize_money(Decimal(subscription.amount)),
            "currency": subscription.currency,
            "cadence": subscription.cadence,
            "status": subscription.status,
            "start_date": subscription.start_date,
            "end_date": subscription.end_date,
            "next_charge_date": subscription.next_charge_date,
            "day_of_month": subscription.day_of_month,
            "auto_renew": subscription.auto_renew,
            "category": (
                category_map.get(subscription.category_id)
                if subscription.category_id is not None
                else "Uncategorized"
            ),
            "payment_method": (
                payment_method_map.get(subscription.payment_method_id)
                if subscription.payment_method_id is not None
                else None
            ),
            "notes": subscription.notes,
        }
        if include_payment_history:
            item["payment_history"] = [
                {
                    "id": payment.id,
                    "paid_at": _iso_datetime(payment.paid_at),
                    "amount": _quantize_money(Decimal(payment.amount)),
                    "currency": payment.currency,
                    "payment_status": payment.payment_status,
                    "reference": payment.reference,
                }
                for payment in payments
            ]
        exported_subscriptions.append(item)

    return json.dumps(payload, default=_json_default, indent=2, sort_keys=True)


def _build_ics_export(
    subscriptions: list[Subscription],
    *,
    generated_at: datetime,
    period_start: date,
    period_end: date,
) -> str:
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MySubscription//Data Export//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:MySubscription renewals",
    ]
    stamp = generated_at.strftime("%Y%m%dT%H%M%SZ")

    for subscription in subscriptions:
        for renewal_date in _renewal_dates_for_period(
            subscription,
            period_start=period_start,
            period_end=period_end,
        ):
            amount = _quantize_money(Decimal(subscription.amount))
            lines.extend(
                [
                    "BEGIN:VEVENT",
                    f"UID:subscription-{subscription.id}-{renewal_date.isoformat()}@mysubscription",
                    f"DTSTAMP:{stamp}",
                    f"DTSTART;VALUE=DATE:{renewal_date.strftime('%Y%m%d')}",
                    f"SUMMARY:{_escape_ical_text(f'{subscription.name} renewal')}",
                    (
                        "DESCRIPTION:"
                        + _escape_ical_text(
                            f"{subscription.vendor} charges {amount} {subscription.currency} "
                            f"on a {subscription.cadence} cadence."
                        )
                    ),
                    "END:VEVENT",
                ]
            )

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


async def build_export_payload(
    session: AsyncSession,
    *,
    user: User,
    export_format: ExportFormat,
    active_only: bool,
    include_payment_history: bool,
    calendar_months: int,
) -> ExportPayload:
    generated_at = datetime.now(UTC)
    (
        subscriptions,
        category_map,
        payment_method_map,
        payments_by_subscription,
    ) = await _load_export_data(
        session,
        user=user,
        active_only=active_only,
        include_payment_history=include_payment_history,
    )
    filename_date = generated_at.date().isoformat()

    if export_format == "json":
        content = _build_json_export(
            subscriptions,
            category_map,
            payment_method_map,
            payments_by_subscription,
            generated_at=generated_at,
            active_only=active_only,
            include_payment_history=include_payment_history,
        )
        content_type = "application/json; charset=utf-8"
    elif export_format == "ics":
        period_start = generated_at.date()
        period_end = _shift_months(period_start, calendar_months)
        content = _build_ics_export(
            subscriptions,
            generated_at=generated_at,
            period_start=period_start,
            period_end=period_end,
        )
        content_type = "text/calendar; charset=utf-8"
    else:
        content = _build_csv_export(
            subscriptions,
            category_map,
            payment_method_map,
            payments_by_subscription,
        )
        content_type = "text/csv; charset=utf-8"

    extension = "ics" if export_format == "ics" else export_format
    logger.info(
        "exports.generated",
        user_id=user.id,
        format=export_format,
        active_only=active_only,
        include_payment_history=include_payment_history,
        subscription_count=len(subscriptions),
    )
    return ExportPayload(
        content=content,
        content_type=content_type,
        filename=f"mysubscription-export-{filename_date}.{extension}",
    )
