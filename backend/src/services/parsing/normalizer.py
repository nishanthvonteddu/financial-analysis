from __future__ import annotations

import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from src.services.parsing.types import ExtractionResult, ParsedTransaction

DATA_DIR = Path(__file__).with_name("data")
NOISE_PATTERNS = (
    r"^(?:card purchase|debit card purchase|checkcard|pos purchase|ach debit|ach withdrawal)\s+",
    r"^(?:recurring|autopay|automatic payment|online payment|purchase authorized on)\s+",
    r"\b(?:pending|visa|mc|checkcard|debit|purchase|payment|online)\b",
    r"\b\d{4,}\b",
)


@dataclass(frozen=True, slots=True)
class KnownService:
    name: str
    category: str


@dataclass(frozen=True, slots=True)
class NormalizedMerchant:
    original: str
    cleaned: str
    canonical_name: str
    category: str | None
    alias_key: str | None
    is_known_service: bool


def _normalize_lookup_key(value: str) -> str:
    normalized = value.upper().replace("&", " AND ")
    normalized = re.sub(r"https?://", " ", normalized)
    normalized = re.sub(r"www\.", " ", normalized, flags=re.IGNORECASE)

    for pattern in NOISE_PATTERNS:
        normalized = re.sub(pattern, " ", normalized, flags=re.IGNORECASE)

    normalized = re.sub(r"[^A-Z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def _fallback_title(value: str) -> str:
    words = value.lower().split()
    return " ".join(word.capitalize() for word in words) if words else "Unknown merchant"


@lru_cache
def _load_aliases() -> dict[str, str]:
    with (DATA_DIR / "merchant_aliases.json").open("r", encoding="utf-8") as handle:
        aliases = json.load(handle)
    return {str(key): str(value) for key, value in aliases.items()}


@lru_cache
def _load_known_services() -> dict[str, KnownService]:
    with (DATA_DIR / "known_services.json").open("r", encoding="utf-8") as handle:
        services = json.load(handle)
    return {
        _normalize_lookup_key(str(service["name"])): KnownService(
            name=str(service["name"]),
            category=str(service["category"]),
        )
        for service in services
    }


def normalize_merchant(value: str) -> NormalizedMerchant:
    original = value.strip() or "Unknown merchant"
    cleaned = _normalize_lookup_key(original)
    aliases = _load_aliases()
    known_services = _load_known_services()

    alias_key: str | None = None
    canonical_name = aliases.get(cleaned)

    if canonical_name is None:
        for candidate_alias, resolved_name in aliases.items():
            if cleaned == candidate_alias or cleaned.startswith(f"{candidate_alias} "):
                alias_key = candidate_alias
                canonical_name = resolved_name
                break

    if canonical_name is None:
        for candidate_key, candidate_service in known_services.items():
            if cleaned == candidate_key or cleaned.startswith(f"{candidate_key} "):
                alias_key = candidate_key
                canonical_name = candidate_service.name
                break

    if canonical_name is None:
        canonical_name = _fallback_title(cleaned or original)

    service: KnownService | None = known_services.get(_normalize_lookup_key(canonical_name))
    return NormalizedMerchant(
        original=original,
        cleaned=cleaned or _normalize_lookup_key(canonical_name),
        canonical_name=service.name if service is not None else canonical_name,
        category=service.category if service is not None else None,
        alias_key=alias_key,
        is_known_service=service is not None,
    )


def normalize_extraction(extraction: ExtractionResult) -> ExtractionResult:
    normalized_transactions: list[ParsedTransaction] = []

    for transaction in extraction.transactions:
        normalized = normalize_merchant(transaction.merchant or transaction.description)
        payload = dict(transaction.raw_payload)
        payload.update(
            {
                "normalized_lookup_key": normalized.cleaned,
                "normalized_merchant": normalized.canonical_name,
                "service_category": normalized.category or "",
                "is_known_service": normalized.is_known_service,
            }
        )
        if normalized.alias_key:
            payload["matched_alias"] = normalized.alias_key

        normalized_transactions.append(
            ParsedTransaction(
                posted_at=transaction.posted_at,
                description=transaction.description,
                merchant=normalized.canonical_name,
                amount=transaction.amount,
                transaction_type=transaction.transaction_type,
                currency=transaction.currency,
                external_id=transaction.external_id,
                service_category=normalized.category,
                subscription_candidate=normalized.is_known_service,
                raw_payload=payload,
            )
        )

    metadata = dict(extraction.source_metadata)
    metadata["normalized"] = True
    metadata["known_service_candidates"] = sum(
        1 for transaction in normalized_transactions if transaction.subscription_candidate
    )
    return ExtractionResult(
        bank_format=extraction.bank_format,
        transactions=normalized_transactions,
        source_metadata=metadata,
    )
