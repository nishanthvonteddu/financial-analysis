from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

DASHBOARD_WIDGET_IDS = (
    "active-subscriptions",
    "monthly-spend",
    "category-breakdown",
    "upcoming-renewals",
    "recently-ended",
)

DashboardWidgetId = Literal[
    "active-subscriptions",
    "monthly-spend",
    "category-breakdown",
    "upcoming-renewals",
    "recently-ended",
]
DashboardColumn = Literal["primary", "secondary"]


class DashboardSummaryStats(BaseModel):
    total_monthly_spend: Decimal
    active_subscriptions: int
    upcoming_renewals: int
    cancelled_subscriptions: int


class DashboardMonthlySpendPoint(BaseModel):
    month: str
    label: str
    total: Decimal


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


class DashboardSummaryResponse(BaseModel):
    summary: DashboardSummaryStats
    active_subscriptions: list[DashboardActiveSubscriptionItem]
    monthly_spend: list[DashboardMonthlySpendPoint]
    category_breakdown: list[DashboardCategoryBreakdownItem]
    upcoming_renewals: list[DashboardUpcomingRenewalItem]
    recently_ended: list[DashboardRecentlyEndedItem]


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
