from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

AnalyticsRangeKey = Literal["90d", "180d", "365d"]


class AnalyticsWindow(BaseModel):
    key: AnalyticsRangeKey
    label: str
    start_date: date
    end_date: date


class AnalyticsSummary(BaseModel):
    total_spend: Decimal
    average_monthly_spend: Decimal
    currency: str
    active_subscriptions: int
    projected_monthly_savings: Decimal
    projected_range_savings: Decimal


class AnalyticsCategoryItem(BaseModel):
    category_id: int | None
    category_name: str
    total_spend: Decimal
    currency: str
    active_subscriptions: int
    projected_monthly_savings: Decimal
    projected_range_savings: Decimal


class AnalyticsPaymentMethodItem(BaseModel):
    payment_method_id: int | None
    payment_method_label: str
    provider: str | None = None
    total_spend: Decimal
    currency: str
    active_subscriptions: int


class AnalyticsFrequencyItem(BaseModel):
    cadence: str
    label: str
    subscription_count: int
    monthly_equivalent: Decimal
    currency: str


class AnalyticsTrendCategoryItem(BaseModel):
    category_name: str
    total_spend: Decimal
    currency: str


class AnalyticsTrendPoint(BaseModel):
    period_start: date
    label: str
    total_spend: Decimal
    currency: str
    category_totals: list[AnalyticsTrendCategoryItem]


class AnalyticsResponse(BaseModel):
    window: AnalyticsWindow
    summary: AnalyticsSummary
    categories: list[AnalyticsCategoryItem]
    payment_methods: list[AnalyticsPaymentMethodItem]
    frequency_distribution: list[AnalyticsFrequencyItem]
    trends: list[AnalyticsTrendPoint]
    trend_categories: list[str]
