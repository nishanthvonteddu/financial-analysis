"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { FamilyCreateInput, FamilyJoinInput, FamilyPrivacyInput, FamilyStatus } from "@/types";

const familyKeys = {
  dashboard: ["family", "dashboard"] as const,
  status: ["family", "status"] as const,
};

function useRequiredToken() {
  const { accessToken } = useAuth();

  if (!accessToken) {
    throw new Error("You must be signed in to manage family sharing.");
  }

  return accessToken;
}

function invalidateFamily(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: familyKeys.status });
  void queryClient.invalidateQueries({ queryKey: familyKeys.dashboard });
}

export function useFamilyStatus() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getFamilyStatus(accessToken!),
    queryKey: familyKeys.status,
    staleTime: 30_000,
  });
}

export function useFamilyDashboard(enabled: boolean) {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken) && enabled,
    queryFn: () => apiClient.getFamilyDashboard(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: familyKeys.dashboard,
    staleTime: 30_000,
  });
}

export function useCreateFamily() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FamilyCreateInput) => apiClient.createFamily(token, payload),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not create the family.");
    },
    onSuccess: (payload: FamilyStatus) => {
      queryClient.setQueryData(familyKeys.status, payload);
      invalidateFamily(queryClient);
    },
  });
}

export function useJoinFamily() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FamilyJoinInput) => apiClient.joinFamily(token, payload),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not join that family.");
    },
    onSuccess: (payload: FamilyStatus) => {
      queryClient.setQueryData(familyKeys.status, payload);
      invalidateFamily(queryClient);
    },
  });
}

export function useUpdateFamilyPrivacy() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FamilyPrivacyInput) => apiClient.updateFamilyPrivacy(token, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: familyKeys.status });
      const previousStatus = queryClient.getQueryData<FamilyStatus>(familyKeys.status);

      queryClient.setQueryData<FamilyStatus>(familyKeys.status, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          current_member: current.current_member
            ? { ...current.current_member, share_subscriptions: payload.share_subscriptions }
            : null,
          members: current.members.map((member) =>
            member.is_current_user
              ? { ...member, share_subscriptions: payload.share_subscriptions }
              : member,
          ),
        };
      });

      return { previousStatus };
    },
    onError: (error, _payload, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(familyKeys.status, context.previousStatus);
      }
      toast.error(error instanceof Error ? error.message : "Could not update sharing privacy.");
    },
    onSettled: () => {
      invalidateFamily(queryClient);
    },
  });
}

export function useLeaveFamily() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.leaveFamily(token),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not leave the family.");
    },
    onSuccess: () => {
      queryClient.setQueryData<FamilyStatus>(familyKeys.status, {
        current_member: null,
        family: null,
        members: [],
      });
      invalidateFamily(queryClient);
    },
  });
}
