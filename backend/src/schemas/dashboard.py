from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

DASHBOARD_WIDGET_IDS = (
    "subscription-score",
    "active-subscriptions",
    "monthly-spend",
    "category-breakdown",
    "upcoming-renewals",
    "recently-ended",
    "duplicate-alerts",
)

DashboardWidgetId = Literal[
    "subscription-score",
    "active-subscriptions",
    "monthly-spend",
    "category-breakdown",
    "upcoming-renewals",
    "recently-ended",
    "duplicate-alerts",
]
DashboardColumn = Literal["primary", "secondary"]
DashboardScoreBand = Literal["excellent", "steady", "attention", "at-risk"]
DuplicateConfidence = Literal["high", "medium"]


class DashboardSummaryStats(BaseModel):
    total_monthly_spend: Decimal
    currency: str
    active_subscriptions: int
    upcoming_renewals: int
    cancelled_subscriptions: int


class DashboardMonthlySpendPoint(BaseModel):
    month: str
    label: str
    total: Decimal
    currency: str


class DashboardActiveSubscriptionItem(BaseModel):
    subscription_id: int
    name: str
    vendor: str
    amount: Decimal
    currency: str
    cadence: str
    category_name: str
    next_charge_date: date | None = None


class DashboardCategoryBreakdownItem(BaseModel):
    category_id: int | None
    category_name: str
    subscriptions: int
    total_monthly_spend: Decimal
    currency: str


class DashboardUpcomingRenewalItem(BaseModel):
    subscription_id: int
    name: str
    vendor: str
    amount: Decimal
    currency: str
    next_charge_date: date
    days_until_charge: int


class DashboardRecentlyEndedItem(BaseModel):
    subscription_id: int
    name: str
    vendor: str
    amount: Decimal
    currency: str
    end_date: date


class DashboardScoreOverview(BaseModel):
    score: int
    grade: str
    band: DashboardScoreBand
    recommendation_count: int
    duplicate_candidates: int
    potential_monthly_savings: Decimal
    currency: str


class DashboardDuplicateAlertItem(BaseModel):
    left_subscription_id: int
    left_name: str
    left_vendor: str
    right_subscription_id: int
    right_name: str
    right_vendor: str
    shared_signal: str
    confidence: DuplicateConfidence
    potential_monthly_savings: Decimal
    currency: str


class DashboardSummaryResponse(BaseModel):
    summary: DashboardSummaryStats
    active_subscriptions: list[DashboardActiveSubscriptionItem]
    monthly_spend: list[DashboardMonthlySpendPoint]
    category_breakdown: list[DashboardCategoryBreakdownItem]
    upcoming_renewals: list[DashboardUpcomingRenewalItem]
    recently_ended: list[DashboardRecentlyEndedItem]
    score_overview: DashboardScoreOverview | None = None
    duplicate_alerts: list[DashboardDuplicateAlertItem] = []


class DashboardLayoutWidget(BaseModel):
    id: DashboardWidgetId
    column: DashboardColumn


class DashboardLayoutUpdate(BaseModel):
    widgets: list[DashboardLayoutWidget]

    @field_validator("widgets")
    @classmethod
    def validate_widget_count(
        cls, value: list[DashboardLayoutWidget]
    ) -> list[DashboardLayoutWidget]:
        if len(value) != len(DASHBOARD_WIDGET_IDS):
            raise ValueError("Dashboard layout must include each widget exactly once.")
        return value

    @model_validator(mode="after")
    def validate_widget_uniqueness(self) -> "DashboardLayoutUpdate":
        widget_ids = [widget.id for widget in self.widgets]
        if len(set(widget_ids)) != len(widget_ids) or set(widget_ids) != set(DASHBOARD_WIDGET_IDS):
            raise ValueError("Dashboard layout must include each widget exactly once.")
        return self


class DashboardLayoutResponse(DashboardLayoutUpdate):
    version: int
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
