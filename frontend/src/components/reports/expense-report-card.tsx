import { CalendarRange, ReceiptText, Sparkles } from "lucide-react";

import { CurrencyDisplay } from "@/components/ui/currency-display";
import { cn } from "@/lib/utils";
import type { ExpenseReport } from "@/types";

function formatDateRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

type ExpenseReportCardProps = {
  isActive?: boolean;
  onSelect?: () => void;
  report: ExpenseReport;
};

export function ExpenseReportCard({
  isActive = false,
  onSelect,
  report,
}: ExpenseReportCardProps) {
  return (
    <button
      className={cn(
        "w-full rounded-[1.8rem] border p-5 text-left shadow-line transition",
        isActive
          ? "border-[#101922] bg-[#101922] text-white"
          : "border-black/10 bg-white/76 text-ink hover:border-black/20 hover:bg-white",
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className={cn("text-xs uppercase tracking-[0.3em]", isActive ? "text-white/46" : "text-black/42")}>
            {report.summary.provider || "Statement upload"}
          </p>
          <h3 className="text-xl font-semibold tracking-tight">
            {report.summary.upload_name || `Report #${report.id}`}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-[1.1rem] border",
            isActive ? "border-white/12 bg-white/10 text-white" : "border-black/10 bg-stone text-ink",
          )}
        >
          <ReceiptText className="size-5" />
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <span className={cn("inline-flex items-center gap-2", isActive ? "text-white/72" : "text-black/58")}>
          <CalendarRange className="size-4" />
          {formatDateRange(report.period_start, report.period_end)}
        </span>
        <span className={cn("inline-flex items-center gap-2", isActive ? "text-white/72" : "text-black/58")}>
          <Sparkles className="size-4" />
          {report.summary.recurring_transaction_count} recurring candidates
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className={cn("text-xs uppercase tracking-[0.28em]", isActive ? "text-white/46" : "text-black/42")}>
            Total spend
          </p>
          <CurrencyDisplay
            className="mt-2 block text-3xl font-semibold tracking-tight"
            currency={report.currency}
            value={Number(report.total_amount)}
          />
        </div>
        <div className={cn("text-right text-sm", isActive ? "text-white/72" : "text-black/58")}>
          <p>{report.summary.transaction_count} charges</p>
          <p>{report.summary.merchant_count} merchants</p>
        </div>
      </div>
    </button>
  );
}
