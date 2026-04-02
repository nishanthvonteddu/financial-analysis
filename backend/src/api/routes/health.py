from fastapi import APIRouter, status

from src.core.logging import get_logger

router = APIRouter(prefix="/health")
logger = get_logger(__name__)


@router.get("", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    logger.info("health.check", service="api", status="ok")
    return {
        "status": "ok",
        "service": "mysubscription-tracker",
    }
