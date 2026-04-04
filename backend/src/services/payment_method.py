from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.payment_history import PaymentHistory
from src.models.payment_method import PaymentMethod
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate

logger = get_logger(__name__)


async def list_payment_methods(
    session: AsyncSession,
    user: User,
) -> tuple[list[PaymentMethod], int]:
    statement = (
        select(PaymentMethod)
        .where(PaymentMethod.user_id == user.id)
        .order_by(PaymentMethod.id.asc())
    )
    items = list((await session.scalars(statement)).all())
    total = await session.scalar(
        select(func.count()).select_from(PaymentMethod).where(PaymentMethod.user_id == user.id)
    )
    logger.info("payment_methods.listed", user_id=user.id, total=total)
    return items, int(total or 0)


async def get_payment_method_or_404(
    session: AsyncSession,
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


async def _clear_default_payment_methods(
    session: AsyncSession,
    user_id: int,
    exclude_id: int | None = None,
) -> None:
    statement = update(PaymentMethod).where(PaymentMethod.user_id == user_id)
    if exclude_id is not None:
        statement = statement.where(PaymentMethod.id != exclude_id)
    await session.execute(statement.values(is_default=False))


async def create_payment_method(
    session: AsyncSession,
    user: User,
    payload: PaymentMethodCreate,
) -> PaymentMethod:
    if payload.is_default:
        await _clear_default_payment_methods(session, user.id)

    payment_method = PaymentMethod(
        user_id=user.id,
        label=payload.label,
        provider=payload.provider,
        last4=payload.last4,
        is_default=payload.is_default,
    )
    session.add(payment_method)
    await session.commit()
    await session.refresh(payment_method)
    logger.info("payment_methods.created", user_id=user.id, payment_method_id=payment_method.id)
    return payment_method


async def update_payment_method(
    session: AsyncSession,
    payment_method_id: int,
    user: User,
    payload: PaymentMethodUpdate,
) -> PaymentMethod:
    payment_method = await get_payment_method_or_404(session, payment_method_id, user)
    changes = payload.model_dump(exclude_unset=True)

    if changes.get("is_default"):
        await _clear_default_payment_methods(session, user.id, exclude_id=payment_method.id)

    for field_name, field_value in changes.items():
        setattr(payment_method, field_name, field_value)

    await session.commit()
    await session.refresh(payment_method)
    logger.info("payment_methods.updated", user_id=user.id, payment_method_id=payment_method.id)
    return payment_method


async def delete_payment_method(session: AsyncSession, payment_method_id: int, user: User) -> None:
    payment_method = await get_payment_method_or_404(session, payment_method_id, user)
    await session.execute(
        update(Subscription)
        .where(Subscription.payment_method_id == payment_method.id)
        .values(payment_method_id=None)
    )
    await session.execute(
        update(PaymentHistory)
        .where(PaymentHistory.payment_method_id == payment_method.id)
        .values(payment_method_id=None)
    )
    await session.delete(payment_method)
    await session.commit()
    logger.info("payment_methods.deleted", user_id=user.id, payment_method_id=payment_method_id)
