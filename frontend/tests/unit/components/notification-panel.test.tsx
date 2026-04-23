import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NotificationPanelContent } from "@/components/notifications/notification-panel";
import type { NotificationPreferencesResponse } from "@/types";

const preferences: NotificationPreferencesResponse = {
  items: [
    {
      channel: "email",
      event_type: "renewal_due",
      is_enabled: true,
      quiet_hours_end: null,
      quiet_hours_start: null,
    },
    {
      channel: "telegram",
      event_type: "renewal_due",
      is_enabled: false,
      quiet_hours_end: null,
      quiet_hours_start: null,
    },
  ],
  telegram_linked: false,
};

describe("NotificationPanelContent", () => {
  it("renders unread notifications and marks one read", async () => {
    const user = userEvent.setup();
    const onMarkRead = vi.fn();

    render(
      <NotificationPanelContent
        notifications={[
          {
            created_at: "2026-04-22T14:00:00Z",
            id: 7,
            message: "Netflix is scheduled to renew on 2026-04-24 for 15.99 USD.",
            notification_type: "renewal_due",
            read_at: null,
            status: "unread",
            title: "Renewal due: Netflix",
            updated_at: "2026-04-22T14:00:00Z",
          },
        ]}
        onCreateLinkToken={vi.fn()}
        onMarkAllRead={vi.fn()}
        onMarkRead={onMarkRead}
        onPreferenceChange={vi.fn()}
        onUnlinkTelegram={vi.fn()}
        preferences={preferences}
        unreadCount={1}
      />,
    );

    expect(screen.getByText("1 unread renewal alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /renewal due: netflix/i }));
    expect(onMarkRead).toHaveBeenCalledWith(7);
  });

  it("creates a Telegram link code from the settings surface", async () => {
    const user = userEvent.setup();
    const onCreateLinkToken = vi.fn();

    render(
      <NotificationPanelContent
        linkToken="abc123"
        notifications={[]}
        onCreateLinkToken={onCreateLinkToken}
        onMarkAllRead={vi.fn()}
        onMarkRead={vi.fn()}
        onPreferenceChange={vi.fn()}
        onUnlinkTelegram={vi.fn()}
        preferences={preferences}
        unreadCount={0}
      />,
    );

    expect(screen.getByText("Send /start abc123")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /create telegram code/i }));
    expect(onCreateLinkToken).toHaveBeenCalledTimes(1);
  });
});
