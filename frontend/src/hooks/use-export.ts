import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { ExportOptions } from "@/types";

export function useExportDownload() {
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (options: ExportOptions) => {
      if (!accessToken) {
        throw new Error("You must be signed in to export data.");
      }

      return apiClient.downloadExport(accessToken, options);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not prepare the export.");
    },
    onSuccess: ({ filename }) => {
      toast.success(`Export ready: ${filename}`);
    },
  });
}
