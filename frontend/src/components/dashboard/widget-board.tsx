"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GridLayout, { WidthProvider, type Layout, type LayoutItem } from "react-grid-layout/legacy";
import { LayoutTemplate, LoaderCircle } from "lucide-react";

import { DashboardWidgetCard, DashboardBoardFootnote, dashboardWidgetMeta } from "@/components/dashboard/widget-library";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DashboardLayoutWidget, DashboardSummary, DashboardWidgetId } from "@/types";

const DashboardGridLayout = WidthProvider(GridLayout);
const COMPACT_QUERY = "(max-width: 1023px)";

type DashboardWidgetBoardProps = {
  isLoading?: boolean;
  isSaving?: boolean;
  onChange: (widgets: DashboardLayoutWidget[]) => void;
  summary?: DashboardSummary;
  version?: number;
  widgets?: DashboardLayoutWidget[];
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

function serializeWidgets(widgets: DashboardLayoutWidget[]) {
  return widgets.map((widget) => `${widget.id}:${widget.column}`).join("|");
}

function buildGridLayout(widgets: DashboardLayoutWidget[], isCompact: boolean) {
  const columnY = {
    primary: 0,
    secondary: 0,
  };

  return widgets.map<LayoutItem>((widget, index) => {
    if (isCompact) {
      return {
        h: Math.max(3, dashboardWidgetMeta[widget.id].desktopHeight - 1),
        i: widget.id,
        isResizable: false,
        minH: 3,
        minW: 1,
        w: 1,
        x: 0,
        y: index * 3,
      };
    }

    const column = widget.column;
    const y = columnY[column];
    columnY[column] += dashboardWidgetMeta[widget.id].desktopHeight;

    return {
      h: dashboardWidgetMeta[widget.id].desktopHeight,
      i: widget.id,
      isResizable: false,
      minH: 3,
      minW: 6,
      w: 6,
      x: column === "primary" ? 0 : 6,
      y,
    };
  }) as Layout;
}

function normalizeWidgets(layout: Layout): DashboardLayoutWidget[] {
  return [...layout]
    .sort((left, right) => {
      const leftColumn = left.x >= 6 ? 1 : 0;
      const rightColumn = right.x >= 6 ? 1 : 0;

      if (leftColumn !== rightColumn) {
        return leftColumn - rightColumn;
      }

      if (left.y !== right.y) {
        return left.y - right.y;
      }

      return left.x - right.x;
    })
    .map((item) => ({
      column: item.x >= 6 ? "secondary" : "primary",
      id: item.i as DashboardWidgetId,
    }));
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

export function DashboardWidgetBoard({
  isLoading = false,
  isSaving = false,
  onChange,
  summary,
  version,
  widgets,
}: DashboardWidgetBoardProps) {
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const layout = useMemo(
    () => buildGridLayout(widgets ?? [], isCompact),
    [isCompact, widgets],
  );
  const serializedWidgets = serializeWidgets(widgets ?? []);

  const handleLayoutStop = (nextLayout: Layout) => {
    if (isCompact || !widgets?.length) {
      return;
    }

    const normalized = normalizeWidgets(nextLayout);
    if (serializeWidgets(normalized) === serializedWidgets) {
      return;
    }

    onChange(normalized);
  };

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 border-b border-black/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-black/45">Widget workspace</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Drag the dashboard into focus</h2>
          <p className="max-w-2xl text-sm leading-6 text-black/62">
            The board holds seven live widgets, each tuned for a specific operating question instead of a generic dashboard card.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-stone/70 px-4 py-2 text-sm text-black/58">
            <LayoutTemplate className="size-4" />
            {isSaving ? "Saving layout..." : version ? `Version ${version}` : "Live layout"}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/72 px-4 py-2 text-sm text-black/58">
            Drag by the grip. Use the lane toggle for keyboard-friendly moves.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)]">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="rounded-[1.7rem] border border-black/10 bg-white/80 p-5" key={index}>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-4 h-9 w-32" />
                <Skeleton className="mt-6 h-24 w-full" />
              </div>
            ))}
          </div>
          <div className="rounded-[1.7rem] border border-black/10 bg-stone/60 p-5">
            <div className="flex items-center gap-3 text-sm text-black/58">
              <LoaderCircle className="size-4 animate-spin" />
              Loading dashboard workspace...
            </div>
            <div className="mt-5 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
            </div>
          </div>
        </div>
      ) : !summary || !widgets || widgets.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            action={
              <Button asChild className="rounded-full px-5" variant="outline">
                <Link href="/uploads">Bring in statement data</Link>
              </Button>
            }
            description="Dashboard widgets need subscriptions, payment history, and renewal dates before they can become useful."
            eyebrow="No dashboard data"
            icon={<LayoutTemplate className="size-5" />}
            title="Nothing to arrange yet."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <DashboardGridLayout
            className={cn("dashboard-grid-layout", isCompact ? "dashboard-grid-layout--compact" : "")}
            cols={isCompact ? 1 : 12}
            compactType="vertical"
            containerPadding={[0, 0]}
            draggableHandle=".dashboard-grid-handle"
            isDraggable={!isCompact && !isSaving}
            isResizable={false}
            layout={layout}
            margin={[16, 16]}
            onDragStop={handleLayoutStop}
            rowHeight={92}
            useCSSTransforms
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <DashboardWidgetCard
                  onToggleColumn={
                    isCompact ? undefined : () => onChange(toggleWidgetColumn(widgets, widget.id))
                  }
                  summary={summary}
                  widgetId={widget.id}
                />
              </div>
            ))}
          </DashboardGridLayout>

          <DashboardBoardFootnote summary={summary} />
        </div>
      )}
    </section>
  );
}
