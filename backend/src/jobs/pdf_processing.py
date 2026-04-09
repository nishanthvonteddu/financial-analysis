from __future__ import annotations

from src.services.parsing.pipeline import process_stored_upload


async def process_pdf_upload_job(_: dict[str, object], upload_id: int) -> None:
    await process_stored_upload(upload_id)
