import pytest

from src.services.parsing.detector import detect_bank_format


@pytest.mark.parametrize(
    ("headers", "pdf_text", "expected"),
    [
        (["Posting Date", "Details", "Amount"], None, "chase"),
        (["Date", "Original Description", "Amount"], None, "bank_of_america"),
        (["Date", "Memo", "Amount"], None, "wells_fargo"),
        (["Transaction Date", "Posted Date", "Description"], None, "capital_one"),
        (None, "AMERICAN EXPRESS statement\nDate Appears on your statement as Amount", "amex"),
        (["Date", "Description", "Status", "Debit", "Credit"], None, "citi"),
        (["Date", "Description", "Amount"], "Generic export", "generic"),
    ],
)
def test_detect_bank_format_matches_day_seven_templates(
    headers: list[str] | None,
    pdf_text: str | None,
    expected: str,
) -> None:
    assert detect_bank_format(headers=headers, pdf_text=pdf_text) == expected
