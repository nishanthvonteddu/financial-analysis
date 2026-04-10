from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from statistics import median
from typing import Final


@dataclass(frozen=True, slots=True)
class FrequencyWindow:
    cadence: str
    interval_days: int
    minimum_days: int
    maximum_days: int


@dataclass(frozen=True, slots=True)
class FrequencyAnalysis:
    cadence: str
    interval_days: int
    interval_consistency: float


FREQUENCY_WINDOWS: Final[tuple[FrequencyWindow, ...]] = (
    FrequencyWindow("weekly", 7, 6, 8),
    FrequencyWindow("biweekly", 14, 13, 15),
    FrequencyWindow("monthly", 30, 26, 33),
    FrequencyWindow("quarterly", 91, 80, 100),
    FrequencyWindow("semiannual", 182, 170, 195),
    FrequencyWindow("annual", 365, 350, 380),
)


def analyze_frequency(posted_dates: list[date]) -> FrequencyAnalysis | None:
    unique_dates = sorted(set(posted_dates))
    if len(unique_dates) < 2:
        return None

    intervals = [
        (current - previous).days
        for previous, current in zip(unique_dates, unique_dates[1:], strict=False)
    ]
    if not intervals:
        return None

    median_interval = float(median(intervals))
    best_window: FrequencyWindow | None = None
    best_ratio = 0.0
    best_distance = float("inf")

    for window in FREQUENCY_WINDOWS:
        matches = sum(
            window.minimum_days <= interval <= window.maximum_days for interval in intervals
        )
        ratio = matches / len(intervals)
        distance = abs(median_interval - window.interval_days)
        if ratio > best_ratio or (ratio == best_ratio and distance < best_distance):
            best_window = window
            best_ratio = ratio
            best_distance = distance

    if best_window is None or best_ratio < 0.6:
        return None

    return FrequencyAnalysis(
        cadence=best_window.cadence,
        interval_days=best_window.interval_days,
        interval_consistency=best_ratio,
    )
