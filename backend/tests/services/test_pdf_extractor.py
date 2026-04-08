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
            [
                _FakePage(
                    "CHASE STATEMENT 2026\n"
                    "04/01 NETFLIX 15.49\n"
                    "04/02 SPOTIFY 10.99\n"
                )
            ]
        )

    monkeypatch.setattr("src.services.parsing.pdf_extractor.pdfplumber.open", _open)

    text = extract_pdf_text(b"%PDF")
    result = extract_pdf_transactions(b"%PDF")

    assert "CHASE STATEMENT" in text
    assert result.bank_format == "chase"
    assert len(result.transactions) == 2
    assert result.transactions[0].merchant == "NETFLIX"


def test_pdf_extractor_detects_scanned_pdfs(monkeypatch) -> None:
    def _open(_: object) -> _FakePdf:
        return _FakePdf([_FakePage(None), _FakePage("")])

    monkeypatch.setattr("src.services.parsing.pdf_extractor.pdfplumber.open", _open)

    with pytest.raises(ScannedPdfError):
        extract_pdf_text(b"%PDF")
