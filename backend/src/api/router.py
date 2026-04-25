from fastapi import APIRouter

from src.api.routes import (
    auth,
    calendar,
    categories,
    currencies,
    dashboard,
    expense_reports,
    exports,
    family,
    health,
    notifications,
    payment_methods,
    subscriptions,
    uploads,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(calendar.router)
api_router.include_router(categories.router)
api_router.include_router(currencies.router)
api_router.include_router(dashboard.router)
api_router.include_router(expense_reports.router)
api_router.include_router(exports.router)
api_router.include_router(family.router)
api_router.include_router(notifications.router)
api_router.include_router(payment_methods.router)
api_router.include_router(subscriptions.router)
api_router.include_router(uploads.router)
