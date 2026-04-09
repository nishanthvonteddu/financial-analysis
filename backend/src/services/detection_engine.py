from __future__ import annotations

import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from statistics import median

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import database as database_module
from src.core.logging import get_logger
from src.models.category import Category
from src.models.payment_history import PaymentHistory
from src.models.raw_transaction import RawTransaction
from src.models.subscription import Subscription
from src.services.confidence import calculate_amount_consistency, score_subscription_confidence
from src.services.frequency import analyze_frequency

logger = get_logger(__name__)
MIN_DETECTION_CONFIDENCE = 70


@dataclass(frozen=True, slots=True)
class DetectedSubscription:
    name: str
    vendor: str
    amount: Decimal
    currency: str
    cadence: str
    status: str
    confidence: int
    category: str | None
    next_charge_date: date
    day_of_month: int | None
    start_date: date
    end_date: date | None
    transaction_count: int
    raw_transaction_ids: list[int]


def _merchant_key(transaction: RawTransaction) -> str:
    merchant = transaction.merchant.strip() or transaction.description.strip() or "Unknown merchant"
    return merchant.lower()


def _display_merchant(transactions: list[RawTransaction]) -> str:
    counts = Counter(
        transaction.merchant.strip() or transaction.description.strip() or "Unknown merchant"
        for transaction in transactions
    )
    return counts.most_common(1)[0][0]


def _category_for_group(transactions: list[RawTransaction]) -> str | None:
    counts = Counter(
        str(transaction.raw_payload.get("service_category", "")).strip().lower()
        for transaction in transactions
        if str(transaction.raw_payload.get("service_category", "")).strip()
    )
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def _is_known_service_group(transactions: list[RawTransaction]) -> bool:
    return any(
        transaction.subscription_candidate
        or transaction.raw_payload.get("is_known_service") is True
        for transaction in transactions
    )


def determine_subscription_status(
    *,
    last_charge_date: date,
    interval_days: int,
    as_of: date | None = None,
) -> tuple[str, date]:
    reference_date = as_of or datetime.now(UTC).date()
    next_charge_date = last_charge_date + timedelta(days=interval_days)
    grace_period_days = max(3, interval_days // 2)
    active_until = next_charge_date + timedelta(days=grace_period_days)
    paused_until = next_charge_date + timedelta(days=interval_days + grace_period_days)

    if reference_date <= active_until:
        return "active", next_charge_date
    if reference_date <= paused_until:
        return "paused", next_charge_date
    return "cancelled", next_charge_date


def detect_subscriptions(
    transactions: list[RawTransaction],
    *,
    as_of: date | None = None,
) -> list[DetectedSubscription]:
    grouped_transactions: dict[str, list[RawTransaction]] = defaultdict(list)
    for transaction in transactions:
        if transaction.transaction_type.lower() != "debit":
            continue
        if transaction.amount >= 0:
            continue
        grouped_transactions[_merchant_key(transaction)].append(transaction)

    detections: list[DetectedSubscription] = []
    for merchant_key, merchant_transactions in grouped_transactions.items():
        del merchant_key
        ordered_transactions = sorted(
            merchant_transactions,
            key=lambda transaction: (transaction.posted_at, transaction.id or 0),
        )
        if len(ordered_transactions) < 2:
            continue

        frequency = analyze_frequency(
            [transaction.posted_at for transaction in ordered_transactions]
        )
        if frequency is None:
            continue

        amount_consistency = calculate_amount_consistency(
            [transaction.amount for transaction in ordered_transactions]
        )
        known_service = _is_known_service_group(ordered_transactions)
        confidence = score_subscription_confidence(
            transaction_count=len(ordered_transactions),
            amount_consistency=amount_consistency,
            interval_consistency=frequency.interval_consistency,
            is_known_service=known_service,
        )
        if confidence < MIN_DETECTION_CONFIDENCE:
            continue

        last_charge_date = ordered_transactions[-1].posted_at
        status, next_charge_date = determine_subscription_status(
            last_charge_date=last_charge_date,
            interval_days=frequency.interval_days,
            as_of=as_of,
        )
        display_name = _display_merchant(ordered_transactions)
        absolute_amounts = [abs(transaction.amount) for transaction in ordered_transactions]
        representative_amount = median(absolute_amounts).quantize(Decimal("0.01"))
        monthly_like = {"monthly", "quarterly", "semiannual", "annual"}
        day_of_month = last_charge_date.day if frequency.cadence in monthly_like else None

        detections.append(
            DetectedSubscription(
                name=display_name,
                vendor=display_name,
                amount=representative_amount,
                currency=ordered_transactions[-1].currency,
                cadence=frequency.cadence,
                status=status,
                confidence=confidence,
                category=_category_for_group(ordered_transactions),
                next_charge_date=next_charge_date,
                day_of_month=day_of_month,
                start_date=ordered_transactions[0].posted_at,
                end_date=last_charge_date if status == "cancelled" else None,
                transaction_count=len(ordered_transactions),
                raw_transaction_ids=[
                    transaction.id
                    for transaction in ordered_transactions
                    if transaction.id is not None
                ],
            )
        )

    return sorted(detections, key=lambda detection: (-detection.confidence, detection.vendor))


def _slugify_category(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "category"


def _display_category_name(name: str) -> str:
    normalized = re.sub(r"[_-]+", " ", name).strip()
    return " ".join(part.capitalize() for part in normalized.split()) or "General"


async def _get_or_create_category(session: AsyncSession, category_name: str) -> Category:
    slug = _slugify_category(category_name)
    statement = select(Category).where(func.lower(Category.slug) == slug)
    category = await session.scalar(statement)
    if category is not None:
        return category

    category = Category(
        name=_display_category_name(category_name),
        slug=slug,
        description="Auto-created from detected subscription imports.",
    )
    session.add(category)
    await session.flush()
    return category


def _should_replace_text(value: str | None) -> bool:
    if value is None:
        return True
    stripped = value.strip()
    return not stripped or stripped.startswith("Auto-detected")


def _apply_detection_to_subscription(
    subscription: Subscription,
    detection: DetectedSubscription,
    *,
    category_id: int | None,
) -> None:
    subscription.amount = detection.amount
    subscription.currency = detection.currency
    subscription.cadence = detection.cadence
    subscription.status = detection.status
    subscription.start_date = min(subscription.start_date, detection.start_date)
    subscription.end_date = detection.end_date
    subscription.next_charge_date = detection.next_charge_date
    subscription.day_of_month = detection.day_of_month
    subscription.auto_renew = detection.status != "cancelled"
    if category_id is not None:
        subscription.category_id = category_id
    if _should_replace_text(subscription.description):
        subscription.description = "Auto-detected from uploaded transaction history."
    if _should_replace_text(subscription.notes):
        subscription.notes = (
            f"Auto-detected from {detection.transaction_count} payments "
            f"with confidence {detection.confidence}/100."
        )


async def sync_detected_subscriptions(
    session: AsyncSession,
    *,
    user_id: int,
    as_of: date | None = None,
) -> list[DetectedSubscription]:
    transactions = list(
        (
            await session.scalars(
                select(RawTransaction)
                .where(RawTransaction.user_id == user_id)
                .order_by(RawTransaction.posted_at.asc(), RawTransaction.id.asc())
            )
        ).all()
    )
    detections = detect_subscriptions(transactions, as_of=as_of)
    logger.info(
        "subscription_detection.started",
        user_id=user_id,
        transaction_count=len(transactions),
        detected_count=len(detections),
    )
    if not detections:
        return []

    subscriptions = list(
        (await session.scalars(select(Subscription).where(Subscription.user_id == user_id))).all()
    )
    subscriptions_by_vendor = {
        subscription.vendor.strip().lower(): subscription for subscription in subscriptions
    }
    transaction_lookup = {
        transaction.id: transaction for transaction in transactions if transaction.id is not None
    }
    raw_transaction_ids = [
        raw_transaction_id
        for detection in detections
        for raw_transaction_id in detection.raw_transaction_ids
    ]
    payment_history_by_raw_id: dict[int, PaymentHistory] = {}
    if raw_transaction_ids:
        existing_history = list(
            (
                await session.scalars(
                    select(PaymentHistory).where(PaymentHistory.raw_transaction_id.in_(raw_transaction_ids))
                )
            ).all()
        )
        payment_history_by_raw_id = {
            history.raw_transaction_id: history
            for history in existing_history
            if history.raw_transaction_id is not None
        }

    created_count = 0
    updated_count = 0
    for detection in detections:
        category = (
            await _get_or_create_category(session, detection.category)
            if detection.category is not None
            else None
        )
        subscription = subscriptions_by_vendor.get(detection.vendor.strip().lower())
        if subscription is None:
            subscription = Subscription(
                user_id=user_id,
                category_id=category.id if category is not None else None,
                payment_method_id=None,
                name=detection.name,
                vendor=detection.vendor,
                description="Auto-detected from uploaded transaction history.",
                website_url=None,
                amount=detection.amount,
                currency=detection.currency,
                cadence=detection.cadence,
                status=detection.status,
                start_date=detection.start_date,
                end_date=detection.end_date,
                next_charge_date=detection.next_charge_date,
                day_of_month=detection.day_of_month,
                auto_renew=detection.status != "cancelled",
                notes=(
                    f"Auto-detected from {detection.transaction_count} payments "
                    f"with confidence {detection.confidence}/100."
                ),
            )
            session.add(subscription)
            await session.flush()
            subscriptions_by_vendor[detection.vendor.strip().lower()] = subscription
            created_count += 1
        else:
            _apply_detection_to_subscription(
                subscription,
                detection,
                category_id=category.id if category is not None else None,
            )
            updated_count += 1

        for raw_transaction_id in detection.raw_transaction_ids:
            transaction = transaction_lookup.get(raw_transaction_id)
            if transaction is None:
                continue
            payment_history = payment_history_by_raw_id.get(raw_transaction_id)
            if payment_history is None:
                payment_history = PaymentHistory(
                    subscription_id=subscription.id,
                    payment_method_id=subscription.payment_method_id,
                    raw_transaction_id=raw_transaction_id,
                    paid_at=datetime.combine(transaction.posted_at, time.min, tzinfo=UTC),
                    amount=abs(transaction.amount).quantize(Decimal("0.01")),
                    currency=transaction.currency,
                    payment_status="settled",
                    reference=transaction.external_id,
                )
                session.add(payment_history)
                payment_history_by_raw_id[raw_transaction_id] = payment_history
            else:
                payment_history.subscription_id = subscription.id
                payment_history.payment_method_id = subscription.payment_method_id
                payment_history.paid_at = datetime.combine(
                    transaction.posted_at,
                    time.min,
                    tzinfo=UTC,
                )
                payment_history.amount = abs(transaction.amount).quantize(Decimal("0.01"))
                payment_history.currency = transaction.currency
                payment_history.payment_status = "settled"
                payment_history.reference = transaction.external_id

        logger.info(
            "subscription_detection.subscription_synced",
            user_id=user_id,
            vendor=detection.vendor,
            cadence=detection.cadence,
            status=detection.status,
            confidence=detection.confidence,
            category=detection.category,
        )

    await session.commit()
    logger.info(
        "subscription_detection.completed",
        user_id=user_id,
        detected_count=len(detections),
        created_count=created_count,
        updated_count=updated_count,
    )
    return detections


async def sync_user_subscriptions(
    *,
    user_id: int,
    as_of: date | None = None,
) -> list[DetectedSubscription]:
    async with database_module.SessionLocal() as session:
        return await sync_detected_subscriptions(session, user_id=user_id, as_of=as_of)
