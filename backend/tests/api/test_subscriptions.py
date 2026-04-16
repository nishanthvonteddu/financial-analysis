from datetime import date


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


def _create_category(client, headers: dict[str, str], name: str = "Streaming") -> int:
    response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": name, "description": "Grouped services"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_payment_method(client, headers: dict[str, str], label: str = "Primary Card") -> int:
    response = client.post(
        "/api/v1/payment-methods",
        headers=headers,
        json={"label": label, "provider": "Visa", "last4": "4242", "is_default": True},
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_subscriptions_support_crud_and_filters(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com")
    category_id = _create_category(client, owner_headers)
    payment_method_id = _create_payment_method(client, owner_headers)

    create_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Netflix",
            "vendor": "Netflix",
            "description": "Primary streaming service",
            "website_url": "https://www.netflix.com",
            "amount": "15.49",
            "currency": "usd",
            "cadence": "monthly",
            "status": "active",
            "start_date": "2026-04-01",
            "next_charge_date": "2026-05-01",
            "day_of_month": 1,
            "category_id": category_id,
            "payment_method_id": payment_method_id,
            "auto_renew": True,
            "notes": "Family plan",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["currency"] == "USD"
    assert created["status"] == "active"
    assert created["payment_method_id"] == payment_method_id
    assert created["website_url"] == "https://www.netflix.com"

    second_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Hulu",
            "vendor": "Hulu",
            "amount": "8.99",
            "currency": "USD",
            "cadence": "monthly",
            "status": "paused",
            "start_date": "2026-03-15",
            "category_id": category_id,
            "auto_renew": False,
        },
    )
    assert second_response.status_code == 201

    third_payment_method_id = _create_payment_method(client, owner_headers, "Travel Card")
    third_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Dropbox",
            "vendor": "Dropbox",
            "amount": "120.00",
            "currency": "USD",
            "cadence": "yearly",
            "status": "active",
            "start_date": "2026-01-15",
            "payment_method_id": third_payment_method_id,
            "auto_renew": True,
        },
    )
    assert third_response.status_code == 201

    list_response = client.get(
        "/api/v1/subscriptions",
        headers=owner_headers,
        params={
            "status": "active",
            "search": "net",
            "payment_method_id": payment_method_id,
            "cadence": "monthly",
            "min_amount": "12.00",
            "max_amount": "20.00",
            "limit": 10,
            "offset": 0,
        },
    )
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed["total"] == 1
    assert listed["items"][0]["name"] == "Netflix"

    yearly_response = client.get(
        "/api/v1/subscriptions",
        headers=owner_headers,
        params={"cadence": "yearly", "min_amount": "100.00", "max_amount": "140.00"},
    )
    assert yearly_response.status_code == 200
    yearly_listed = yearly_response.json()
    assert yearly_listed["total"] == 1
    assert yearly_listed["items"][0]["name"] == "Dropbox"

    get_response = client.get(f"/api/v1/subscriptions/{created['id']}", headers=owner_headers)
    assert get_response.status_code == 200
    assert get_response.json()["category_id"] == category_id

    update_response = client.patch(
        f"/api/v1/subscriptions/{created['id']}",
        headers=owner_headers,
        json={
            "amount": "17.99",
            "status": "cancelled",
            "end_date": "2026-06-01",
            "website_url": "https://www.netflix.com/account",
            "notes": "Cancelled after price increase",
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["amount"] == "17.99"
    assert updated["status"] == "cancelled"
    assert updated["end_date"] == "2026-06-01"
    assert updated["website_url"] == "https://www.netflix.com/account"

    delete_response = client.delete(f"/api/v1/subscriptions/{created['id']}", headers=owner_headers)
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/v1/subscriptions/{created['id']}", headers=owner_headers)
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Subscription not found."


def test_subscriptions_enforce_validation_and_ownership(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com")
    other_headers = _auth_headers(client, "other@example.com")

    category_id = _create_category(client, owner_headers, "Productivity")
    owner_payment_method_id = _create_payment_method(client, owner_headers, "Owner Card")
    other_payment_method_id = _create_payment_method(client, other_headers, "Other Card")

    invalid_amount_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Invalid Service",
            "vendor": "Invalid Service",
            "amount": "0",
            "currency": "USD",
            "cadence": "monthly",
            "start_date": "2026-04-01",
        },
    )
    assert invalid_amount_response.status_code == 422

    cross_user_payment_method_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Shared Service",
            "vendor": "Shared Service",
            "amount": "12.00",
            "currency": "USD",
            "cadence": "monthly",
            "start_date": "2026-04-01",
            "category_id": category_id,
            "payment_method_id": other_payment_method_id,
        },
    )
    assert cross_user_payment_method_response.status_code == 404
    assert cross_user_payment_method_response.json()["detail"] == "Payment method not found."

    other_category_id = _create_category(client, other_headers, "Other Category")
    cross_user_category_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Cross Account Category",
            "vendor": "Cross Account Category",
            "amount": "12.00",
            "currency": "USD",
            "cadence": "monthly",
            "start_date": "2026-04-01",
            "category_id": other_category_id,
        },
    )
    assert cross_user_category_response.status_code == 404
    assert cross_user_category_response.json()["detail"] == "Category not found."

    owner_subscription_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Notion",
            "vendor": "Notion",
            "amount": "10.00",
            "currency": "USD",
            "cadence": "monthly",
            "start_date": "2026-04-01",
            "category_id": category_id,
            "payment_method_id": owner_payment_method_id,
        },
    )
    assert owner_subscription_response.status_code == 201
    subscription_id = owner_subscription_response.json()["id"]

    other_user_get_response = client.get(
        f"/api/v1/subscriptions/{subscription_id}",
        headers=other_headers,
    )
    assert other_user_get_response.status_code == 404
    assert other_user_get_response.json()["detail"] == "Subscription not found."

    invalid_dates_response = client.patch(
        f"/api/v1/subscriptions/{subscription_id}",
        headers=owner_headers,
        json={"start_date": str(date(2026, 4, 10)), "end_date": str(date(2026, 4, 5))},
    )
    assert invalid_dates_response.status_code == 422
    assert invalid_dates_response.json()["detail"] == "end_date must be on or after start_date."

    invalid_url_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Bad URL Service",
            "vendor": "Bad URL Service",
            "amount": "12.00",
            "currency": "USD",
            "cadence": "monthly",
            "start_date": "2026-04-01",
            "website_url": "notaurl",
        },
    )
    assert invalid_url_response.status_code == 422

    invalid_range_response = client.get(
        "/api/v1/subscriptions",
        headers=owner_headers,
        params={"min_amount": "30.00", "max_amount": "10.00"},
    )
    assert invalid_range_response.status_code == 422
    assert (
        invalid_range_response.json()["detail"]
        == "min_amount must be less than or equal to max_amount."
    )
