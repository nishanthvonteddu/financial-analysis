"use client";

import { CheckCircle2, CircleDashed, LoaderCircle, TriangleAlert } from "lucide-react";

import { ServiceLogo } from "@/components/uploads/service-logo";
import { cn } from "@/lib/utils";
import type { Upload } from "@/types";

const stepLabels = ["Queued", "Parsing", "Detecting", "Done"] as const;
type VisualStep = (typeof stepLabels)[number] | "Failed";

function formatProvider(provider: string) {
  if (provider === "pending") {
    return "Awaiting source";
  }

  return provider
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Waiting for completion";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type UploadProcessingPanelProps = {
  upload: Upload | null;
  visualStep: VisualStep;
};

export function UploadProcessingPanel({ upload, visualStep }: UploadProcessingPanelProps) {
  if (!upload) {
    return (
      <section className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">Processing</p>
        <div className="mt-4 max-w-xl space-y-3">
          <h3 className="text-2xl font-semibold text-ink">No upload selected</h3>
          <p className="text-sm leading-6 text-black/62">
            Start with a CSV or PDF export to light up the queue, then select any history row to
            inspect the live status rail here.
          </p>
        </div>
      </section>
    );
  }

  const activeIndex = visualStep === "Failed" ? 2 : stepLabels.indexOf(visualStep);

  return (
    <section className="rounded-[2rem] border border-black/10 bg-[#101922] p-6 text-white shadow-[0_24px_80px_rgba(16,25,34,0.22)] sm:p-7">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <ServiceLogo provider={upload.provider} size="lg" />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Selected file</p>
            <h3 className="text-2xl font-semibold">{upload.file_name}</h3>
            <p className="text-sm text-white/62">{formatProvider(upload.provider)}</p>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/72 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Transactions</p>
            <p className="mt-2 text-lg font-semibold text-white">{upload.transaction_count}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Last update</p>
            <p className="mt-2 text-sm leading-6 text-white/72">{formatTimestamp(upload.updated_at)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">Pipeline</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {stepLabels.map((label, index) => {
              const isDone = visualStep !== "Failed" && index < activeIndex;
              const isCurrent = visualStep !== "Failed" && index === activeIndex;
              const isPending = visualStep !== "Failed" && index > activeIndex;

              return (
                <div
                  className={cn(
                    "rounded-[1.5rem] border px-4 py-4 transition",
                    isDone
                      ? "border-emerald-400/30 bg-emerald-400/10"
                      : isCurrent
                        ? "border-amber-300/25 bg-white/8"
                        : "border-white/10 bg-white/4",
                  )}
                  key={label}
                >
                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="size-5 text-emerald-300" />
                    ) : isCurrent ? (
                      <LoaderCircle className="size-5 animate-spin text-amber-200" />
                    ) : (
                      <CircleDashed className="size-5 text-white/28" />
                    )}
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {label === "Queued" && "File accepted and waiting to start."}
                    {label === "Parsing" && "Statement rows are being extracted and normalized."}
                    {label === "Detecting" && "Recurring services are being matched from the upload."}
                    {label === "Done" && "Upload is ready for downstream review."}
                  </p>
                  {isPending ? (
                    <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-white/34">Pending</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-[1.7rem] border border-white/10 bg-white/6 p-5">
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">Queue notes</p>
          <div className="space-y-3 text-sm leading-6 text-white/72">
            <p>
              Current backend status: <span className="font-semibold capitalize text-white">{upload.status}</span>
            </p>
            <p>
              Last sync: <span className="text-white">{formatTimestamp(upload.last_synced_at)}</span>
            </p>
            {upload.error_message ? (
              <div className="flex gap-3 rounded-[1.25rem] border border-rose-300/20 bg-rose-400/10 p-4 text-rose-100">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <p>{upload.error_message}</p>
              </div>
            ) : (
              <p>
                The step rail above is driven by the live status poll and keeps advancing while the
                selected file remains queued or processing.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
