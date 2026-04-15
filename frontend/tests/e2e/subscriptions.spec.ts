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
  const createForm = page.getByTestId("subscription-create-form");
  await createForm.getByLabel("Subscription name").fill(subscriptionName);
  await createForm.getByLabel("Vendor").fill("Netflix");
  await createForm.getByLabel("Amount", { exact: true }).fill("15.49");
  await createForm.getByLabel("Currency").fill("USD");
  await createForm.getByLabel("Billing day").fill("1");
  await createForm.getByLabel("Start date").fill("2026-01-01");
  await createForm.getByLabel("Next charge date").fill("2026-02-01");
  await createForm.getByLabel("Category").selectOption({ label: categoryName });
  await createForm.getByLabel("Payment method").selectOption({ label: paymentMethodName });
  await createForm.getByLabel("Website URL").fill("https://www.netflix.com");
  await createForm.getByLabel("Notes").fill("Family streaming plan");
  await createForm.getByRole("button", { name: "Save subscription" }).click();

  await expect(page.getByRole("heading", { name: subscriptionName })).toBeVisible();

  await page.getByRole("link", { name: "Open detail" }).click();
  await expect(page).toHaveURL(/\/subscriptions\/\d+$/);

  await page.getByRole("button", { name: "Edit subscription" }).click();
  const editForm = page.getByTestId("subscription-edit-form");
  await editForm.getByLabel("Amount", { exact: true }).fill("17.99");
  await editForm.getByLabel("Notes").fill("Updated after the annual increase");
  await editForm.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Updated after the annual increase")).toBeVisible();
  await expect(page.getByText("$17.99")).toBeVisible();

  await page.getByRole("button", { name: "Delete subscription" }).click();
  await page
    .getByLabel("Delete this subscription?")
    .getByRole("button", { name: "Delete subscription" })
    .click();

  await expect(page).toHaveURL(/\/subscriptions$/);
  await expect(page.getByText(subscriptionName)).not.toBeVisible();
});
