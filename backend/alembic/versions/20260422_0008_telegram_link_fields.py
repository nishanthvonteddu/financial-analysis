"""Add Telegram link fields to users."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision = "20260422_0008"
down_revision = "20260421_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("telegram_chat_id", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("telegram_link_token", sa.String(length=100), nullable=True))
    op.add_column(
        "users",
        sa.Column("telegram_linked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_unique_constraint("uq_users_telegram_chat_id", "users", ["telegram_chat_id"])
    op.create_unique_constraint("uq_users_telegram_link_token", "users", ["telegram_link_token"])


def downgrade() -> None:
    op.drop_constraint("uq_users_telegram_link_token", "users", type_="unique")
    op.drop_constraint("uq_users_telegram_chat_id", "users", type_="unique")
    op.drop_column("users", "telegram_linked_at")
    op.drop_column("users", "telegram_link_token")
    op.drop_column("users", "telegram_chat_id")
