"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { NotificationPreferencesUpdate } from "@/types";

const notificationKeys = {
  list: ["notifications", "list"] as const,
  preferences: ["notifications", "preferences"] as const,
};

function useRequiredToken() {
  const { accessToken } = useAuth();

  if (!accessToken) {
    throw new Error("You must be signed in to manage notifications.");
  }

  return accessToken;
}

export function useNotifications() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getNotifications(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: notificationKeys.list,
    refetchInterval: 60_000,
    staleTime: 20_000,
  });
}

export function useNotificationPreferences() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getNotificationPreferences(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: notificationKeys.preferences,
    staleTime: 60_000,
  });
}

export function useMarkNotificationRead() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => apiClient.markNotificationRead(token, notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.markAllNotificationsRead(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NotificationPreferencesUpdate) =>
      apiClient.updateNotificationPreferences(token, payload),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save notification settings.");
    },
    onSuccess: () => {
      toast.success("Notification settings saved.");
      void queryClient.invalidateQueries({ queryKey: notificationKeys.preferences });
    },
  });
}

export function useCreateTelegramLinkToken() {
  const token = useRequiredToken();

  return useMutation({
    mutationFn: () => apiClient.createTelegramLinkToken(token),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not create Telegram link token.");
    },
  });
}

export function useUnlinkTelegram() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.unlinkTelegram(token),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not unlink Telegram.");
    },
    onSuccess: () => {
      toast.success("Telegram unlinked.");
      void queryClient.invalidateQueries({ queryKey: notificationKeys.preferences });
    },
  });
}
