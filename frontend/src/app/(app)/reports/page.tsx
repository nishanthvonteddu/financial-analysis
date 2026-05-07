"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
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

type BankAnalysis = {
  averageStatementSpend: number;
  categories: Array<{ label: string; total: number; transactionCount: number }>;
  currency: string;
  merchants: Array<{ label: string; total: number; transactionCount: number }>;
  provider: string;
  recurringCandidates: number;
  reports: ExpenseReport[];
  statementCount: number;
  totalSpend: number;
  transactions: number;
};

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

function buildAllStatementSummary(reports: ExpenseReport[]) {
  const totalSpend = reports.reduce((sum, report) => sum + Number(report.total_amount), 0);
  const totalTransactions = reports.reduce(
    (sum, report) => sum + report.summary.transaction_count,
    0,
  );
  const totalRecurringCandidates = reports.reduce(
    (sum, report) => sum + report.summary.recurring_transaction_count,
    0,
  );
  const merchantNames = new Set<string>();
  reports.forEach((report) => {
    report.summary.top_merchants.forEach((merchant) => {
      merchantNames.add(merchant.merchant);
    });
  });

  return {
    currency: reports[0]?.currency ?? "USD",
    statementCount: reports.length,
    totalRecurringCandidates,
    totalSpend,
    totalTransactions,
    uniqueMerchants: merchantNames.size,
  };
}

function formatProviderName(provider: string | null | undefined) {
  if (!provider || provider === "pending") {
    return "Unknown bank";
  }

  return provider
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function addBreakdownValue(
  map: Map<string, { label: string; total: number; transactionCount: number }>,
  label: string,
  total: string,
  transactionCount: number,
) {
  const current = map.get(label) ?? { label, total: 0, transactionCount: 0 };
  current.total += Number(total);
  current.transactionCount += transactionCount;
  map.set(label, current);
}

function buildBankAnalysis(reports: ExpenseReport[]): BankAnalysis[] {
  const grouped = new Map<string, ExpenseReport[]>();
  reports.forEach((report) => {
    const provider = report.summary.provider ?? "unknown";
    grouped.set(provider, [...(grouped.get(provider) ?? []), report]);
  });

  return [...grouped.entries()]
    .map(([provider, providerReports]) => {
      const categoryMap = new Map<string, { label: string; total: number; transactionCount: number }>();
      const merchantMap = new Map<string, { label: string; total: number; transactionCount: number }>();
      let totalSpend = 0;
      let transactions = 0;
      let recurringCandidates = 0;

      providerReports.forEach((report) => {
        totalSpend += Number(report.total_amount);
        transactions += report.summary.transaction_count;
        recurringCandidates += report.summary.recurring_transaction_count;
        report.summary.category_breakdown.forEach((category) => {
          addBreakdownValue(
            categoryMap,
            category.category_name,
            category.total_amount,
            category.transaction_count,
          );
        });
        report.summary.top_merchants.forEach((merchant) => {
          addBreakdownValue(
            merchantMap,
            merchant.merchant,
            merchant.total_amount,
            merchant.transaction_count,
          );
        });
      });

      const sortBySpend = (
        left: { label: string; total: number },
        right: { label: string; total: number },
      ) => right.total - left.total || left.label.localeCompare(right.label);

      return {
        averageStatementSpend:
          providerReports.length > 0 ? totalSpend / providerReports.length : 0,
        categories: [...categoryMap.values()].sort(sortBySpend).slice(0, 4),
        currency: providerReports[0]?.currency ?? "USD",
        merchants: [...merchantMap.values()].sort(sortBySpend).slice(0, 4),
        provider,
        recurringCandidates,
        reports: providerReports,
        statementCount: providerReports.length,
        totalSpend,
        transactions,
      };
    })
    .sort((left, right) => right.totalSpend - left.totalSpend);
}

function buildCombinedAnalysis(reports: ExpenseReport[]): BankAnalysis | null {
  if (reports.length === 0) {
    return null;
  }
  const bankAnalysis = buildBankAnalysis(reports);
  const categoryMap = new Map<string, { label: string; total: number; transactionCount: number }>();
  const merchantMap = new Map<string, { label: string; total: number; transactionCount: number }>();

  bankAnalysis.forEach((bank) => {
    bank.categories.forEach((category) => {
      addBreakdownValue(categoryMap, category.label, String(category.total), category.transactionCount);
    });
    bank.merchants.forEach((merchant) => {
      addBreakdownValue(merchantMap, merchant.label, String(merchant.total), merchant.transactionCount);
    });
  });

  const totalSpend = bankAnalysis.reduce((sum, bank) => sum + bank.totalSpend, 0);
  const sortBySpend = (
    left: { label: string; total: number },
    right: { label: string; total: number },
  ) => right.total - left.total || left.label.localeCompare(right.label);

  return {
    averageStatementSpend: totalSpend / reports.length,
    categories: [...categoryMap.values()].sort(sortBySpend).slice(0, 4),
    currency: reports[0]?.currency ?? "USD",
    merchants: [...merchantMap.values()].sort(sortBySpend).slice(0, 4),
    provider: "combined",
    recurringCandidates: bankAnalysis.reduce((sum, bank) => sum + bank.recurringCandidates, 0),
    reports,
    statementCount: reports.length,
    totalSpend,
    transactions: bankAnalysis.reduce((sum, bank) => sum + bank.transactions, 0),
  };
}

function MiniBreakdown({
  items,
}: {
  items: Array<{ label: string; total: number; transactionCount: number }>;
}) {
  const maxTotal = Math.max(...items.map((item) => item.total), 0);

  if (items.length === 0) {
    return <p className="text-sm text-black/55">No breakdown available.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink">{item.label}</span>
            <span className="text-black/55">{item.transactionCount}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/8">
            <div
              className="h-full rounded-full bg-[#101922]"
              style={{ width: `${maxTotal > 0 ? Math.max(5, (item.total / maxTotal) * 100) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BankAnalysisCard({ analysis }: { analysis: BankAnalysis }) {
  const isCombined = analysis.provider === "combined";

  return (
    <section
      className={
        isCombined
          ? "rounded-xl border border-black/10 bg-[#101922] p-5 text-white shadow-line"
          : "rounded-xl border border-black/10 bg-white p-5 shadow-line"
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={isCombined ? "text-xs uppercase tracking-[0.14em] text-white/48" : "text-xs uppercase tracking-[0.14em] text-black/48"}>
            {isCombined ? "Combined analysis" : "Bank analysis"}
          </p>
          <h3 className={isCombined ? "mt-2 text-2xl font-semibold text-white" : "mt-2 text-2xl font-semibold text-ink"}>
            {isCombined ? "All banks together" : formatProviderName(analysis.provider)}
          </h3>
        </div>
        <CurrencyDisplay
          className={isCombined ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-ink"}
          currency={analysis.currency}
          value={analysis.totalSpend}
        />
      </div>

      <div className={isCombined ? "mt-5 grid gap-3 sm:grid-cols-4 text-white" : "mt-5 grid gap-3 sm:grid-cols-4"}>
        {[
          ["Statements", analysis.statementCount],
          ["Transactions", analysis.transactions],
          ["Avg / statement", analysis.averageStatementSpend],
          ["Recurring candidates", analysis.recurringCandidates],
        ].map(([label, value]) => (
          <div
            className={isCombined ? "rounded-lg bg-white/10 p-3" : "rounded-lg bg-stone/60 p-3"}
            key={label}
          >
            <p className={isCombined ? "text-xs uppercase tracking-[0.12em] text-white/42" : "text-xs uppercase tracking-[0.12em] text-black/42"}>
              {label}
            </p>
            {typeof value === "number" && label === "Avg / statement" ? (
              <CurrencyDisplay
                className={isCombined ? "mt-2 block text-lg font-semibold text-white" : "mt-2 block text-lg font-semibold text-ink"}
                currency={analysis.currency}
                value={value}
              />
            ) : (
              <p className={isCombined ? "mt-2 text-lg font-semibold text-white" : "mt-2 text-lg font-semibold text-ink"}>
                {value}
              </p>
            )}
          </div>
        ))}
      </div>

      {!isCombined ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/45">
              Top categories
            </p>
            <MiniBreakdown items={analysis.categories} />
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/45">
              Top merchants
            </p>
            <MiniBreakdown items={analysis.merchants} />
          </div>
        </div>
      ) : null}
    </section>
  );
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
  const allStatementSummary = useMemo(() => buildAllStatementSummary(reports), [reports]);
  const bankAnalysis = useMemo(() => buildBankAnalysis(reports), [reports]);
  const combinedAnalysis = useMemo(() => buildCombinedAnalysis(reports), [reports]);

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
        description="All uploaded statements, monthly trends, merchants, categories, and recurring candidates in one analysis view."
        eyebrow="Spend analysis"
        title="Financial analysis"
      />

      {reports.length > 0 ? (
        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-line sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48">
                All statements together
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                {allStatementSummary.statementCount} uploaded statement
                {allStatementSummary.statementCount === 1 ? "" : "s"}
              </h2>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">
                Open dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-[#101922] p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/46">
                Total spend
              </p>
              <CurrencyDisplay
                className="mt-2 block text-3xl font-semibold"
                currency={allStatementSummary.currency}
                value={allStatementSummary.totalSpend}
              />
            </div>
            <div className="rounded-lg border border-black/10 bg-stone/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Transactions
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {allStatementSummary.totalTransactions}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-stone/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Merchants
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {allStatementSummary.uniqueMerchants}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-stone/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Recurring candidates
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {allStatementSummary.totalRecurringCandidates}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {combinedAnalysis ? (
        <div className="grid gap-4">
          <BankAnalysisCard analysis={combinedAnalysis} />
          <div className="grid gap-4 xl:grid-cols-2">
            {bankAnalysis.map((analysis) => (
              <BankAnalysisCard analysis={analysis} key={analysis.provider} />
            ))}
          </div>
        </div>
      ) : null}

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
        <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
          <section className="space-y-3">
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
