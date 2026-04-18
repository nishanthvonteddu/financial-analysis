from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from pathlib import Path

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import BackgroundTasks, HTTPException, UploadFile, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.core.logging import get_logger
from src.core.storage import get_storage
from src.models.data_source import DataSource
from src.models.expense_report import ExpenseReport
from src.models.raw_transaction import RawTransaction
from src.models.user import User
from src.schemas.upload import UploadListResponse, UploadResponse
from src.services.parsing import get_processing_job_name, process_stored_upload

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


async def _close_redis_pool(redis: object) -> None:
    close = getattr(redis, "aclose", None)
    if callable(close):
        await close()
        return

    close = getattr(redis, "close", None)
    if callable(close):
        result = close()
        if hasattr(result, "__await__"):
            await result


async def _enqueue_upload_job(upload: DataSource) -> bool:
    settings = get_settings()
    if settings.upload_job_backend.lower() != "arq":
        return False

    try:
        redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
        try:
            await redis.enqueue_job(get_processing_job_name(upload.source_type), upload.id)
        finally:
            await _close_redis_pool(redis)
    except Exception:
        logger.exception(
            "uploads.enqueue_failed",
            upload_id=upload.id,
            source_type=upload.source_type,
        )
        return False

    logger.info("uploads.enqueued", upload_id=upload.id, source_type=upload.source_type)
    return True


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
    if not await _enqueue_upload_job(upload):
        background_tasks.add_task(process_stored_upload, upload.id)
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
    await session.execute(delete(ExpenseReport).where(ExpenseReport.data_source_id == upload.id))
    await session.execute(delete(RawTransaction).where(RawTransaction.data_source_id == upload.id))
    await session.delete(upload)
    await session.commit()

    if upload.storage_path:
        await get_storage().delete(upload.storage_path)

    logger.info("uploads.deleted", user_id=user.id, upload_id=upload_id)
