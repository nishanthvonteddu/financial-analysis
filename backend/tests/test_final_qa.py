from typing import Any

import pytest
import structlog
from structlog.testing import capture_logs

from src.core.logging import configure_logging, get_logger
from src.jobs import csv_processing, pdf_processing
from src.worker import WorkerSettings


def test_worker_registers_upload_jobs_and_daily_cron_jobs() -> None:
    function_names = {function.__name__ for function in WorkerSettings.functions}
    assert function_names == {
        "process_csv_upload_job",
        "process_pdf_upload_job",
        "refresh_exchange_rates_job",
        "dispatch_renewal_notifications_job",
    }

    cron_jobs = {job.name: job for job in WorkerSettings.cron_jobs}
    assert cron_jobs["daily_exchange_rate_refresh"].hour == 6
    assert cron_jobs["daily_exchange_rate_refresh"].minute == 0
    assert cron_jobs["daily_renewal_notifications"].hour == 9
    assert cron_jobs["daily_renewal_notifications"].minute == 0


@pytest.mark.asyncio
async def test_upload_background_jobs_dispatch_to_stored_upload_processor(monkeypatch: Any) -> None:
    processed: list[int] = []

    async def fake_process_stored_upload(upload_id: int) -> None:
        processed.append(upload_id)

    monkeypatch.setattr(csv_processing, "process_stored_upload", fake_process_stored_upload)
    monkeypatch.setattr(pdf_processing, "process_stored_upload", fake_process_stored_upload)

    await csv_processing.process_csv_upload_job({}, 101)
    await pdf_processing.process_pdf_upload_job({}, 202)

    assert processed == [101, 202]


def test_json_logging_includes_structured_context() -> None:
    configure_logging(json_logs=True, log_level="INFO")
    processors = structlog.get_config()["processors"]
    assert isinstance(processors[-1], structlog.processors.JSONRenderer)

    with capture_logs() as logs:
        get_logger("final_qa").info(
            "final_qa.logging_verified",
            component="backend",
            route="/api/v1/health",
        )

    [log_record] = logs
    assert log_record["event"] == "final_qa.logging_verified"
    assert log_record["log_level"] == "info"
    assert log_record["component"] == "backend"
    assert log_record["route"] == "/api/v1/health"
