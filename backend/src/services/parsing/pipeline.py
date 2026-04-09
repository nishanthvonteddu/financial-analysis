from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import delete

from src.core import database as database_module
from src.core.logging import get_logger
from src.models.data_source import DataSource
from src.models.raw_transaction import RawTransaction
from src.services.parsing.csv_extractor import extract_csv_transactions
from src.services.parsing.normalizer import normalize_extraction
from src.services.parsing.pdf_extractor import ScannedPdfError, extract_pdf_transactions
from src.services.parsing.types import ExtractionResult

logger = get_logger(__name__)


def get_processing_job_name(source_type: str) -> str:
    if source_type == "upload_pdf":
        return "process_pdf_upload_job"
    if source_type == "upload_csv":
        return "process_csv_upload_job"
    raise ValueError(f"Unsupported upload source type: {source_type}")


def process_upload_bytes(*, source_type: str, file_bytes: bytes) -> ExtractionResult:
    if source_type == "upload_pdf":
        return normalize_extraction(extract_pdf_transactions(file_bytes))
    if source_type == "upload_csv":
        return normalize_extraction(extract_csv_transactions(file_bytes))
    raise ValueError(f"Unsupported upload source type: {source_type}")


async def _store_transactions(upload: DataSource, extraction: ExtractionResult) -> int:
    async with database_module.SessionLocal() as session:
        persistent_upload = await session.get(DataSource, upload.id)
        if persistent_upload is None:
            return 0

        await session.execute(
            delete(RawTransaction).where(RawTransaction.data_source_id == upload.id)
        )

        for transaction in extraction.transactions:
            session.add(
                RawTransaction(
                    user_id=upload.user_id,
                    data_source_id=upload.id,
                    external_id=transaction.external_id,
                    posted_at=transaction.posted_at,
                    merchant=transaction.merchant,
                    description=transaction.description,
                    amount=transaction.amount,
                    currency=transaction.currency,
                    transaction_type=transaction.transaction_type,
                    subscription_candidate=transaction.subscription_candidate,
                    raw_payload=transaction.raw_payload,
                )
            )

        persistent_upload.provider = extraction.bank_format
        persistent_upload.status = "completed"
        persistent_upload.error_message = None
        persistent_upload.last_synced_at = datetime.now(UTC)
        await session.commit()
        return sum(
            1 for transaction in extraction.transactions if transaction.subscription_candidate
        )


async def process_stored_upload(upload_id: int) -> None:
    async with database_module.SessionLocal() as session:
        upload = await session.get(DataSource, upload_id)
        if upload is None:
            return

        upload.status = "processing"
        upload.error_message = None
        await session.commit()

        try:
            if not upload.storage_path:
                raise ValueError("Upload is missing its storage path.")

            logger.info(
                "parsing.pipeline.started",
                upload_id=upload.id,
                source_type=upload.source_type,
                storage_path=upload.storage_path,
            )
            extraction = process_upload_bytes(
                source_type=upload.source_type,
                file_bytes=Path(upload.storage_path).read_bytes(),
            )
            candidate_count = await _store_transactions(upload, extraction)
            logger.info(
                "parsing.pipeline.detection_triggered",
                upload_id=upload.id,
                candidate_count=candidate_count,
            )
        except ScannedPdfError as exc:
            upload.status = "failed"
            upload.error_message = str(exc)
            await session.commit()
            logger.info("uploads.processing_failed", upload_id=upload.id, reason="scanned_pdf")
        except Exception as exc:  # pragma: no cover - exercised via API and job paths
            upload.status = "failed"
            upload.error_message = str(exc)
            await session.commit()
            logger.exception("uploads.processing_failed", upload_id=upload.id)
