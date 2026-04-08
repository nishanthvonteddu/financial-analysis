from datetime import datetime

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    id: int
    file_name: str
    source_type: str
    provider: str
    status: str
    content_type: str | None = None
    file_size: int | None = None
    error_message: str | None = None
    transaction_count: int = Field(default=0, ge=0)
    created_at: datetime
    updated_at: datetime
    last_synced_at: datetime | None = None


class UploadListResponse(BaseModel):
    items: list[UploadResponse]
    total: int
