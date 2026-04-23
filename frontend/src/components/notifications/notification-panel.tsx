"use client";

import { Bell, CheckCheck, Mail, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

import {
  useCreateTelegramLinkToken,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationPreferences,
  useNotifications,
  useUnlinkTelegram,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type {
  NotificationItem,
  NotificationPreference,
  NotificationPreferencesResponse,
} from "@/types";

type NotificationPanelContentProps = {
  isCreatingToken?: boolean;
  isSaving?: boolean;
  isUnlinking?: boolean;
  linkToken?: string;
  notifications: NotificationItem[];
  onCreateLinkToken: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (notificationId: number) => void;
  onPreferenceChange: (channel: NotificationPreference["channel"], enabled: boolean) => void;
  onUnlinkTelegram: () => void;
  preferences: NotificationPreferencesResponse | undefined;
  unreadCount: number;
};

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getPreference(
  preferences: NotificationPreferencesResponse | undefined,
  channel: NotificationPreference["channel"],
) {
  return preferences?.items.find((item) => item.channel === channel);
}

export function NotificationPanelContent({
  isCreatingToken = false,
  isSaving = false,
  isUnlinking = false,
  linkToken,
  notifications,
  onCreateLinkToken,
  onMarkAllRead,
  onMarkRead,
  onPreferenceChange,
  onUnlinkTelegram,
  preferences,
  unreadCount,
}: NotificationPanelContentProps) {
  const emailPreference = getPreference(preferences, "email");
  const telegramPreference = getPreference(preferences, "telegram");

  return (
    <div
      className="absolute right-0 top-[calc(100%+12px)] z-40 w-[min(calc(100vw-2rem),28rem)] overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-[0_24px_80px_rgba(17,20,24,0.18)]"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-ink">Notifications</p>
          <p className="mt-1 text-xs text-black/52">
            {unreadCount > 0 ? `${unreadCount} unread renewal alert${unreadCount === 1 ? "" : "s"}` : "All caught up"}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-stone disabled:cursor-not-allowed disabled:opacity-50"
          disabled={unreadCount === 0}
          onClick={onMarkAllRead}
          type="button"
        >
          <CheckCheck className="size-3.5" />
          Read all
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto px-3 py-3">
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                className={cn(
                  "w-full rounded-[1.1rem] px-3 py-3 text-left transition hover:bg-stone",
                  notification.status === "unread" ? "bg-stone/78" : "bg-transparent",
                )}
                key={notification.id}
                onClick={() => onMarkRead(notification.id)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 size-2.5 shrink-0 rounded-full",
                      notification.status === "unread" ? "bg-ember" : "bg-black/16",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-black/58">
                      {notification.message}
                    </span>
                    <span className="mt-2 block text-xs text-black/42">
                      {formatNotificationTime(notification.created_at)}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto size-6 text-black/32" />
            <p className="mt-3 text-sm font-semibold text-ink">No notifications yet</p>
            <p className="mt-1 text-sm text-black/52">
              Renewal reminders will appear here before scheduled charges.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-black/8 bg-stone/60 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/42">
          Delivery
        </p>
        <div className="mt-3 grid gap-2">
          <label className="flex items-center justify-between gap-3 rounded-[1rem] bg-white/74 px-3 py-3">
            <span className="flex min-w-0 items-center gap-3">
              <Mail className="size-4 text-black/48" />
              <span className="text-sm font-medium text-ink">Email reminders</span>
            </span>
            <input
              checked={emailPreference?.is_enabled ?? false}
              className="size-4 accent-ember"
              disabled={isSaving}
              onChange={(event) => onPreferenceChange("email", event.target.checked)}
              type="checkbox"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-[1rem] bg-white/74 px-3 py-3">
            <span className="flex min-w-0 items-center gap-3">
              <MessageCircle className="size-4 text-black/48" />
              <span className="text-sm font-medium text-ink">Telegram reminders</span>
            </span>
            <input
              checked={telegramPreference?.is_enabled ?? false}
              className="size-4 accent-ember"
              disabled={isSaving || !preferences?.telegram_linked}
              onChange={(event) => onPreferenceChange("telegram", event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>

        <div className="mt-3 rounded-[1rem] bg-white/74 px-3 py-3">
          {preferences?.telegram_linked ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-black/58">Telegram is linked for this workspace.</p>
              <button
                className="shrink-0 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-stone disabled:opacity-50"
                disabled={isUnlinking}
                onClick={onUnlinkTelegram}
                type="button"
              >
                Unlink
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
                disabled={isCreatingToken}
                onClick={onCreateLinkToken}
                type="button"
              >
                <Send className="size-3.5" />
                Create Telegram code
              </button>
              {linkToken ? (
                <p className="break-all text-sm text-black/58">Send /start {linkToken}</p>
              ) : (
                <p className="text-sm text-black/52">
                  Create a code, then send it to the Telegram bot to link this account.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [linkToken, setLinkToken] = useState<string | undefined>();
  const notificationsQuery = useNotifications();
  const preferencesQuery = useNotificationPreferences();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const updatePreferencesMutation = useUpdateNotificationPreferences();
  const createLinkTokenMutation = useCreateTelegramLinkToken();
  const unlinkTelegramMutation = useUnlinkTelegram();

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unread_count ?? 0;
  const preferences = preferencesQuery.data;

  const handlePreferenceChange = (
    channel: NotificationPreference["channel"],
    enabled: boolean,
  ) => {
    if (!preferences) {
      return;
    }

    updatePreferencesMutation.mutate({
      items: preferences.items.map((item) =>
        item.channel === channel ? { ...item, is_enabled: enabled } : item,
      ),
    });
  };

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-label="Notifications"
        className="relative inline-flex size-11 items-center justify-center rounded-full border border-black/10 bg-white/78 text-ink transition hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/30"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <NotificationPanelContent
          isCreatingToken={createLinkTokenMutation.isPending}
          isSaving={updatePreferencesMutation.isPending}
          isUnlinking={unlinkTelegramMutation.isPending}
          linkToken={linkToken}
          notifications={notifications}
          onCreateLinkToken={() => {
            createLinkTokenMutation.mutate(undefined, {
              onSuccess: (response) => setLinkToken(response.token),
            });
          }}
          onMarkAllRead={() => markAllReadMutation.mutate()}
          onMarkRead={(notificationId) => markReadMutation.mutate(notificationId)}
          onPreferenceChange={handlePreferenceChange}
          onUnlinkTelegram={() => unlinkTelegramMutation.mutate()}
          preferences={preferences}
          unreadCount={unreadCount}
        />
      ) : null}
    </div>
  );
}
