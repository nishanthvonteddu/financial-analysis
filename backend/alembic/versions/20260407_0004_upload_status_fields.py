"""Add upload metadata fields to data sources."""

import sqlalchemy as sa

from alembic import op

revision = "20260407_0004"
down_revision = "20260406_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("data_sources", sa.Column("display_name", sa.String(length=255), nullable=True))
    op.add_column("data_sources", sa.Column("storage_path", sa.String(length=500), nullable=True))
    op.add_column("data_sources", sa.Column("content_type", sa.String(length=100), nullable=True))
    op.add_column("data_sources", sa.Column("file_size", sa.Integer(), nullable=True))
    op.add_column(
        "data_sources",
        sa.Column("status", sa.String(length=30), nullable=False, server_default="completed"),
    )
    op.add_column("data_sources", sa.Column("error_message", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("data_sources", "error_message")
    op.drop_column("data_sources", "status")
    op.drop_column("data_sources", "file_size")
    op.drop_column("data_sources", "content_type")
    op.drop_column("data_sources", "storage_path")
    op.drop_column("data_sources", "display_name")
