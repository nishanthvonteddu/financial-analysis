from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.category import Category
from src.models.payment_history import PaymentHistory
from src.models.payment_method import PaymentMethod
from src.models.subscription import Subscription
from src.models.subscription_event import SubscriptionEvent
from src.models.user import User
from src.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionPaymentHistoryItem,
    SubscriptionPaymentHistoryResponse,
    SubscriptionPaymentHistorySummary,
    SubscriptionPriceChangeResponse,
    SubscriptionUpdate,
)

logger = get_logger(__name__)


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _as_utc_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


async def _get_category_or_404(session: AsyncSession, category_id: int, user: User) -> Category:
    statement = select(Category).where(Category.id == category_id, Category.user_id == user.id)
    category = await session.scalar(statement)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return category


async def _get_payment_method_or_404(
    session: AsyncSession,
    *,
    payment_method_id: int,
    user: User,
) -> PaymentMethod:
    statement = select(PaymentMethod).where(
        PaymentMethod.id == payment_method_id,
        PaymentMethod.user_id == user.id,
    )
    payment_method = await session.scalar(statement)
    if payment_method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found.",
        )
    return payment_method


async def list_subscriptions(
    session: AsyncSession,
    *,
    user: User,
    status_filter: str | None,
    category_id: int | None,
    payment_method_id: int | None,
    cadence: str | None,
    min_amount: Decimal | None,
    max_amount: Decimal | None,
    search: str | None,
    offset: int,
    limit: int,
) -> tuple[list[Subscription], int]:
    conditions = [Subscription.user_id == user.id]

    if status_filter:
        conditions.append(Subscription.status == status_filter.lower())
    if category_id is not None:
        conditions.append(Subscription.category_id == category_id)
    if payment_method_id is not None:
        conditions.append(Subscription.payment_method_id == payment_method_id)
    if cadence:
        conditions.append(Subscription.cadence == cadence.strip().lower())
    if min_amount is not None:
        conditions.append(Subscription.amount >= min_amount)
    if max_amount is not None:
        conditions.append(Subscription.amount <= max_amount)
    if search:
        pattern = f"%{search.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(Subscription.name).like(pattern),
                func.lower(Subscription.vendor).like(pattern),
            )
        )

    statement = (
        select(Subscription)
        .where(*conditions)
        .order_by(Subscription.id.asc())
        .offset(offset)
        .limit(limit)
    )
    items = list((await session.scalars(statement)).all())
    total = await session.scalar(select(func.count()).select_from(Subscription).where(*conditions))
    logger.info(
        "subscriptions.listed",
        user_id=user.id,
        total=total,
        offset=offset,
        limit=limit,
        cadence=cadence,
        min_amount=str(min_amount) if min_amount is not None else None,
        max_amount=str(max_amount) if max_amount is not None else None,
    )
    return items, int(total or 0)


async def get_subscription_or_404(
    session: AsyncSession,
    *,
    subscription_id: int,
    user: User,
) -> Subscription:
    statement = select(Subscription).where(
        Subscription.id == subscription_id,
        Subscription.user_id == user.id,
    )
    subscription = await session.scalar(statement)
    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found.",
        )
    return subscription


async def create_subscription(
    session: AsyncSession,
    *,
    user: User,
    payload: SubscriptionCreate,
) -> Subscription:
    if payload.category_id is not None:
        await _get_category_or_404(session, payload.category_id, user)
    if payload.payment_method_id is not None:
        await _get_payment_method_or_404(
            session,
            payment_method_id=payload.payment_method_id,
            user=user,
        )

    subscription = Subscription(user_id=user.id, **payload.model_dump())
    session.add(subscription)
    await session.commit()
    await session.refresh(subscription)
    logger.info("subscriptions.created", user_id=user.id, subscription_id=subscription.id)
    return subscription


async def update_subscription(
    session: AsyncSession,
    *,
    subscription_id: int,
    user: User,
    payload: SubscriptionUpdate,
) -> Subscription:
    subscription = await get_subscription_or_404(
        session,
        subscription_id=subscription_id,
        user=user,
    )
    changes = payload.model_dump(exclude_unset=True)

    if "category_id" in changes and changes["category_id"] is not None:
        await _get_category_or_404(session, changes["category_id"], user)
    if "payment_method_id" in changes and changes["payment_method_id"] is not None:
        await _get_payment_method_or_404(
            session,
            payment_method_id=changes["payment_method_id"],
            user=user,
        )

    for field_name, field_value in changes.items():
        setattr(subscription, field_name, field_value)

    if (
        subscription.end_date is not None
        and subscription.start_date is not None
        and subscription.end_date < subscription.start_date
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date must be on or after start_date.",
        )

    await session.commit()
    await session.refresh(subscription)
    logger.info("subscriptions.updated", user_id=user.id, subscription_id=subscription.id)
    return subscription


async def delete_subscription(
    session: AsyncSession,
    *,
    subscription_id: int,
    user: User,
) -> None:
    subscription = await get_subscription_or_404(
        session,
        subscription_id=subscription_id,
        user=user,
    )
    await session.delete(subscription)
    await session.commit()
    logger.info("subscriptions.deleted", user_id=user.id, subscription_id=subscription_id)


async def get_subscription_payment_history(
    session: AsyncSession,
    *,
    subscription_id: int,
    user: User,
) -> SubscriptionPaymentHistoryResponse:
    subscription = await get_subscription_or_404(
        session,
        subscription_id=subscription_id,
        user=user,
    )
    payments = list(
        (
            await session.scalars(
                select(PaymentHistory)
                .where(PaymentHistory.subscription_id == subscription.id)
                .order_by(PaymentHistory.paid_at.desc(), PaymentHistory.id.desc())
            )
        ).all()
    )
    payment_method_ids = sorted(
        {
            payment.payment_method_id
            for payment in payments
            if payment.payment_method_id is not None
        }
    )
    payment_method_map: dict[int, str] = {}
    if payment_method_ids:
        payment_method_map = {
            payment_method.id: payment_method.label
            for payment_method in (
                await session.scalars(
                    select(PaymentMethod).where(PaymentMethod.id.in_(payment_method_ids))
                )
            ).all()
        }

    price_change_events = list(
        (
            await session.scalars(
                select(SubscriptionEvent)
                .where(
                    SubscriptionEvent.subscription_id == subscription.id,
                    SubscriptionEvent.event_type == "price_changed",
                )
                .order_by(
                    SubscriptionEvent.effective_date.desc(),
                    SubscriptionEvent.id.desc(),
                )
            )
        ).all()
    )

    total_paid = _quantize_money(
        sum((Decimal(payment.amount) for payment in payments), Decimal("0.00"))
    )
    average_payment = (
        _quantize_money(total_paid / Decimal(len(payments)))
        if payments
        else Decimal("0.00")
    )
    latest_payment = payments[0] if payments else None
    first_payment = payments[-1] if payments else None

    return SubscriptionPaymentHistoryResponse(
        subscription_id=subscription.id,
        subscription_name=subscription.name,
        summary=SubscriptionPaymentHistorySummary(
            payment_count=len(payments),
            total_paid=total_paid,
            average_payment=average_payment,
            latest_payment_amount=(
                _quantize_money(Decimal(latest_payment.amount))
                if latest_payment is not None
                else None
            ),
            latest_payment_at=(
                _as_utc_datetime(latest_payment.paid_at) if latest_payment is not None else None
            ),
            first_payment_at=(
                _as_utc_datetime(first_payment.paid_at) if first_payment is not None else None
            ),
            price_change_count=len(price_change_events),
        ),
        items=[
            SubscriptionPaymentHistoryItem(
                id=payment.id,
                payment_method_id=payment.payment_method_id,
                payment_method_label=(
                    payment_method_map.get(payment.payment_method_id)
                    if payment.payment_method_id is not None
                    else None
                ),
                paid_at=_as_utc_datetime(payment.paid_at) or payment.paid_at,
                amount=_quantize_money(Decimal(payment.amount)),
                currency=payment.currency,
                payment_status=payment.payment_status,
                reference=payment.reference,
            )
            for payment in payments
        ],
        price_changes=[
            SubscriptionPriceChangeResponse(
                id=event.id,
                effective_date=event.effective_date,
                previous_amount=_quantize_money(
                    Decimal(str(event.payload.get("previous_amount", "0.00")))
                ),
                new_amount=_quantize_money(Decimal(str(event.payload.get("new_amount", "0.00")))),
                currency=str(event.payload.get("currency") or subscription.currency),
                note=event.note,
            )
            for event in price_change_events
        ],
    )
