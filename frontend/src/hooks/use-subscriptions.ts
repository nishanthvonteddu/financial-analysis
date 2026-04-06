"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { SubscriptionFilters, SubscriptionUpsertInput } from "@/types";

const subscriptionKeys = {
  categories: ["categories"] as const,
  detail: (subscriptionId: number) => ["subscriptions", "detail", subscriptionId] as const,
  lists: () => ["subscriptions", "list"] as const,
  list: (filters: SubscriptionFilters) => ["subscriptions", "list", filters] as const,
  paymentMethods: ["payment-methods"] as const,
};

function useRequiredToken() {
  const { accessToken } = useAuth();

  if (!accessToken) {
    throw new Error("You must be signed in to manage subscriptions.");
  }

  return accessToken;
}

export function useSubscriptionCatalog() {
  const { accessToken } = useAuth();
  const enabled = Boolean(accessToken);

  const categoriesQuery = useQuery({
    enabled,
    queryFn: () => apiClient.getCategories(accessToken!),
    queryKey: subscriptionKeys.categories,
  });

  const paymentMethodsQuery = useQuery({
    enabled,
    queryFn: () => apiClient.getPaymentMethods(accessToken!),
    queryKey: subscriptionKeys.paymentMethods,
  });

  return {
    categoriesQuery,
    paymentMethodsQuery,
  };
}

export function useSubscriptionList(filters: SubscriptionFilters) {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getSubscriptions(accessToken!, filters),
    queryKey: subscriptionKeys.list(filters),
  });
}

export function useSubscription(subscriptionId: number) {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken) && Number.isFinite(subscriptionId),
    queryFn: () => apiClient.getSubscription(accessToken!, subscriptionId),
    queryKey: subscriptionKeys.detail(subscriptionId),
  });
}

export function useCreateSubscription() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubscriptionUpsertInput) => apiClient.createSubscription(token, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useUpdateSubscription(subscriptionId: number) {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<SubscriptionUpsertInput>) =>
      apiClient.updateSubscription(token, subscriptionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(subscriptionId) });
    },
  });
}

export function useDeleteSubscription(subscriptionId: number) {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deleteSubscription(token, subscriptionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.removeQueries({ queryKey: subscriptionKeys.detail(subscriptionId) });
    },
  });
}
