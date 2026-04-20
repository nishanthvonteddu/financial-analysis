from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.calendar import CalendarRenewalResponse
from src.services.calendar import get_calendar_renewals

router = APIRouter(prefix="/calendar", tags=["calendar"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "",
    response_model=CalendarRenewalResponse,
    status_code=status.HTTP_200_OK,
    summary="Get calendar renewals",
    description="Return projected subscription renewal dates for the authenticated user.",
)
async def get_calendar_renewals_route(
    session: DbSession,
    current_user: CurrentUser,
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
) -> CalendarRenewalResponse:
    today = datetime.now(UTC).date()
    return await get_calendar_renewals(
        session,
        user=current_user,
        year=year or today.year,
        month=month or today.month,
    )
