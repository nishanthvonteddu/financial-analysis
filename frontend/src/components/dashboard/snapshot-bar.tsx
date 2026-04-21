"use client";

import { AlertCircle, CalendarClock, CreditCard, Sparkles } from "lucide-react";

import { CurrencyDisplay } from "@/components/ui/currency-display";
import { cn } from "@/lib/utils";
import type { DashboardSummaryStats } from "@/types";

type SnapshotBarProps = {
  isLoading?: boolean;
  summary?: DashboardSummaryStats;
};

const metricMeta = [
  {
    accentClassName: "bg-[#101922] text-white",
    detail: (summary: DashboardSummaryStats) =>
      `${summary.active_subscriptions} live plans are contributing to this total.`,
    icon: CreditCard,
    key: "total_monthly_spend",
    label: "Total spend",
  },
  {
    accentClassName: "bg-white/82 text-ink",
    detail: (summary: DashboardSummaryStats) =>
      `${summary.active_subscriptions} subscriptions are currently active.`,
    icon: Sparkles,
    key: "active_subscriptions",
    label: "Active subs",
  },
  {
    accentClassName: "bg-white/82 text-ink",
    detail: (summary: DashboardSummaryStats) =>
      `${summary.upcoming_renewals} charges are due within the next 30 days.`,
    icon: CalendarClock,
    key: "upcoming_renewals",
    label: "Upcoming",
  },
  {
    accentClassName: "bg-white/82 text-ink",
    detail: (summary: DashboardSummaryStats) =>
      `${summary.cancelled_subscriptions} subscriptions are sitting in the cancelled lane.`,
    icon: AlertCircle,
    key: "cancelled_subscriptions",
    label: "Cancelled",
  },
] as const;

function renderMetricValue(metricKey: (typeof metricMeta)[number]["key"], summary: DashboardSummaryStats) {
  if (metricKey === "total_monthly_spend") {
    return (
      <CurrencyDisplay
        className="text-3xl font-semibold tracking-tight sm:text-4xl"
        currency={summary.currency}
        value={Number.parseFloat(summary.total_monthly_spend)}
      />
    );
  }

  return <span className="text-3xl font-semibold tracking-tight sm:text-4xl">{summary[metricKey]}</span>;
}

export function SnapshotBar({ isLoading = false, summary }: SnapshotBarProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/76 shadow-line backdrop-blur">
      <div className="grid md:grid-cols-2 xl:grid-cols-4">
        {metricMeta.map(({ accentClassName, detail, icon: Icon, key, label }, index) => (
          <div
            className={cn(
              "relative min-h-44 border-black/10 px-5 py-5 sm:px-6",
              accentClassName,
              index > 0 ? "border-t md:border-l md:border-t-0 xl:border-l" : "",
            )}
            key={key}
          >
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "text-xs uppercase tracking-[0.3em]",
                  index === 0 ? "text-white/50" : "text-black/45",
                )}
              >
                {label}
              </p>
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-full border",
                  index === 0
                    ? "border-white/12 bg-white/10 text-white/78"
                    : "border-black/10 bg-stone/70 text-ink",
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>

            <div className="mt-7">
              {isLoading || !summary ? (
                <div className="space-y-3 animate-pulse">
                  <div className={cn("h-10 w-28 rounded-full", index === 0 ? "bg-white/14" : "bg-black/8")} />
                  <div className={cn("h-4 w-full rounded-full", index === 0 ? "bg-white/10" : "bg-black/6")} />
                  <div className={cn("h-4 w-4/5 rounded-full", index === 0 ? "bg-white/10" : "bg-black/6")} />
                </div>
              ) : (
                <div className="space-y-3">
                  {renderMetricValue(key, summary)}
                  {key === "total_monthly_spend" ? (
                    <p className={cn("text-xs uppercase tracking-[0.24em]", index === 0 ? "text-white/45" : "text-black/42")}>
                      Approx. converted to {summary.currency}
                    </p>
                  ) : null}
                  <p className={cn("text-sm leading-6", index === 0 ? "text-white/68" : "text-black/62")}>
                    {detail(summary)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
