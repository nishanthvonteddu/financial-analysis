from src.models.base import Base


def _index_columns(table_name: str, index_name: str) -> tuple[str, ...]:
    table = Base.metadata.tables[table_name]
    for index in table.indexes:
        if index.name == index_name:
            return tuple(column.name for column in index.columns)
    raise AssertionError(f"Missing index {index_name} on {table_name}")


def test_phase_two_three_query_indexes_are_declared() -> None:
    expected_indexes = {
        ("subscriptions", "ix_subscriptions_user_status_next_charge"): (
            "user_id",
            "status",
            "next_charge_date",
            "id",
        ),
        ("subscriptions", "ix_subscriptions_user_status_name"): (
            "user_id",
            "status",
            "name",
            "id",
        ),
        ("subscriptions", "ix_subscriptions_user_cadence_amount"): (
            "user_id",
            "cadence",
            "amount",
            "id",
        ),
        ("payment_history", "ix_payment_history_paid_at_subscription"): (
            "paid_at",
            "subscription_id",
            "id",
        ),
        ("payment_history", "ix_payment_history_subscription_paid_at"): (
            "subscription_id",
            "paid_at",
            "id",
        ),
        ("raw_transactions", "ix_raw_transactions_data_source_id"): ("data_source_id",),
        ("raw_transactions", "ix_raw_transactions_user_posted_id"): (
            "user_id",
            "posted_at",
            "id",
        ),
        ("raw_transactions", "ix_raw_transactions_user_candidate_merchant"): (
            "user_id",
            "subscription_candidate",
            "merchant",
        ),
        ("data_sources", "ix_data_sources_user_source_created"): (
            "user_id",
            "source_type",
            "created_at",
            "id",
        ),
        ("notifications", "ix_notifications_user_status_created"): (
            "user_id",
            "status",
            "created_at",
            "id",
        ),
        ("exchange_rates", "ix_exchange_rates_pair_effective"): (
            "base_currency",
            "quote_currency",
            "effective_date",
        ),
    }

    for (table_name, index_name), columns in expected_indexes.items():
        assert _index_columns(table_name, index_name) == columns
