"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { Upload } from "@/types";

const uploadKeys = {
  history: ["uploads", "history"] as const,
  status: (uploadId: number) => ["uploads", "status", uploadId] as const,
};

function useRequiredToken() {
  const { accessToken } = useAuth();

  if (!accessToken) {
    throw new Error("You must be signed in to manage uploads.");
  }

  return accessToken;
}

export function useUploadHistory() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getUploads(accessToken!),
    placeholderData: (previousData) => previousData,
    queryKey: uploadKeys.history,
    staleTime: 20_000,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some((item) => item.status === "queued" || item.status === "processing")
        ? 2_000
        : false;
    },
  });
}

export function useUploadStatus(uploadId: number | null) {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken) && uploadId !== null,
    queryFn: () => apiClient.getUploadStatus(accessToken!, uploadId!),
    placeholderData: (previousData) => previousData,
    queryKey: uploadId === null ? ["uploads", "status", "idle"] : uploadKeys.status(uploadId),
    staleTime: 10_000,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchInterval: (query) => {
      const upload = query.state.data;
      return upload?.status === "queued" || upload?.status === "processing" ? 1_250 : false;
    },
  });
}

export function useCreateUpload() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) =>
      apiClient.uploadFile(token, file, onProgress),
    onSuccess: (upload) => {
      queryClient.setQueryData(uploadKeys.status(upload.id), upload);
      void queryClient.invalidateQueries({ queryKey: uploadKeys.status(upload.id) });
      void queryClient.invalidateQueries({ queryKey: uploadKeys.history });
    },
  });
}

export function useDeleteUpload() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadId: number) => apiClient.deleteUpload(token, uploadId),
    onSuccess: (_, uploadId) => {
      void queryClient.invalidateQueries({ queryKey: uploadKeys.history });
      queryClient.removeQueries({ queryKey: uploadKeys.status(uploadId) });
    },
  });
}

export function mergeSelectedUpload(
  selectedUploadId: number | null,
  historyItems: Upload[],
  selectedUploadStatus: Upload | undefined,
) {
  if (selectedUploadStatus && selectedUploadId === selectedUploadStatus.id) {
    return selectedUploadStatus;
  }

  return historyItems.find((item) => item.id === selectedUploadId) ?? historyItems[0] ?? null;
}
