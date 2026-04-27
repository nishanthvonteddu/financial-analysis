from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class PaymentHistory(TimestampMixin, Base):
    __tablename__ = "payment_history"
    __table_args__ = (
        Index(
            "ix_payment_history_paid_at_subscription",
            "paid_at",
            "subscription_id",
            "id",
        ),
        Index(
            "ix_payment_history_subscription_paid_at",
            "subscription_id",
            "paid_at",
            "id",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subscription_id: Mapped[int] = mapped_column(ForeignKey("subscriptions.id"), nullable=False)
    payment_method_id: Mapped[int | None] = mapped_column(
        ForeignKey("payment_methods.id", ondelete="SET NULL"),
        nullable=True,
    )
    raw_transaction_id: Mapped[int | None] = mapped_column(
        ForeignKey("raw_transactions.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(30), default="settled", nullable=False)
    reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
