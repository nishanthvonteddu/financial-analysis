from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.rate_limiter import rate_limit
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from src.services.auth import (
    delete_user_workspace_data,
    login_user,
    refresh_user_tokens,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("auth-register"))],
    summary="Register a new user",
    description="Create an account and return fresh access and refresh tokens for immediate use.",
)
async def register(
    payload: RegisterRequest,
    session: DbSession,
) -> TokenResponse:
    return await register_user(session, payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit("auth-login"))],
    summary="Log in with email and password",
    description="Authenticate an existing user and return new bearer tokens.",
)
async def login(
    payload: LoginRequest,
    session: DbSession,
) -> TokenResponse:
    return await login_user(session, payload)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit("auth-refresh"))],
    summary="Refresh an authenticated session",
    description="Exchange a valid refresh token for a new access and refresh token pair.",
)
async def refresh(
    payload: RefreshRequest,
    session: DbSession,
) -> TokenResponse:
    return await refresh_user_tokens(session, payload.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the current user profile",
)
async def me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.delete(
    "/me/data",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete all workspace-owned user data",
)
async def delete_my_workspace_data(
    session: DbSession,
    current_user: CurrentUser,
) -> Response:
    await delete_user_workspace_data(session, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
