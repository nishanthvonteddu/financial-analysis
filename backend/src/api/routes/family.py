from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.family import (
    FamilyCreate,
    FamilyDashboardResponse,
    FamilyJoinRequest,
    FamilyPrivacyUpdate,
    FamilyStatusResponse,
)
from src.services.family import (
    create_family,
    get_family_dashboard,
    get_family_status,
    join_family,
    leave_family,
    update_family_privacy,
)

router = APIRouter(prefix="/family", tags=["family"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "",
    response_model=FamilyStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the current family workspace",
)
async def get_family_route(
    session: DbSession,
    current_user: CurrentUser,
) -> FamilyStatusResponse:
    return await get_family_status(session, user=current_user)


@router.post(
    "",
    response_model=FamilyStatusResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a family workspace",
)
async def create_family_route(
    payload: FamilyCreate,
    session: DbSession,
    current_user: CurrentUser,
) -> FamilyStatusResponse:
    return await create_family(session, user=current_user, payload=payload)


@router.post(
    "/join",
    response_model=FamilyStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Join a family workspace by invite code",
)
async def join_family_route(
    payload: FamilyJoinRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> FamilyStatusResponse:
    return await join_family(session, user=current_user, payload=payload)


@router.patch(
    "/privacy",
    response_model=FamilyStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Update family sharing privacy",
)
async def update_family_privacy_route(
    payload: FamilyPrivacyUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> FamilyStatusResponse:
    return await update_family_privacy(session, user=current_user, payload=payload)


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Leave the current family workspace",
)
async def leave_family_route(
    session: DbSession,
    current_user: CurrentUser,
) -> Response:
    await leave_family(session, user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/dashboard",
    response_model=FamilyDashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get family dashboard summary and sharing recommendations",
)
async def get_family_dashboard_route(
    session: DbSession,
    current_user: CurrentUser,
) -> FamilyDashboardResponse:
    return await get_family_dashboard(session, user=current_user)
