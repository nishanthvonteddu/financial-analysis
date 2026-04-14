import { expect, test } from "@playwright/test";

import {
  createCategory,
  createPaymentMethod,
  resetWorkspace,
  uniqueLabel,
} from "./support/session";

test.beforeEach(async ({ request }) => {
  await resetWorkspace(request);
});

test("adds, edits, and deletes a subscription", async ({ page, request }) => {
  const categoryName = uniqueLabel("Streaming");
  const paymentMethodName = uniqueLabel("Primary Card");
  const subscriptionName = uniqueLabel("Netflix Family");

  await createCategory(request, categoryName);
  await createPaymentMethod(request, paymentMethodName);

  await page.goto("/subscriptions");
  await page.getByLabel("Subscription name").fill(subscriptionName);
  await page.getByLabel("Vendor").fill("Netflix");
  await page.getByLabel("Amount").fill("15.49");
  await page.getByLabel("Currency").fill("USD");
  await page.getByLabel("Billing day").fill("1");
  await page.getByLabel("Start date").fill("2026-01-01");
  await page.getByLabel("Next charge date").fill("2026-02-01");
  await page.getByLabel("Category").selectOption({ label: categoryName });
  await page.getByLabel("Payment method").selectOption({ label: paymentMethodName });
  await page.getByLabel("Website URL").fill("https://www.netflix.com");
  await page.getByLabel("Notes").fill("Family streaming plan");
  await page.getByRole("button", { name: "Save subscription" }).click();

  await expect(page.getByRole("heading", { name: subscriptionName })).toBeVisible();

  await page.getByRole("link", { name: "Open detail" }).click();
  await expect(page).toHaveURL(/\/subscriptions\/\d+$/);

  await page.getByRole("button", { name: "Edit subscription" }).click();
  await page.getByLabel("Amount").fill("17.99");
  await page.getByLabel("Notes").fill("Updated after the annual increase");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Updated after the annual increase")).toBeVisible();
  await expect(page.getByText("$17.99")).toBeVisible();

  await page.getByRole("button", { name: "Delete subscription" }).click();
  await page.getByRole("button", { name: "Delete subscription" }).click();

  await expect(page).toHaveURL(/\/subscriptions$/);
  await expect(page.getByText(subscriptionName)).not.toBeVisible();
});
