from src.services.confidence import calculate_amount_consistency, score_subscription_confidence


def test_confidence_scores_high_for_known_service_with_clean_pattern() -> None:
    score = score_subscription_confidence(
        transaction_count=4,
        amount_consistency=calculate_amount_consistency([15.49, 15.49, 15.49, 15.49]),
        interval_consistency=1.0,
        is_known_service=True,
    )

    assert score >= 90


def test_confidence_scores_midrange_for_unknown_service_with_small_variance() -> None:
    score = score_subscription_confidence(
        transaction_count=3,
        amount_consistency=calculate_amount_consistency([49.99, 51.99, 50.49]),
        interval_consistency=1.0,
        is_known_service=False,
    )

    assert 65 <= score < 90


def test_confidence_scores_low_for_sparse_irregular_pattern() -> None:
    score = score_subscription_confidence(
        transaction_count=2,
        amount_consistency=calculate_amount_consistency([12.99, 39.99]),
        interval_consistency=0.5,
        is_known_service=False,
    )

    assert score < 60
