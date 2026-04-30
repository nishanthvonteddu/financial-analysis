"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { startTransition, useMemo } from "react";
import { ArrowRight, Activity, Gauge, LayoutTemplate } from "lucide-react";

import { WorkspaceOnboarding } from "@/components/onboarding/workspace-onboarding";
import { SnapshotBar } from "@/components/dashboard/snapshot-bar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardLayout, useDashboardSummary, useUpdateDashboardLayout } from "@/hooks/use-dashboard";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useSubscriptionCatalog, useSubscriptionList } from "@/hooks/use-subscriptions";
import { useUploadHistory } from "@/hooks/use-uploads";
import type { DashboardLayoutWidget } from "@/types";

function DashboardBoardLoading() {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 border-b border-black/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="rounded-[1.7rem] border border-black/10 bg-white/80 p-5" key={index}>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-4 h-9 w-32" />
            <Skeleton className="mt-6 h-24 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

const DashboardWidgetBoard = dynamic(
  () =>
    import("@/components/dashboard/widget-board").then((module) => module.DashboardWidgetBoard),
  {
    loading: DashboardBoardLoading,
    ssr: false,
  },
);

export default function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const layoutQuery = useDashboardLayout();
  const updateLayout = useUpdateDashboardLayout();
  const subscriptionsQuery = useSubscriptionList({ limit: 1 });
  const uploadsQuery = useUploadHistory();
  const { categoriesQuery, paymentMethodsQuery } = useSubscriptionCatalog();
  const { isComplete, isReady } = useOnboarding();

  const summary = summaryQuery.data;
  const widgets = layoutQuery.data?.widgets;
  const isWorkspaceSnapshotLoading =
    subscriptionsQuery.isLoading ||
    uploadsQuery.isLoading ||
    categoriesQuery.isLoading ||
    paymentMethodsQuery.isLoading;
  const hasWorkspaceData = useMemo(
    () =>
      (subscriptionsQuery.data?.total ?? 0) > 0 ||
      (uploadsQuery.data?.total ?? 0) > 0 ||
      (categoriesQuery.data?.total ?? 0) > 0 ||
      (paymentMethodsQuery.data?.total ?? 0) > 0,
    [categoriesQuery.data?.total, paymentMethodsQuery.data?.total, subscriptionsQuery.data?.total, uploadsQuery.data?.total],
  );
  const showOnboarding = isReady && !isComplete && !isWorkspaceSnapshotLoading && !hasWorkspaceData;

  const applyLayout = (nextWidgets: DashboardLayoutWidget[]) => {
    startTransition(() => {
      void updateLayout.mutateAsync({ widgets: nextWidgets });
    });
  };

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          showOnboarding ? undefined : (
            <Button asChild className="rounded-full px-5" variant="outline">
              <Link href="/score">
                Open score
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          )
        }
        description="Operate from a live dashboard where score, duplicate risk, renewals, category mix, and spend all stay visible in one working surface."
        eyebrow="Dashboard workspace"
        title="Smart dashboard workspace"
      />

      {showOnboarding ? <WorkspaceOnboarding /> : null}

      <SnapshotBar isLoading={summaryQuery.isLoading} summary={summary?.summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.24fr)_320px]">
        <DashboardWidgetBoard
          isLoading={summaryQuery.isLoading || layoutQuery.isLoading}
          isSaving={updateLayout.isPending}
          onChange={applyLayout}
          summary={summary}
          version={layoutQuery.data?.version}
          widgets={widgets}
        />

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-white/10 bg-[#101922] p-6 text-white shadow-[0_24px_80px_rgba(17,20,24,0.22)] sm:p-7">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Control lane</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Keep the board operational</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Use the snapshot bar for totals, then let the widget board answer the next question: what is active, what is growing, what is due, and what just ended.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/42">Layout persistence</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Moves save back to your dashboard layout so the same instrument panel returns on the next visit.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/42">Data freshness</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Upload history feeds the spend curve, while subscription records keep score, duplicate alerts, renewal, and churn widgets grounded.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="inline-flex size-12 items-center justify-center rounded-[1.1rem] border border-black/10 bg-stone text-ink">
              <Activity className="size-5" />
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Keep the signal moving</h3>
            <p className="mt-3 text-sm leading-6 text-black/62">
              If one lane is empty, the fastest way to improve this board is usually adding or refreshing source data rather than rearranging the layout again.
            </p>

            <div className="mt-5 space-y-3">
              <Button asChild className="w-full rounded-full" variant="outline">
                <Link href="/score">
                  Open subscription score
                  <Gauge className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild className="w-full rounded-full" variant="outline">
                <Link href="/uploads">
                  Open uploads
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild className="w-full rounded-full" variant="ghost">
                <Link href="/subscriptions">
                  Review subscriptions
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-stone/70 px-4 py-2 text-sm text-black/58">
              <LayoutTemplate className="size-4" />
              {layoutQuery.data ? `Layout v${layoutQuery.data.version}` : "Widget board"}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
