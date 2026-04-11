"""Route modules for versioned APIs."""

from src.api.routes import auth, categories, dashboard, health, payment_methods, subscriptions

__all__ = [
    "auth",
    "categories",
    "dashboard",
    "health",
    "payment_methods",
    "subscriptions",
]
