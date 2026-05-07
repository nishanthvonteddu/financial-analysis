"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  FileUp,
  Gauge,
  Layers3,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { CurrencyDisplay, formatCurrency } from "@/components/ui/currency-display";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DashboardActiveSubscriptionItem,
  DashboardCategoryBreakdownItem,
  DashboardMonthlySpendPoint,
  DashboardSummary,
  DashboardUpcomingRenewalItem,
} from "@/types";

type FinancialCommandCenterProps = {
  isLoading?: boolean;
  summary?: DashboardSummary;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: { currency?: string; label?: string; total?: number } }>;
  label?: string;
};

const CATEGORY_COLORS = ["#101922", "#d85f35", "#8b9db2", "#c6a571", "#5c7566"];

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00Z`));
}

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-black/10 bg-white px-3 py-2 shadow-line">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">
        {formatCurrency({
          currency: point?.currency ?? "USD",
          value: point?.total ?? 0,
        })}
      </p>
    </div>
  );
}

function getStatementTotals(points: ReturnType<typeof buildMonthlyData>) {
  const nonZeroPoints = points.filter((point) => point.total > 0);
  const total = nonZeroPoints.reduce((sum, point) => sum + point.total, 0);
  return {
    activeMonths: nonZeroPoints.length,
    average: nonZeroPoints.length > 0 ? total / nonZeroPoints.length : 0,
    total,
  };
}

function buildMonthlyData(points: DashboardMonthlySpendPoint[]) {
  return points.map((point, index, allPoints) => {
    const total = toNumber(point.total);
    const previous = index > 0 ? toNumber(allPoints[index - 1]?.total) : 0;

    return {
      currency: point.currency,
      label: point.label,
      month: point.month,
      total,
      variance: total - previous,
    };
  });
}

function getMonthlyNarrative(points: ReturnType<typeof buildMonthlyData>, currency: string) {
  const latest = points.at(-1);
  const previous = points.at(-2);

  if (!latest || latest.total <= 0) {
    return "Upload statement history to populate the monthly spend comparison.";
  }

  if (!previous || previous.total <= 0) {
    return `${latest.label} is the first month with parsed spend in this view.`;
  }

  const delta = latest.total - previous.total;
  const direction = delta >= 0 ? "up" : "down";
  return `${latest.label} is ${direction} ${formatCurrency({
    compact: true,
    currency,
    maximumFractionDigits: 0,
    value: Math.abs(delta),
  })} from ${previous.label}.`;
}

function categoryPercentages(categories: DashboardCategoryBreakdownItem[]) {
  const total = categories.reduce(
    (sum, category) => sum + toNumber(category.total_monthly_spend),
    0,
  );

  return categories.slice(0, 4).map((category) => ({
    ...category,
    percent: total > 0 ? (toNumber(category.total_monthly_spend) / total) * 100 : 0,
  }));
}

function CategoryMixChart({
  categories,
  currency,
}: {
  categories: ReturnType<typeof categoryPercentages>;
  currency: string;
}) {
  if (categories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-black/10 bg-stone/45 p-4 text-sm leading-6 text-black/58">
        Categories appear after recurring charges are classified.
      </p>
    );
  }

  const chartData = categories.map((category) => ({
    currency,
    label: category.category_name,
    total: toNumber(category.total_monthly_spend),
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
      <div className="h-32">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="total"
              innerRadius={36}
              outerRadius={58}
              paddingAngle={3}
            >
              {chartData.map((item, index) => (
                <Cell fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} key={item.label} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {categories.map((category, index) => (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3" key={`${category.category_id}-${category.category_name}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                />
                <p className="truncate text-sm font-medium text-ink">{category.category_name}</p>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/8">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                    width: `${Math.max(5, category.percent)}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-ink">
              {formatCurrency({
                compact: true,
                currency: category.currency,
                maximumFractionDigits: 0,
                value: toNumber(category.total_monthly_spend),
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-line">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-full min-h-80 rounded-xl" />
      </div>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-6 shadow-line">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48">
            Financial dashboard
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">No analysis data yet</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/62">
            Upload a bank statement to populate monthly spend, category concentration, merchant
            patterns, reports, and recurring-charge signals.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/uploads">
              Upload statement
              <FileUp className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/subscriptions">
              Add recurring bill
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SubscriptionTable({ items }: { items: DashboardActiveSubscriptionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 bg-stone/45 p-5 text-sm leading-6 text-black/58">
        Recurring charges will appear here after imports or manual entries identify repeating
        expenses.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/10">
      <div className="grid grid-cols-[minmax(0,1fr)_110px_88px] gap-3 border-b border-black/10 bg-stone/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
        <span>Plan</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Renewal</span>
      </div>
      <div className="divide-y divide-black/10">
        {items.slice(0, 5).map((item) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_110px_88px] gap-3 px-4 py-3"
            key={item.subscription_id}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
              <p className="mt-0.5 truncate text-xs text-black/55">
                {item.vendor} · {item.category_name} · {item.cadence}
              </p>
            </div>
            <CurrencyDisplay
              className="text-right text-sm font-semibold text-ink"
              currency={item.currency}
              value={toNumber(item.amount)}
            />
            <p className="text-right text-sm text-black/58">{formatDate(item.next_charge_date)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RenewalList({ items }: { items: DashboardUpcomingRenewalItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 bg-stone/45 p-4 text-sm leading-6 text-black/58">
        No renewals are due in the next 30 days.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 4).map((item) => (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-stone/55 px-3 py-3" key={item.subscription_id}>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
            <p className="mt-0.5 text-xs text-black/55">
              {formatDate(item.next_charge_date)} · {item.days_until_charge} days
            </p>
          </div>
          <CurrencyDisplay
            className="shrink-0 text-sm font-semibold text-ink"
            currency={item.currency}
            value={toNumber(item.amount)}
          />
        </div>
      ))}
    </div>
  );
}

export function FinancialCommandCenter({ isLoading = false, summary }: FinancialCommandCenterProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!summary) {
    return <EmptyDashboard />;
  }

  const currency = summary.summary.currency;
  const monthlyData = buildMonthlyData(summary.monthly_spend);
  const hasMonthlySpend = monthlyData.some((point) => point.total > 0);
  const latestMonth = monthlyData.at(-1);
  const previousMonth = monthlyData.at(-2);
  const monthlyVariance = (latestMonth?.total ?? 0) - (previousMonth?.total ?? 0);
  const categories = categoryPercentages(summary.category_breakdown);
  const score = summary.score_overview;
  const statementTotals = getStatementTotals(monthlyData);

  return (
    <section className="rounded-xl border border-black/10 bg-white shadow-line">
      <div className="min-w-0 p-4 sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 border-b border-black/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48">
                Financial analysis
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">All statements and recurring spend</h2>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/reports">
                  Reports
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/uploads">
                  Upload
                  <FileUp className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-black/10 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-[#101922] p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/46">
                Total statement spend
              </p>
              <CurrencyDisplay
                className="mt-2 block text-3xl font-semibold"
                currency={currency}
                value={statementTotals.total}
              />
              <p className="mt-1 text-xs text-white/58">
                {statementTotals.activeMonths} month{statementTotals.activeMonths === 1 ? "" : "s"} with parsed spend
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-stone/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Monthly average
              </p>
              <CurrencyDisplay
                className="mt-2 block text-3xl font-semibold text-ink"
                currency={currency}
                value={statementTotals.average}
              />
              <p className="mt-1 text-xs text-black/56">
                {getMonthlyNarrative(monthlyData, currency)}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-stone/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Recurring run rate
              </p>
              <CurrencyDisplay
                className="mt-2 block text-3xl font-semibold text-ink"
                currency={currency}
                value={toNumber(summary.summary.total_monthly_spend)}
              />
              <p className="mt-1 text-xs text-black/56">
                {summary.summary.active_subscriptions} active recurring charge
                {summary.summary.active_subscriptions === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-stone/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Risk score
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">{score?.score ?? 0}</p>
              <p className="mt-1 text-xs text-black/56">
                {score ? `${score.grade} grade · ${score.recommendation_count} actions` : "No score yet"}
              </p>
            </div>
          </div>

          <div className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ink">Monthly statement spend</h3>
                </div>
                <div className="rounded-lg bg-stone/70 px-3 py-2 text-sm text-black/62">
                  {monthlyVariance >= 0 ? "Up" : "Down"}{" "}
                  {formatCurrency({
                    compact: true,
                    currency,
                    maximumFractionDigits: 0,
                    value: Math.abs(monthlyVariance),
                  })}{" "}
                  vs previous month
                </div>
              </div>
              <div className="h-64 rounded-xl border border-black/10 bg-stone/35 px-3 py-4">
                {hasMonthlySpend ? (
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={monthlyData} margin={{ bottom: 0, left: -12, right: 10, top: 8 }}>
                      <CartesianGrid stroke="rgba(17,20,24,0.08)" strokeDasharray="4 8" vertical={false} />
                      <XAxis
                        axisLine={false}
                        dataKey="label"
                        tick={{ fill: "rgba(17,20,24,0.52)", fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        axisLine={false}
                        tick={{ fill: "rgba(17,20,24,0.45)", fontSize: 12 }}
                        tickFormatter={(value) =>
                          formatCurrency({
                            compact: true,
                            currency,
                            maximumFractionDigits: 0,
                            value: Number(value),
                          })
                        }
                        tickLine={false}
                        width={54}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(17,20,24,0.05)" }} />
                      <Bar dataKey="total" fill="#111418" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm leading-6 text-black/58">
                    Monthly bars appear after statement transactions are parsed.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-ink">Recurring mix</h3>
              <div className="mt-4">
                <CategoryMixChart categories={categories} currency={currency} />
              </div>
            </div>
          </div>

          <div className="grid gap-5 border-t border-black/10 pt-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">Recurring charge ledger</h3>
                  <p className="mt-1 text-sm text-black/58">Active recurring expenses ordered by next charge date.</p>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/subscriptions">
                    Open all
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
              <SubscriptionTable items={summary.active_subscriptions} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-ink">Upcoming recurring charges</h3>
              <p className="mt-1 text-sm text-black/58">Due within the next 30 days.</p>
              <div className="mt-3">
                <RenewalList items={summary.upcoming_renewals} />
              </div>
            </div>
          </div>
        </div>

        <aside className="border-t border-black/10 bg-stone/45 p-5 xl:border-l xl:border-t-0">
          <div className="rounded-xl bg-ink p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/48">
              Readout
            </p>
            <h3 className="mt-3 text-xl font-semibold">What changed</h3>
            <div className="mt-5 space-y-4 text-sm leading-6 text-white/68">
              <div className="flex gap-3">
                <CircleDollarSign className="mt-0.5 size-4 shrink-0 text-white/70" />
                <p>
                  Run rate is{" "}
                  {formatCurrency({
                    currency,
                    value: toNumber(summary.summary.total_monthly_spend),
                  })}{" "}
                  per month across detected and manually tracked recurring charges.
                </p>
              </div>
              <div className="flex gap-3">
                <TrendingUp className="mt-0.5 size-4 shrink-0 text-white/70" />
                <p>{getMonthlyNarrative(monthlyData, currency)}</p>
              </div>
              <div className="flex gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-white/70" />
                <p>
                  {summary.summary.upcoming_renewals} recurring charge
                  {summary.summary.upcoming_renewals === 1 ? "" : "s"} need review in the next
                  30 days.
                </p>
              </div>
              <div className="flex gap-3">
                <Gauge className="mt-0.5 size-4 shrink-0 text-white/70" />
                <p>
                  {score
                    ? `${score.recommendation_count} score recommendation${
                        score.recommendation_count === 1 ? "" : "s"
                      } ${score.recommendation_count === 1 ? "is" : "are"} ready.`
                    : "Score recommendations will appear after recurring plans exist."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/reports">
                Financial reports
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/score">
                Recurring spend score
                <Gauge className="size-4" />
              </Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="ghost">
              <Link href="/subscriptions">
                Manage recurring charges
                <Layers3 className="size-4" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
      </div>
    </section>
  );
}
