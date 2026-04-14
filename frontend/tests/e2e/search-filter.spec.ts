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

test("searches and filters subscriptions from the list surface", async ({ page, request }) => {
  const streamingCategoryId = await createCategory(request, uniqueLabel("Streaming"));
  const workCategoryId = await createCategory(request, uniqueLabel("Work"));
  const primaryCardId = await createPaymentMethod(request, uniqueLabel("Primary Card"));
  const backupCardId = await createPaymentMethod(request, uniqueLabel("Backup Card"));

  await createSubscription(request, {
    amount: "15.49",
    category_id: streamingCategoryId,
    name: "Netflix Family",
    payment_method_id: primaryCardId,
    start_date: "2026-01-01",
    status: "active",
  });
  await createSubscription(request, {
    amount: "8.99",
    category_id: streamingCategoryId,
    name: "Hulu Basic",
    payment_method_id: backupCardId,
    start_date: "2026-01-05",
    status: "paused",
  });
  await createSubscription(request, {
    amount: "12.00",
    category_id: workCategoryId,
    cadence: "yearly",
    name: "Notion Pro",
    payment_method_id: primaryCardId,
    start_date: "2026-01-10",
    status: "active",
  });

  await page.goto("/subscriptions");

  await page.getByPlaceholder("Search plans, vendors, notes").fill("netflix");
  await expect(page).toHaveURL(/search=netflix/);
  await expect(page.getByRole("heading", { name: "Netflix Family" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hulu Basic" })).not.toBeVisible();

  await page.getByLabel("Filter by status").selectOption("paused");
  await expect(page).toHaveURL(/status=paused/);
  await expect(page.getByRole("heading", { name: "Netflix Family" })).not.toBeVisible();

  await page.getByRole("button", { name: "Reset all" }).click();
  await page.getByLabel("Filter by cadence").selectOption("yearly");
  await expect(page).toHaveURL(/cadence=yearly/);
  await expect(page.getByRole("heading", { name: "Notion Pro" })).toBeVisible();

  await page.getByRole("button", { name: "Reset all" }).click();
  await page.getByLabel("Minimum monthly amount").fill("14");
  await page.getByLabel("Maximum monthly amount").fill("16");
  await expect(page).toHaveURL(/min_amount=14/);
  await expect(page.getByRole("heading", { name: "Netflix Family" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hulu Basic" })).not.toBeVisible();
});
