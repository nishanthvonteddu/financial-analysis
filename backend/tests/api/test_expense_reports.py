def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Reports Owner",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_expense_reports_and_subscription_payment_history(client) -> None:
    headers = _auth_headers(client, "reports@example.com")
    other_headers = _auth_headers(client, "other-reports@example.com")
    csv_content = (
        "Posting Date,Details,Amount\n"
        "01/05/2026,NETFLIX,-15.00\n"
        "02/05/2026,NETFLIX,-15.00\n"
        "03/05/2026,NETFLIX,-18.00\n"
        "03/09/2026,SPOTIFY,-9.99\n"
    )

    create_response = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("expense-history.csv", csv_content, "text/csv")},
    )

    assert create_response.status_code == 201
    upload_id = create_response.json()["id"]

    reports_response = client.get("/api/v1/expense-reports", headers=headers)
    assert reports_response.status_code == 200
    reports_payload = reports_response.json()
    assert reports_payload["total"] == 1
    report = reports_payload["items"][0]
    assert report["data_source_id"] == upload_id
    assert report["total_amount"] == "57.99"
    assert report["summary"]["upload_name"] == "expense-history.csv"
    assert report["summary"]["top_merchants"][0]["merchant"] == "Netflix"
    assert report["summary"]["recurring_transaction_count"] >= 3

    report_detail_response = client.get(
        f"/api/v1/expense-reports/{report['id']}",
        headers=headers,
    )
    assert report_detail_response.status_code == 200
    report_detail = report_detail_response.json()
    assert report_detail["summary"]["category_breakdown"][0]["category_name"] == "Entertainment"
    assert len(report_detail["summary"]["spend_timeline"]) == 3

    hidden_report_response = client.get(
        f"/api/v1/expense-reports/{report['id']}",
        headers=other_headers,
    )
    assert hidden_report_response.status_code == 404

    subscriptions_response = client.get("/api/v1/subscriptions", headers=headers)
    assert subscriptions_response.status_code == 200
    subscriptions = subscriptions_response.json()
    assert subscriptions["total"] == 1
    subscription = subscriptions["items"][0]
    assert subscription["amount"] == "18.00"

    payment_history_response = client.get(
        f"/api/v1/subscriptions/{subscription['id']}/payment-history",
        headers=headers,
    )
    assert payment_history_response.status_code == 200
    payment_history = payment_history_response.json()
    assert payment_history["summary"] == {
        "payment_count": 3,
        "total_paid": "48.00",
        "average_payment": "16.00",
        "latest_payment_amount": "18.00",
        "latest_payment_at": "2026-03-05T00:00:00Z",
        "first_payment_at": "2026-01-05T00:00:00Z",
        "price_change_count": 1,
    }
    assert len(payment_history["items"]) == 3
    assert payment_history["items"][0]["amount"] == "18.00"
    assert payment_history["price_changes"][0]["previous_amount"] == "15.00"
    assert payment_history["price_changes"][0]["new_amount"] == "18.00"
