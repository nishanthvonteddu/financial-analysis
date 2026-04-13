"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type {
  CategoryInput,
  PaymentMethodInput,
  SubscriptionFilters,
  SubscriptionUpsertInput,
} from "@/types";

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

export function useCreateCategory() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CategoryInput) => apiClient.createCategory(token, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.categories });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: number;
      payload: CategoryInput;
    }) => apiClient.updateCategory(token, categoryId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.categories });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useDeleteCategory() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => apiClient.deleteCategory(token, categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.categories });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useCreatePaymentMethod() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentMethodInput) => apiClient.createPaymentMethod(token, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.paymentMethods });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useUpdatePaymentMethod() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentMethodId,
      payload,
    }: {
      paymentMethodId: number;
      payload: PaymentMethodInput;
    }) => apiClient.updatePaymentMethod(token, paymentMethodId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.paymentMethods });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useDeletePaymentMethod() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: number) => apiClient.deletePaymentMethod(token, paymentMethodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.paymentMethods });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useDeleteWorkspaceData() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deleteWorkspaceData(token),
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
