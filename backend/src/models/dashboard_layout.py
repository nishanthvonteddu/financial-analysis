from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class DashboardLayout(TimestampMixin, Base):
    __tablename__ = "dashboard_layouts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    layout: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    version: Mapped[int] = mapped_column(default=1, nullable=False)
