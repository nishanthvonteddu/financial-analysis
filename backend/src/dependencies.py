from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.logging import get_logger
from src.core.security import decode_token
from src.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)
BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
logger = get_logger(__name__)


async def get_current_user(
    credentials: BearerCredentials,
    session: DbSession,
) -> User:
    if credentials is None:
        logger.warning("auth.credentials_missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        logger.warning("auth.token_invalid")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload["type"] != "access":
        logger.warning("auth.token_wrong_type", token_type=payload["type"])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await session.scalar(select(User).where(User.id == int(payload["sub"])))
    if user is None or not user.is_active:
        logger.warning("auth.user_unavailable", user_id=payload["sub"])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is unavailable.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
