"""Add Day 25 performance indexes."""

from alembic import op

revision = "20260426_0010"
down_revision = "20260424_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_subscriptions_user_status_next_charge",
        "subscriptions",
        ["user_id", "status", "next_charge_date", "id"],
    )
    op.create_index(
        "ix_subscriptions_user_status_name",
        "subscriptions",
        ["user_id", "status", "name", "id"],
    )
    op.create_index(
        "ix_subscriptions_user_cadence_amount",
        "subscriptions",
        ["user_id", "cadence", "amount", "id"],
    )
    op.create_index(
        "ix_payment_history_paid_at_subscription",
        "payment_history",
        ["paid_at", "subscription_id", "id"],
    )
    op.create_index(
        "ix_payment_history_subscription_paid_at",
        "payment_history",
        ["subscription_id", "paid_at", "id"],
    )
    op.create_index(
        "ix_raw_transactions_data_source_id",
        "raw_transactions",
        ["data_source_id"],
    )
    op.create_index(
        "ix_raw_transactions_user_posted_id",
        "raw_transactions",
        ["user_id", "posted_at", "id"],
    )
    op.create_index(
        "ix_raw_transactions_user_candidate_merchant",
        "raw_transactions",
        ["user_id", "subscription_candidate", "merchant"],
    )
    op.create_index(
        "ix_data_sources_user_source_created",
        "data_sources",
        ["user_id", "source_type", "created_at", "id"],
    )
    op.create_index(
        "ix_notifications_user_status_created",
        "notifications",
        ["user_id", "status", "created_at", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_notifications_user_status_created", table_name="notifications")
    op.drop_index("ix_data_sources_user_source_created", table_name="data_sources")
    op.drop_index("ix_raw_transactions_user_candidate_merchant", table_name="raw_transactions")
    op.drop_index("ix_raw_transactions_user_posted_id", table_name="raw_transactions")
    op.drop_index("ix_raw_transactions_data_source_id", table_name="raw_transactions")
    op.drop_index("ix_payment_history_subscription_paid_at", table_name="payment_history")
    op.drop_index("ix_payment_history_paid_at_subscription", table_name="payment_history")
    op.drop_index("ix_subscriptions_user_cadence_amount", table_name="subscriptions")
    op.drop_index("ix_subscriptions_user_status_name", table_name="subscriptions")
    op.drop_index("ix_subscriptions_user_status_next_charge", table_name="subscriptions")
