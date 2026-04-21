"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  LoaderCircle,
  PencilLine,
  Power,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { PaymentTimeline } from "@/components/subscriptions/payment-timeline";
import { RenewalBadge } from "@/components/subscriptions/renewal-badge";
import { StatusBadge } from "@/components/subscriptions/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  useDeleteSubscription,
  useSubscription,
  useSubscriptionCatalog,
  useSubscriptionPaymentHistory,
  useUpdateSubscription,
} from "@/hooks/use-subscriptions";
import { subscriptionStatusOptions } from "@/lib/validators";
import type { SubscriptionStatus } from "@/types";

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export default function SubscriptionDetailPage() {
  const params = useParams<{ subscriptionId: string }>();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const subscriptionId = Number(params.subscriptionId);
  const { categoriesQuery, paymentMethodsQuery } = useSubscriptionCatalog();
  const subscriptionQuery = useSubscription(subscriptionId);
  const paymentHistoryQuery = useSubscriptionPaymentHistory(subscriptionId);
  const updateSubscription = useUpdateSubscription(subscriptionId);
  const deleteSubscription = useDeleteSubscription(subscriptionId);

  if (!Number.isFinite(subscriptionId)) {
    return (
      <EmptyState
        description="The requested subscription id is invalid. Return to the list and choose a valid plan."
        title="Invalid subscription route"
      />
    );
  }

  const subscription = subscriptionQuery.data;
  const categories = categoriesQuery.data?.items ?? [];
  const paymentMethods = paymentMethodsQuery.data?.items ?? [];
  const categoryName = categories.find((category) => category.id === subscription?.category_id)?.name;
  const paymentMethod = paymentMethods.find(
    (entry) => entry.id === subscription?.payment_method_id,
  );

  if (subscriptionQuery.isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-[2rem] border border-black/10 bg-white/76 shadow-line backdrop-blur">
        <div className="flex items-center gap-3 text-sm text-black/58">
          <LoaderCircle className="size-4 animate-spin" />
          Loading subscription detail...
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <EmptyState
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/subscriptions">
              Return to subscriptions
              <ArrowLeft className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="This subscription could not be loaded. It may have been deleted or the route is stale."
        title="Subscription not found"
      />
    );
  }

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-full px-5" variant="outline">
              <Link href="/subscriptions">
                <ArrowLeft className="mr-2 size-4" />
                Back to list
              </Link>
            </Button>
            <Button className="rounded-full px-5" onClick={() => setIsEditing((open) => !open)} variant="outline">
              <PencilLine className="mr-2 size-4" />
              {isEditing ? "Close editor" : "Edit subscription"}
            </Button>
          </div>
        }
        description="Review billing terms, monitor renewal health, update details, or remove the plan from the subscriptions workspace."
        eyebrow="Subscription detail"
        title={subscription.name}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.95fr)]">
        <section className="space-y-5 rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
          <div className="flex flex-col gap-5 border-b border-black/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-black/45">
                {categoryName ?? "Uncategorized"}
              </p>
              <div>
                <h2 className="text-3xl font-semibold text-ink">{subscription.name}</h2>
                <p className="mt-2 text-base text-black/58">{subscription.vendor}</p>
              </div>
            </div>

            <div className="space-y-3">
              <StatusBadge className="w-fit" status={subscription.status} />
              <RenewalBadge className="w-fit" renewal={subscription.renewal} />
              <CurrencyDisplay
                className="block text-3xl font-semibold text-ink"
                currency={subscription.currency}
                value={Number(subscription.amount)}
              />
              <p className="text-sm capitalize text-black/52">{subscription.cadence} billing</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-black/10 bg-stone/60 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Lifecycle</p>
              <dl className="mt-4 space-y-3 text-sm text-black/64">
                <div>
                  <dt className="font-medium text-ink">Start date</dt>
                  <dd>{formatDate(subscription.start_date)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Next charge</dt>
                  <dd>{formatDate(subscription.next_charge_date)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Last renewed</dt>
                  <dd>
                    {subscription.renewal.last_renewed_at
                      ? formatDate(subscription.renewal.last_renewed_at)
                      : subscription.renewal.state === "trialing"
                        ? "Waiting for the first renewal"
                        : "Not recorded yet"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">End date</dt>
                  <dd>{formatDate(subscription.end_date)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Auto renew</dt>
                  <dd>{subscription.auto_renew ? "Enabled" : "Disabled"}</dd>
                </div>
                {subscription.renewal.state === "overdue" && subscription.renewal.days_overdue !== null ? (
                  <div>
                    <dt className="font-medium text-ink">Renewal alert</dt>
                    <dd>Overdue by {subscription.renewal.days_overdue} days</dd>
                  </div>
                ) : null}
                {subscription.renewal.state === "trialing" &&
                subscription.renewal.trial_ends_at !== null &&
                subscription.renewal.trial_days_remaining !== null ? (
                  <div>
                    <dt className="font-medium text-ink">Trial window</dt>
                    <dd>
                      Ends {formatDate(subscription.renewal.trial_ends_at)} with{" "}
                      {subscription.renewal.trial_days_remaining} days remaining
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="rounded-[1.5rem] border border-black/10 bg-stone/60 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Metadata</p>
              <dl className="mt-4 space-y-3 text-sm text-black/64">
                <div>
                  <dt className="font-medium text-ink">Billing day</dt>
                  <dd>{subscription.day_of_month ?? "Not set"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Payment method</dt>
                  <dd>
                    {paymentMethod
                      ? `${paymentMethod.label}${paymentMethod.last4 ? ` •••• ${paymentMethod.last4}` : ""}`
                      : "Not assigned"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Website</dt>
                  <dd>
                    {subscription.website_url ? (
                      <a
                        className="inline-flex items-center gap-1.5 font-medium text-ink transition hover:text-ember"
                        href={subscription.website_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open website
                        <ExternalLink className="size-4" />
                      </a>
                    ) : (
                      "Not set"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-[1.5rem] border border-black/10 bg-white/88 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Description</p>
              <p className="mt-4 text-sm leading-7 text-black/66">
                {subscription.description || "No description captured for this subscription yet."}
              </p>
            </section>

            <section className="rounded-[1.5rem] border border-black/10 bg-white/88 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Notes</p>
              <p className="mt-4 text-sm leading-7 text-black/66">
                {subscription.notes || "No operator notes captured for this subscription yet."}
              </p>
            </section>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-black/45">Lifecycle actions</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Change status</h2>
              </div>
              <Power className="size-5 text-black/45" />
            </div>

            <div className="mt-5 grid gap-3">
              {subscriptionStatusOptions.map((status) => (
                <Button
                  className="justify-between rounded-[1.2rem] px-4"
                  disabled={updateSubscription.isPending || status === subscription.status}
                  key={status}
                  onClick={() => {
                    void updateSubscription.mutateAsync({ status: status as SubscriptionStatus });
                  }}
                  type="button"
                  variant={status === subscription.status ? "default" : "outline"}
                >
                  <span className="capitalize">{status}</span>
                  {status === subscription.status ? "Current" : "Apply"}
                </Button>
              ))}
            </div>

            <Button
              className="mt-5 w-full rounded-[1.2rem] bg-ember text-white hover:bg-ember/92"
              disabled={deleteSubscription.isPending}
              onClick={() => setIsDeleteDialogOpen(true)}
              type="button"
            >
              <Trash2 className="mr-2 size-4" />
              Delete subscription
            </Button>
          </section>

          {isEditing ? (
            <SubscriptionForm
              categories={categories}
              description="Update billing details, dates, status, URL, and notes from the dedicated subscription route."
              disabled={categoriesQuery.isLoading || paymentMethodsQuery.isLoading}
              initialSubscription={subscription}
              onCancel={() => setIsEditing(false)}
              onSubmit={async (payload) => {
                await updateSubscription.mutateAsync(payload);
                setIsEditing(false);
              }}
              paymentMethods={paymentMethods}
              submitLabel="Save changes"
              testId="subscription-edit-form"
              title="Edit subscription"
            />
          ) : null}
        </div>
      </div>

      <PaymentTimeline history={paymentHistoryQuery.data} isLoading={paymentHistoryQuery.isLoading} />

      <ConfirmDialog
        confirmLabel={deleteSubscription.isPending ? "Deleting..." : "Delete subscription"}
        description="This removes the subscription from the management workspace and returns you to the list."
        onConfirm={() => {
          void deleteSubscription.mutateAsync().then(() => {
            router.replace("/subscriptions");
          });
        }}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
        title="Delete this subscription?"
        tone="danger"
      />
    </div>
  );
}
