from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class SentNotification(TimestampMixin, Base):
    __tablename__ = "sent_notifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    notification_id: Mapped[int | None] = mapped_column(
        ForeignKey("notifications.id", ondelete="SET NULL"),
        nullable=True,
    )
    notification_preference_id: Mapped[int | None] = mapped_column(
        ForeignKey("notification_preferences.id", ondelete="SET NULL"),
        nullable=True,
    )
    channel: Mapped[str] = mapped_column(String(50))
    notification_type: Mapped[str] = mapped_column(String(50))
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    delivery_status: Mapped[str] = mapped_column(String(30), default="sent", nullable=False)
    payload: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
