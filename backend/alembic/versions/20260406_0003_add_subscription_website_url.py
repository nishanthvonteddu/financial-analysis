"""Add website URL support to subscriptions."""

import sqlalchemy as sa

from alembic import op

revision = "20260406_0003"
down_revision = "20260404_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("subscriptions", sa.Column("website_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("subscriptions", "website_url")
