from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from pathlib import Path

from fastapi import BackgroundTasks, HTTPException, UploadFile, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import database as database_module
from src.core.logging import get_logger
from src.core.storage import get_storage
from src.models.data_source import DataSource
from src.models.raw_transaction import RawTransaction
from src.models.user import User
from src.schemas.upload import UploadListResponse, UploadResponse
from src.services.parsing import ScannedPdfError, extract_csv_transactions, extract_pdf_transactions

logger = get_logger(__name__)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024
UPLOAD_TYPES = {
    ".csv": {
        "content_types": {"text/csv", "application/csv", "application/vnd.ms-excel"},
        "source_type": "upload_csv",
    },
    ".pdf": {"content_types": {"application/pdf"}, "source_type": "upload_pdf"},
}


def _source_type_for_upload(file_name: str, content_type: str | None) -> str:
    suffix = Path(file_name).suffix.lower()
    upload_type = UPLOAD_TYPES.get(suffix)
    if upload_type is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only CSV and PDF uploads are supported.",
        )

    if (
        content_type
        and upload_type["content_types"]
        and content_type not in upload_type["content_types"]
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Uploaded file type does not match its extension.",
        )

    return str(upload_type["source_type"])


def _build_storage_key(user_id: int, file_hash: str, file_name: str) -> str:
    suffix = Path(file_name).suffix.lower()
    return f"uploads/{user_id}/{datetime.now(UTC).strftime('%Y/%m/%d')}/{file_hash}{suffix}"


def _serialize_upload(upload: DataSource, *, transaction_count: int = 0) -> UploadResponse:
    return UploadResponse(
        id=upload.id,
        file_name=upload.display_name or upload.name,
        source_type=upload.source_type,
        provider=upload.provider,
        status=upload.status,
        content_type=upload.content_type,
        file_size=upload.file_size,
        error_message=upload.error_message,
        transaction_count=transaction_count,
        created_at=upload.created_at,
        updated_at=upload.updated_at,
        last_synced_at=upload.last_synced_at,
    )


async def _transaction_counts(
    session: AsyncSession,
    *,
    upload_ids: list[int],
) -> dict[int, int]:
    if not upload_ids:
        return {}

    rows = await session.execute(
        select(RawTransaction.data_source_id, func.count(RawTransaction.id))
        .where(RawTransaction.data_source_id.in_(upload_ids))
        .group_by(RawTransaction.data_source_id)
    )
    return {
        int(data_source_id): int(count)
        for data_source_id, count in rows.all()
        if data_source_id is not None
    }


async def create_upload(
    session: AsyncSession,
    *,
    user: User,
    upload_file: UploadFile,
    background_tasks: BackgroundTasks,
) -> UploadResponse:
    file_name = (upload_file.filename or "").strip()
    if not file_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing upload filename.",
        )

    source_type = _source_type_for_upload(file_name, upload_file.content_type)
    content = await upload_file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded file exceeds the 10 MB limit.",
        )

    file_hash = hashlib.sha256(content).hexdigest()
    storage_key = _build_storage_key(user.id, file_hash, file_name)
    storage = get_storage()
    saved_path = await storage.save(storage_key, content)

    upload = DataSource(
        user_id=user.id,
        name=f"{file_hash[:12]}-{int(datetime.now(UTC).timestamp())}",
        display_name=file_name,
        source_type=source_type,
        provider="pending",
        external_id=file_hash,
        storage_path=saved_path,
        content_type=upload_file.content_type,
        file_size=len(content),
        status="queued",
        error_message=None,
    )
    session.add(upload)
    await session.commit()
    await session.refresh(upload)

    logger.info(
        "uploads.created",
        user_id=user.id,
        upload_id=upload.id,
        source_type=source_type,
        file_hash=file_hash,
    )
    response = _serialize_upload(upload)
    await process_upload(upload.id)
    return response


async def list_uploads(session: AsyncSession, *, user: User) -> UploadListResponse:
    statement = (
        select(DataSource)
        .where(
            DataSource.user_id == user.id,
            DataSource.source_type.in_(("upload_csv", "upload_pdf")),
        )
        .order_by(DataSource.created_at.desc(), DataSource.id.desc())
    )
    uploads = list((await session.scalars(statement)).all())
    counts = await _transaction_counts(session, upload_ids=[upload.id for upload in uploads])
    return UploadListResponse(
        items=[
            _serialize_upload(upload, transaction_count=counts.get(upload.id, 0))
            for upload in uploads
        ],
        total=len(uploads),
    )


async def get_upload_or_404(session: AsyncSession, *, upload_id: int, user: User) -> DataSource:
    statement = select(DataSource).where(
        DataSource.id == upload_id,
        DataSource.user_id == user.id,
        DataSource.source_type.in_(("upload_csv", "upload_pdf")),
    )
    upload = await session.scalar(statement)
    if upload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found.")
    return upload


async def get_upload_status(
    session: AsyncSession,
    *,
    upload_id: int,
    user: User,
) -> UploadResponse:
    upload = await get_upload_or_404(session, upload_id=upload_id, user=user)
    counts = await _transaction_counts(session, upload_ids=[upload.id])
    return _serialize_upload(upload, transaction_count=counts.get(upload.id, 0))


async def delete_upload(
    session: AsyncSession,
    *,
    upload_id: int,
    user: User,
) -> None:
    upload = await get_upload_or_404(session, upload_id=upload_id, user=user)
    await session.execute(delete(RawTransaction).where(RawTransaction.data_source_id == upload.id))
    await session.delete(upload)
    await session.commit()

    if upload.storage_path:
        await get_storage().delete(upload.storage_path)

    logger.info("uploads.deleted", user_id=user.id, upload_id=upload_id)


async def process_upload(upload_id: int) -> None:
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

            file_bytes = Path(upload.storage_path).read_bytes()
            if upload.source_type == "upload_pdf":
                extraction = extract_pdf_transactions(file_bytes)
            else:
                extraction = extract_csv_transactions(file_bytes)

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
                        raw_payload=transaction.raw_payload,
                    )
                )

            upload.provider = extraction.bank_format
            upload.status = "completed"
            upload.error_message = None
            upload.last_synced_at = datetime.now(UTC)
            await session.commit()
            logger.info(
                "uploads.processed",
                upload_id=upload.id,
                bank_format=extraction.bank_format,
                transaction_count=len(extraction.transactions),
            )
        except (ScannedPdfError, ValueError) as exc:
            upload.provider = "unknown"
            upload.status = "failed"
            upload.error_message = str(exc)
            await session.commit()
            logger.info("uploads.failed", upload_id=upload.id, error_message=str(exc))
