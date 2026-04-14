import { expect, test } from "@playwright/test";

import { AUTH_STORAGE_KEY } from "../../src/lib/constants";
import { registerTestUser, seedSession, uniqueEmail } from "./support/session";

test.use({ storageState: { cookies: [], origins: [] } });

test("registers, logs in, and logs out through the UI", async ({ page }) => {
  const email = uniqueEmail("auth-ui");
  const password = "super-secret";

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Taylor Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Smart dashboard snapshot" })).toBeVisible();

  await page.locator("button[aria-haspopup='menu']").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});

test("shows an error for invalid credentials", async ({ page, request }) => {
  const email = uniqueEmail("invalid-login");

  await registerTestUser(request, {
    email,
    fullName: "Invalid Login User",
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("The email or password did not match an active account.")).toBeVisible();
});

test("refreshes the session before expiry", async ({ page, request }) => {
  const { session } = await registerTestUser(request, {
    email: uniqueEmail("refresh"),
    fullName: "Refresh User",
  });

  await seedSession(page, {
    ...session,
    access_token_expires_at: new Date(Date.now() + 1_500).toISOString(),
  });

  const refreshResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/auth/refresh") &&
      response.request().method() === "POST" &&
      response.ok(),
  );

  await page.goto("/dashboard");
  await refreshResponse;

  const storedSession = await page.evaluate((key) => {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as { access_token: string }) : null;
  }, AUTH_STORAGE_KEY);

  expect(storedSession?.access_token).not.toBe(session.access_token);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("redirects to login when refresh fails", async ({ page, request }) => {
  const { session } = await registerTestUser(request, {
    email: uniqueEmail("expired"),
    fullName: "Expired Session User",
  });

  await seedSession(page, {
    ...session,
    access_token_expires_at: new Date(Date.now() + 1_500).toISOString(),
    refresh_token: "invalid-refresh-token",
  });

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});
