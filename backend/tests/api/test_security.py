import asyncio

from sqlalchemy import select

from src.core.encryption import ENCRYPTED_PREFIX
from src.models.user import User


def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Security User",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_security_headers_are_applied(client) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.headers["content-security-policy"].startswith("default-src 'none'")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert "camera=()" in response.headers["permissions-policy"]


def test_browser_state_change_requires_csrf_header(client) -> None:
    headers = _auth_headers(client, "csrf@example.com")

    missing_csrf = client.post(
        "/api/v1/categories",
        headers={**headers, "Origin": "http://localhost:3000"},
        json={"name": "Security", "description": "Protected write"},
    )
    assert missing_csrf.status_code == 403
    assert missing_csrf.json()["detail"] == "CSRF token header is required."

    with_csrf = client.post(
        "/api/v1/categories",
        headers={
            **headers,
            "Origin": "http://localhost:3000",
            "X-CSRF-Token": "browser-intent",
        },
        json={"name": "Security", "description": "Protected write"},
    )
    assert with_csrf.status_code == 201


def test_cross_user_data_access_is_blocked(client) -> None:
    owner_headers = _auth_headers(client, "owner-security@example.com")
    other_headers = _auth_headers(client, "other-security@example.com")

    create_response = client.post(
        "/api/v1/payment-methods",
        headers=owner_headers,
        json={"label": "Owner Card", "provider": "Visa", "last4": "4242"},
    )
    assert create_response.status_code == 201
    payment_method_id = create_response.json()["id"]

    forbidden_response = client.patch(
        f"/api/v1/payment-methods/{payment_method_id}",
        headers=other_headers,
        json={"label": "Other Card", "provider": "Visa", "last4": "9999"},
    )
    assert forbidden_response.status_code == 404


def test_telegram_link_identifiers_are_encrypted_at_rest(client) -> None:
    headers = _auth_headers(client, "telegram-security@example.com")

    token_response = client.post("/api/v1/notifications/telegram/link-token", headers=headers)
    assert token_response.status_code == 201
    token = token_response.json()["token"]

    link_response = client.post(
        "/api/v1/notifications/telegram/webhook",
        json={"message": {"chat": {"id": 123456789}, "text": f"/start {token}"}},
    )
    assert link_response.status_code == 200
    assert link_response.json()["action"] == "linked"

    async def load_user() -> User:
        from src.core.database import SessionLocal

        async with SessionLocal() as session:
            user = await session.scalar(
                select(User).where(User.email == "telegram-security@example.com")
            )
            assert user is not None
            return user

    user = asyncio.run(load_user())
    assert user.telegram_chat_id is not None
    assert user.telegram_chat_id.startswith(ENCRYPTED_PREFIX)
    assert user.telegram_chat_id != "123456789"
    assert user.telegram_chat_id_hash is not None
    assert user.telegram_link_token is None
    assert user.telegram_link_token_hash is None
