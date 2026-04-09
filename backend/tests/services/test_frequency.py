from datetime import date

import pytest

from src.services.frequency import analyze_frequency


@pytest.mark.parametrize(
    ("posted_dates", "expected_cadence"),
    [
        ([date(2026, 4, 1), date(2026, 4, 8), date(2026, 4, 15)], "weekly"),
        ([date(2026, 4, 1), date(2026, 4, 15), date(2026, 4, 29)], "biweekly"),
        ([date(2026, 1, 1), date(2026, 2, 1), date(2026, 3, 1)], "monthly"),
        ([date(2026, 1, 1), date(2026, 4, 1), date(2026, 7, 1)], "quarterly"),
        ([date(2025, 1, 1), date(2025, 7, 1), date(2026, 1, 1)], "semiannual"),
        ([date(2024, 4, 1), date(2025, 4, 1), date(2026, 4, 1)], "annual"),
    ],
)
def test_analyze_frequency_classifies_supported_cadences(
    posted_dates: list[date],
    expected_cadence: str,
) -> None:
    analysis = analyze_frequency(posted_dates)

    assert analysis is not None
    assert analysis.cadence == expected_cadence
    assert analysis.interval_consistency == 1.0


def test_analyze_frequency_returns_none_for_irregular_activity() -> None:
    analysis = analyze_frequency(
        [date(2026, 1, 1), date(2026, 1, 20), date(2026, 3, 19), date(2026, 6, 1)]
    )

    assert analysis is None
