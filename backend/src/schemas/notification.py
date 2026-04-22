from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

NotificationChannel = Literal["email", "telegram"]
NotificationEventType = Literal["renewal_due"]


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    status: str
    read_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    unread_count: int
    total: int


class NotificationPreferenceResponse(BaseModel):
    channel: NotificationChannel
    event_type: NotificationEventType
    is_enabled: bool
    quiet_hours_start: int | None = None
    quiet_hours_end: int | None = None


class NotificationPreferencesResponse(BaseModel):
    items: list[NotificationPreferenceResponse]
    telegram_linked: bool


class NotificationPreferenceUpdate(BaseModel):
    channel: NotificationChannel
    event_type: NotificationEventType = "renewal_due"
    is_enabled: bool
    quiet_hours_start: int | None = Field(default=None, ge=0, le=23)
    quiet_hours_end: int | None = Field(default=None, ge=0, le=23)


class NotificationPreferencesUpdate(BaseModel):
    items: list[NotificationPreferenceUpdate]


class NotificationReadAllResponse(BaseModel):
    updated: int


class TelegramLinkTokenResponse(BaseModel):
    token: str
    deep_link_hint: str


class TelegramUnlinkResponse(BaseModel):
    telegram_linked: bool


class TelegramWebhookChat(BaseModel):
    id: int | str


class TelegramWebhookMessage(BaseModel):
    chat: TelegramWebhookChat
    text: str | None = None


class TelegramWebhookPayload(BaseModel):
    message: TelegramWebhookMessage | None = None


class TelegramWebhookResponse(BaseModel):
    action: Literal["ignored", "linked", "unlinked"]
    telegram_linked: bool = False


class NotificationDispatchSummary(BaseModel):
    due_date: date
    in_app_created: int
    email_sent: int
    telegram_sent: int
    skipped_duplicates: int

    @field_validator("in_app_created", "email_sent", "telegram_sent", "skipped_duplicates")
    @classmethod
    def non_negative(cls, value: int) -> int:
        return max(value, 0)
