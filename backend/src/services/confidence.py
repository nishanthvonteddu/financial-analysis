from __future__ import annotations

from decimal import Decimal


def calculate_amount_consistency(amounts: list[Decimal]) -> float:
    absolute_amounts = [abs(amount) for amount in amounts]
    if not absolute_amounts:
        return 0.0
    if len(absolute_amounts) == 1:
        return 0.5

    maximum = max(absolute_amounts)
    minimum = min(absolute_amounts)
    if maximum == 0:
        return 0.0

    spread = float((maximum - minimum) / maximum)
    return max(0.0, min(1.0, 1.0 - spread))


def score_subscription_confidence(
    *,
    transaction_count: int,
    amount_consistency: float,
    interval_consistency: float,
    is_known_service: bool,
) -> int:
    score = 10
    score += min(20, max(0, transaction_count - 1) * 5)
    score += round(max(0.0, min(1.0, amount_consistency)) * 25)
    score += round(max(0.0, min(1.0, interval_consistency)) * 25)
    if is_known_service:
        score += 20
    return max(0, min(100, score))
