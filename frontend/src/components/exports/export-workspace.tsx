"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileJson,
  LoaderCircle,
  Table2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useExportDownload } from "@/hooks/use-export";
import { cn } from "@/lib/utils";
import type { ExportFormat, ExportOptions } from "@/types";

type FormatOption = {
  description: string;
  format: ExportFormat;
  icon: typeof Table2;
  label: string;
};

const formatOptions: FormatOption[] = [
  {
    description: "Subscription rows for spreadsheets",
    format: "csv",
    icon: Table2,
    label: "CSV",
  },
  {
    description: "Structured workspace archive",
    format: "json",
    icon: FileJson,
    label: "JSON",
  },
  {
    description: "Renewal events for calendars",
    format: "ics",
    icon: CalendarDays,
    label: "iCal",
  },
];

function triggerBrowserDownload(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export function ExportWorkspace() {
  const exportDownload = useExportDownload();
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [activeOnly, setActiveOnly] = useState(false);
  const [includePaymentHistory, setIncludePaymentHistory] = useState(true);
  const [calendarMonths, setCalendarMonths] = useState(12);
  const [latestFilename, setLatestFilename] = useState<string | null>(null);

  const options = useMemo<ExportOptions>(
    () => ({
      active_only: activeOnly,
      calendar_months: calendarMonths,
      format,
      include_payment_history: includePaymentHistory,
    }),
    [activeOnly, calendarMonths, format, includePaymentHistory],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const download = await exportDownload.mutateAsync(options);
    triggerBrowserDownload(download.blob, download.filename);
    setLatestFilename(download.filename);
  };

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        description="Package subscription records, renewal dates, and payment history into portable files for finance reviews, spreadsheets, and external calendars."
        eyebrow="Data export"
        title="Export center"
      />

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]" onSubmit={handleSubmit}>
        <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/42">Format</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {formatOptions.map(({ description, format: optionFormat, icon: Icon, label }) => {
                const isSelected = format === optionFormat;

                return (
                  <button
                    aria-pressed={isSelected}
                    className={cn(
                      "min-h-36 rounded-[1.4rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/30",
                      isSelected
                        ? "border-ink bg-[#101922] text-white shadow-line"
                        : "border-black/10 bg-white text-ink hover:border-black/18 hover:bg-stone/55",
                    )}
                    key={optionFormat}
                    onClick={() => setFormat(optionFormat)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "inline-flex size-11 items-center justify-center rounded-[1rem] border",
                        isSelected
                          ? "border-white/18 bg-white/10 text-white"
                          : "border-black/10 bg-stone text-ink",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="mt-5 block text-xl font-semibold">{label}</span>
                    <span
                      className={cn(
                        "mt-2 block text-sm leading-6",
                        isSelected ? "text-white/68" : "text-black/58",
                      )}
                    >
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <label className="flex min-h-28 items-start gap-4 rounded-[1.4rem] border border-black/10 bg-stone/65 p-4">
              <input
                checked={activeOnly}
                className="mt-1 size-5 rounded border-black/20 text-ember focus:ring-ember/30"
                onChange={(event) => setActiveOnly(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block text-base font-semibold text-ink">Active subscriptions</span>
                <span className="mt-1 block text-sm leading-6 text-black/58">
                  Excludes paused and cancelled plans.
                </span>
              </span>
            </label>

            <label className="flex min-h-28 items-start gap-4 rounded-[1.4rem] border border-black/10 bg-stone/65 p-4">
              <input
                checked={includePaymentHistory}
                className="mt-1 size-5 rounded border-black/20 text-ember focus:ring-ember/30"
                onChange={(event) => setIncludePaymentHistory(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block text-base font-semibold text-ink">Payment history</span>
                <span className="mt-1 block text-sm leading-6 text-black/58">
                  Includes settled payment rows in CSV and JSON exports.
                </span>
              </span>
            </label>
          </div>

          <label className="mt-5 block rounded-[1.4rem] border border-black/10 bg-white/88 p-4">
            <span className="text-sm font-semibold text-ink">Calendar horizon</span>
            <select
              className="mt-3 h-11 w-full rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-ink focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-ember/20"
              onChange={(event) => setCalendarMonths(Number(event.target.value))}
              value={calendarMonths}
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
          </label>
        </section>

        <aside className="rounded-[2rem] border border-black/10 bg-[#101922] p-6 text-white shadow-line">
          <p className="text-xs uppercase tracking-[0.32em] text-white/42">Download</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <p className="text-sm text-white/52">Selected format</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {format.toUpperCase()}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <p className="text-sm text-white/52">Scope</p>
              <p className="mt-2 text-base font-semibold">
                {activeOnly ? "Active plans" : "All plans"}
              </p>
              <p className="mt-1 text-sm text-white/56">
                {includePaymentHistory ? "Payment history included" : "Subscription fields only"}
              </p>
            </div>
          </div>

          <Button
            className="mt-6 w-full rounded-full bg-white text-ink hover:bg-white/90"
            disabled={exportDownload.isPending}
            size="lg"
            type="submit"
          >
            {exportDownload.isPending ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            Download export
          </Button>

          {latestFilename ? (
            <div className="mt-5 flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72">
              <CheckCircle2 className="size-4 text-[#7fd1a6]" />
              <span className="min-w-0 truncate">{latestFilename}</span>
            </div>
          ) : null}
        </aside>
      </form>
    </div>
  );
}
