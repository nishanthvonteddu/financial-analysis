from src.services.parsing.csv_extractor import extract_csv_transactions


def test_csv_extractor_handles_chase_headers_and_signed_amounts() -> None:
    content = (
        b"Posting Date,Details,Amount,Type\n"
        b"04/01/2026,NETFLIX,-15.49,Sale\n"
        b"04/02/2026,REFUND,8.00,Return\n"
    )

    result = extract_csv_transactions(content)

    assert result.bank_format == "chase"
    assert len(result.transactions) == 2
    assert str(result.transactions[0].amount) == "-15.49"
    assert result.transactions[0].transaction_type == "debit"
    assert str(result.transactions[1].amount) == "-8.00"


def test_csv_extractor_handles_delimiter_encoding_and_footer_rows() -> None:
    content = (
        "Date;Description;Debit;Credit\n"
        "04/01/2026;Caf\xe9 Plus;12.00;\n"
        "04/02/2026;Payroll;;2500.00\n"
        "Ending Balance;;;;\n"
    ).encode("latin-1")

    result = extract_csv_transactions(content)

    assert result.bank_format == "generic"
    assert [tx.merchant for tx in result.transactions] == ["Caf\xe9 Plus", "Payroll"]
    assert str(result.transactions[0].amount) == "-12.00"
    assert str(result.transactions[1].amount) == "2500.00"
    assert result.transactions[1].transaction_type == "credit"
