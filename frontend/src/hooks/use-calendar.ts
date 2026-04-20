"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";

const calendarKeys = {
  month: (year: number, month: number) => ["calendar", year, month] as const,
};

export function useCalendarRenewals(year: number, month: number) {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getCalendarRenewals(accessToken!, year, month),
    placeholderData: (previousData) => previousData,
    queryKey: calendarKeys.month(year, month),
    staleTime: 30_000,
  });
}
