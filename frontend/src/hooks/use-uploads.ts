"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { Upload, UploadListResponse } from "@/types";

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
  const queryClient = useQueryClient();
  const completedUploadIds = useRef(new Set<number>());

  const query = useQuery({
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

  useEffect(() => {
    const completedItems = query.data?.items.filter((item) => item.status === "completed") ?? [];
    const hasNewCompletedUpload = completedItems.some((item) => {
      if (completedUploadIds.current.has(item.id)) {
        return false;
      }
      completedUploadIds.current.add(item.id);
      return true;
    });

    if (hasNewCompletedUpload) {
      void queryClient.invalidateQueries({ queryKey: ["expense-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  }, [query.data?.items, queryClient]);

  return query;
}

export function useUploadStatus(uploadId: number | null) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const invalidatedUploadIds = useRef(new Set<number>());

  const query = useQuery({
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

  useEffect(() => {
    const upload = query.data;
    if (!upload || upload.status !== "completed" || invalidatedUploadIds.current.has(upload.id)) {
      return;
    }

    invalidatedUploadIds.current.add(upload.id);
    void queryClient.invalidateQueries({ queryKey: ["expense-reports"] });
    void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [query.data, queryClient]);

  return query;
}

export function useCreateUpload() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) =>
      apiClient.uploadFile(token, file, onProgress),
    onSuccess: (upload) => {
      toast.success(`Upload queued: ${upload.file_name}`);
      queryClient.setQueryData<UploadListResponse>(uploadKeys.history, (previous) => {
        const nextItems = [upload, ...(previous?.items ?? []).filter((item) => item.id !== upload.id)];

        return {
          items: nextItems,
          total: nextItems.length,
        };
      });
      queryClient.setQueryData(uploadKeys.status(upload.id), upload);
      void queryClient.invalidateQueries({ queryKey: uploadKeys.status(upload.id) });
      void queryClient.invalidateQueries({ queryKey: uploadKeys.history });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not upload the file.");
    },
  });
}

export function useDeleteUpload() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadId: number) => apiClient.deleteUpload(token, uploadId),
    onSuccess: (_, uploadId) => {
      toast.success("Upload removed.");
      void queryClient.invalidateQueries({ queryKey: uploadKeys.history });
      queryClient.removeQueries({ queryKey: uploadKeys.status(uploadId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not delete the upload.");
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
