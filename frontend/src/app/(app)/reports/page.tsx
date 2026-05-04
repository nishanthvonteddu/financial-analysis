"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { ArrowRight, BarChart3, LoaderCircle } from "lucide-react";

import { ReportAnalytics } from "@/components/reports/report-analytics";
import { ExpenseReportCard } from "@/components/reports/expense-report-card";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenseAnalytics, useExpenseReport, useExpenseReports } from "@/hooks/use-expense-reports";
import type { AnalyticsRangeKey, ExpenseReport } from "@/types";

const EMPTY_REPORTS: ExpenseReport[] = [];

function ExpenseReportChartsLoading() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <section className="rounded-[1.6rem] border border-black/10 bg-white/88 p-5" key={index}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-[1rem]" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-44" />
            </div>
          </div>
          <Skeleton className="mt-5 h-64 w-full rounded-[1.2rem]" />
        </section>
      ))}
    </div>
  );
}

const ExpenseReportCharts = dynamic(
  () =>
    import("@/components/reports/expense-report-charts").then(
      (module) => module.ExpenseReportCharts,
    ),
  {
    loading: ExpenseReportChartsLoading,
    ssr: false,
  },
);

function formatGeneratedAt(value: string | null) {
  if (!value) {
    return "Generated recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function ReportsPage() {
  const reportsQuery = useExpenseReports();
  const [selectedRange, setSelectedRange] = useState<AnalyticsRangeKey>("180d");
  const deferredRange = useDeferredValue(selectedRange);
  const analyticsQuery = useExpenseAnalytics(deferredRange);
  const reports = reportsQuery.data?.items ?? EMPTY_REPORTS;
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  useEffect(() => {
    if (reports.length === 0) {
      setSelectedReportId(null);
      return;
    }

    if (selectedReportId === null || !reports.some((report) => report.id === selectedReportId)) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  const reportQuery = useExpenseReport(selectedReportId);
  const selectedReport =
    reportQuery.data ?? reports.find((report) => report.id === selectedReportId) ?? null;

  return (
    <div className="animate-page-enter space-y-6">
      <PageHeader
        action={
          <Button asChild variant="outline">
            <Link href="/uploads">
              Review uploads
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="Run category analytics across the active subscription graph, compare payment-method concentration and savings potential, then drop into statement-derived report detail when you need the raw source view."
        eyebrow="Spend analysis"
        title="Reports and analytics"
      />

      <ReportAnalytics
        analytics={analyticsQuery.data}
        isLoading={analyticsQuery.isLoading && !analyticsQuery.data}
        onRangeChange={(range) => {
          startTransition(() => {
            setSelectedRange(range);
          });
        }}
        selectedRange={selectedRange}
      />

      {!reportsQuery.isLoading && reports.length === 0 ? (
        <EmptyState
          action={
            <Button asChild variant="outline">
              <Link href="/uploads">Open uploads</Link>
            </Button>
          }
          description="Import CSV or PDF statements to populate the source report library beneath the analytics workspace."
          icon={<BarChart3 className="size-5" />}
          title="No uploaded report snapshots yet"
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <section className="space-y-4">
            {reportsQuery.isLoading ? (
              <div className="rounded-xl border border-black/10 bg-white p-5 shadow-line">
                <div className="flex items-center gap-3 text-sm text-black/58">
                  <LoaderCircle className="size-4 animate-spin" />
                  Loading expense reports...
                </div>
              </div>
            ) : (
              reports.map((report) => (
                <ExpenseReportCard
                  isActive={report.id === selectedReportId}
                  key={report.id}
                  onSelect={() => setSelectedReportId(report.id)}
                  report={report}
                />
              ))
            )}
          </section>

          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-line sm:p-6">
            {!selectedReport || reportQuery.isLoading ? (
              <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-black/58">
                <LoaderCircle className="size-4 animate-spin" />
                Loading report detail...
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 border-b border-black/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48">
                      {selectedReport.summary.provider || "Statement upload"}
                    </p>
                    <h2 className="text-2xl font-semibold text-ink">
                      {selectedReport.summary.upload_name || `Expense report #${selectedReport.id}`}
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-black/62">
                      Generated {formatGeneratedAt(selectedReport.generated_at)} with{" "}
                      {selectedReport.summary.transaction_count} charges across{" "}
                      {selectedReport.summary.merchant_count} merchants.
                    </p>
                  </div>

                  <div className="rounded-xl bg-ink px-5 py-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/48">Report total</p>
                    <CurrencyDisplay
                      className="mt-2 block text-2xl font-semibold"
                      currency={selectedReport.currency}
                      value={Number(selectedReport.total_amount)}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-black/10 bg-stone/65 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48">Average charge</p>
                    <CurrencyDisplay
                      className="mt-3 block text-2xl font-semibold text-ink"
                      currency={selectedReport.currency}
                      value={Number(selectedReport.summary.average_transaction)}
                    />
                  </div>
                  <div className="rounded-xl border border-black/10 bg-stone/65 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48">Largest charge</p>
                    <CurrencyDisplay
                      className="mt-3 block text-2xl font-semibold text-ink"
                      currency={selectedReport.currency}
                      value={Number(selectedReport.summary.largest_transaction)}
                    />
                  </div>
                  <div className="rounded-xl border border-black/10 bg-stone/65 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48">Recurring candidates</p>
                    <p className="mt-3 text-2xl font-semibold text-ink">
                      {selectedReport.summary.recurring_transaction_count}
                    </p>
                  </div>
                </div>

                <ExpenseReportCharts report={selectedReport} />

                <section className="rounded-[1.6rem] border border-black/10 bg-white/88 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-black/42">Top merchants</p>
                  <div className="mt-4 space-y-3">
                    {selectedReport.summary.top_merchants.map((merchant) => (
                      <div
                        className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-black/10 bg-white px-4 py-3"
                        key={merchant.merchant}
                      >
                        <div>
                          <p className="text-base font-semibold text-ink">{merchant.merchant}</p>
                          <p className="mt-1 text-sm text-black/58">
                            {merchant.transaction_count} charge{merchant.transaction_count === 1 ? "" : "s"}
                          </p>
                        </div>
                        <CurrencyDisplay
                          className="text-base font-semibold text-ink"
                          currency={selectedReport.currency}
                          value={Number(merchant.total_amount)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
