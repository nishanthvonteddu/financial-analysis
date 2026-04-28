import { act, render as rtlRender } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthResponse } from "@/types";
import { AuthProvider } from "@/components/providers/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { render, screen } from "../../../test-utils/render";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    login: vi.fn(),
    refresh: vi.fn(),
    register: vi.fn(),
    updateMe: vi.fn(),
  },
  setApiCsrfToken: vi.fn(),
}));

const buildSession = (overrides: Partial<AuthResponse> = {}) => ({
  access_token: "access-token",
  refresh_token: "refresh-token",
  token_type: "bearer",
  access_token_expires_at: new Date(Date.now() + 65_000).toISOString(),
  refresh_token_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  user: {
    id: 1,
    email: "owner@example.com",
    full_name: "Owner One",
    preferred_currency: "USD",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  ...overrides,
});

function AuthHarness() {
  const { isAuthenticated, login, user } = useAuth();

  return createElement(
    "div",
    null,
    createElement("p", { "data-testid": "state" }, isAuthenticated ? user?.email : "anonymous"),
    createElement(
      "button",
      {
        onClick: () =>
          void login({
            email: "owner@example.com",
            password: "super-secret",
          }),
        type: "button",
      },
      "Login",
    ),
  );
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.__MYSUBSCRIPTION_TEST_SESSION__ = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.__MYSUBSCRIPTION_TEST_SESSION__ = undefined;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("requires an auth provider", () => {
    expect(() => rtlRender(createElement(AuthHarness))).toThrow(
      "useAuth must be used within AuthProvider.",
    );
  });

  it("logs a user in and exposes their state", async () => {
    vi.mocked(apiClient.login).mockResolvedValue(buildSession());

    render(
      createElement(AuthProvider, null, createElement(AuthHarness)),
    );

    await act(async () => {
      screen.getByRole("button", { name: "Login" }).click();
    });

    expect(screen.getByTestId("state")).toHaveTextContent("owner@example.com");
  });

  it("hydrates a test bootstrap session without browser storage", async () => {
    window.__MYSUBSCRIPTION_TEST_SESSION__ = buildSession();

    render(
      createElement(AuthProvider, null, createElement(AuthHarness)),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("state")).toHaveTextContent("owner@example.com");
    expect(window.localStorage.getItem("mysubscription.auth")).toBeNull();
    expect(window.sessionStorage.getItem("mysubscription.auth")).toBeNull();
  });

  it("refreshes the session before the access token expires", async () => {
    vi.mocked(apiClient.login).mockResolvedValue(buildSession());
    vi.mocked(apiClient.refresh).mockResolvedValue(
      buildSession({ access_token: "refreshed-token" }),
    );

    render(
      createElement(AuthProvider, null, createElement(AuthHarness)),
    );

    await act(async () => {
      screen.getByRole("button", { name: "Login" }).click();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(35_000);
    });

    expect(apiClient.refresh).toHaveBeenCalledWith("refresh-token");
    expect(window.localStorage.getItem("mysubscription.auth")).toBeNull();
    expect(window.sessionStorage.getItem("mysubscription.auth")).toBeNull();
  });
});
