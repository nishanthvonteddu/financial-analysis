from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.notification import (
    NotificationListResponse,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationReadAllResponse,
    NotificationResponse,
    TelegramLinkTokenResponse,
    TelegramUnlinkResponse,
    TelegramWebhookPayload,
    TelegramWebhookResponse,
)
from src.services.notification import (
    create_telegram_link_token,
    get_notification_preferences,
    handle_telegram_webhook,
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    unlink_telegram,
    update_notification_preferences,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "",
    response_model=NotificationListResponse,
    status_code=status.HTTP_200_OK,
    summary="List notifications",
)
async def get_notifications(
    session: DbSession,
    current_user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=100),
) -> NotificationListResponse:
    return await list_notifications(session, user=current_user, limit=limit)


@router.get(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    status_code=status.HTTP_200_OK,
    summary="Get notification preferences",
)
async def get_preferences(
    session: DbSession,
    current_user: CurrentUser,
) -> NotificationPreferencesResponse:
    return await get_notification_preferences(session, user=current_user)


@router.put(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    status_code=status.HTTP_200_OK,
    summary="Update notification preferences",
)
async def update_preferences(
    payload: NotificationPreferencesUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> NotificationPreferencesResponse:
    return await update_notification_preferences(session, user=current_user, payload=payload)


@router.post(
    "/read-all",
    response_model=NotificationReadAllResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark all notifications read",
)
async def read_all_notifications(
    session: DbSession,
    current_user: CurrentUser,
) -> NotificationReadAllResponse:
    updated = await mark_all_notifications_read(session, user=current_user)
    return NotificationReadAllResponse(updated=updated)


@router.post(
    "/telegram/link-token",
    response_model=TelegramLinkTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Telegram link token",
)
async def create_link_token(
    session: DbSession,
    current_user: CurrentUser,
) -> TelegramLinkTokenResponse:
    token = await create_telegram_link_token(session, user=current_user)
    return TelegramLinkTokenResponse(
        token=token,
        deep_link_hint=f"Send /start {token} to the MySubscription Telegram bot.",
    )


@router.delete(
    "/telegram/link",
    response_model=TelegramUnlinkResponse,
    status_code=status.HTTP_200_OK,
    summary="Unlink Telegram",
)
async def delete_telegram_link(
    session: DbSession,
    current_user: CurrentUser,
) -> TelegramUnlinkResponse:
    await unlink_telegram(session, user=current_user)
    return TelegramUnlinkResponse(telegram_linked=False)


@router.post(
    "/telegram/webhook",
    response_model=TelegramWebhookResponse,
    status_code=status.HTTP_200_OK,
    summary="Receive Telegram webhook",
)
async def telegram_webhook(
    payload: TelegramWebhookPayload,
    session: DbSession,
    secret_token: str | None = Header(default=None, alias="X-Telegram-Bot-Api-Secret-Token"),
) -> TelegramWebhookResponse:
    settings = get_settings()
    if settings.telegram_webhook_secret and secret_token != settings.telegram_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid webhook secret.",
        )
    return await handle_telegram_webhook(session, payload=payload)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark notification read",
)
async def read_notification(
    notification_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> NotificationResponse:
    notification = await mark_notification_read(
        session,
        notification_id=notification_id,
        user=current_user,
    )
    return NotificationResponse.model_validate(notification)
