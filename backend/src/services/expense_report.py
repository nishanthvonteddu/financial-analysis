from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import database as database_module
from src.core.logging import get_logger
from src.models.data_source import DataSource
from src.models.expense_report import ExpenseReport
from src.models.raw_transaction import RawTransaction
from src.models.user import User
from src.schemas.expense_report import (
    ExpenseReportCategoryBreakdownItem,
    ExpenseReportListResponse,
    ExpenseReportMerchantBreakdownItem,
    ExpenseReportResponse,
    ExpenseReportSummary,
    ExpenseReportTimelinePoint,
)

logger = get_logger(__name__)


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _merchant_label(transaction: RawTransaction) -> str:
    return transaction.merchant.strip() or transaction.description.strip() or "Unknown merchant"


def _category_label(transaction: RawTransaction) -> str:
    raw_value = (
        transaction.raw_payload.get("service_category")
        or transaction.raw_payload.get("category")
        or "Uncategorized"
    )
    normalized = str(raw_value).strip().replace("_", " ").replace("-", " ")
    return " ".join(part.capitalize() for part in normalized.split()) or "Uncategorized"


def _is_recurring_candidate(transaction: RawTransaction) -> bool:
    return (
        transaction.subscription_candidate
        or transaction.raw_payload.get("is_known_service") is True
    )


def _build_report_summary(
    *,
    upload: DataSource,
    transactions: list[RawTransaction],
) -> ExpenseReportSummary:
    total_amount = sum(
        (abs(Decimal(transaction.amount)) for transaction in transactions),
        Decimal("0.00"),
    )
    merchant_totals: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"total_amount": Decimal("0.00"), "transaction_count": 0}
    )
    category_totals: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"total_amount": Decimal("0.00"), "transaction_count": 0}
    )
    timeline_totals: dict[date, Decimal] = defaultdict(lambda: Decimal("0.00"))

    for transaction in transactions:
        amount = abs(Decimal(transaction.amount))
        merchant_entry = merchant_totals[_merchant_label(transaction)]
        merchant_entry["total_amount"] = Decimal(merchant_entry["total_amount"]) + amount
        merchant_entry["transaction_count"] = int(merchant_entry["transaction_count"]) + 1

        category_entry = category_totals[_category_label(transaction)]
        category_entry["total_amount"] = Decimal(category_entry["total_amount"]) + amount
        category_entry["transaction_count"] = int(category_entry["transaction_count"]) + 1

        timeline_totals[transaction.posted_at.replace(day=1)] += amount

    transaction_count = len(transactions)
    average_transaction = (
        _quantize_money(total_amount / Decimal(transaction_count))
        if transaction_count > 0
        else Decimal("0.00")
    )
    largest_transaction = max(
        (_quantize_money(abs(Decimal(transaction.amount))) for transaction in transactions),
        default=Decimal("0.00"),
    )

    return ExpenseReportSummary(
        upload_name=upload.display_name or upload.name,
        provider=upload.provider,
        transaction_count=transaction_count,
        recurring_transaction_count=sum(
            1 for transaction in transactions if _is_recurring_candidate(transaction)
        ),
        merchant_count=len(merchant_totals),
        average_transaction=average_transaction,
        largest_transaction=largest_transaction,
        category_breakdown=[
            ExpenseReportCategoryBreakdownItem(
                category_name=category_name,
                total_amount=_quantize_money(Decimal(values["total_amount"])),
                transaction_count=int(values["transaction_count"]),
            )
            for category_name, values in sorted(
                category_totals.items(),
                key=lambda item: (
                    Decimal(item[1]["total_amount"]),
                    item[0].lower(),
                ),
                reverse=True,
            )
        ],
        top_merchants=[
            ExpenseReportMerchantBreakdownItem(
                merchant=merchant,
                total_amount=_quantize_money(Decimal(values["total_amount"])),
                transaction_count=int(values["transaction_count"]),
            )
            for merchant, values in sorted(
                merchant_totals.items(),
                key=lambda item: (
                    Decimal(item[1]["total_amount"]),
                    item[0].lower(),
                ),
                reverse=True,
            )[:5]
        ],
        spend_timeline=[
            ExpenseReportTimelinePoint(
                period_start=period_start,
                label=period_start.strftime("%b %Y"),
                total_amount=_quantize_money(total),
            )
            for period_start, total in sorted(timeline_totals.items())
        ],
    )


def _serialize_report(report: ExpenseReport) -> ExpenseReportResponse:
    return ExpenseReportResponse(
        id=report.id,
        user_id=report.user_id,
        data_source_id=report.data_source_id,
        period_start=report.period_start,
        period_end=report.period_end,
        currency=report.currency,
        total_amount=_quantize_money(Decimal(report.total_amount)),
        report_status=report.report_status,
        generated_at=report.generated_at,
        created_at=report.created_at,
        updated_at=report.updated_at,
        summary=ExpenseReportSummary.model_validate(report.summary),
    )


async def generate_expense_reports_for_upload(*, upload_id: int) -> list[ExpenseReportResponse]:
    async with database_module.SessionLocal() as session:
        upload = await session.get(DataSource, upload_id)
        if upload is None:
            return []

        reports = await _generate_expense_reports_for_upload(session, upload=upload)
        await session.commit()
        return [_serialize_report(report) for report in reports]


async def _generate_expense_reports_for_upload(
    session: AsyncSession,
    *,
    upload: DataSource,
) -> list[ExpenseReport]:
    transactions = list(
        (
            await session.scalars(
                select(RawTransaction)
                .where(
                    RawTransaction.user_id == upload.user_id,
                    RawTransaction.data_source_id == upload.id,
                )
                .order_by(RawTransaction.posted_at.asc(), RawTransaction.id.asc())
            )
        ).all()
    )
    debit_transactions = [
        transaction
        for transaction in transactions
        if transaction.transaction_type.lower() == "debit" and Decimal(transaction.amount) < 0
    ]
    existing_reports = list(
        (
            await session.scalars(
                select(ExpenseReport).where(
                    ExpenseReport.user_id == upload.user_id,
                    ExpenseReport.data_source_id == upload.id,
                )
            )
        ).all()
    )
    existing_by_currency = {report.currency: report for report in existing_reports}

    if not debit_transactions:
        for report in existing_reports:
            await session.delete(report)
        logger.info("expense_reports.cleared", upload_id=upload.id, user_id=upload.user_id)
        return []

    transactions_by_currency: dict[str, list[RawTransaction]] = defaultdict(list)
    for transaction in debit_transactions:
        transactions_by_currency[transaction.currency].append(transaction)

    now = datetime.now(UTC)
    reports: list[ExpenseReport] = []
    seen_currencies: set[str] = set()

    for currency, currency_transactions in sorted(transactions_by_currency.items()):
        seen_currencies.add(currency)
        total_amount = _quantize_money(
            sum(
                (abs(Decimal(transaction.amount)) for transaction in currency_transactions),
                Decimal("0.00"),
            )
        )
        summary = _build_report_summary(upload=upload, transactions=currency_transactions)
        current_report = existing_by_currency.get(currency)
        if current_report is None:
            current_report = ExpenseReport(
                user_id=upload.user_id,
                data_source_id=upload.id,
                period_start=currency_transactions[0].posted_at,
                period_end=currency_transactions[-1].posted_at,
                currency=currency,
                total_amount=total_amount,
                report_status="ready",
                generated_at=now,
                summary=summary.model_dump(mode="json"),
            )
            session.add(current_report)
        else:
            current_report.period_start = currency_transactions[0].posted_at
            current_report.period_end = currency_transactions[-1].posted_at
            current_report.total_amount = total_amount
            current_report.report_status = "ready"
            current_report.generated_at = now
            current_report.summary = summary.model_dump(mode="json")
        reports.append(current_report)

    for currency, report in existing_by_currency.items():
        if currency not in seen_currencies:
            await session.delete(report)

    logger.info(
        "expense_reports.generated",
        upload_id=upload.id,
        user_id=upload.user_id,
        report_count=len(reports),
        currencies=sorted(seen_currencies),
    )
    return reports


async def list_expense_reports(
    session: AsyncSession,
    *,
    user: User,
) -> ExpenseReportListResponse:
    reports = list(
        (
            await session.scalars(
                select(ExpenseReport)
                .where(ExpenseReport.user_id == user.id)
                .order_by(ExpenseReport.generated_at.desc(), ExpenseReport.id.desc())
            )
        ).all()
    )
    return ExpenseReportListResponse(
        items=[_serialize_report(report) for report in reports],
        total=len(reports),
    )


async def get_expense_report_or_404(
    session: AsyncSession,
    *,
    report_id: int,
    user: User,
) -> ExpenseReportResponse:
    report = await session.scalar(
        select(ExpenseReport).where(ExpenseReport.id == report_id, ExpenseReport.user_id == user.id)
    )
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense report not found.",
        )
    return _serialize_report(report)
