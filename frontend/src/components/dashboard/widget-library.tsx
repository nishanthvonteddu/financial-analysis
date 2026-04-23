"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  Donut,
  FolderClock,
  Gauge,
  Layers3,
  ShieldAlert,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { CurrencyDisplay, formatCurrency } from "@/components/ui/currency-display";
import { cn } from "@/lib/utils";
import type { DashboardScoreBand, DashboardSummary, DashboardWidgetId } from "@/types";

import { WidgetContainer } from "./widget-container";

type WidgetMeta = {
  description: string;
  desktopHeight: number;
  emptyText: string;
  eyebrow: string;
  title: string;
};

const CATEGORY_COLORS = ["#111418", "#dc5d30", "#d9895d", "#95a6ba", "#cdb28f"];

export const dashboardWidgetMeta: Record<DashboardWidgetId, WidgetMeta> = {
  "subscription-score": {
    description: "A portfolio score that blends coverage, renewal readiness, context, and duplicate risk.",
    desktopHeight: 4,
    emptyText: "Add active subscriptions to start tracking the score and cleanup queue.",
    eyebrow: "Score pulse",
    title: "Subscription score",
  },
  "active-subscriptions": {
    description: "Live roster of the subscriptions currently shaping monthly spend.",
    desktopHeight: 4,
    emptyText: "Add subscriptions or import statement data to populate the active roster.",
    eyebrow: "Live roster",
    title: "Active subscriptions",
  },
  "category-breakdown": {
    description: "Where recurring spend is clustering right now across categories.",
    desktopHeight: 4,
    emptyText: "Categorize active subscriptions to unlock the category breakdown.",
    eyebrow: "Spend mix",
    title: "Category breakdown",
  },
  "monthly-spend": {
    description: "Six months of payment history, shaped into a single spend curve.",
    desktopHeight: 4,
    emptyText: "Upload statement history to start plotting monthly spend.",
    eyebrow: "Trend line",
    title: "Monthly spend",
  },
  "recently-ended": {
    description: "Recent cancellations with enough context to review what changed.",
    desktopHeight: 3,
    emptyText: "Cancelled subscriptions with end dates will show up here.",
    eyebrow: "Closed recently",
    title: "Recently ended",
  },
  "duplicate-alerts": {
    description: "Possible overlap pairs ranked by confidence so duplicate spend can be cleaned up fast.",
    desktopHeight: 4,
    emptyText: "Duplicate alerts appear when two active plans look like overlapping services.",
    eyebrow: "Overlap watch",
    title: "Duplicate alerts",
  },
  "upcoming-renewals": {
    description: "Charges due soon, ordered by urgency so the next move is obvious.",
    desktopHeight: 4,
    emptyText: "Upcoming renewal dates will appear once active plans have charge schedules.",
    eyebrow: "Next up",
    title: "Upcoming renewals",
  },
};

type DashboardWidgetCardProps = {
  onToggleColumn?: () => void;
  summary: DashboardSummary;
  widgetId: DashboardWidgetId;
};

type WidgetEmptyStateProps = {
  ctaHref: string;
  ctaLabel: string;
  icon: ReactNode;
  text: string;
};

function formatCompactCurrency(value: string, currency = "USD") {
  return formatCurrency({
    compact: true,
    currency,
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    value: Number.parseFloat(value),
  });
}

function formatDisplayDate(value: string | null) {
  if (!value) {
    return "Schedule pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function WidgetEmptyState({ ctaHref, ctaLabel, icon, text }: WidgetEmptyStateProps) {
  return (
    <div className="flex h-full min-h-48 flex-col items-start justify-between rounded-[1.4rem] border border-dashed border-black/12 bg-white/54 p-5">
      <div className="space-y-3">
        <div className="inline-flex size-12 items-center justify-center rounded-[1.1rem] border border-black/10 bg-stone text-ink">
          {icon}
        </div>
        <p className="max-w-sm text-sm leading-6 text-black/62">{text}</p>
      </div>

      <Button asChild className="mt-5 rounded-full px-4" size="sm" variant="outline">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}

function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload?: { currency?: string; total?: number } }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-[1.2rem] border border-black/10 bg-white/94 px-4 py-3 shadow-line">
      <p className="text-xs uppercase tracking-[0.28em] text-black/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">
        {formatCurrency({
          currency: payload[0]?.payload?.currency ?? "USD",
          value: payload[0]?.payload?.total ?? 0,
        })}
      </p>
    </div>
  );
}

function formatBandLabel(value: DashboardScoreBand) {
  if (value === "excellent") {
    return "Excellent";
  }
  if (value === "steady") {
    return "Steady";
  }
  if (value === "attention") {
    return "Needs attention";
  }
  return "At risk";
}

function ScoreWidget({ summary }: { summary: DashboardSummary }) {
  const score = summary.score_overview;

  if (!score || summary.summary.active_subscriptions === 0) {
    return (
      <WidgetEmptyState
        ctaHref="/subscriptions"
        ctaLabel="Add subscriptions"
        icon={<Gauge className="size-5" />}
        text={dashboardWidgetMeta["subscription-score"].emptyText}
      />
    );
  }

  const circumference = 2 * Math.PI * 52;
  const progress = Math.max(0, Math.min(100, score.score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(210px,0.78fr)_minmax(0,1.22fr)]">
      <div className="rounded-[1.5rem] bg-[#101922] p-5 text-white shadow-[0_18px_60px_rgba(17,20,24,0.22)]">
        <p className="text-xs uppercase tracking-[0.28em] text-white/45">Current score</p>
        <div className="mt-5 flex items-center justify-center">
          <div className="relative flex size-36 items-center justify-center">
            <svg className="-rotate-90" height="136" viewBox="0 0 136 136" width="136">
              <circle
                cx="68"
                cy="68"
                fill="none"
                r="52"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="12"
              />
              <circle
                cx="68"
                cy="68"
                fill="none"
                r="52"
                stroke="#dc5d30"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-semibold tracking-tight">{score.score}</p>
              <p className="mt-1 text-sm uppercase tracking-[0.28em] text-white/48">{score.grade} grade</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/68">
          {formatBandLabel(score.band)} with {score.recommendation_count} recommended cleanup move
          {score.recommendation_count === 1 ? "" : "s"} queued.
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.35rem] border border-black/10 bg-white/68 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-black/42">Duplicate savings</p>
            <CurrencyDisplay
              className="mt-3 block text-2xl font-semibold tracking-tight text-ink"
              currency={score.currency}
              value={Number.parseFloat(score.potential_monthly_savings)}
            />
            <p className="mt-1 text-sm text-black/58">
              {score.duplicate_candidates} overlap candidate{score.duplicate_candidates === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-black/10 bg-white/68 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-black/42">Action queue</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{score.recommendation_count}</p>
            <p className="mt-1 text-sm text-black/58">Recommendations are ready on the full score page.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {summary.summary.active_subscriptions > 0 ? (
            <>
              <div className="rounded-[1.35rem] border border-black/10 bg-stone/70 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-black/42">Score band</p>
                <p className="mt-3 text-lg font-semibold text-ink">{formatBandLabel(score.band)}</p>
                <p className="mt-1 text-sm text-black/58">Coverage, context, renewals, and waste control.</p>
              </div>
              <div className="rounded-[1.35rem] border border-black/10 bg-stone/70 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-black/42">Next move</p>
                <p className="mt-3 text-lg font-semibold text-ink">
                  {score.recommendation_count > 0 ? "Open score page" : "Score is stable"}
                </p>
                <p className="mt-1 text-sm text-black/58">Review the full breakdown and recommendation stack.</p>
              </div>
            </>
          ) : null}
        </div>

        <Button asChild className="rounded-full px-4" size="sm" variant="outline">
          <Link href="/score">Open score page</Link>
        </Button>
      </div>
    </div>
  );
}

function DuplicateAlertsWidget({ summary }: { summary: DashboardSummary }) {
  const items = summary.duplicate_alerts.slice(0, 3);
  const score = summary.score_overview;

  if (items.length === 0) {
    return (
      <WidgetEmptyState
        ctaHref="/score"
        ctaLabel="Review score"
        icon={<ShieldAlert className="size-5" />}
        text={dashboardWidgetMeta["duplicate-alerts"].emptyText}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] bg-[#101922] p-5 text-white shadow-[0_18px_60px_rgba(17,20,24,0.22)]">
        <p className="text-xs uppercase tracking-[0.28em] text-white/45">Potential monthly savings</p>
        <CurrencyDisplay
          className="mt-3 block text-3xl font-semibold tracking-tight"
          currency={score?.currency ?? items[0].currency}
          value={Number.parseFloat(score?.potential_monthly_savings ?? items[0].potential_monthly_savings)}
        />
        <p className="mt-2 text-sm leading-6 text-white/68">
          {score?.duplicate_candidates ?? items.length} duplicate candidate
          {(score?.duplicate_candidates ?? items.length) === 1 ? "" : "s"} are active right now.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            className="rounded-[1.35rem] border border-black/10 bg-white/68 px-4 py-4"
            key={`${item.left_subscription_id}-${item.right_subscription_id}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink">
                  {item.left_name} + {item.right_name}
                </p>
                <p className="mt-1 text-sm text-black/58">
                  {item.left_vendor} · {item.shared_signal}
                </p>
              </div>
              <div className="text-right">
                <CurrencyDisplay
                  className="text-base font-semibold text-ink"
                  currency={item.currency}
                  value={Number.parseFloat(item.potential_monthly_savings)}
                />
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-black/42">
                  {item.confidence} confidence
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button asChild className="rounded-full px-4" size="sm" variant="outline">
        <Link href="/score">Review duplicates</Link>
      </Button>
    </div>
  );
}

function ActiveSubscriptionsWidget({ summary }: { summary: DashboardSummary }) {
  const items = summary.active_subscriptions.slice(0, 4);

  if (items.length === 0) {
    return (
      <WidgetEmptyState
        ctaHref="/subscriptions"
        ctaLabel="Add a subscription"
        icon={<Layers3 className="size-5" />}
        text={dashboardWidgetMeta["active-subscriptions"].emptyText}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(210px,0.82fr)_minmax(0,1.18fr)]">
      <div className="rounded-[1.5rem] bg-[#101922] p-5 text-white shadow-[0_18px_60px_rgba(17,20,24,0.22)]">
        <p className="text-xs uppercase tracking-[0.28em] text-white/45">Live now</p>
        <p className="mt-4 text-5xl font-semibold tracking-tight">{summary.summary.active_subscriptions}</p>
        <p className="mt-3 text-sm leading-6 text-white/65">
          {formatCurrency({
            currency: summary.summary.currency,
            value: Number.parseFloat(summary.summary.total_monthly_spend),
          })}{" "}
          in monthly-equivalent spend is currently active after conversion.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-black/10 bg-white/68 px-4 py-3"
            key={item.subscription_id}
          >
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">{item.name}</p>
              <p className="mt-1 truncate text-sm text-black/58">
                {item.vendor} · {item.category_name} · {item.cadence}
              </p>
            </div>

            <div className="text-right">
              <CurrencyDisplay
                className="text-base font-semibold text-ink"
                currency={item.currency}
                value={Number.parseFloat(item.amount)}
              />
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-black/42">
                {formatDisplayDate(item.next_charge_date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlySpendWidget({ summary }: { summary: DashboardSummary }) {
  const chartData = summary.monthly_spend.map((point) => ({
    label: point.label,
    month: point.month,
    currency: point.currency,
    total: Number.parseFloat(point.total),
  }));
  const hasData = chartData.some((point) => point.total > 0);

  if (!hasData) {
    return (
      <WidgetEmptyState
        ctaHref="/uploads"
        ctaLabel="Import statements"
        icon={<Activity className="size-5" />}
        text={dashboardWidgetMeta["monthly-spend"].emptyText}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-black/45">Latest recorded month</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {formatCurrency({
              currency: summary.summary.currency,
              value: chartData.at(-1)?.total ?? 0,
            })}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-black/42">
            Approx. converted to {summary.summary.currency}
          </p>
        </div>
        <p className="max-w-xs text-sm leading-6 text-black/58">
          The bar chart reads the last six months of payment history and surfaces actual paid totals.
        </p>
      </div>

      <div className="h-60 rounded-[1.5rem] bg-white/58 px-3 py-4">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart accessibilityLayer data={chartData} margin={{ bottom: 0, left: -12, right: 8, top: 6 }}>
            <CartesianGrid stroke="rgba(17,20,24,0.08)" strokeDasharray="4 8" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "rgba(17,20,24,0.45)", fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(220, 93, 48, 0.08)" }} />
            <Bar dataKey="total" fill="#dc5d30" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CategoryBreakdownWidget({ summary }: { summary: DashboardSummary }) {
  const chartData = summary.category_breakdown.slice(0, 5).map((item) => ({
    currency: item.currency,
    label: item.category_name,
    subscriptions: item.subscriptions,
    total: Number.parseFloat(item.total_monthly_spend),
  }));

  if (chartData.length === 0) {
    return (
      <WidgetEmptyState
        ctaHref="/subscriptions"
        ctaLabel="Review subscriptions"
        icon={<Donut className="size-5" />}
        text={dashboardWidgetMeta["category-breakdown"].emptyText}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(190px,0.82fr)_minmax(0,1.18fr)]">
      <div className="flex h-56 items-center justify-center rounded-[1.5rem] bg-white/58 p-4">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="total"
              innerRadius={54}
              outerRadius={82}
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

      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div
            className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-black/10 bg-white/68 px-4 py-3"
            key={item.label}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{item.label}</p>
                <p className="text-sm text-black/58">{item.subscriptions} subscriptions</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-ink">
              {formatCompactCurrency(String(item.total), item.currency)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingRenewalsWidget({ summary }: { summary: DashboardSummary }) {
  const items = summary.upcoming_renewals.slice(0, 4);

  if (items.length === 0) {
    return (
      <WidgetEmptyState
        ctaHref="/subscriptions"
        ctaLabel="Review renewal dates"
        icon={<CalendarClock className="size-5" />}
        text={dashboardWidgetMeta["upcoming-renewals"].emptyText}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isUrgent = item.days_until_charge <= 7;

        return (
          <div
            className="rounded-[1.35rem] border border-black/10 bg-white/68 px-4 py-4"
            key={item.subscription_id}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-sm text-black/58">
                  {item.vendor} · {formatDisplayDate(item.next_charge_date)}
                </p>
              </div>
              <div className="text-right">
                <CurrencyDisplay
                  className="text-base font-semibold text-ink"
                  currency={item.currency}
                  value={Number.parseFloat(item.amount)}
                />
                <p
                  className={cn(
                    "mt-1 text-xs uppercase tracking-[0.24em]",
                    isUrgent ? "text-ember" : "text-black/42",
                  )}
                >
                  {item.days_until_charge} days
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentlyEndedWidget({ summary }: { summary: DashboardSummary }) {
  const items = summary.recently_ended.slice(0, 4);

  if (items.length === 0) {
    return (
      <WidgetEmptyState
        ctaHref="/subscriptions"
        ctaLabel="Inspect subscriptions"
        icon={<FolderClock className="size-5" />}
        text={dashboardWidgetMeta["recently-ended"].emptyText}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-black/10 bg-white/68 px-4 py-4"
          key={item.subscription_id}
        >
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{item.name}</p>
            <p className="mt-1 text-sm text-black/58">
              {item.vendor} · ended {formatDisplayDate(item.end_date)}
            </p>
          </div>

          <div className="text-right">
            <CurrencyDisplay
              className="text-base font-semibold text-ink"
              currency={item.currency}
              value={Number.parseFloat(item.amount)}
            />
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-black/42">Closed out</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderWidgetBody(widgetId: DashboardWidgetId, summary: DashboardSummary) {
  switch (widgetId) {
    case "subscription-score":
      return <ScoreWidget summary={summary} />;
    case "active-subscriptions":
      return <ActiveSubscriptionsWidget summary={summary} />;
    case "monthly-spend":
      return <MonthlySpendWidget summary={summary} />;
    case "category-breakdown":
      return <CategoryBreakdownWidget summary={summary} />;
    case "upcoming-renewals":
      return <UpcomingRenewalsWidget summary={summary} />;
    case "recently-ended":
      return <RecentlyEndedWidget summary={summary} />;
    case "duplicate-alerts":
      return <DuplicateAlertsWidget summary={summary} />;
    default:
      return null;
  }
}

export function DashboardWidgetCard({ onToggleColumn, summary, widgetId }: DashboardWidgetCardProps) {
  const meta = dashboardWidgetMeta[widgetId];

  return (
    <WidgetContainer
      description={meta.description}
      eyebrow={meta.eyebrow}
      onToggleColumn={onToggleColumn}
      title={meta.title}
    >
      {renderWidgetBody(widgetId, summary)}
    </WidgetContainer>
  );
}

export function DashboardBoardFootnote({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5 shadow-line backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Why this board works</p>
        <p className="mt-3 text-sm leading-6 text-black/62">
          Dragging changes the persisted widget order, while the summary strip keeps the top-line numbers fixed for quick scanning.
        </p>
      </div>
      <div className="rounded-[1.6rem] border border-black/10 bg-[#101922] p-5 text-white shadow-[0_20px_70px_rgba(17,20,24,0.22)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Live spend signal</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatCurrency({
                currency: summary.summary.currency,
                value: Number.parseFloat(summary.summary.total_monthly_spend),
              })}
            </p>
          </div>
          <ArrowUpRight className="size-5 text-white/55" />
        </div>
        <p className="mt-3 text-sm leading-6 text-white/65">
          {summary.summary.upcoming_renewals} renewal{summary.summary.upcoming_renewals === 1 ? "" : "s"} are due soon, so the widget grid stays grounded in action instead of just reporting totals.
        </p>
      </div>
    </div>
  );
}
