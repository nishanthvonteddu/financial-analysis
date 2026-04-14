import { chromium, request } from "@playwright/test";

import {
  AUTH_STATE_PATH,
  ensureAuthArtifactDir,
  FRONTEND_BASE_URL,
  registerTestUser,
  saveSessionArtifact,
  seedSession,
} from "./support/session";

export default async function globalSetup() {
  ensureAuthArtifactDir();

  const apiContext = await request.newContext();
  const { session } = await registerTestUser(apiContext, {
    email: "playwright.runner@example.com",
    fullName: "Playwright Runner",
  }).catch(async () => {
    return registerTestUser(apiContext);
  });
  saveSessionArtifact(session);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await seedSession(page, session);
  await page.goto(`${FRONTEND_BASE_URL}/dashboard`);
  await page.context().storageState({ path: AUTH_STATE_PATH });

  await browser.close();
  await apiContext.dispose();
}
