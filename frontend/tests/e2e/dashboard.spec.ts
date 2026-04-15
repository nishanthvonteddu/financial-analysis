import { expect, test } from "@playwright/test";

import {
  createCategory,
  createPaymentMethod,
  createSubscription,
  resetWorkspace,
  uniqueLabel,
} from "./support/session";

test.beforeEach(async ({ request }) => {
  await resetWorkspace(request);
});

test("renders the dashboard with its widget structure", async ({ page, request }) => {
  const categoryId = await createCategory(request, uniqueLabel("Entertainment"));
  const paymentMethodId = await createPaymentMethod(request, uniqueLabel("Visa"));

  await createSubscription(request, {
    amount: "15.49",
    category_id: categoryId,
    name: "Netflix",
    next_charge_date: "2026-02-01",
    payment_method_id: paymentMethodId,
    start_date: "2026-01-01",
  });
  await createSubscription(request, {
    amount: "8.99",
    category_id: categoryId,
    name: "Hulu",
    next_charge_date: "2026-02-05",
    payment_method_id: paymentMethodId,
    start_date: "2026-01-05",
  });

  await page.goto("/dashboard");

  await expect(page.getByTestId("app-shell-route-title")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Monthly spend" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Category breakdown" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Upcoming renewals" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recently ended" })).toBeVisible();
});
