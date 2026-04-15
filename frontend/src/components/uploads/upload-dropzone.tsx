"use client";

import { useId, useMemo, useState } from "react";
import { FileUp, LoaderCircle, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const supportedMimeTypes = new Set(["text/csv", "application/csv", "application/pdf", "application/vnd.ms-excel"]);

function validateFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const matchesExtension = lowerName.endsWith(".csv") || lowerName.endsWith(".pdf");
  const matchesMimeType = !file.type || supportedMimeTypes.has(file.type);

  if (!matchesExtension || !matchesMimeType) {
    return "Only CSV and PDF uploads are supported.";
  }

  if (file.size === 0) {
    return "Uploaded file is empty.";
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return "Uploaded file exceeds the 10 MB limit.";
  }

  return null;
}

function formatSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

type UploadDropzoneProps = {
  disabled?: boolean;
  onUpload: (file: File, onProgress: (progress: number) => void) => Promise<void>;
  sectionId?: string;
};

export function UploadDropzone({ disabled = false, onUpload, sectionId }: UploadDropzoneProps) {
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const helperText = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }

    if (selectedFileName && selectedFileSize !== null) {
      return `${selectedFileName} ready to process • ${formatSize(selectedFileSize)}`;
    }

    return "Drop a statement export here or browse for a CSV/PDF file up to 10 MB.";
  }, [errorMessage, selectedFileName, selectedFileSize]);

  async function handleFile(file: File | null) {
    if (!file || disabled || isUploading) {
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadProgress(0);
      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      return;
    }

    setErrorMessage(null);
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setUploadProgress(0);
    setIsUploading(true);

    try {
      await onUpload(file, (progress) => {
        setUploadProgress(Math.max(8, progress));
      });
      setUploadProgress(100);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section
      className="overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(245,239,231,0.92))] shadow-line backdrop-blur"
      id={sectionId}
    >
      <div className="border-b border-black/10 px-5 py-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">Ingest</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h3 className="text-3xl font-semibold tracking-tight text-ink">Upload a bank export</h3>
            <p className="text-sm leading-6 text-black/62">
              Drag in a PDF or CSV statement, validate it before it leaves the browser, and hand
              the file straight into the parsing queue.
            </p>
          </div>

          <Button asChild className="rounded-full px-5" variant="outline">
            <label className={cn(disabled ? "cursor-not-allowed" : "cursor-pointer")} htmlFor={inputId}>
              Choose file
            </label>
          </Button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <input
          accept=".csv,.pdf,text/csv,application/pdf,application/vnd.ms-excel"
          aria-label="Upload statement"
          className="sr-only"
          disabled={disabled || isUploading}
          id={inputId}
          onChange={(event) => {
            void handleFile(event.target.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
          type="file"
        />

        <div
          className={cn(
            "relative overflow-hidden rounded-[1.9rem] border border-dashed px-5 py-7 transition sm:px-7 sm:py-10",
            dragActive
              ? "border-ember bg-[#fff5ed] shadow-[inset_0_0_0_1px_rgba(220,93,48,0.15)]"
              : "border-black/12 bg-white/78",
            disabled ? "opacity-60" : "",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) {
              setDragActive(true);
            }
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
              return;
            }
            setDragActive(false);
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            void handleFile(event.dataTransfer.files[0] ?? null);
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex size-14 items-center justify-center rounded-[1.35rem] border border-black/10 bg-stone text-ink">
                {isUploading ? (
                  <LoaderCircle className="size-6 animate-spin" />
                ) : (
                  <FileUp className="size-6" />
                )}
              </div>
              <p className="mt-4 text-xl font-semibold text-ink">Drop a statement or browse locally</p>
              <p className="mt-2 text-sm leading-6 text-black/62">
                CSV exports move fastest. PDFs work too and stay visible in the queue while parsing
                and detection finish in the background.
              </p>
            </div>

            <div className="min-w-0 max-w-sm space-y-3 rounded-[1.5rem] border border-black/10 bg-[#101922] p-5 text-white shadow-[0_24px_70px_rgba(16,25,34,0.18)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Validation</p>
              <p
                className={cn(
                  "text-sm leading-6",
                  errorMessage ? "text-[#ffd0c7]" : "text-white/76",
                )}
                role={errorMessage ? "alert" : undefined}
              >
                {helperText}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-white/48">
                  <span>{isUploading ? "Upload progress" : "Ready state"}</span>
                  <span>{isUploading ? `${uploadProgress}%` : errorMessage ? "Check file" : "Waiting"}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "h-full rounded-full transition-[width] duration-300",
                      errorMessage ? "bg-[#ff7f66]" : "bg-[#f4caad]",
                    )}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1.15rem] border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/58">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#f4caad]" />
                <p>Accepted formats: CSV and PDF. Larger files or mismatched extensions are rejected before upload.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
