from datetime import date
from decimal import Decimal

from src.services.parsing.normalizer import normalize_extraction, normalize_merchant
from src.services.parsing.types import ExtractionResult, ParsedTransaction


def test_normalize_merchant_resolves_aliases_and_known_services() -> None:
    normalized = normalize_merchant("NETFLIX COM LOS GATOS 12345")

    assert normalized.canonical_name == "Netflix"
    assert normalized.category == "entertainment"
    assert normalized.is_known_service is True


def test_normalize_merchant_keeps_unknown_merchants_usable() -> None:
    normalized = normalize_merchant("LOCAL COFFEE HOUSE BROOKLYN NY")

    assert normalized.canonical_name == "Local Coffee House Brooklyn Ny"
    assert normalized.category is None
    assert normalized.is_known_service is False


def test_normalize_extraction_marks_subscription_candidates() -> None:
    extraction = ExtractionResult(
        bank_format="generic",
        transactions=[
            ParsedTransaction(
                posted_at=date(2026, 4, 8),
                description="NETFLIX COM LOS GATOS",
                merchant="NETFLIX COM LOS GATOS",
                amount=Decimal("-15.49"),
                transaction_type="debit",
                raw_payload={"source": "csv"},
            )
        ],
    )

    normalized = normalize_extraction(extraction)

    assert normalized.source_metadata["normalized"] is True
    assert normalized.source_metadata["known_service_candidates"] == 1
    assert normalized.transactions[0].merchant == "Netflix"
    assert normalized.transactions[0].service_category == "entertainment"
    assert normalized.transactions[0].subscription_candidate is True
    assert normalized.transactions[0].raw_payload["is_known_service"] is True
