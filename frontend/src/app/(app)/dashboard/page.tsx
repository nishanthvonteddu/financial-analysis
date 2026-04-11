"use client";

import Link from "next/link";
import { startTransition, useMemo } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Columns2, LayoutTemplate, LoaderCircle } from "lucide-react";

import { SnapshotBar } from "@/components/dashboard/snapshot-bar";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay, formatCurrency } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useDashboardLayout, useDashboardSummary, useUpdateDashboardLayout } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import type {
  DashboardCategoryBreakdownItem,
  DashboardLayoutWidget,
  DashboardRecentlyEndedItem,
  DashboardSummary,
  DashboardWidgetId,
} from "@/types";

const widgetMeta: Record<
  DashboardWidgetId,
  {
    detail: (summary: DashboardSummary) => string;
    eyebrow: string;
    title: string;
  }
> = {
  "category-breakdown": {
    detail: (summary) => {
      const leader = summary.category_breakdown[0];
      if (!leader) {
        return "Category mix will populate after more subscription activity lands.";
      }

      return `${leader.category_name} is currently pacing the mix at ${formatCurrency({ value: Number.parseFloat(leader.total_monthly_spend) })}.`;
    },
    eyebrow: "Prepared",
    title: "Category breakdown",
  },
  "monthly-spend": {
    detail: (summary) => {
      const currentMonth = summary.monthly_spend.at(-1);
      if (!currentMonth) {
        return "Monthly spend history becomes available once payment history starts landing.";
      }

      return `${currentMonth.label} has ${formatCurrency({ value: Number.parseFloat(currentMonth.total) })} recorded so far.`;
    },
    eyebrow: "Prepared",
    title: "Monthly spend",
  },
  "recently-ended": {
    detail: (summary) => {
      const latest = summary.recently_ended[0];
      if (!latest) {
        return "Recently ended subscriptions will appear once cancellations start recording end dates.";
      }

      return `${latest.name} ended most recently, closing out ${formatCurrency({ value: Number.parseFloat(latest.amount) })}.`;
    },
    eyebrow: "Prepared",
    title: "Recently ended",
  },
  "upcoming-renewals": {
    detail: (summary) => {
      const next = summary.upcoming_renewals[0];
      if (!next) {
        return "Upcoming renewals will surface once active plans carry their next charge dates.";
      }

      return `${next.name} is next in line, due in ${next.days_until_charge} days.`;
    },
    eyebrow: "Prepared",
    title: "Upcoming renewals",
  },
};

function moveItemWithinColumn(
  widgets: DashboardLayoutWidget[],
  widgetId: DashboardWidgetId,
  direction: "down" | "up",
) {
  const nextWidgets = [...widgets];
  const currentIndex = nextWidgets.findIndex((widget) => widget.id === widgetId);

  if (currentIndex === -1) {
    return widgets;
  }

  const current = nextWidgets[currentIndex];
  const columnIndexes = nextWidgets
    .map((widget, index) => ({ index, widget }))
    .filter(({ widget }) => widget.column === current.column)
    .map(({ index }) => index);
  const columnPosition = columnIndexes.indexOf(currentIndex);
  const targetIndex =
    direction === "up" ? columnIndexes[columnPosition - 1] : columnIndexes[columnPosition + 1];

  if (targetIndex === undefined) {
    return widgets;
  }

  [nextWidgets[currentIndex], nextWidgets[targetIndex]] = [nextWidgets[targetIndex], nextWidgets[currentIndex]];
  return nextWidgets;
}

function toggleWidgetColumn(widgets: DashboardLayoutWidget[], widgetId: DashboardWidgetId) {
  return widgets.map<DashboardLayoutWidget>((widget) =>
    widget.id === widgetId
      ? {
          ...widget,
          column: widget.column === "primary" ? "secondary" : "primary",
        }
      : widget,
  );
}

function WidgetPlaceholder({
  item,
  onMoveDown,
  onMoveUp,
  onToggleColumn,
  summary,
}: {
  item: DashboardLayoutWidget;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onToggleColumn: () => void;
  summary: DashboardSummary;
}) {
  const meta = widgetMeta[item.id];

  return (
    <article className="group rounded-[1.8rem] border border-black/10 bg-white/82 p-5 shadow-line backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-black/16">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">{meta.eyebrow}</p>
          <h3 className="text-2xl font-semibold tracking-tight text-ink">{meta.title}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label={`Move ${meta.title} up`}
            className="inline-flex size-9 items-center justify-center rounded-full border border-black/10 bg-stone/70 text-black/60 transition hover:border-black/18 hover:text-ink"
            onClick={onMoveUp}
            type="button"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            aria-label={`Move ${meta.title} down`}
            className="inline-flex size-9 items-center justify-center rounded-full border border-black/10 bg-stone/70 text-black/60 transition hover:border-black/18 hover:text-ink"
            onClick={onMoveDown}
            type="button"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            aria-label={`Move ${meta.title} to the other column`}
            className="inline-flex size-9 items-center justify-center rounded-full border border-black/10 bg-stone/70 text-black/60 transition hover:border-black/18 hover:text-ink"
            onClick={onToggleColumn}
            type="button"
          >
            <Columns2 className="size-4" />
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm leading-6 text-black/62">{meta.detail(summary)}</p>
      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4 text-sm text-black/52">
        <span>{item.column === "primary" ? "Primary column" : "Secondary column"}</span>
        <span>Day 11 widget slot</span>
      </div>
    </article>
  );
}

function SidebarInsight({
  breakdown,
  recentlyEnded,
  upcoming,
}: {
  breakdown: DashboardCategoryBreakdownItem | undefined;
  recentlyEnded: DashboardRecentlyEndedItem | undefined;
  upcoming: DashboardSummary["upcoming_renewals"];
}) {
  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-[#101922] p-6 text-white shadow-[0_24px_80px_rgba(17,20,24,0.22)] sm:p-8">
      <div className="space-y-2 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.32em] text-white/45">Renewal focus</p>
        <h3 className="text-2xl font-semibold tracking-tight">What needs attention next</h3>
        <p className="text-sm leading-6 text-white/62">
          Day 10 keeps the dashboard operational with live KPIs now, then leaves the richer widgets ready for Day 11.
        </p>
      </div>

      <div className="space-y-4">
        {upcoming.length === 0 ? (
          <p className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4 text-sm leading-6 text-white/62">
            No upcoming renewals are queued yet. As active subscriptions gain charge dates, this rail will start sorting urgency automatically.
          </p>
        ) : (
          upcoming.slice(0, 3).map((item) => (
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4" key={item.subscription_id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-white/62">
                    {item.vendor} · due in {item.days_until_charge} days
                  </p>
                </div>
                <CurrencyDisplay
                  className="text-lg font-semibold text-amber-200"
                  value={Number.parseFloat(item.amount)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
        <p className="text-xs uppercase tracking-[0.28em] text-white/42">Category lead</p>
        <p className="mt-3 text-lg font-semibold">
          {breakdown?.category_name ?? "Waiting for category mix"}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/62">
          {breakdown
            ? `${breakdown.subscriptions} subscriptions currently map here at ${formatCurrency({ value: Number.parseFloat(breakdown.total_monthly_spend) })} in monthly-equivalent spend.`
            : "Once active subscriptions are categorized, this lane will call out the heaviest spend cluster."}
        </p>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
        <p className="text-xs uppercase tracking-[0.28em] text-white/42">Recently ended</p>
        <p className="mt-3 text-lg font-semibold">
          {recentlyEnded?.name ?? "No recent cancellations"}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/62">
          {recentlyEnded
            ? `${recentlyEnded.vendor} most recently closed at ${formatCurrency({ value: Number.parseFloat(recentlyEnded.amount) })}.`
            : "As plans are cancelled with end dates, this lane will preserve the recent context for review."}
        </p>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const layoutQuery = useDashboardLayout();
  const updateLayout = useUpdateDashboardLayout();

  const summary = summaryQuery.data;
  const widgets = layoutQuery.data?.widgets;
  const groupedWidgets = useMemo(
    () => ({
      primary: (widgets ?? []).filter((widget) => widget.column === "primary"),
      secondary: (widgets ?? []).filter((widget) => widget.column === "secondary"),
    }),
    [widgets],
  );

  const applyLayout = (nextWidgets: DashboardLayoutWidget[]) => {
    startTransition(() => {
      void updateLayout.mutateAsync({ widgets: nextWidgets });
    });
  };

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/subscriptions">
              Open subscriptions
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="Track recurring spend, keep renewals in view, and stage the widget system with a persistent dashboard layout before the richer analytics surface lands."
        eyebrow="Day 10 live surface"
        title="Smart dashboard snapshot"
      />

      <SnapshotBar isLoading={summaryQuery.isLoading} summary={summary?.summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <section className="rounded-[2rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-black/45">Widget staging</p>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">Layout now, widgets next</h2>
              <p className="max-w-2xl text-sm leading-6 text-black/62">
                The layout is already persistent, so Day 11 can drop real widgets into stable slots without rebuilding the page frame.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-stone/70 px-4 py-2 text-sm text-black/58">
              <LayoutTemplate className="size-4" />
              {layoutQuery.data ? `Version ${layoutQuery.data.version}` : "Loading layout"}
            </div>
          </div>

          {summaryQuery.isLoading || layoutQuery.isLoading ? (
            <div className="flex min-h-[22rem] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-black/58">
                <LoaderCircle className="size-4 animate-spin" />
                Loading dashboard workspace...
              </div>
            </div>
          ) : !summary || !widgets || widgets.length === 0 ? (
            <EmptyState
              action={
                <Button asChild className="rounded-full px-5" variant="outline">
                  <Link href="/uploads">Bring in statement data</Link>
                </Button>
              }
              description="Dashboard analytics will populate as subscriptions, payment history, and renewal dates accumulate in the workspace."
              eyebrow="No dashboard data"
              icon={<LayoutTemplate className="size-5" />}
              title="Nothing to stage yet."
            />
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              {(["primary", "secondary"] as const).map((column) => (
                <div className={cn("space-y-4", column === "secondary" ? "xl:pt-10" : "")} key={column}>
                  {groupedWidgets[column].map((item) => (
                    <WidgetPlaceholder
                      item={item}
                      key={item.id}
                      onMoveDown={() => applyLayout(moveItemWithinColumn(widgets, item.id, "down"))}
                      onMoveUp={() => applyLayout(moveItemWithinColumn(widgets, item.id, "up"))}
                      onToggleColumn={() => applyLayout(toggleWidgetColumn(widgets, item.id))}
                      summary={summary}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <SidebarInsight
          breakdown={summary?.category_breakdown[0]}
          recentlyEnded={summary?.recently_ended[0]}
          upcoming={summary?.upcoming_renewals ?? []}
        />
      </div>
    </div>
  );
}
