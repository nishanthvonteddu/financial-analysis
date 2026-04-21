"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LayoutGrid, List, SlidersHorizontal, Sparkles } from "lucide-react";

import { SearchBar } from "@/components/subscriptions/search-bar";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useFilters } from "@/hooks/use-filters";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useCreateSubscription, useSubscriptionCatalog, useSubscriptionList } from "@/hooks/use-subscriptions";
import { subscriptionCadenceOptions, subscriptionStatusOptions } from "@/lib/validators";

export default function SubscriptionsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const {
    activeFilterCount,
    clearFilters,
    filters,
    hasActiveFilters,
    queryFilters,
    setCadence,
    setCategoryId,
    setMaxAmount,
    setMinAmount,
    setPaymentMethodId,
    setSearch,
    setStatus,
  } = useFilters();

  const createSubscription = useCreateSubscription();
  const { categoriesQuery, paymentMethodsQuery } = useSubscriptionCatalog();
  const subscriptionsQuery = useSubscriptionList({
    limit: 100,
    ...queryFilters,
  });
  const { user } = useAuth();
  const { preferredCurrency } = useOnboarding();
  const workspaceCurrency = user?.preferred_currency ?? preferredCurrency;

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
        eyebrow="Subscription workspace"
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
                  Search by vendor, pin the exact billing rail, constrain price ranges, and keep
                  the filters live in the URL while you move through the workspace.
                </p>
                {subscriptionsQuery.isFetching && subscriptions.length > 0 ? (
                  <p className="text-xs uppercase tracking-[0.24em] text-black/42">
                    Updating results without clearing the list
                  </p>
                ) : null}
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

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <SearchBar
                  onChange={setSearch}
                  placeholder="Search plans, vendors, notes"
                  value={filters.search}
                />

                <select
                  aria-label="Filter by status"
                  className="h-12 rounded-full border border-black/10 bg-white/88 px-4 text-sm capitalize text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                  onChange={(event) => setStatus(event.target.value as typeof filters.status)}
                  value={filters.status}
                >
                  <option value="all">All statuses</option>
                  {subscriptionStatusOptions.map((status) => (
                    <option className="capitalize" key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[1.7rem] border border-black/10 bg-stone/65 p-4">
                <div className="flex flex-col gap-3 border-b border-black/10 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/42">Filter panel</p>
                    <h3 className="mt-1 text-lg font-semibold text-ink">
                      {activeFilterCount} live constraint{activeFilterCount === 1 ? "" : "s"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-black/58">
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-3 py-1.5">
                      <SlidersHorizontal className="size-4" />
                      URL synced
                    </span>
                    <Button
                      className="rounded-full"
                      onClick={clearFilters}
                      type="button"
                      variant="ghost"
                    >
                      Reset all
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <select
                    aria-label="Filter by category"
                    className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                    onChange={(event) => setCategoryId(event.target.value)}
                    value={filters.categoryId}
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by payment method"
                    className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                    onChange={(event) => setPaymentMethodId(event.target.value)}
                    value={filters.paymentMethodId}
                  >
                    <option value="all">All payment methods</option>
                    {paymentMethods.map((paymentMethod) => (
                      <option key={paymentMethod.id} value={String(paymentMethod.id)}>
                        {paymentMethod.label}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by cadence"
                    className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm capitalize text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                    onChange={(event) => setCadence(event.target.value as typeof filters.cadence)}
                    value={filters.cadence}
                  >
                    <option value="all">All cadences</option>
                    {subscriptionCadenceOptions.map((cadence) => (
                      <option className="capitalize" key={cadence} value={cadence}>
                        {cadence}
                      </option>
                    ))}
                  </select>

                  <input
                    aria-label="Minimum monthly amount"
                    className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                    inputMode="decimal"
                    onChange={(event) => setMinAmount(event.target.value)}
                    placeholder="Min amount"
                    value={filters.minAmount}
                  />

                  <input
                    aria-label="Maximum monthly amount"
                    className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                    inputMode="decimal"
                    onChange={(event) => setMaxAmount(event.target.value)}
                    placeholder="Max amount"
                    value={filters.maxAmount}
                  />
                </div>
              </div>
            </div>
          </section>

          {subscriptionsQuery.isLoading ? (
            <section className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="rounded-[1.8rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur"
                  key={index}
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-4 h-8 w-40" />
                  <Skeleton className="mt-3 h-4 w-28" />
                  <Skeleton className="mt-6 h-20 w-full" />
                  <Skeleton className="mt-4 h-10 w-36" />
                </div>
              ))}
            </section>
          ) : subscriptions.length === 0 ? (
            <EmptyState
              action={
                hasActiveFilters ? (
                  <Button className="rounded-full px-5" onClick={clearFilters} variant="outline">
                    Clear filters
                  </Button>
                ) : (
                  <Button asChild className="rounded-full px-5" variant="outline">
                    <Link href="/settings">Set up categories and payment rails</Link>
                  </Button>
                )
              }
              description={
                hasActiveFilters
                  ? "No plans match the current search or filter. Clear the active constraints to widen the view again."
                  : `No subscriptions are saved yet. Use the form on the right to add the first plan with ${workspaceCurrency} as the default billing code.`
              }
              eyebrow={hasActiveFilters ? "Filtered view" : "First subscription"}
              icon={<Sparkles className="size-5" />}
              title={hasActiveFilters ? "No subscriptions match these filters." : "The subscription list is still empty."}
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
          preferredCurrency={workspaceCurrency}
          submitLabel="Save subscription"
          testId="subscription-create-form"
          title="Add a subscription"
        />
      </div>
    </div>
  );
}
