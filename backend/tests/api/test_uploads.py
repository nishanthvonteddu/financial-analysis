def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Uploader",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_upload_endpoints_process_csv_history_status_and_delete(client) -> None:
    headers = _auth_headers(client, "uploader@example.com")
    csv_content = (
        "Posting Date,Details,Amount\n"
        "04/01/2026,NETFLIX,-15.49\n"
        "04/02/2026,Hulu,-8.99\n"
    )

    create_response = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("statement.csv", csv_content, "text/csv")},
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["status"] == "queued"
    assert created["provider"] == "pending"
    assert created["transaction_count"] == 0

    list_response = client.get("/api/v1/uploads", headers=headers)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed["total"] == 1
    assert listed["items"][0]["file_name"] == "statement.csv"
    assert listed["items"][0]["transaction_count"] == 2

    status_response = client.get(f"/api/v1/uploads/{created['id']}/status", headers=headers)
    assert status_response.status_code == 200
    assert status_response.json()["transaction_count"] == 2

    delete_response = client.delete(f"/api/v1/uploads/{created['id']}", headers=headers)
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/v1/uploads/{created['id']}/status", headers=headers)
    assert missing_response.status_code == 404


def test_upload_processing_triggers_subscription_detection(client) -> None:
    headers = _auth_headers(client, "detection@example.com")
    csv_content = (
        "Posting Date,Details,Amount\n"
        "01/01/2026,NETFLIX,-15.49\n"
        "02/01/2026,NETFLIX,-15.49\n"
        "03/01/2026,NETFLIX,-15.49\n"
    )

    create_response = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("netflix.csv", csv_content, "text/csv")},
    )

    assert create_response.status_code == 201

    subscriptions_response = client.get("/api/v1/subscriptions", headers=headers)
    assert subscriptions_response.status_code == 200
    subscriptions = subscriptions_response.json()

    assert subscriptions["total"] == 1
    detected = subscriptions["items"][0]
    assert detected["vendor"] == "Netflix"
    assert detected["cadence"] == "monthly"
    assert detected["status"] == "active"


def test_upload_rejects_unsupported_files(client) -> None:
    headers = _auth_headers(client, "rejector@example.com")

    response = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("statement.txt", "hello", "text/plain")},
    )

    assert response.status_code == 415
    assert response.json()["detail"] == "Only CSV and PDF uploads are supported."
