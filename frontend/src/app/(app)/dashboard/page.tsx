"use client";

import { useMemo } from "react";

import { WorkspaceOnboarding } from "@/components/onboarding/workspace-onboarding";
import { FinancialCommandCenter } from "@/components/dashboard/financial-command-center";
import { PageHeader } from "@/components/ui/page-header";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useSubscriptionCatalog, useSubscriptionList } from "@/hooks/use-subscriptions";
import { useUploadHistory } from "@/hooks/use-uploads";

export default function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const subscriptionsQuery = useSubscriptionList({ limit: 1 });
  const uploadsQuery = useUploadHistory();
  const { categoriesQuery, paymentMethodsQuery } = useSubscriptionCatalog();
  const { isComplete, isReady } = useOnboarding();

  const summary = summaryQuery.data;
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
    [
      categoriesQuery.data?.total,
      paymentMethodsQuery.data?.total,
      subscriptionsQuery.data?.total,
      uploadsQuery.data?.total,
    ],
  );
  const showOnboarding = isReady && !isComplete && !isWorkspaceSnapshotLoading && !hasWorkspaceData;

  return (
    <div className="animate-page-enter space-y-6">
      <PageHeader
        description="Statement totals, monthly movement, recurring spend, and renewal risk in one compact view."
        eyebrow="Dashboard"
        title="Financial analysis"
      />

      {showOnboarding ? <WorkspaceOnboarding /> : null}

      <FinancialCommandCenter isLoading={summaryQuery.isLoading} summary={summary} />
    </div>
  );
}
