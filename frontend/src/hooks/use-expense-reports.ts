"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { AnalyticsRangeKey } from "@/types";

const expenseReportKeys = {
  analytics: (range: AnalyticsRangeKey) => ["expense-reports", "analytics", range] as const,
  detail: (reportId: number) => ["expense-reports", "detail", reportId] as const,
  list: ["expense-reports", "list"] as const,
};

export function useExpenseReports() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getExpenseReports(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: expenseReportKeys.list,
    staleTime: 30_000,
  });
}

export function useExpenseAnalytics(range: AnalyticsRangeKey) {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getExpenseAnalytics(accessToken!, range),
    placeholderData: (previousData) => previousData,
    queryKey: expenseReportKeys.analytics(range),
    staleTime: 30_000,
  });
}

export function useExpenseReport(reportId: number | null) {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken) && Number.isFinite(reportId),
    queryFn: () => apiClient.getExpenseReport(accessToken!, reportId!),
    placeholderData: (previousData) => previousData,
    queryKey: expenseReportKeys.detail(reportId ?? 0),
    staleTime: 30_000,
  });
}
