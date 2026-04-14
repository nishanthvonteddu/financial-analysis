import { expect, test } from "@playwright/test";

import { resetWorkspace, uniqueLabel } from "./support/session";

test.beforeEach(async ({ request }) => {
  await resetWorkspace(request);
});

test("adds a category and changes the theme", async ({ page }) => {
  const categoryName = uniqueLabel("Utilities");

  await page.goto("/settings");
  await page.getByPlaceholder("Add a category name").fill(categoryName);
  await page.getByRole("button", { name: "Add category" }).click();

  await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();

  await page.getByRole("button", { name: /Switch to dark mode/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
