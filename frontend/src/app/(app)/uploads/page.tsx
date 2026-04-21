"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ArrowRight, FolderSearch } from "lucide-react";

import { UploadDropzone } from "@/components/uploads/upload-dropzone";
import { UploadHistoryList } from "@/components/uploads/upload-history-list";
import { UploadProcessingPanel } from "@/components/uploads/upload-processing-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  mergeSelectedUpload,
  useCreateUpload,
  useDeleteUpload,
  useUploadHistory,
  useUploadStatus,
} from "@/hooks/use-uploads";

function getVisualStep(
  status: "completed" | "failed" | "processing" | "queued",
  processingPhase: number,
) {
  if (status === "completed") {
    return "Done" as const;
  }

  if (status === "failed") {
    return "Failed" as const;
  }

  if (status === "queued") {
    return "Queued" as const;
  }

  return processingPhase > 0 ? ("Detecting" as const) : ("Parsing" as const);
}

export default function UploadsPage() {
  const uploadsQuery = useUploadHistory();
  const createUpload = useCreateUpload();
  const deleteUpload = useDeleteUpload();

  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const [processingPhase, setProcessingPhase] = useState(0);

  const uploads = useMemo(() => uploadsQuery.data?.items ?? [], [uploadsQuery.data?.items]);
  const selectedUploadStatusQuery = useUploadStatus(selectedUploadId);
  const selectedUpload = mergeSelectedUpload(
    selectedUploadId,
    uploads,
    selectedUploadStatusQuery.data,
  );
  const selectedUploadKey = selectedUpload?.id ?? null;
  const selectedUploadStatus = selectedUpload?.status ?? null;

  useEffect(() => {
    if (uploads.length === 0) {
      setSelectedUploadId(null);
      return;
    }

    if (selectedUploadId === null) {
      startTransition(() => {
        setSelectedUploadId(uploads[0]?.id ?? null);
      });
    }
  }, [selectedUploadId, uploads]);

  useEffect(() => {
    setProcessingPhase(0);

    if (selectedUploadStatus !== "processing") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setProcessingPhase(1);
    }, 1_400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedUploadKey, selectedUploadStatus]);

  const visualStep = getVisualStep(selectedUpload?.status ?? "queued", processingPhase);
  const activeUploads = useMemo(
    () => uploads.filter((upload) => upload.status === "queued" || upload.status === "processing").length,
    [uploads],
  );
  const completedUploads = useMemo(
    () => uploads.filter((upload) => upload.status === "completed").length,
    [uploads],
  );

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          completedUploads > 0 ? (
            <Button asChild className="rounded-full px-5" variant="outline">
              <Link href="/subscriptions">
                Review detected subscriptions
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          ) : undefined
        }
        description="Pull statement files into the pipeline, keep the queue visible, and watch ingestion finish without leaving the authenticated workspace."
        eyebrow="Upload queue"
        title="Uploads and processing status"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.7rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Total files</p>
          {uploadsQuery.isLoading ? (
            <Skeleton className="mt-4 h-11 w-20" />
          ) : (
            <p className="mt-4 text-4xl font-semibold tracking-tight text-ink">{uploads.length}</p>
          )}
          <p className="mt-2 text-sm leading-6 text-black/60">
            Every statement stays in history with deletion controls and provider detection visible.
          </p>
        </div>
        <div className="rounded-[1.7rem] border border-black/10 bg-[#101922] p-5 text-white shadow-[0_24px_80px_rgba(16,25,34,0.16)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Active queue</p>
          {uploadsQuery.isLoading ? (
            <Skeleton className="mt-4 h-11 w-20 bg-white/12" />
          ) : (
            <p className="mt-4 text-4xl font-semibold tracking-tight">{activeUploads}</p>
          )}
          <p className="mt-2 text-sm leading-6 text-white/62">
            Polling stays live while anything is queued or processing so the status rail keeps moving.
          </p>
        </div>
        <div className="rounded-[1.7rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Completed ingests</p>
          {uploadsQuery.isLoading ? (
            <Skeleton className="mt-4 h-11 w-24" />
          ) : (
            <p className="mt-4 text-4xl font-semibold tracking-tight text-ink">{completedUploads}</p>
          )}
          <p className="mt-2 text-sm leading-6 text-black/60">
            Finished uploads are ready for downstream subscription review and cleanup.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
        <div className="space-y-6">
          <UploadDropzone
            onUpload={async (file, onProgress) => {
              const created = await createUpload.mutateAsync({ file, onProgress });
              startTransition(() => {
                setSelectedUploadId(created.id);
              });
            }}
            sectionId="upload-dropzone"
          />
          <UploadProcessingPanel upload={selectedUpload} visualStep={visualStep} />
        </div>

        {uploadsQuery.isLoading ? (
          <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/76 shadow-line backdrop-blur">
            <div className="border-b border-black/10 px-5 py-5 sm:px-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-4 h-8 w-44" />
              <Skeleton className="mt-3 h-4 w-10/12" />
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="rounded-[1.4rem] border border-black/8 bg-white/88 p-4" key={index}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <Skeleton className="size-11 rounded-[1rem]" />
                      <div className="min-w-0 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : uploads.length === 0 ? (
          <EmptyState
            action={
              <Button asChild className="rounded-full px-5" variant="outline">
                <a href="#upload-dropzone">Queue your first file</a>
              </Button>
            }
            description="The history rail will populate after the first CSV or PDF upload and stay searchable from this workspace."
            eyebrow="No uploads yet"
            icon={<FolderSearch className="size-5" />}
            title="Nothing in the queue yet."
          />
        ) : (
          <UploadHistoryList
            deletingUploadId={deleteUpload.isPending ? deleteUpload.variables ?? null : null}
            onDelete={(uploadId) => {
              void deleteUpload.mutateAsync(uploadId).then(() => {
                if (selectedUploadId === uploadId) {
                  startTransition(() => {
                    setSelectedUploadId(null);
                  });
                }
              });
            }}
            onSelect={(uploadId) => {
              startTransition(() => {
                setSelectedUploadId(uploadId);
              });
            }}
            selectedUploadId={selectedUpload?.id ?? null}
            uploads={uploads}
          />
        )}
      </div>
    </div>
  );
}
