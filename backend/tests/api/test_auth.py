def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Owner One",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_login_refresh_and_me(client) -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner@example.com",
            "full_name": "Owner One",
            "password": "super-secret",
        },
    )

    assert register_response.status_code == 201
    register_payload = register_response.json()
    assert register_payload["token_type"] == "bearer"
    assert register_payload["user"]["email"] == "owner@example.com"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.com", "password": "super-secret"},
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["full_name"] == "Owner One"
    assert me_response.json()["preferred_currency"] == "USD"

    update_response = client.patch(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
        json={"preferred_currency": "eur"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["preferred_currency"] == "EUR"

    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": login_payload["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    assert refresh_response.json()["user"]["email"] == "owner@example.com"


def test_login_rejects_invalid_credentials(client) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner@example.com",
            "full_name": "Owner One",
            "password": "super-secret",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_login_is_rate_limited_after_repeated_attempts(client) -> None:
    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "missing@example.com", "password": "wrong-password"},
        )
        assert response.status_code == 401

    limited_response = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "wrong-password"},
    )

    assert limited_response.status_code == 429
    assert limited_response.json()["detail"] == "Too many requests. Try again in a minute."


def test_delete_my_workspace_data_resets_user_owned_records(client) -> None:
    headers = _auth_headers(client, "cleanup@example.com")

    default_layout_response = client.get("/api/v1/dashboard/layout", headers=headers)
    assert default_layout_response.status_code == 200
    default_widgets = default_layout_response.json()["widgets"]

    payment_method_response = client.post(
        "/api/v1/payment-methods",
        headers=headers,
        json={"label": "Primary Card", "provider": "Visa", "last4": "4242", "is_default": True},
    )
    assert payment_method_response.status_code == 201
    payment_method_id = payment_method_response.json()["id"]

    category_response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": "Streaming", "description": "Monthly streaming services"},
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    subscription_response = client.post(
        "/api/v1/subscriptions",
        headers=headers,
        json={
            "name": "Netflix",
            "vendor": "Netflix",
            "amount": "15.49",
            "currency": "USD",
            "cadence": "monthly",
            "status": "active",
            "start_date": "2026-04-01",
            "category_id": category_id,
            "payment_method_id": payment_method_id,
            "auto_renew": True,
        },
    )
    assert subscription_response.status_code == 201

    updated_widgets = [
        *[widget for widget in default_widgets if widget["id"] == "upcoming-renewals"],
        *[widget for widget in default_widgets if widget["id"] != "upcoming-renewals"],
    ]

    layout_response = client.put(
        "/api/v1/dashboard/layout",
        headers=headers,
        json={"widgets": updated_widgets},
    )
    assert layout_response.status_code == 200
    assert layout_response.json()["widgets"][0]["id"] == "upcoming-renewals"

    delete_response = client.delete("/api/v1/auth/me/data", headers=headers)
    assert delete_response.status_code == 204

    subscriptions_response = client.get("/api/v1/subscriptions", headers=headers)
    assert subscriptions_response.status_code == 200
    assert subscriptions_response.json()["total"] == 0

    payment_methods_response = client.get("/api/v1/payment-methods", headers=headers)
    assert payment_methods_response.status_code == 200
    assert payment_methods_response.json()["total"] == 0

    categories_response = client.get("/api/v1/categories", headers=headers)
    assert categories_response.status_code == 200
    assert categories_response.json()["total"] == 0

    reset_layout_response = client.get("/api/v1/dashboard/layout", headers=headers)
    assert reset_layout_response.status_code == 200
    assert reset_layout_response.json()["widgets"] == default_widgets
