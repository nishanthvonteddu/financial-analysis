from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from secrets import token_urlsafe

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.email import BaseEmailService, get_email_service
from src.core.logging import get_logger
from src.models.notification import Notification
from src.models.notification_preference import NotificationPreference
from src.models.sent_notification import SentNotification
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.notification import (
    NotificationDispatchSummary,
    NotificationListResponse,
    NotificationPreferenceResponse,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationResponse,
    TelegramWebhookPayload,
    TelegramWebhookResponse,
)

logger = get_logger(__name__)

DEFAULT_EVENT_TYPE = "renewal_due"
DEFAULT_CHANNELS = ("email", "telegram")
RENEWAL_WINDOW_DAYS = 7


@dataclass(frozen=True)
class RenewalCandidate:
    subscription: Subscription
    user: User


def _now() -> datetime:
    return datetime.now(UTC)


def _preference_key(preference: NotificationPreference) -> tuple[str, str]:
    return (preference.channel, preference.event_type)


async def ensure_notification_preferences(
    session: AsyncSession,
    *,
    user: User,
) -> list[NotificationPreference]:
    existing = list(
        (
            await session.scalars(
                select(NotificationPreference).where(NotificationPreference.user_id == user.id)
            )
        ).all()
    )
    by_key = {_preference_key(preference): preference for preference in existing}
    created = False

    for channel in DEFAULT_CHANNELS:
        key = (channel, DEFAULT_EVENT_TYPE)
        if key in by_key:
            continue

        preference = NotificationPreference(
            user_id=user.id,
            channel=channel,
            event_type=DEFAULT_EVENT_TYPE,
            is_enabled=channel == "email",
        )
        session.add(preference)
        by_key[key] = preference
        created = True

    if created:
        await session.commit()
        for preference in by_key.values():
            await session.refresh(preference)

    return sorted(
        by_key.values(),
        key=lambda preference: (preference.channel, preference.event_type),
    )


async def get_notification_preferences(
    session: AsyncSession,
    *,
    user: User,
) -> NotificationPreferencesResponse:
    preferences = await ensure_notification_preferences(session, user=user)
    return NotificationPreferencesResponse(
        items=[
            NotificationPreferenceResponse(
                channel=preference.channel,  # type: ignore[arg-type]
                event_type=preference.event_type,  # type: ignore[arg-type]
                is_enabled=preference.is_enabled,
                quiet_hours_start=preference.quiet_hours_start,
                quiet_hours_end=preference.quiet_hours_end,
            )
            for preference in preferences
        ],
        telegram_linked=user.telegram_chat_id is not None,
    )


async def update_notification_preferences(
    session: AsyncSession,
    *,
    user: User,
    payload: NotificationPreferencesUpdate,
) -> NotificationPreferencesResponse:
    preferences = await ensure_notification_preferences(session, user=user)
    by_key = {_preference_key(preference): preference for preference in preferences}

    for item in payload.items:
        key = (item.channel, item.event_type)
        preference = by_key.get(key)
        if preference is None:
            preference = NotificationPreference(
                user_id=user.id,
                channel=item.channel,
                event_type=item.event_type,
            )
            session.add(preference)
            by_key[key] = preference

        preference.is_enabled = item.is_enabled
        preference.quiet_hours_start = item.quiet_hours_start
        preference.quiet_hours_end = item.quiet_hours_end

    await session.commit()
    await session.refresh(user)
    return await get_notification_preferences(session, user=user)


async def list_notifications(
    session: AsyncSession,
    *,
    user: User,
    limit: int,
) -> NotificationListResponse:
    items = list(
        (
            await session.scalars(
                select(Notification)
                .where(Notification.user_id == user.id)
                .order_by(Notification.created_at.desc(), Notification.id.desc())
                .limit(limit)
            )
        ).all()
    )
    unread_count = await session.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user.id, Notification.status == "unread")
    )
    total = await session.scalar(
        select(func.count()).select_from(Notification).where(Notification.user_id == user.id)
    )

    return NotificationListResponse(
        items=[NotificationResponse.model_validate(item) for item in items],
        unread_count=int(unread_count or 0),
        total=int(total or 0),
    )


async def mark_notification_read(
    session: AsyncSession,
    *,
    notification_id: int,
    user: User,
) -> Notification:
    notification = await session.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    notification.status = "read"
    notification.read_at = _now()
    await session.commit()
    await session.refresh(notification)
    return notification


async def mark_all_notifications_read(
    session: AsyncSession,
    *,
    user: User,
) -> int:
    notifications = list(
        (
            await session.scalars(
                select(Notification).where(
                    Notification.user_id == user.id,
                    Notification.status == "unread",
                )
            )
        ).all()
    )
    read_at = _now()
    for notification in notifications:
        notification.status = "read"
        notification.read_at = read_at

    await session.commit()
    return len(notifications)


async def create_telegram_link_token(session: AsyncSession, *, user: User) -> str:
    token = token_urlsafe(18)
    user.telegram_link_token = token
    await session.commit()
    await session.refresh(user)
    logger.info("notifications.telegram_link_token_created", user_id=user.id)
    return token


async def unlink_telegram(session: AsyncSession, *, user: User) -> None:
    user.telegram_chat_id = None
    user.telegram_link_token = None
    user.telegram_linked_at = None

    preferences = await ensure_notification_preferences(session, user=user)
    for preference in preferences:
        if preference.channel == "telegram":
            preference.is_enabled = False

    await session.commit()
    await session.refresh(user)
    logger.info("notifications.telegram_unlinked", user_id=user.id)


def _extract_token(text: str | None) -> str | None:
    if not text:
        return None
    parts = text.strip().split()
    if not parts:
        return None
    if parts[0].lower() in {"/start", "start", "link"} and len(parts) >= 2:
        return parts[1]
    return parts[0]


async def handle_telegram_webhook(
    session: AsyncSession,
    *,
    payload: TelegramWebhookPayload,
) -> TelegramWebhookResponse:
    message = payload.message
    if message is None:
        return TelegramWebhookResponse(action="ignored")

    chat_id = str(message.chat.id)
    text = (message.text or "").strip()
    if text.lower() == "/stop":
        user = await session.scalar(select(User).where(User.telegram_chat_id == chat_id))
        if user is None:
            return TelegramWebhookResponse(action="ignored")
        await unlink_telegram(session, user=user)
        return TelegramWebhookResponse(action="unlinked", telegram_linked=False)

    token = _extract_token(text)
    if token is None:
        return TelegramWebhookResponse(action="ignored")

    user = await session.scalar(select(User).where(User.telegram_link_token == token))
    if user is None:
        return TelegramWebhookResponse(action="ignored")

    user.telegram_chat_id = chat_id
    user.telegram_link_token = None
    user.telegram_linked_at = _now()
    preferences = await ensure_notification_preferences(session, user=user)
    for preference in preferences:
        if preference.channel == "telegram":
            preference.is_enabled = True

    await session.commit()
    logger.info("notifications.telegram_linked", user_id=user.id)
    return TelegramWebhookResponse(action="linked", telegram_linked=True)


async def _sent_already(
    session: AsyncSession,
    *,
    user_id: int,
    channel: str,
    notification_type: str,
    subscription_id: int,
    charge_date: date,
) -> bool:
    rows = list(
        (
            await session.scalars(
                select(SentNotification).where(
                    SentNotification.user_id == user_id,
                    SentNotification.channel == channel,
                    SentNotification.notification_type == notification_type,
                )
            )
        ).all()
    )
    charge_date_text = charge_date.isoformat()
    return any(
        row.payload.get("subscription_id") == subscription_id
        and row.payload.get("charge_date") == charge_date_text
        for row in rows
    )


async def _record_sent(
    session: AsyncSession,
    *,
    user_id: int,
    notification_id: int | None,
    preference_id: int | None,
    channel: str,
    notification_type: str,
    subscription: Subscription,
) -> None:
    session.add(
        SentNotification(
            user_id=user_id,
            notification_id=notification_id,
            notification_preference_id=preference_id,
            channel=channel,
            notification_type=notification_type,
            sent_at=_now(),
            delivery_status="sent",
            payload={
                "subscription_id": subscription.id,
                "subscription_name": subscription.name,
                "charge_date": subscription.next_charge_date.isoformat()
                if subscription.next_charge_date
                else None,
            },
        )
    )


async def _create_in_app_notification(
    session: AsyncSession,
    *,
    user: User,
    subscription: Subscription,
) -> Notification:
    charge_date = subscription.next_charge_date
    if charge_date is None:
        raise ValueError("Cannot create renewal notification without a charge date.")
    title = f"Renewal due: {subscription.name}"
    message = (
        f"{subscription.vendor} is scheduled to renew on {charge_date.isoformat()} "
        f"for {subscription.amount} {subscription.currency}."
    )
    notification = Notification(
        user_id=user.id,
        title=title,
        message=message,
        notification_type=DEFAULT_EVENT_TYPE,
        status="unread",
    )
    session.add(notification)
    await session.flush()
    return notification


async def _load_renewal_candidates(
    session: AsyncSession,
    *,
    as_of: date,
) -> list[RenewalCandidate]:
    window_end = as_of + timedelta(days=RENEWAL_WINDOW_DAYS)
    rows = (
        await session.execute(
            select(Subscription, User)
            .join(User, User.id == Subscription.user_id)
            .where(
                Subscription.status == "active",
                Subscription.auto_renew.is_(True),
                Subscription.next_charge_date.is_not(None),
                Subscription.next_charge_date >= as_of,
                Subscription.next_charge_date <= window_end,
            )
            .order_by(Subscription.next_charge_date.asc(), Subscription.id.asc())
        )
    ).all()
    return [RenewalCandidate(subscription=row[0], user=row[1]) for row in rows]


async def dispatch_renewal_notifications(
    session: AsyncSession,
    *,
    as_of: date | None = None,
    email_service: BaseEmailService | None = None,
) -> NotificationDispatchSummary:
    due_date = as_of or _now().date()
    candidates = await _load_renewal_candidates(session, as_of=due_date)
    resolved_email_service = email_service or get_email_service()

    in_app_created = 0
    email_sent = 0
    telegram_sent = 0
    skipped_duplicates = 0

    for candidate in candidates:
        subscription = candidate.subscription
        user = candidate.user
        charge_date = subscription.next_charge_date
        if charge_date is None:
            continue

        preferences = await ensure_notification_preferences(session, user=user)
        preference_by_channel = {preference.channel: preference for preference in preferences}

        notification: Notification | None = None
        if not await _sent_already(
            session,
            user_id=user.id,
            channel="in_app",
            notification_type=DEFAULT_EVENT_TYPE,
            subscription_id=subscription.id,
            charge_date=charge_date,
        ):
            notification = await _create_in_app_notification(
                session,
                user=user,
                subscription=subscription,
            )
            await _record_sent(
                session,
                user_id=user.id,
                notification_id=notification.id,
                preference_id=None,
                channel="in_app",
                notification_type=DEFAULT_EVENT_TYPE,
                subscription=subscription,
            )
            in_app_created += 1
        else:
            skipped_duplicates += 1

        email_preference = preference_by_channel.get("email")
        if email_preference and email_preference.is_enabled:
            if await _sent_already(
                session,
                user_id=user.id,
                channel="email",
                notification_type=DEFAULT_EVENT_TYPE,
                subscription_id=subscription.id,
                charge_date=charge_date,
            ):
                skipped_duplicates += 1
            else:
                await resolved_email_service.send(
                    to_email=user.email,
                    subject=f"{subscription.name} renews soon",
                    body=(
                        f"{subscription.vendor} renews on {charge_date.isoformat()} "
                        f"for {subscription.amount} {subscription.currency}."
                    ),
                )
                await _record_sent(
                    session,
                    user_id=user.id,
                    notification_id=notification.id if notification else None,
                    preference_id=email_preference.id,
                    channel="email",
                    notification_type=DEFAULT_EVENT_TYPE,
                    subscription=subscription,
                )
                email_sent += 1

        telegram_preference = preference_by_channel.get("telegram")
        if (
            telegram_preference
            and telegram_preference.is_enabled
            and user.telegram_chat_id is not None
        ):
            if await _sent_already(
                session,
                user_id=user.id,
                channel="telegram",
                notification_type=DEFAULT_EVENT_TYPE,
                subscription_id=subscription.id,
                charge_date=charge_date,
            ):
                skipped_duplicates += 1
            else:
                logger.info(
                    "notifications.telegram_dispatch",
                    user_id=user.id,
                    telegram_chat_id=user.telegram_chat_id,
                    subscription_id=subscription.id,
                )
                await _record_sent(
                    session,
                    user_id=user.id,
                    notification_id=notification.id if notification else None,
                    preference_id=telegram_preference.id,
                    channel="telegram",
                    notification_type=DEFAULT_EVENT_TYPE,
                    subscription=subscription,
                )
                telegram_sent += 1

    await session.commit()
    logger.info(
        "notifications.renewals_dispatched",
        due_date=due_date.isoformat(),
        in_app_created=in_app_created,
        email_sent=email_sent,
        telegram_sent=telegram_sent,
        skipped_duplicates=skipped_duplicates,
    )
    return NotificationDispatchSummary(
        due_date=due_date,
        in_app_created=in_app_created,
        email_sent=email_sent,
        telegram_sent=telegram_sent,
        skipped_duplicates=skipped_duplicates,
    )
