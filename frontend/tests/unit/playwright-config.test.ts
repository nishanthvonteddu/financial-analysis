import { describe, expect, it } from "vitest";

import config from "../../playwright.config";

describe("Playwright final QA configuration", () => {
  it("runs the regression suite across desktop and mobile browser projects", () => {
    const projectNames = config.projects?.map((project) => project.name) ?? [];

    expect(projectNames).toEqual(
      expect.arrayContaining(["chromium", "firefox", "webkit", "mobile-chrome"]),
    );
  });
});
