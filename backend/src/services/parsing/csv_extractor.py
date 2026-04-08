from __future__ import annotations

import csv
from io import StringIO

import pandas as pd  # type: ignore[import-untyped]

from src.core.logging import get_logger
from src.services.parsing.template_parsers import parse_csv_records
from src.services.parsing.types import ExtractionResult

logger = get_logger(__name__)

ENCODINGS = ("utf-8-sig", "utf-8", "latin-1")
DELIMITERS = ",;\t|"
HEADER_MARKERS = ("date", "posting", "transaction", "amount", "description", "details", "debit")


def _decode_csv(content: bytes) -> tuple[str, str]:
    for encoding in ENCODINGS:
        try:
            return content.decode(encoding), encoding
        except UnicodeDecodeError:
            continue
    return content.decode("latin-1", errors="ignore"), "latin-1"


def _detect_delimiter(text: str) -> str:
    sample = "\n".join(line for line in text.splitlines() if line.strip())[:4096]
    try:
        delimiter = csv.Sniffer().sniff(sample, delimiters=DELIMITERS).delimiter
        if delimiter in sample:
            return delimiter
    except csv.Error:
        pass

    lines = [line for line in text.splitlines() if line.strip()][:5]
    if not lines:
        return ","
    delimiter_scores = {
        delimiter: sum(line.count(delimiter) for line in lines) for delimiter in DELIMITERS
    }
    return max(delimiter_scores, key=lambda delimiter: delimiter_scores[delimiter])


def _detect_header_index(lines: list[str], delimiter: str) -> int:
    for index, line in enumerate(lines[:10]):
        parts = [part.strip().lower() for part in line.split(delimiter)]
        score = sum(any(marker in part for marker in HEADER_MARKERS) for part in parts)
        if score >= 2:
            return index
    return 0


def extract_csv_transactions(content: bytes) -> ExtractionResult:
    logger.info("parsing.csv.started", file_size=len(content))
    text, encoding = _decode_csv(content)
    delimiter = _detect_delimiter(text)
    lines = [line for line in text.splitlines() if line.strip()]
    header_index = _detect_header_index(lines, delimiter)

    frame = pd.read_csv(
        StringIO(text),
        sep=delimiter,
        header=header_index,
        engine="python",
        skip_blank_lines=True,
        on_bad_lines="skip",
    )
    frame = frame.dropna(axis=1, how="all")
    headers = [str(column).strip() for column in frame.columns]
    records = frame.to_dict(orient="records")

    logger.info(
        "parsing.csv.decoded",
        encoding=encoding,
        delimiter=delimiter,
        header_index=header_index,
        headers=headers,
    )
    return parse_csv_records(records, headers=headers)
