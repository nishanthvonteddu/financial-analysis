from src.services.parsing.pipeline import get_processing_job_name, process_upload_bytes


def test_process_upload_bytes_normalizes_known_services_from_csv() -> None:
    content = (
        b"Posting Date,Details,Amount\n"
        b"04/01/2026,NETFLIX COM LOS GATOS,-15.49\n"
        b"04/02/2026,LOCAL COFFEE HOUSE,-8.25\n"
    )

    result = process_upload_bytes(source_type="upload_csv", file_bytes=content)

    assert result.bank_format == "chase"
    assert result.transactions[0].merchant == "Netflix"
    assert result.transactions[0].subscription_candidate is True
    assert result.transactions[0].service_category == "entertainment"
    assert result.transactions[1].merchant == "Local Coffee House"
    assert result.transactions[1].subscription_candidate is False


def test_get_processing_job_name_routes_each_upload_type() -> None:
    assert get_processing_job_name("upload_csv") == "process_csv_upload_job"
    assert get_processing_job_name("upload_pdf") == "process_pdf_upload_job"
