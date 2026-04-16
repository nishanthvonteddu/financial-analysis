def _auth_headers(client, email: str = "owner@example.com") -> dict[str, str]:
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


def test_categories_require_authentication(client) -> None:
    response = client.get("/api/v1/categories")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required."


def test_categories_support_crud_and_duplicate_protection(client) -> None:
    headers = _auth_headers(client)

    create_response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": "Streaming", "description": "Monthly streaming services"},
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["name"] == "Streaming"
    assert created["slug"] == "streaming"

    list_response = client.get("/api/v1/categories", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    get_response = client.get(f"/api/v1/categories/{created['id']}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["description"] == "Monthly streaming services"

    duplicate_response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": "streaming", "description": "Duplicate by case"},
    )
    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["detail"] == "A category with that name already exists."

    update_response = client.patch(
        f"/api/v1/categories/{created['id']}",
        headers=headers,
        json={"name": "News", "description": "News and media"},
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == "News"
    assert updated["slug"] == "news"
    assert updated["description"] == "News and media"

    delete_response = client.delete(f"/api/v1/categories/{created['id']}", headers=headers)
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/v1/categories/{created['id']}", headers=headers)
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Category not found."


def test_categories_are_user_scoped(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com")
    other_headers = _auth_headers(client, "other@example.com")

    create_response = client.post(
        "/api/v1/categories",
        headers=owner_headers,
        json={"name": "Streaming", "description": "Monthly streaming services"},
    )
    assert create_response.status_code == 201
    category_id = create_response.json()["id"]

    owner_list_response = client.get("/api/v1/categories", headers=owner_headers)
    assert owner_list_response.status_code == 200
    assert owner_list_response.json()["total"] == 1

    other_list_response = client.get("/api/v1/categories", headers=other_headers)
    assert other_list_response.status_code == 200
    assert other_list_response.json()["total"] == 0

    other_get_response = client.get(f"/api/v1/categories/{category_id}", headers=other_headers)
    assert other_get_response.status_code == 404
    assert other_get_response.json()["detail"] == "Category not found."
