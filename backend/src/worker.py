from typing import cast

from arq import cron
from arq.connections import RedisSettings
from arq.typing import WorkerCoroutine

from src.config import get_settings
from src.jobs import (
    dispatch_renewal_notifications_job,
    process_csv_upload_job,
    process_pdf_upload_job,
    refresh_exchange_rates_job,
)

settings = get_settings()


class WorkerSettings:
    functions = [
        process_csv_upload_job,
        process_pdf_upload_job,
        refresh_exchange_rates_job,
        dispatch_renewal_notifications_job,
    ]
    cron_jobs = [
        cron(
            cast(WorkerCoroutine, refresh_exchange_rates_job),
            hour=6,
            minute=0,
            name="daily_exchange_rate_refresh",
        ),
        cron(
            cast(WorkerCoroutine, dispatch_renewal_notifications_job),
            hour=9,
            minute=0,
            name="daily_renewal_notifications",
        )
    ]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
