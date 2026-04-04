from fastapi import APIRouter

from src.api.routes import auth, categories, health, payment_methods, subscriptions

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(categories.router)
api_router.include_router(payment_methods.router)
api_router.include_router(subscriptions.router)
