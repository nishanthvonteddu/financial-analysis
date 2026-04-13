from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.category import Category
from src.models.payment_method import PaymentMethod
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.subscription import SubscriptionCreate, SubscriptionUpdate

logger = get_logger(__name__)


async def _get_category_or_404(session: AsyncSession, category_id: int) -> Category:
    category = await session.get(Category, category_id)
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
        await _get_category_or_404(session, payload.category_id)
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
        await _get_category_or_404(session, changes["category_id"])
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
