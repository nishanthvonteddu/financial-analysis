import { expect, test } from "@playwright/test";

test("renders the MVP landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("MySubscription Tracker")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "See every renewal coming",
  );
  await expect(page.getByText("Import. Detect. Decide.")).toBeVisible();
});
