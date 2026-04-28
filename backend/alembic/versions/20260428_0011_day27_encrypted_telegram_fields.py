"""Add encrypted Telegram field blind indexes."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision = "20260428_0011"
down_revision = "20260426_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "telegram_chat_id",
        existing_type=sa.String(length=100),
        type_=sa.String(length=512),
    )
    op.alter_column(
        "users",
        "telegram_link_token",
        existing_type=sa.String(length=100),
        type_=sa.String(length=512),
    )
    op.add_column("users", sa.Column("telegram_chat_id_hash", sa.String(length=64), nullable=True))
    op.add_column(
        "users",
        sa.Column("telegram_link_token_hash", sa.String(length=64), nullable=True),
    )
    op.create_unique_constraint("uq_users_telegram_chat_id_hash", "users", ["telegram_chat_id_hash"])
    op.create_unique_constraint(
        "uq_users_telegram_link_token_hash",
        "users",
        ["telegram_link_token_hash"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_users_telegram_link_token_hash", "users", type_="unique")
    op.drop_constraint("uq_users_telegram_chat_id_hash", "users", type_="unique")
    op.drop_column("users", "telegram_link_token_hash")
    op.drop_column("users", "telegram_chat_id_hash")
    op.alter_column(
        "users",
        "telegram_link_token",
        existing_type=sa.String(length=512),
        type_=sa.String(length=100),
    )
    op.alter_column(
        "users",
        "telegram_chat_id",
        existing_type=sa.String(length=512),
        type_=sa.String(length=100),
    )
