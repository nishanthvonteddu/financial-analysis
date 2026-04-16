from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.upload import UploadListResponse, UploadResponse
from src.services.upload import create_upload, delete_upload, get_upload_status, list_uploads

router = APIRouter(prefix="/uploads", tags=["uploads"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post(
    "",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an upload",
)
async def create_upload_route(
    background_tasks: BackgroundTasks,
    session: DbSession,
    current_user: CurrentUser,
    file: Annotated[UploadFile, File(...)],
) -> UploadResponse:
    return await create_upload(
        session,
        user=current_user,
        upload_file=file,
        background_tasks=background_tasks,
    )


@router.get(
    "",
    response_model=UploadListResponse,
    status_code=status.HTTP_200_OK,
    summary="List uploads",
)
async def list_uploads_route(
    session: DbSession,
    current_user: CurrentUser,
) -> UploadListResponse:
    return await list_uploads(session, user=current_user)


@router.get(
    "/{upload_id}/status",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Get upload processing status",
)
async def get_upload_status_route(
    upload_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> UploadResponse:
    return await get_upload_status(session, upload_id=upload_id, user=current_user)


@router.delete(
    "/{upload_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an upload",
)
async def delete_upload_route(
    upload_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> Response:
    await delete_upload(session, upload_id=upload_id, user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
