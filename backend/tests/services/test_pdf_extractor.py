from datetime import date

import pytest

from src.services.parsing.pdf_extractor import (
    ScannedPdfError,
    extract_pdf_text,
    extract_pdf_transactions,
)


class _FakePage:
    def __init__(self, text: str | None) -> None:
        self._text = text

    def extract_text(self) -> str | None:
        return self._text


class _FakePdf:
    def __init__(self, pages: list[_FakePage]) -> None:
        self.pages = pages

    def __enter__(self) -> "_FakePdf":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


def test_pdf_extractor_returns_text_and_transactions(monkeypatch) -> None:
    def _open(_: object) -> _FakePdf:
        return _FakePdf(
            [_FakePage("CHASE STATEMENT 2026\n04/01 NETFLIX 15.49\n04/02 SPOTIFY 10.99\n")]
        )

    monkeypatch.setattr("src.services.parsing.pdf_extractor.pdfplumber.open", _open)

    text = extract_pdf_text(b"%PDF")
    result = extract_pdf_transactions(b"%PDF")

    assert "CHASE STATEMENT" in text
    assert result.bank_format == "chase"
    assert len(result.transactions) == 2
    assert result.transactions[0].merchant == "NETFLIX"


def test_pdf_extractor_handles_capital_one_statement_rows(monkeypatch) -> None:
    statement_text = "\n".join(
        [
            "Savor Credit Card | World Elite Mastercard ending in 0510",
            "Capital One",
            "Payment Due Date: Apr 20, 2026 Account ending in 0510",
            "Transactions",
            "Trans Date Post Date Description Amount",
            "Mar 20 Mar 20 CAPITAL ONE AUTOPAY PYMT - $63.00",
            "Mar 2 Mar 2 Amazon web servicesSEATTLEWA $4.80",
            "Mar 14 Mar 16 CLAUDE.AI SUBSCRIPTIONSAN FRANCISCOCA $20.00",
        ]
    )

    def _open(_: object) -> _FakePdf:
        return _FakePdf([_FakePage(statement_text)])

    monkeypatch.setattr("src.services.parsing.pdf_extractor.pdfplumber.open", _open)

    result = extract_pdf_transactions(b"%PDF")

    assert result.bank_format == "capital_one"
    assert len(result.transactions) == 3
    assert result.transactions[0].transaction_type == "credit"
    assert str(result.transactions[0].amount) == "63.00"
    assert result.transactions[1].transaction_type == "debit"
    assert str(result.transactions[1].amount) == "-4.80"
    assert result.transactions[2].posted_at == date(2026, 3, 16)
    assert result.transactions[2].description == "CLAUDE.AI SUBSCRIPTIONSAN FRANCISCOCA"
    assert str(result.transactions[2].amount) == "-20.00"


def test_pdf_extractor_detects_scanned_pdfs(monkeypatch) -> None:
    def _open(_: object) -> _FakePdf:
        return _FakePdf([_FakePage(None), _FakePage("")])

    monkeypatch.setattr("src.services.parsing.pdf_extractor.pdfplumber.open", _open)

    with pytest.raises(ScannedPdfError):
        extract_pdf_text(b"%PDF")
