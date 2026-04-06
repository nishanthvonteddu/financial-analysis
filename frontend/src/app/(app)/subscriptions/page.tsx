"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowRight, LayoutGrid, List, LoaderCircle, Search, Sparkles } from "lucide-react";

import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useCreateSubscription, useSubscriptionCatalog, useSubscriptionList } from "@/hooks/use-subscriptions";
import { subscriptionStatusOptions } from "@/lib/validators";
import type { SubscriptionStatus } from "@/types";

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubscriptionStatus>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const deferredSearch = useDeferredValue(search);

  const createSubscription = useCreateSubscription();
  const { categoriesQuery, paymentMethodsQuery } = useSubscriptionCatalog();
  const subscriptionsQuery = useSubscriptionList({
    limit: 100,
    search: deferredSearch.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const categories = categoriesQuery.data?.items ?? [];
  const paymentMethods = paymentMethodsQuery.data?.items ?? [];
  const subscriptions = subscriptionsQuery.data?.items ?? [];

  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const paymentMethodMap = new Map(
    paymentMethods.map((paymentMethod) => [paymentMethod.id, paymentMethod.label]),
  );

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          subscriptions[0] ? (
            <Button asChild className="rounded-full px-5" variant="outline">
              <Link href={`/subscriptions/${subscriptions[0].id}`}>
                Open latest detail
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          ) : undefined
        }
        description="Track recurring plans, save manual entries, and move straight into lifecycle controls without leaving the workspace."
        eyebrow="Day 5 live surface"
        title="Subscription management"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.95fr)]">
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.32em] text-black/45">Browse plans</p>
                <h2 className="text-2xl font-semibold text-ink">
                  {subscriptionsQuery.data?.total ?? subscriptions.length} subscriptions in view
                </h2>
                <p className="text-sm leading-6 text-black/62">
                  Filter by status, switch the density, and open a detail route for edits,
                  cancellation, or lifecycle review.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full border border-black/10 bg-stone/70 p-1">
                <button
                  aria-pressed={viewMode === "grid"}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                    viewMode === "grid" ? "bg-[#101922] text-white" : "text-black/58 hover:text-ink"
                  }`}
                  onClick={() => setViewMode("grid")}
                  type="button"
                >
                  <LayoutGrid className="size-4" />
                  Grid
                </button>
                <button
                  aria-pressed={viewMode === "list"}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                    viewMode === "list" ? "bg-[#101922] text-white" : "text-black/58 hover:text-ink"
                  }`}
                  onClick={() => setViewMode("list")}
                  type="button"
                >
                  <List className="size-4" />
                  List
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label className="relative flex items-center">
                <Search className="pointer-events-none absolute left-4 size-4 text-black/38" />
                <input
                  className="h-12 w-full rounded-full border border-black/10 bg-white/88 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search plans, vendors, notes"
                  type="search"
                  value={search}
                />
              </label>

              <select
                className="h-12 rounded-full border border-black/10 bg-white/88 px-4 text-sm capitalize text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                onChange={(event) => setStatusFilter(event.target.value as "all" | SubscriptionStatus)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                {subscriptionStatusOptions.map((status) => (
                  <option className="capitalize" key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {subscriptionsQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-[2rem] border border-black/10 bg-white/76 shadow-line backdrop-blur">
              <div className="flex items-center gap-3 text-sm text-black/58">
                <LoaderCircle className="size-4 animate-spin" />
                Loading subscriptions...
              </div>
            </div>
          ) : subscriptions.length === 0 ? (
            <EmptyState
              action={
                <Button className="rounded-full px-5" onClick={() => setSearch("")} variant="outline">
                  Clear filters
                </Button>
              }
              description="No plans match the current search or filter. Save a new subscription on the right to populate the workspace."
              eyebrow="Empty state"
              icon={<Sparkles className="size-5" />}
              title="No subscriptions in view."
            />
          ) : (
            <section
              className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2" : "space-y-3"}
            >
              {subscriptions.map((subscription) => (
                <SubscriptionCard
                  categoryName={
                    subscription.category_id ? categoryMap.get(subscription.category_id) : undefined
                  }
                  href={`/subscriptions/${subscription.id}`}
                  key={subscription.id}
                  paymentMethodLabel={
                    subscription.payment_method_id
                      ? paymentMethodMap.get(subscription.payment_method_id)
                      : undefined
                  }
                  subscription={subscription}
                  viewMode={viewMode}
                />
              ))}
            </section>
          )}
        </div>

        <SubscriptionForm
          categories={categories}
          description="Capture plan terms, billing cadence, category, payment method, dates, URL, and operator notes in one pass."
          disabled={categoriesQuery.isLoading || paymentMethodsQuery.isLoading}
          onSubmit={async (payload) => {
            await createSubscription.mutateAsync(payload);
          }}
          paymentMethods={paymentMethods}
          submitLabel="Save subscription"
          title="Add a subscription"
        />
      </div>
    </div>
  );
}
