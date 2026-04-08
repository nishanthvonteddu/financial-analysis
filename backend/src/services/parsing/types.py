from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal


@dataclass(slots=True)
class ParsedTransaction:
    posted_at: date
    description: str
    merchant: str
    amount: Decimal
    transaction_type: str
    currency: str = "USD"
    external_id: str | None = None
    raw_payload: dict[str, object] = field(default_factory=dict)


@dataclass(slots=True)
class ExtractionResult:
    bank_format: str
    transactions: list[ParsedTransaction]
    source_metadata: dict[str, object] = field(default_factory=dict)
