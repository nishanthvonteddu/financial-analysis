"""Add user preferred currency."""

import sqlalchemy as sa

from alembic import op

revision = "20260421_0007"
down_revision = "20260417_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "preferred_currency",
                sa.String(length=3),
                nullable=False,
                server_default="USD",
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("preferred_currency")
