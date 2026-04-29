"""Add Day 28 performance optimizations."""

from alembic import op

revision = "20260429_0012"
down_revision = "20260428_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_exchange_rates_pair_effective",
        "exchange_rates",
        ["base_currency", "quote_currency", "effective_date"],
    )


def downgrade() -> None:
    op.drop_index("ix_exchange_rates_pair_effective", table_name="exchange_rates")
