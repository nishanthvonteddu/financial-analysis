"use client";

import { Clock3, FileSpreadsheet, FileText, Trash2 } from "lucide-react";

import { ServiceLogo } from "@/components/uploads/service-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Upload, UploadStatus } from "@/types";

const statusStyles: Record<UploadStatus, string> = {
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
  failed: "border-rose-500/25 bg-rose-500/10 text-rose-700",
  processing: "border-amber-500/25 bg-amber-500/10 text-amber-700",
  queued: "border-sky-500/25 bg-sky-500/10 text-sky-700",
};

function formatStatus(status: UploadStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatProvider(provider: string) {
  if (provider === "pending") {
    return "Awaiting source";
  }

  return provider
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type UploadHistoryListProps = {
  deletingUploadId?: number | null;
  onDelete: (uploadId: number) => void;
  onSelect: (uploadId: number) => void;
  selectedUploadId: number | null;
  uploads: Upload[];
};

export function UploadHistoryList({
  deletingUploadId = null,
  onDelete,
  onSelect,
  selectedUploadId,
  uploads,
}: UploadHistoryListProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/76 shadow-line backdrop-blur">
      <div className="border-b border-black/10 px-5 py-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">History</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-ink">Recent uploads</h3>
            <p className="mt-2 text-sm leading-6 text-black/62">
              Re-open any file to inspect status, provider detection, transaction counts, and queue
              changes without leaving this workspace.
            </p>
          </div>
          <p className="text-sm font-medium text-black/48">{uploads.length} files</p>
        </div>
      </div>

      <div className="divide-y divide-black/8">
        {uploads.map((upload) => {
          const isSelected = selectedUploadId === upload.id;

          return (
            <button
              className={cn(
                "group grid w-full gap-4 px-5 py-4 text-left transition sm:px-6",
                isSelected ? "bg-[#f7f0e7]" : "hover:bg-black/[0.025]",
              )}
              key={upload.id}
              onClick={() => onSelect(upload.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <ServiceLogo provider={upload.provider} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{upload.file_name}</p>
                    <p className="mt-1 text-sm text-black/55">{formatProvider(upload.provider)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
                      statusStyles[upload.status],
                    )}
                  >
                    {formatStatus(upload.status)}
                  </span>
                  <Button
                    aria-label={`Delete ${upload.file_name}`}
                    className="rounded-full"
                    disabled={deletingUploadId === upload.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(upload.id);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-black/42">
                <span className="inline-flex items-center gap-2">
                  {upload.source_type === "upload_pdf" ? (
                    <FileText className="size-3.5" />
                  ) : (
                    <FileSpreadsheet className="size-3.5" />
                  )}
                  {upload.source_type === "upload_pdf" ? "PDF" : "CSV"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-3.5" />
                  {formatTimestamp(upload.created_at)}
                </span>
                <span>{upload.transaction_count} transactions</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
