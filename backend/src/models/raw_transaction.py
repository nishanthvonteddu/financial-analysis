from datetime import date
from decimal import Decimal

from sqlalchemy import JSON, Boolean, Date, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class RawTransaction(TimestampMixin, Base):
    __tablename__ = "raw_transactions"
    __table_args__ = (
        UniqueConstraint("data_source_id", "external_id", name="uq_raw_transactions_external"),
        Index("ix_raw_transactions_data_source_id", "data_source_id"),
        Index("ix_raw_transactions_user_posted_id", "user_id", "posted_at", "id"),
        Index(
            "ix_raw_transactions_user_candidate_merchant",
            "user_id",
            "subscription_candidate",
            "merchant",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    data_source_id: Mapped[int | None] = mapped_column(
        ForeignKey("data_sources.id", ondelete="SET NULL"),
        nullable=True,
    )
    external_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    posted_at: Mapped[date] = mapped_column(Date, nullable=False)
    merchant: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(255))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), default="debit", nullable=False)
    subscription_candidate: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    raw_payload: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
