from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.analytics import AnalyticsRangeKey, AnalyticsResponse
from src.schemas.expense_report import ExpenseReportListResponse, ExpenseReportResponse
from src.services.analytics import get_expense_analytics
from src.services.expense_report import get_expense_report_or_404, list_expense_reports

router = APIRouter(prefix="/expense-reports", tags=["expense-reports"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AnalyticsRangeParam = Annotated[AnalyticsRangeKey, Query(alias="range")]


@router.get(
    "",
    response_model=ExpenseReportListResponse,
    status_code=status.HTTP_200_OK,
    summary="List expense reports",
)
async def list_expense_reports_route(
    session: DbSession,
    current_user: CurrentUser,
) -> ExpenseReportListResponse:
    return await list_expense_reports(session, user=current_user)


@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get analytics aggregates for the reports workspace",
)
async def get_expense_analytics_route(
    session: DbSession,
    current_user: CurrentUser,
    range_key: AnalyticsRangeParam = "180d",
) -> AnalyticsResponse:
    return await get_expense_analytics(session, user=current_user, range_key=range_key)


@router.get(
    "/{report_id}",
    response_model=ExpenseReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Get an expense report",
)
async def get_expense_report_route(
    report_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> ExpenseReportResponse:
    return await get_expense_report_or_404(session, report_id=report_id, user=current_user)
