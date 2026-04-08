from __future__ import annotations

import hashlib
import re
from datetime import UTC, date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any

import pandas as pd  # type: ignore[import-untyped]

from src.core.logging import get_logger
from src.services.parsing.detector import detect_bank_format
from src.services.parsing.types import ExtractionResult, ParsedTransaction

logger = get_logger(__name__)

DATE_KEYS = (
    "posting date",
    "transaction date",
    "date",
    "posted at",
    "post date",
    "posted date",
    "trans date",
)
DESCRIPTION_KEYS = (
    "description",
    "details",
    "merchant",
    "name",
    "transaction",
    "original description",
    "simple description",
    "appears on your statement as",
    "memo",
)
AMOUNT_KEYS = ("amount", "transaction amount", "amt", "billing amount")
DEBIT_KEYS = ("debit", "withdrawal", "charge", "debits")
CREDIT_KEYS = ("credit", "deposit", "payment", "credits")
SUMMARY_MARKERS = (
    "balance",
    "summary",
    "total",
    "subtotal",
    "beginning",
    "ending",
    "opening",
    "closing",
)
PDF_LINE_PATTERN = re.compile(
    r"^(?P<date>\d{1,2}/\d{1,2}(?:/\d{2,4})?|\d{4}-\d{2}-\d{2})\s+"
    r"(?P<description>.+?)\s+"
    r"(?P<amount>\(?-?\$?[\d,]+\.\d{2}\)?(?:\s?CR)?)$"
)


def _normalize_header(value: Any) -> str:
    return " ".join(str(value).strip().lower().replace("_", " ").split())


def _serialize_value(value: Any) -> object:
    if pd.isna(value):
        return ""
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    return value


def _clean_text(value: Any) -> str:
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def _find_value(record: dict[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        if key in record and not pd.isna(record[key]) and str(record[key]).strip():
            return record[key]
    return None


def _extract_date(record: dict[str, Any], *, year_hint: int | None = None) -> date | None:
    raw_value = _find_value(record, DATE_KEYS)
    if raw_value is None:
        return None

    text = _clean_text(raw_value)
    if not text:
        return None
    if re.fullmatch(r"\d{1,2}/\d{1,2}$", text):
        year = year_hint or datetime.now(UTC).year
        text = f"{text}/{year}"

    parsed = pd.to_datetime(text, errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed.date()


def _should_skip_record(record: dict[str, Any], *, year_hint: int | None = None) -> bool:
    if not any(_clean_text(value) for value in record.values()):
        return True
    if _extract_date(record, year_hint=year_hint) is not None:
        return False

    combined = " ".join(_clean_text(value).lower() for value in record.values())
    return any(marker in combined for marker in SUMMARY_MARKERS)


def _parse_amount_token(value: Any, *, default_type: str = "debit") -> tuple[Decimal, str] | None:
    text = _clean_text(value)
    if not text:
        return None

    normalized = text.upper().replace("$", "").replace(",", "").replace(" ", "")
    transaction_type = default_type
    negative_hint = normalized.startswith("-") or normalized.startswith("(")

    if normalized.endswith("CR"):
        transaction_type = "credit"
        normalized = normalized[:-2]
    elif negative_hint:
        transaction_type = "debit"
    elif default_type == "debit":
        transaction_type = "debit"
    else:
        transaction_type = "credit"

    normalized = normalized.replace("(", "").replace(")", "")
    try:
        amount = Decimal(normalized)
    except InvalidOperation:
        return None
    amount = amount.quantize(Decimal("0.01"))

    if transaction_type == "debit" and amount > 0:
        amount = -amount
    if transaction_type == "credit" and amount < 0:
        amount = abs(amount)

    return amount, transaction_type


def _extract_amount(record: dict[str, Any], *, bank_format: str) -> tuple[Decimal, str] | None:
    amount_value = _find_value(record, AMOUNT_KEYS)
    if amount_value is not None:
        default_type = "debit" if bank_format == "chase" else "debit"
        parsed = _parse_amount_token(amount_value, default_type=default_type)
        if parsed is not None:
            return parsed

    debit_value = _find_value(record, DEBIT_KEYS)
    if debit_value is not None:
        parsed = _parse_amount_token(debit_value, default_type="debit")
        if parsed is not None:
            return parsed

    credit_value = _find_value(record, CREDIT_KEYS)
    if credit_value is not None:
        parsed = _parse_amount_token(credit_value, default_type="credit")
        if parsed is not None:
            return parsed

    return None


def _extract_description(record: dict[str, Any]) -> str:
    raw_value = _find_value(record, DESCRIPTION_KEYS)
    if raw_value is not None:
        return _clean_text(raw_value)
    return ""


def _merchant_from_description(description: str) -> str:
    merchant = re.sub(r"\s{2,}", " ", description).strip()
    return merchant[:255] if merchant else "Unknown merchant"


def _build_external_id(
    posted_at: date,
    description: str,
    amount: Decimal,
    source_suffix: str,
) -> str:
    digest = hashlib.sha256(
        f"{posted_at.isoformat()}|{description}|{amount}|{source_suffix}".encode()
    ).hexdigest()
    return digest[:40]


def parse_csv_records(
    records: list[dict[str, Any]],
    *,
    headers: list[str],
    year_hint: int | None = None,
) -> ExtractionResult:
    bank_format = detect_bank_format(headers=headers)
    transactions: list[ParsedTransaction] = []

    for record in records:
        normalized_record = {_normalize_header(key): value for key, value in record.items()}
        if _should_skip_record(normalized_record, year_hint=year_hint):
            continue

        posted_at = _extract_date(normalized_record, year_hint=year_hint)
        description = _extract_description(normalized_record)
        amount_data = _extract_amount(normalized_record, bank_format=bank_format)
        if posted_at is None or not description or amount_data is None:
            logger.info(
                "parsing.csv.row_skipped",
                bank_format=bank_format,
                reason="missing_required_fields",
                row=normalized_record,
            )
            continue

        amount, transaction_type = amount_data
        merchant = _merchant_from_description(description)
        transactions.append(
            ParsedTransaction(
                posted_at=posted_at,
                description=description,
                merchant=merchant,
                amount=amount,
                transaction_type=transaction_type,
                external_id=_build_external_id(posted_at, description, amount, "csv"),
                raw_payload={
                    key: _serialize_value(value) for key, value in normalized_record.items()
                },
            )
        )

    logger.info(
        "parsing.csv.records_parsed",
        bank_format=bank_format,
        transaction_count=len(transactions),
    )
    return ExtractionResult(
        bank_format=bank_format,
        transactions=transactions,
        source_metadata={"headers": headers},
    )


def _infer_year_hint(text: str) -> int:
    year_match = re.search(r"\b(20\d{2})\b", text)
    if year_match:
        return int(year_match.group(1))
    return datetime.now(UTC).year


def parse_pdf_text(text: str) -> ExtractionResult:
    bank_format = detect_bank_format(pdf_text=text)
    year_hint = _infer_year_hint(text)
    transactions: list[ParsedTransaction] = []

    for raw_line in text.splitlines():
        line = " ".join(raw_line.strip().split())
        if not line:
            continue
        match = PDF_LINE_PATTERN.match(line)
        if match is None:
            continue

        record = {
            "date": match.group("date"),
            "description": match.group("description"),
            "amount": match.group("amount"),
        }
        posted_at = _extract_date(record, year_hint=year_hint)
        amount_data = _extract_amount(record, bank_format=bank_format)
        if posted_at is None or amount_data is None:
            continue

        amount, transaction_type = amount_data
        description = match.group("description").strip()
        transactions.append(
            ParsedTransaction(
                posted_at=posted_at,
                description=description,
                merchant=_merchant_from_description(description),
                amount=amount,
                transaction_type=transaction_type,
                external_id=_build_external_id(posted_at, description, amount, "pdf"),
                raw_payload={"line": line},
            )
        )

    logger.info(
        "parsing.pdf.records_parsed",
        bank_format=bank_format,
        transaction_count=len(transactions),
    )
    return ExtractionResult(
        bank_format=bank_format,
        transactions=transactions,
        source_metadata={"year_hint": year_hint},
    )
