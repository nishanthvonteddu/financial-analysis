from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ExpenseReportCategoryBreakdownItem(BaseModel):
    category_name: str
    total_amount: Decimal
    transaction_count: int


class ExpenseReportMerchantBreakdownItem(BaseModel):
    merchant: str
    total_amount: Decimal
    transaction_count: int


class ExpenseReportTimelinePoint(BaseModel):
    period_start: date
    label: str
    total_amount: Decimal


class ExpenseReportSummary(BaseModel):
    upload_name: str | None = None
    provider: str | None = None
    transaction_count: int
    recurring_transaction_count: int
    merchant_count: int
    average_transaction: Decimal
    largest_transaction: Decimal
    category_breakdown: list[ExpenseReportCategoryBreakdownItem]
    top_merchants: list[ExpenseReportMerchantBreakdownItem]
    spend_timeline: list[ExpenseReportTimelinePoint]


class ExpenseReportResponse(BaseModel):
    id: int
    user_id: int
    data_source_id: int | None
    period_start: date
    period_end: date
    currency: str
    total_amount: Decimal
    report_status: str
    generated_at: datetime | None
    created_at: datetime
    updated_at: datetime
    summary: ExpenseReportSummary

    model_config = ConfigDict(from_attributes=True)


class ExpenseReportListResponse(BaseModel):
    items: list[ExpenseReportResponse]
    total: int
