from arq.connections import RedisSettings

from src.config import get_settings
from src.jobs import process_csv_upload_job, process_pdf_upload_job

settings = get_settings()


class WorkerSettings:
    functions = [process_csv_upload_job, process_pdf_upload_job]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
