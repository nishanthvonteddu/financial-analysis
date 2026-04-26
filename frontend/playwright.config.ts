import { defineConfig, devices } from "@playwright/test";

import { AUTH_STATE_PATH } from "./tests/e2e/support/session";

const backendPort = process.env.BACKEND_PORT ?? "8000";
const frontendPort = process.env.FRONTEND_PORT ?? "3000";
const apiBaseURL = `http://127.0.0.1:${backendPort}/api/v1`;
const frontendBaseURL = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  globalSetup: "./tests/e2e/global-setup.ts",
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: frontendBaseURL,
    storageState: AUTH_STATE_PATH,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: [
    {
      command: "bash ../backend/scripts/start_playwright_server.sh",
      url: `${apiBaseURL}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        `NEXT_PUBLIC_API_BASE_URL=${apiBaseURL} npm run start -- --hostname 127.0.0.1 --port ${frontendPort}`,
      url: frontendBaseURL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
