import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient, setApiCsrfToken } from "@/lib/api-client";

describe("apiClient", () => {
  afterEach(() => {
    setApiCsrfToken(null);
    vi.restoreAllMocks();
  });

  it("sends the bearer token when a protected request is made", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: 1, email: "owner@example.com" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await apiClient.getMe("access-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("posts JSON payloads for login requests", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "token",
          refresh_token: "refresh",
          token_type: "bearer",
          access_token_expires_at: new Date().toISOString(),
          refresh_token_expires_at: new Date().toISOString(),
          user: {
            id: 1,
            email: "owner@example.com",
            full_name: "Owner One",
            preferred_currency: "USD",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await apiClient.login({
      email: "owner@example.com",
      password: "super-secret",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "owner@example.com",
          password: "super-secret",
        }),
        method: "POST",
      }),
    );
  });

  it("adds query params for subscription list requests", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          limit: 25,
          offset: 0,
          total: 0,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await apiClient.getSubscriptions("access-token", {
      cadence: "monthly",
      category_id: 3,
      limit: 25,
      max_amount: 18,
      min_amount: 10,
      payment_method_id: 7,
      search: "netflix",
      status: "active",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/subscriptions?cadence=monthly&category_id=3&limit=25&max_amount=18&min_amount=10&payment_method_id=7&search=netflix&status=active",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("supports delete requests that return no JSON body", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );

    await expect(apiClient.deleteSubscription("access-token", 4)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/subscriptions/4",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("adds a CSRF token header to protected state-changing requests", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );
    setApiCsrfToken("csrf-token");

    await apiClient.deleteSubscription("access-token", 4);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/subscriptions/4",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
          "X-CSRF-Token": "csrf-token",
        }),
        method: "DELETE",
      }),
    );
  });

  it("downloads exports with bearer auth and parsed attachment filename", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("subscription_id,name\n1,Netflix\n", {
        status: 200,
        headers: {
          "Content-Disposition": 'attachment; filename="mysubscription-export.csv"',
          "Content-Type": "text/csv",
        },
      }),
    );

    const download = await apiClient.downloadExport("access-token", {
      active_only: true,
      calendar_months: 12,
      format: "csv",
      include_payment_history: true,
    });

    expect(download.filename).toBe("mysubscription-export.csv");
    await expect(download.blob.text()).resolves.toContain("Netflix");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/exports?active_only=true&calendar_months=12&format=csv&include_payment_history=true",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("surfaces API error details instead of a generic status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Category not found." }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(apiClient.deleteCategory("access-token", 99)).rejects.toThrow(
      "Category not found.",
    );
  });
});
