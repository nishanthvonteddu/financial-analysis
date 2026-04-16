"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    placeholderData: (previousData) => previousData,
    queryKey: subscriptionKeys.categories,
    staleTime: 60_000,
  });

  const paymentMethodsQuery = useQuery({
    enabled,
    queryFn: () => apiClient.getPaymentMethods(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: subscriptionKeys.paymentMethods,
    staleTime: 60_000,
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
    placeholderData: (previousData) => previousData,
    queryKey: subscriptionKeys.list(filters),
    staleTime: 30_000,
  });
}

export function useSubscription(subscriptionId: number) {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken) && Number.isFinite(subscriptionId),
    queryFn: () => apiClient.getSubscription(accessToken!, subscriptionId),
    placeholderData: (previousData) => previousData,
    queryKey: subscriptionKeys.detail(subscriptionId),
    staleTime: 30_000,
  });
}

export function useCreateSubscription() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubscriptionUpsertInput) => apiClient.createSubscription(token, payload),
    onSuccess: () => {
      toast.success("Subscription saved.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save the subscription.");
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
      toast.success("Subscription updated.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(subscriptionId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update the subscription.");
    },
  });
}

export function useDeleteSubscription(subscriptionId: number) {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deleteSubscription(token, subscriptionId),
    onSuccess: () => {
      toast.success("Subscription removed.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.removeQueries({ queryKey: subscriptionKeys.detail(subscriptionId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not delete the subscription.");
    },
  });
}

export function useCreateCategory() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CategoryInput) => apiClient.createCategory(token, payload),
    onSuccess: () => {
      toast.success("Category saved.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.categories });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save the category.");
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
      toast.success("Category updated.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.categories });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update the category.");
    },
  });
}

export function useDeleteCategory() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => apiClient.deleteCategory(token, categoryId),
    onSuccess: () => {
      toast.success("Category deleted.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.categories });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not delete the category.");
    },
  });
}

export function useCreatePaymentMethod() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentMethodInput) => apiClient.createPaymentMethod(token, payload),
    onSuccess: () => {
      toast.success("Payment method saved.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.paymentMethods });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save the payment method.");
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
      toast.success("Payment method updated.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.paymentMethods });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update the payment method.");
    },
  });
}

export function useDeletePaymentMethod() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: number) => apiClient.deletePaymentMethod(token, paymentMethodId),
    onSuccess: () => {
      toast.success("Payment method deleted.");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.paymentMethods });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not delete the payment method.");
    },
  });
}

export function useDeleteWorkspaceData() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deleteWorkspaceData(token),
    onSuccess: () => {
      toast.success("Workspace data cleared.");
      void queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not clear workspace data.");
    },
  });
}
