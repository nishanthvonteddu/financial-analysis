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


def test_payment_methods_are_user_scoped_and_manage_defaults(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com")
    other_headers = _auth_headers(client, "other@example.com")

    first_response = client.post(
        "/api/v1/payment-methods",
        headers=owner_headers,
        json={
            "label": "Primary Card",
            "provider": "Visa",
            "last4": "1111",
            "is_default": True,
        },
    )
    assert first_response.status_code == 201
    first_payment_method = first_response.json()
    assert first_payment_method["is_default"] is True

    second_response = client.post(
        "/api/v1/payment-methods",
        headers=owner_headers,
        json={
            "label": "Travel Card",
            "provider": "Mastercard",
            "last4": "2222",
            "is_default": True,
        },
    )
    assert second_response.status_code == 201
    second_payment_method = second_response.json()
    assert second_payment_method["is_default"] is True

    owner_list_response = client.get("/api/v1/payment-methods", headers=owner_headers)
    assert owner_list_response.status_code == 200
    owner_items = owner_list_response.json()["items"]
    assert owner_list_response.json()["total"] == 2
    assert owner_items[0]["is_default"] is False
    assert owner_items[1]["is_default"] is True

    other_list_response = client.get("/api/v1/payment-methods", headers=other_headers)
    assert other_list_response.status_code == 200
    assert other_list_response.json()["items"] == []

    forbidden_response = client.get(
        f"/api/v1/payment-methods/{second_payment_method['id']}",
        headers=other_headers,
    )
    assert forbidden_response.status_code == 404
    assert forbidden_response.json()["detail"] == "Payment method not found."

    update_response = client.patch(
        f"/api/v1/payment-methods/{second_payment_method['id']}",
        headers=owner_headers,
        json={"label": "Travel Rewards", "last4": "3333"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["label"] == "Travel Rewards"
    assert update_response.json()["last4"] == "3333"

    delete_response = client.delete(
        f"/api/v1/payment-methods/{second_payment_method['id']}",
        headers=owner_headers,
    )
    assert delete_response.status_code == 204

    final_list_response = client.get("/api/v1/payment-methods", headers=owner_headers)
    assert final_list_response.status_code == 200
    assert final_list_response.json()["total"] == 1
