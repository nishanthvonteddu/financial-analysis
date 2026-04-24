"""Add family member subscription privacy controls."""

import sqlalchemy as sa

from alembic import op

revision = "20260424_0009"
down_revision = "20260422_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "family_members",
        sa.Column(
            "share_subscriptions",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade() -> None:
    op.drop_column("family_members", "share_subscriptions")
