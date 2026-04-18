"""Scope expense reports to uploads."""

import sqlalchemy as sa

from alembic import op

revision = "20260417_0006"
down_revision = "20260416_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("expense_reports") as batch_op:
        batch_op.add_column(sa.Column("data_source_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_expense_reports_data_source_id",
            "data_sources",
            ["data_source_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.drop_constraint("uq_expense_reports_period", type_="unique")
        batch_op.create_unique_constraint(
            "uq_expense_reports_upload_currency",
            ["user_id", "data_source_id", "currency"],
        )


def downgrade() -> None:
    with op.batch_alter_table("expense_reports") as batch_op:
        batch_op.drop_constraint("uq_expense_reports_upload_currency", type_="unique")
        batch_op.create_unique_constraint(
            "uq_expense_reports_period",
            ["user_id", "period_start", "period_end", "currency"],
        )
        batch_op.drop_constraint("fk_expense_reports_data_source_id", type_="foreignkey")
        batch_op.drop_column("data_source_id")
