"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ArrowRight, FolderSearch, LoaderCircle } from "lucide-react";

import { UploadDropzone } from "@/components/uploads/upload-dropzone";
import { UploadHistoryList } from "@/components/uploads/upload-history-list";
import { UploadProcessingPanel } from "@/components/uploads/upload-processing-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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
        eyebrow="Day 9 live surface"
        title="Uploads and processing status"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.7rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Total files</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-ink">{uploads.length}</p>
          <p className="mt-2 text-sm leading-6 text-black/60">
            Every statement stays in history with deletion controls and provider detection visible.
          </p>
        </div>
        <div className="rounded-[1.7rem] border border-black/10 bg-[#101922] p-5 text-white shadow-[0_24px_80px_rgba(16,25,34,0.16)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Active queue</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight">{activeUploads}</p>
          <p className="mt-2 text-sm leading-6 text-white/62">
            Polling stays live while anything is queued or processing so the status rail keeps moving.
          </p>
        </div>
        <div className="rounded-[1.7rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Completed ingests</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-ink">{completedUploads}</p>
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
          />
          <UploadProcessingPanel upload={selectedUpload} visualStep={visualStep} />
        </div>

        {uploadsQuery.isLoading ? (
          <div className="flex min-h-[24rem] items-center justify-center rounded-[2rem] border border-black/10 bg-white/76 shadow-line backdrop-blur">
            <div className="flex items-center gap-3 text-sm text-black/58">
              <LoaderCircle className="size-4 animate-spin" />
              Loading upload history...
            </div>
          </div>
        ) : uploads.length === 0 ? (
          <EmptyState
            action={
              <Button className="rounded-full px-5" variant="outline">
                Queue your first file
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
