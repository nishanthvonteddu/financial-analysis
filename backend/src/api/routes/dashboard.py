from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.dashboard import (
    DashboardLayoutResponse,
    DashboardLayoutUpdate,
    DashboardSummaryResponse,
)
from src.schemas.score import SubscriptionScoreResponse
from src.services.dashboard import (
    get_dashboard_layout,
    get_dashboard_summary,
    update_dashboard_layout,
)
from src.services.score import get_subscription_score

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dashboard summary metrics",
)
async def get_dashboard_summary_route(
    session: DbSession,
    current_user: CurrentUser,
) -> DashboardSummaryResponse:
    return await get_dashboard_summary(session, user=current_user)


@router.get(
    "/score",
    response_model=SubscriptionScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the subscription score and duplicate candidates",
)
async def get_dashboard_score_route(
    session: DbSession,
    current_user: CurrentUser,
) -> SubscriptionScoreResponse:
    return await get_subscription_score(session, user=current_user)


@router.get(
    "/layout",
    response_model=DashboardLayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the saved dashboard layout",
)
async def get_dashboard_layout_route(
    session: DbSession,
    current_user: CurrentUser,
) -> DashboardLayoutResponse:
    return await get_dashboard_layout(session, user=current_user)


@router.put(
    "/layout",
    response_model=DashboardLayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Replace the saved dashboard layout",
)
async def update_dashboard_layout_route(
    payload: DashboardLayoutUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> DashboardLayoutResponse:
    return await update_dashboard_layout(session, user=current_user, payload=payload)
