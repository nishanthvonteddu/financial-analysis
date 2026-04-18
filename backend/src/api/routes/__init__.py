"""Route modules for versioned APIs."""

from src.api.routes import (
    auth,
    categories,
    dashboard,
    expense_reports,
    health,
    payment_methods,
    subscriptions,
    uploads,
)

__all__ = [
    "auth",
    "categories",
    "dashboard",
    "expense_reports",
    "health",
    "payment_methods",
    "subscriptions",
    "uploads",
]
