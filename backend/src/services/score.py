from __future__ import annotations

import re
from decimal import ROUND_HALF_UP, Decimal
from itertools import combinations
from typing import Any
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.score import (
    ScoreBand,
    SubscriptionDuplicateCandidate,
    SubscriptionScoreBreakdownItem,
    SubscriptionScoreRecommendation,
    SubscriptionScoreResponse,
)
from src.services.currency import convert

STOP_WORDS = {
    "a",
    "an",
    "and",
    "app",
    "basic",
    "co",
    "company",
    "for",
    "inc",
    "ltd",
    "plan",
    "premium",
    "pro",
    "service",
    "services",
    "subscription",
    "suite",
    "the",
}
MONTHLY_SCORE_WEIGHT = 25


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _round_score(value: float) -> int:
    return max(0, min(MONTHLY_SCORE_WEIGHT, int(round(value))))


def _get_user_currency(user: User) -> str:
    return (user.preferred_currency or "USD").strip().upper()


def _normalize_tokens(*parts: str | None) -> set[str]:
    tokens = re.findall(r"[a-z0-9]+", " ".join(part or "" for part in parts).lower())
    return {token for token in tokens if len(token) > 1 and token not in STOP_WORDS}


def _normalize_vendor(value: str | None) -> str:
    return " ".join(sorted(_normalize_tokens(value)))


def _normalize_host(value: str | None) -> str | None:
    if not value:
        return None

    host = urlparse(value).netloc.lower().removeprefix("www.").strip()
    return host or None


def _token_similarity(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0

    union = left | right
    if not union:
        return 0.0

    return len(left & right) / len(union)


async def _monthly_equivalent(
    session: AsyncSession,
    subscription: Subscription,
    *,
    target_currency: str,
) -> Decimal:
    cadence = subscription.cadence.lower()
    amount = await convert(
        session,
        Decimal(subscription.amount),
        from_currency=subscription.currency,
        to_currency=target_currency,
    )

    if cadence == "weekly":
        return _quantize_money((amount * Decimal(52)) / Decimal(12))
    if cadence == "quarterly":
        return _quantize_money(amount / Decimal(3))
    if cadence == "yearly":
        return _quantize_money(amount / Decimal(12))
    return _quantize_money(amount)


def _grade(score: int) -> tuple[str, ScoreBand]:
    if score >= 90:
        return ("A", "excellent")
    if score >= 80:
        return ("B", "steady")
    if score >= 65:
        return ("C", "attention")
    if score >= 50:
        return ("D", "attention")
    return ("F", "at-risk")


async def _build_duplicate_candidates(
    session: AsyncSession,
    subscriptions: list[Subscription],
    *,
    target_currency: str,
) -> list[SubscriptionDuplicateCandidate]:
    if len(subscriptions) < 2:
        return []

    monthly_equivalents = {
        subscription.id: await _monthly_equivalent(
            session,
            subscription,
            target_currency=target_currency,
        )
        for subscription in subscriptions
    }

    candidates: list[tuple[float, SubscriptionDuplicateCandidate]] = []

    for left, right in combinations(subscriptions, 2):
        left_tokens = _normalize_tokens(left.vendor, left.name)
        right_tokens = _normalize_tokens(right.vendor, right.name)
        token_similarity = _token_similarity(left_tokens, right_tokens)
        left_vendor = _normalize_vendor(left.vendor)
        right_vendor = _normalize_vendor(right.vendor)
        left_host = _normalize_host(left.website_url)
        right_host = _normalize_host(right.website_url)
        vendor_match = left_vendor == right_vendor and bool(left_vendor)
        host_match = left_host == right_host and bool(left_host)
        same_category = left.category_id is not None and left.category_id == right.category_id

        confidence = 0.0
        reasons: list[str] = []
        if vendor_match:
            confidence += 0.5
            reasons.append("matching vendor")
        if host_match:
            confidence += 0.3
            reasons.append("shared website")
        if same_category:
            confidence += 0.2
            reasons.append("same category")
        if token_similarity >= 0.75:
            confidence += 0.2
            reasons.append("nearly identical naming")
        elif token_similarity >= 0.6:
            confidence += 0.1
            reasons.append("overlapping naming")

        if confidence < 0.6:
            continue

        signal = reasons[0] if reasons else "similar billing profile"
        savings = _quantize_money(min(monthly_equivalents[left.id], monthly_equivalents[right.id]))
        candidates.append(
            (
                confidence,
                SubscriptionDuplicateCandidate(
                    left_subscription_id=left.id,
                    left_name=left.name,
                    left_vendor=left.vendor,
                    right_subscription_id=right.id,
                    right_name=right.name,
                    right_vendor=right.vendor,
                    shared_signal=signal,
                    confidence="high" if confidence >= 0.8 else "medium",
                    potential_monthly_savings=savings,
                    currency=target_currency,
                ),
            )
        )

    candidates.sort(
        key=lambda item: (
            item[0],
            item[1].potential_monthly_savings,
            -item[1].left_subscription_id,
            -item[1].right_subscription_id,
        ),
        reverse=True,
    )
    return [candidate for _, candidate in candidates]


def _non_overlapping_duplicate_savings(
    candidates: list[SubscriptionDuplicateCandidate],
) -> Decimal:
    total = Decimal("0.00")
    seen_subscription_ids: set[int] = set()

    for candidate in candidates:
        pair = {candidate.left_subscription_id, candidate.right_subscription_id}
        if pair & seen_subscription_ids:
            continue

        total += Decimal(candidate.potential_monthly_savings)
        seen_subscription_ids.update(pair)

    return _quantize_money(total)


def _build_breakdown(
    subscriptions: list[Subscription],
    duplicate_candidates: list[SubscriptionDuplicateCandidate],
    *,
    total_monthly_spend: Decimal,
) -> list[SubscriptionScoreBreakdownItem]:
    total = len(subscriptions)
    if total == 0:
        return [
            SubscriptionScoreBreakdownItem(
                id="coverage",
                label="Coverage",
                detail="No active subscriptions are available to score yet.",
                score=0,
                max_score=MONTHLY_SCORE_WEIGHT,
            ),
            SubscriptionScoreBreakdownItem(
                id="renewal",
                label="Renewal readiness",
                detail="Add an active subscription to start tracking charge cadence.",
                score=0,
                max_score=MONTHLY_SCORE_WEIGHT,
            ),
            SubscriptionScoreBreakdownItem(
                id="context",
                label="Context",
                detail="Profile links and notes unlock better recommendations once plans exist.",
                score=0,
                max_score=MONTHLY_SCORE_WEIGHT,
            ),
            SubscriptionScoreBreakdownItem(
                id="waste",
                label="Waste control",
                detail="Duplicate detection activates once at least two active plans are present.",
                score=0,
                max_score=MONTHLY_SCORE_WEIGHT,
            ),
        ]

    categorized = sum(1 for subscription in subscriptions if subscription.category_id is not None)
    billed = sum(1 for subscription in subscriptions if subscription.payment_method_id is not None)
    renewal_dates = sum(
        1 for subscription in subscriptions if subscription.next_charge_date is not None
    )
    monthly_with_anchor = sum(
        1
        for subscription in subscriptions
        if subscription.cadence != "monthly"
        or subscription.day_of_month is not None
        or subscription.next_charge_date is not None
    )
    linked = sum(1 for subscription in subscriptions if subscription.website_url)
    documented = sum(
        1 for subscription in subscriptions if subscription.description or subscription.notes
    )

    coverage_score = _round_score(
        (((categorized / total) + (billed / total)) / 2) * MONTHLY_SCORE_WEIGHT
    )
    renewal_score = _round_score(
        (((renewal_dates / total) + (monthly_with_anchor / total)) / 2) * MONTHLY_SCORE_WEIGHT
    )
    context_score = _round_score(
        (((linked / total) + (documented / total)) / 2) * MONTHLY_SCORE_WEIGHT
    )

    duplicate_penalty_ratio = 0.0
    duplicate_savings = _non_overlapping_duplicate_savings(duplicate_candidates)
    if total_monthly_spend > 0:
        duplicate_penalty_ratio = min(
            0.85,
            (len(duplicate_candidates) / max(1, total - 1)) * 0.55
            + float((duplicate_savings / total_monthly_spend) * Decimal("0.45")),
        )
    elif duplicate_candidates:
        duplicate_penalty_ratio = min(0.85, len(duplicate_candidates) * 0.3)
    waste_score = _round_score((1 - duplicate_penalty_ratio) * MONTHLY_SCORE_WEIGHT)

    return [
        SubscriptionScoreBreakdownItem(
            id="coverage",
            label="Coverage",
            detail=(
                f"{categorized}/{total} categorized and "
                f"{billed}/{total} mapped to a payment method."
            ),
            score=coverage_score,
            max_score=MONTHLY_SCORE_WEIGHT,
        ),
        SubscriptionScoreBreakdownItem(
            id="renewal",
            label="Renewal readiness",
            detail=(
                f"{renewal_dates}/{total} with renewal dates and "
                f"{monthly_with_anchor}/{total} with a monthly anchor."
            ),
            score=renewal_score,
            max_score=MONTHLY_SCORE_WEIGHT,
        ),
        SubscriptionScoreBreakdownItem(
            id="context",
            label="Context",
            detail=(
                f"{linked}/{total} linked back to a service URL and "
                f"{documented}/{total} carrying notes or descriptions."
            ),
            score=context_score,
            max_score=MONTHLY_SCORE_WEIGHT,
        ),
        SubscriptionScoreBreakdownItem(
            id="waste",
            label="Waste control",
            detail=(
                "No strong overlap pairs are active right now."
                if not duplicate_candidates
                else (
                    f"{len(duplicate_candidates)} overlap pair(s) could free about "
                    f"{duplicate_savings} {duplicate_candidates[0].currency}/mo."
                )
            ),
            score=waste_score,
            max_score=MONTHLY_SCORE_WEIGHT,
        ),
    ]


def _build_recommendations(
    subscriptions: list[Subscription],
    duplicate_candidates: list[SubscriptionDuplicateCandidate],
    *,
    currency: str,
) -> list[SubscriptionScoreRecommendation]:
    total = len(subscriptions)
    if total == 0:
        return [
            SubscriptionScoreRecommendation(
                title="Add an active subscription",
                description=(
                    "The score starts once at least one live subscription exists in the "
                    "workspace."
                ),
                priority="high",
                action_label="Open subscriptions",
                action_href="/subscriptions",
            )
        ]

    missing_category = sum(1 for subscription in subscriptions if subscription.category_id is None)
    missing_payment_method = sum(
        1 for subscription in subscriptions if subscription.payment_method_id is None
    )
    missing_renewal_date = sum(
        1 for subscription in subscriptions if subscription.next_charge_date is None
    )
    missing_context = sum(
        1
        for subscription in subscriptions
        if not subscription.website_url and not subscription.description and not subscription.notes
    )

    recommendations: list[tuple[int, SubscriptionScoreRecommendation]] = []

    if duplicate_candidates:
        recommendations.append(
            (
                0,
                SubscriptionScoreRecommendation(
                    title="Resolve duplicate candidates",
                    description=(
                        f"{len(duplicate_candidates)} overlap pair(s) are active and could "
                        "be merged or downgraded."
                    ),
                    priority="high",
                    action_label="Open score page",
                    action_href="/score",
                    subscriptions_affected=len(
                        {candidate.left_subscription_id for candidate in duplicate_candidates}
                        | {candidate.right_subscription_id for candidate in duplicate_candidates}
                    ),
                    potential_monthly_savings=_non_overlapping_duplicate_savings(
                        duplicate_candidates
                    ),
                    currency=currency,
                ),
            )
        )

    if missing_payment_method:
        recommendations.append(
            (
                1,
                SubscriptionScoreRecommendation(
                    title="Attach payment rails",
                    description=(
                        f"{missing_payment_method} active subscription(s) are missing a "
                        "payment method, which weakens renewal visibility."
                    ),
                    priority="high",
                    action_label="Open subscriptions",
                    action_href="/subscriptions",
                    subscriptions_affected=missing_payment_method,
                ),
            )
        )

    if missing_renewal_date:
        recommendations.append(
            (
                2,
                SubscriptionScoreRecommendation(
                    title="Fill in renewal dates",
                    description=(
                        f"{missing_renewal_date} active subscription(s) still lack a next "
                        "charge date or anchor."
                    ),
                    priority="high",
                    action_label="Review subscriptions",
                    action_href="/subscriptions",
                    subscriptions_affected=missing_renewal_date,
                ),
            )
        )

    if missing_category:
        recommendations.append(
            (
                3,
                SubscriptionScoreRecommendation(
                    title="Categorize uncoded plans",
                    description=(
                        f"{missing_category} active subscription(s) are still uncategorized, "
                        "which reduces dashboard and duplicate clarity."
                    ),
                    priority="medium",
                    action_label="Open settings",
                    action_href="/settings",
                    subscriptions_affected=missing_category,
                ),
            )
        )

    if missing_context:
        recommendations.append(
            (
                4,
                SubscriptionScoreRecommendation(
                    title="Add service context",
                    description=(
                        f"{missing_context} active subscription(s) are missing URLs, notes, "
                        "and descriptions that help future cleanup."
                    ),
                    priority="medium",
                    action_label="Review subscriptions",
                    action_href="/subscriptions",
                    subscriptions_affected=missing_context,
                ),
            )
        )

    if not recommendations:
        recommendations.append(
            (
                5,
                SubscriptionScoreRecommendation(
                    title="Keep the score steady",
                    description=(
                        "The active portfolio is well linked, scheduled, and free of strong "
                        "duplicate signals."
                    ),
                    priority="low",
                    action_label="Open dashboard",
                    action_href="/dashboard",
                ),
            )
        )

    recommendations.sort(key=lambda item: item[0])
    return [recommendation for _, recommendation in recommendations[:4]]


async def get_subscription_score(
    session: AsyncSession,
    *,
    user: User,
    subscriptions: list[Subscription] | None = None,
) -> SubscriptionScoreResponse:
    target_currency = _get_user_currency(user)
    if subscriptions is None:
        subscriptions = list(
            (
                await session.scalars(
                    select(Subscription)
                    .where(Subscription.user_id == user.id, Subscription.status == "active")
                    .order_by(Subscription.id.asc())
                )
            ).all()
        )

    monthly_equivalents = [
        await _monthly_equivalent(session, subscription, target_currency=target_currency)
        for subscription in subscriptions
    ]
    total_monthly_spend = _quantize_money(sum(monthly_equivalents, Decimal("0.00")))
    duplicate_candidates = await _build_duplicate_candidates(
        session,
        subscriptions,
        target_currency=target_currency,
    )
    breakdown = _build_breakdown(
        subscriptions,
        duplicate_candidates,
        total_monthly_spend=total_monthly_spend,
    )
    score = sum(item.score for item in breakdown)
    grade, band = _grade(score)
    recommendations = _build_recommendations(
        subscriptions,
        duplicate_candidates,
        currency=target_currency,
    )

    return SubscriptionScoreResponse(
        score=score,
        grade=grade,
        band=band,
        active_subscription_count=len(subscriptions),
        potential_monthly_savings=_non_overlapping_duplicate_savings(duplicate_candidates),
        currency=target_currency,
        breakdown=breakdown,
        recommendations=recommendations,
        duplicate_candidates=duplicate_candidates[:6],
    )


def summarize_duplicate_alerts(
    candidates: list[SubscriptionDuplicateCandidate],
    *,
    limit: int,
) -> list[SubscriptionDuplicateCandidate]:
    return candidates[:limit]


def build_score_overview(score_payload: SubscriptionScoreResponse) -> dict[str, Any]:
    return {
        "score": score_payload.score,
        "grade": score_payload.grade,
        "band": score_payload.band,
        "recommendation_count": len(score_payload.recommendations),
        "duplicate_candidates": len(score_payload.duplicate_candidates),
        "potential_monthly_savings": score_payload.potential_monthly_savings,
        "currency": score_payload.currency,
    }
