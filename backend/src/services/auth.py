from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.core.logging import get_logger
from src.core.security import create_token, decode_token, hash_password, verify_password
from src.models.dashboard_layout import DashboardLayout
from src.models.data_source import DataSource
from src.models.payment_history import PaymentHistory
from src.models.payment_method import PaymentMethod
from src.models.raw_transaction import RawTransaction
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

logger = get_logger(__name__)


def _build_token_response(user: User) -> TokenResponse:
    settings = get_settings()
    access_token, access_expires_at = create_token(
        subject=str(user.id),
        token_type="access",
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        extra_claims={"email": user.email},
    )
    refresh_token, refresh_expires_at = create_token(
        subject=str(user.id),
        token_type="refresh",
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=access_expires_at,
        refresh_token_expires_at=refresh_expires_at,
        user=UserResponse.model_validate(user),
    )


async def register_user(session: AsyncSession, payload: RegisterRequest) -> TokenResponse:
    existing_user = await session.scalar(select(User).where(User.email == payload.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with that email already exists.",
        )

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    logger.info("auth.registered", user_id=user.id, email=user.email)
    return _build_token_response(user)


async def login_user(session: AsyncSession, payload: LoginRequest) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.hashed_password):
        logger.warning("auth.login_failed", email=payload.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    logger.info("auth.logged_in", user_id=user.id, email=user.email)
    return _build_token_response(user)


async def refresh_user_tokens(session: AsyncSession, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        ) from exc

    if payload["type"] != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required.",
        )

    user = await session.scalar(select(User).where(User.id == int(payload["sub"])))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is unavailable.",
        )

    logger.info("auth.refreshed", user_id=user.id, email=user.email)
    return _build_token_response(user)


async def delete_user_workspace_data(session: AsyncSession, user: User) -> None:
    subscription_ids = list(
        (
            await session.scalars(
                select(Subscription.id).where(Subscription.user_id == user.id),
            )
        ).all()
    )

    if subscription_ids:
        await session.execute(
            delete(PaymentHistory).where(PaymentHistory.subscription_id.in_(subscription_ids)),
        )

    await session.execute(delete(DashboardLayout).where(DashboardLayout.user_id == user.id))
    await session.execute(delete(RawTransaction).where(RawTransaction.user_id == user.id))
    await session.execute(delete(DataSource).where(DataSource.user_id == user.id))
    await session.execute(delete(Subscription).where(Subscription.user_id == user.id))
    await session.execute(delete(PaymentMethod).where(PaymentMethod.user_id == user.id))
    await session.commit()

    logger.info(
        "auth.workspace_data_deleted",
        user_id=user.id,
        dashboard_layouts_removed=True,
        payment_methods_removed=True,
        subscriptions_removed=len(subscription_ids),
    )
