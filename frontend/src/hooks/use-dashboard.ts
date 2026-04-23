"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { DashboardLayoutPayload, DashboardLayoutWidget } from "@/types";

const dashboardKeys = {
  layout: ["dashboard", "layout"] as const,
  score: ["dashboard", "score"] as const,
  summary: ["dashboard", "summary"] as const,
};

type DashboardLayoutCache = {
  updated_at: string | null;
  version: number;
  widgets: DashboardLayoutWidget[];
};

function useRequiredToken() {
  const { accessToken } = useAuth();

  if (!accessToken) {
    throw new Error("You must be signed in to view the dashboard.");
  }

  return accessToken;
}

export function useDashboardSummary() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getDashboardSummary(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: dashboardKeys.summary,
    staleTime: 30_000,
  });
}

export function useDashboardScore() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getDashboardScore(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: dashboardKeys.score,
    staleTime: 30_000,
  });
}

export function useDashboardLayout() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getDashboardLayout(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: dashboardKeys.layout,
    staleTime: 30_000,
  });
}

export function useUpdateDashboardLayout() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DashboardLayoutPayload) => apiClient.updateDashboardLayout(token, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.layout });
      const previousLayout = queryClient.getQueryData<DashboardLayoutCache>(dashboardKeys.layout);

      queryClient.setQueryData<DashboardLayoutCache>(dashboardKeys.layout, (current) => ({
        updated_at: current?.updated_at ?? null,
        version: current?.version ?? 1,
        widgets: payload.widgets,
      }));

      return { previousLayout };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousLayout !== undefined) {
        queryClient.setQueryData(dashboardKeys.layout, context.previousLayout);
      }
      toast.error("Could not save the dashboard layout.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.layout });
    },
  });
}
