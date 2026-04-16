import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";

describe("apiClient", () => {
  afterEach(() => {
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
