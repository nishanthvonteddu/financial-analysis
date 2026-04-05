from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class PaymentMethod(TimestampMixin, Base):
    __tablename__ = "payment_methods"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    label: Mapped[str] = mapped_column(String(120))
    provider: Mapped[str] = mapped_column(String(100))
    last4: Mapped[str | None] = mapped_column(String(4), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
