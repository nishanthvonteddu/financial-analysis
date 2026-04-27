import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app-shell/app-shell";

const replaceMock = vi.fn();
const logoutMock = vi.fn();
let pathname = "/uploads";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    logout: logoutMock,
    user: {
      email: "operator@example.com",
      full_name: "Operator One",
    },
  }),
}));

vi.mock("@/components/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/notifications/notification-panel", () => ({
  NotificationBell: () => (
    <button aria-label="Notifications" type="button">
      Notifications
    </button>
  ),
}));

vi.mock("@/components/ui/theme-toggle", () => ({
  ThemeToggle: () => (
    <button aria-label="Toggle theme" type="button">
      Theme
    </button>
  ),
}));

describe("AppShell", () => {
  beforeEach(() => {
    pathname = "/uploads";
    replaceMock.mockClear();
    logoutMock.mockClear();
  });

  it("exposes consistent navigation and workspace search affordances", () => {
    render(
      <AppShell>
        <p>Upload workspace</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /skip to workspace content/i })).toHaveAttribute(
      "href",
      "#workspace-content",
    );
    expect(screen.getByRole("navigation", { name: "Primary sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary mobile" })).toBeInTheDocument();
    expect(screen.getByTestId("app-shell-route-title")).toHaveTextContent("Uploads");
    expect(screen.getAllByRole("searchbox", { name: "Search workspace" })).toHaveLength(2);
  });
});
