"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { CreditCard, FolderTree, PencilLine, ShieldAlert, Trash2, UserRound } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  useCreateCategory,
  useCreatePaymentMethod,
  useDeleteCategory,
  useDeletePaymentMethod,
  useDeleteWorkspaceData,
  useSubscriptionCatalog,
  useSubscriptionList,
  useUpdateCategory,
  useUpdatePaymentMethod,
} from "@/hooks/use-subscriptions";
import type { Category, PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type CategoryDraft = {
  description: string;
  name: string;
};

type PaymentMethodDraft = {
  is_default: boolean;
  label: string;
  last4: string;
  provider: string;
};

const emptyCategoryDraft: CategoryDraft = {
  description: "",
  name: "",
};

const emptyPaymentMethodDraft: PaymentMethodDraft = {
  is_default: false,
  label: "",
  last4: "",
  provider: "",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

function getCurrencySummary(currencies: string[], preferredCurrency: string) {
  if (currencies.length === 0) {
    return {
      detail: `No saved subscriptions yet. New plans default to ${preferredCurrency} until live billing data takes over.`,
      label: preferredCurrency,
    };
  }

  const counts = new Map<string, number>();
  for (const currency of currencies) {
    counts.set(currency, (counts.get(currency) ?? 0) + 1);
  }

  const [label, count] = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  return {
    detail: `${count} of ${currencies.length} saved subscriptions currently bill in ${label}.`,
    label,
  };
}

function SectionShell({
  children,
  description,
  icon,
  title,
}: Readonly<{
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}>) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
      <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-black/42">Settings block</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/62">{description}</p>
        </div>
        <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-black/10 bg-stone text-ink">
          {icon}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { preferredCurrency } = useOnboarding();
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft);
  const [paymentMethodDraft, setPaymentMethodDraft] = useState<PaymentMethodDraft>(emptyPaymentMethodDraft);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCategoryDraft, setEditingCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [editingPaymentMethodDraft, setEditingPaymentMethodDraft] =
    useState<PaymentMethodDraft>(emptyPaymentMethodDraft);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { categoriesQuery, paymentMethodsQuery } = useSubscriptionCatalog();
  const subscriptionsQuery = useSubscriptionList({ limit: 100 });
  const createCategory = useCreateCategory();
  const createPaymentMethod = useCreatePaymentMethod();
  const deleteWorkspaceData = useDeleteWorkspaceData();
  const editingCategoryMutation = useUpdateCategory();
  const deletingCategoryMutation = useDeleteCategory();
  const editingPaymentMethodMutation = useUpdatePaymentMethod();
  const deletingPaymentMethodMutation = useDeletePaymentMethod();

  const categories = categoriesQuery.data?.items ?? [];
  const paymentMethods = paymentMethodsQuery.data?.items ?? [];
  const currencySummary = useMemo(
    () =>
      getCurrencySummary(
        (subscriptionsQuery.data?.items ?? []).map((subscription) => subscription.currency),
        preferredCurrency,
      ),
    [preferredCurrency, subscriptionsQuery.data?.items],
  );

  const isCatalogLoading = categoriesQuery.isLoading || paymentMethodsQuery.isLoading;

  const openCategoryEditor = (category: Category) => {
    setEditingCategory(category);
    setEditingCategoryDraft({
      description: category.description ?? "",
      name: category.name,
    });
  };

  const openPaymentMethodEditor = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setEditingPaymentMethodDraft({
      is_default: paymentMethod.is_default,
      label: paymentMethod.label,
      last4: paymentMethod.last4 ?? "",
      provider: paymentMethod.provider,
    });
  };

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={<ThemeToggle />}
        description="Keep shared billing metadata tidy, manage payment rails, and control the workspace profile without leaving the authenticated shell."
        eyebrow="Settings"
        title="Settings and workspace profile"
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SectionShell
          description="Rename taxonomy, add fresh buckets for new services, and prune categories without leaving the operator workspace."
          icon={<FolderTree className="size-5" />}
          title="Categories management"
        >
          <form
            id="settings-category-create"
            className="grid gap-3 rounded-[1.6rem] border border-black/10 bg-stone/55 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto]"
            onSubmit={async (event) => {
              event.preventDefault();
              await createCategory.mutateAsync({
                description: categoryDraft.description || undefined,
                name: categoryDraft.name,
              });
              setCategoryDraft(emptyCategoryDraft);
            }}
          >
            <input
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              onChange={(event) =>
                setCategoryDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Add a category name"
              value={categoryDraft.name}
            />
            <input
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              onChange={(event) =>
                setCategoryDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Optional description"
              value={categoryDraft.description}
            />
            <Button className="rounded-full px-5" disabled={createCategory.isPending} type="submit">
              {createCategory.isPending ? "Saving..." : "Add category"}
            </Button>
          </form>

          {createCategory.error ? (
            <p className="mt-3 text-sm text-ember">{getErrorMessage(createCategory.error)}</p>
          ) : null}

          <div className="mt-5 space-y-3">
            {categoriesQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div className="rounded-[1.5rem] border border-black/10 bg-white/85 p-4" key={index}>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-3 h-4 w-10/12" />
                  <div className="mt-5 flex gap-2">
                    <Skeleton className="h-9 w-20 rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                  </div>
                </div>
              ))
            ) : categories.length === 0 ? (
              <EmptyState
                action={
                  <Button asChild className="rounded-full px-5" variant="outline">
                    <a href="#settings-category-create">Add the first category</a>
                  </Button>
                }
                description="Categories help the dashboard and search filters read like an operating tool instead of a raw list."
                eyebrow="Category setup"
                icon={<FolderTree className="size-5" />}
                title="No categories yet."
              />
            ) : (
              categories.map((category) => {
                const isEditing = editingCategory?.id === category.id;

                return (
                  <div
                    className="rounded-[1.5rem] border border-black/10 bg-white/85 p-4"
                    key={category.id}
                  >
                    {isEditing ? (
                      <form
                        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto_auto]"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (!editingCategory) {
                            return;
                          }
                          await editingCategoryMutation.mutateAsync({
                            categoryId: editingCategory.id,
                            payload: {
                              description: editingCategoryDraft.description || undefined,
                              name: editingCategoryDraft.name,
                            },
                          });
                          setEditingCategory(null);
                        }}
                      >
                        <input
                          className="h-11 rounded-2xl border border-black/10 bg-stone/35 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                          onChange={(event) =>
                            setEditingCategoryDraft((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          value={editingCategoryDraft.name}
                        />
                        <input
                          className="h-11 rounded-2xl border border-black/10 bg-stone/35 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                          onChange={(event) =>
                            setEditingCategoryDraft((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          value={editingCategoryDraft.description}
                        />
                        <Button disabled={editingCategoryMutation.isPending} type="submit" variant="outline">
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingCategory(null)}
                          type="button"
                          variant="ghost"
                        >
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-ink">{category.name}</h3>
                          <p className="mt-1 text-sm text-black/58">
                            {category.description || "No description yet."}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            className="rounded-full"
                            onClick={() => openCategoryEditor(category)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <PencilLine className="mr-2 size-4" />
                            Edit
                          </Button>
                          <Button
                            className="rounded-full"
                            onClick={async () => deletingCategoryMutation.mutateAsync(category.id)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {isEditing && editingCategoryMutation.error ? (
                      <p className="mt-3 text-sm text-ember">
                        {getErrorMessage(editingCategoryMutation.error)}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </SectionShell>

        <SectionShell
          description="Add, rename, and retire payment methods while keeping the default card obvious for future billing flows."
          icon={<CreditCard className="size-5" />}
          title="Payment methods management"
        >
          <form
            id="settings-payment-method-create"
            className="grid gap-3 rounded-[1.6rem] border border-black/10 bg-stone/55 p-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              await createPaymentMethod.mutateAsync({
                is_default: paymentMethodDraft.is_default,
                label: paymentMethodDraft.label,
                last4: paymentMethodDraft.last4 || undefined,
                provider: paymentMethodDraft.provider,
              });
              setPaymentMethodDraft(emptyPaymentMethodDraft);
            }}
          >
            <input
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              onChange={(event) =>
                setPaymentMethodDraft((current) => ({ ...current, label: event.target.value }))
              }
              placeholder="Label"
              value={paymentMethodDraft.label}
            />
            <input
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              onChange={(event) =>
                setPaymentMethodDraft((current) => ({ ...current, provider: event.target.value }))
              }
              placeholder="Provider"
              value={paymentMethodDraft.provider}
            />
            <input
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              inputMode="numeric"
              maxLength={4}
              onChange={(event) =>
                setPaymentMethodDraft((current) => ({
                  ...current,
                  last4: event.target.value.replace(/\D/g, "").slice(0, 4),
                }))
              }
              placeholder="Last 4 digits"
              value={paymentMethodDraft.last4}
            />
            <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4">
              <label className="text-sm font-medium text-ink" htmlFor="payment-method-default">
                Mark as default
              </label>
              <input
                checked={paymentMethodDraft.is_default}
                id="payment-method-default"
                onChange={(event) =>
                  setPaymentMethodDraft((current) => ({
                    ...current,
                    is_default: event.target.checked,
                  }))
                }
                type="checkbox"
              />
            </div>
            <Button
              className="rounded-full px-5 md:col-span-2 md:justify-self-start"
              disabled={createPaymentMethod.isPending}
              type="submit"
            >
              {createPaymentMethod.isPending ? "Saving..." : "Add payment method"}
            </Button>
          </form>

          {createPaymentMethod.error ? (
            <p className="mt-3 text-sm text-ember">{getErrorMessage(createPaymentMethod.error)}</p>
          ) : null}

          <div className="mt-5 space-y-3">
            {paymentMethodsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div className="rounded-[1.5rem] border border-black/10 bg-white/85 p-4" key={index}>
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="mt-3 h-4 w-32" />
                  <div className="mt-5 flex gap-2">
                    <Skeleton className="h-9 w-20 rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                  </div>
                </div>
              ))
            ) : paymentMethods.length === 0 ? (
              <EmptyState
                action={
                  <Button asChild className="rounded-full px-5" variant="outline">
                    <a href="#settings-payment-method-create">Add the first payment rail</a>
                  </Button>
                }
                description="Save the primary billing rail here so upcoming plan management and alerting flows already have a default instrument to reference."
                eyebrow="Billing setup"
                icon={<CreditCard className="size-5" />}
                title="No payment methods yet."
              />
            ) : (
              paymentMethods.map((paymentMethod) => {
                const isEditing = editingPaymentMethod?.id === paymentMethod.id;

                return (
                  <div
                    className="rounded-[1.5rem] border border-black/10 bg-white/85 p-4"
                    key={paymentMethod.id}
                  >
                    {isEditing ? (
                      <form
                        className="grid gap-3 md:grid-cols-2"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (!editingPaymentMethod) {
                            return;
                          }
                          await editingPaymentMethodMutation.mutateAsync({
                            paymentMethodId: editingPaymentMethod.id,
                            payload: {
                              is_default: editingPaymentMethodDraft.is_default,
                              label: editingPaymentMethodDraft.label,
                              last4: editingPaymentMethodDraft.last4 || undefined,
                              provider: editingPaymentMethodDraft.provider,
                            },
                          });
                          setEditingPaymentMethod(null);
                        }}
                      >
                        <input
                          className="h-11 rounded-2xl border border-black/10 bg-stone/35 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                          onChange={(event) =>
                            setEditingPaymentMethodDraft((current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                          value={editingPaymentMethodDraft.label}
                        />
                        <input
                          className="h-11 rounded-2xl border border-black/10 bg-stone/35 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                          onChange={(event) =>
                            setEditingPaymentMethodDraft((current) => ({
                              ...current,
                              provider: event.target.value,
                            }))
                          }
                          value={editingPaymentMethodDraft.provider}
                        />
                        <input
                          className="h-11 rounded-2xl border border-black/10 bg-stone/35 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                          inputMode="numeric"
                          maxLength={4}
                          onChange={(event) =>
                            setEditingPaymentMethodDraft((current) => ({
                              ...current,
                              last4: event.target.value.replace(/\D/g, "").slice(0, 4),
                            }))
                          }
                          value={editingPaymentMethodDraft.last4}
                        />
                        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-stone/35 px-4">
                          <label
                            className="text-sm font-medium text-ink"
                            htmlFor={`payment-default-${paymentMethod.id}`}
                          >
                            Default card
                          </label>
                          <input
                            checked={editingPaymentMethodDraft.is_default}
                            id={`payment-default-${paymentMethod.id}`}
                            onChange={(event) =>
                              setEditingPaymentMethodDraft((current) => ({
                                ...current,
                                is_default: event.target.checked,
                              }))
                            }
                            type="checkbox"
                          />
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                          <Button disabled={editingPaymentMethodMutation.isPending} type="submit" variant="outline">
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingPaymentMethod(null)}
                            type="button"
                            variant="ghost"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-ink">{paymentMethod.label}</h3>
                            {paymentMethod.is_default ? (
                              <span className="rounded-full border border-black/10 bg-stone px-3 py-1 text-xs uppercase tracking-[0.24em] text-black/48">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-black/58">
                            {paymentMethod.provider}
                            {paymentMethod.last4 ? ` •••• ${paymentMethod.last4}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            className="rounded-full"
                            onClick={() => openPaymentMethodEditor(paymentMethod)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <PencilLine className="mr-2 size-4" />
                            Edit
                          </Button>
                          <Button
                            className="rounded-full"
                            onClick={async () =>
                              deletingPaymentMethodMutation.mutateAsync(paymentMethod.id)
                            }
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {isEditing && editingPaymentMethodMutation.error ? (
                      <p className="mt-3 text-sm text-ember">
                        {getErrorMessage(editingPaymentMethodMutation.error)}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </SectionShell>
      </div>

      <SectionShell
        description="Surface the active operator identity, keep the visual theme accessible, and provide a deliberate destructive path for wiping workspace-owned records."
        icon={<UserRound className="size-5" />}
        title="Profile and workspace controls"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4 rounded-[1.6rem] border border-black/10 bg-stone/55 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/42">Signed in as</p>
              <h3 className="mt-2 text-xl font-semibold text-ink">{user?.full_name ?? "Workspace operator"}</h3>
              <p className="mt-1 text-sm text-black/58">{user?.email ?? "No email available"}</p>
            </div>

            <div className="rounded-[1.35rem] border border-black/10 bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Workspace currency</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{currencySummary.label}</p>
              <p className="mt-2 text-sm leading-6 text-black/58">{currencySummary.detail}</p>
            </div>

            {categories.length === 0 && paymentMethods.length === 0 ? (
              <EmptyState
                action={
                  <Button asChild className="rounded-full px-5" variant="outline">
                    <Link href="/dashboard">Return to setup guide</Link>
                  </Button>
                }
                className="rounded-[1.35rem] bg-white/82 p-4 shadow-none"
                description="This workspace is still in first-run mode. Finish the dashboard setup guide or seed categories and payment rails here."
                eyebrow="First-run workspace"
                title="Settings is ready for initial setup."
              />
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-black/10 bg-white/85 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-black/42">Theme mode</p>
              <h3 className="mt-2 text-xl font-semibold text-ink">Display preference</h3>
              <p className="mt-2 text-sm leading-6 text-black/58">
                Toggle the shell between light and dark modes without leaving the workspace.
              </p>
              <div className="mt-4">
                <ThemeToggle testId="settings-theme-toggle" />
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-ember/20 bg-[rgba(255,241,234,0.88)] p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-5 text-ember" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/42">Danger zone</p>
                  <h3 className="mt-2 text-xl font-semibold text-ink">Delete workspace data</h3>
                  <p className="mt-2 text-sm leading-6 text-black/58">
                    Removes subscriptions, payment methods, uploads, raw transactions, payment history, and saved dashboard layout for this user.
                  </p>
                </div>
              </div>

              <Button
                className="mt-5 rounded-full bg-ember px-5 text-white hover:bg-ember/92"
                disabled={deleteWorkspaceData.isPending || isCatalogLoading}
                onClick={() => setIsDeleteDialogOpen(true)}
                type="button"
              >
                <Trash2 className="mr-2 size-4" />
                Delete workspace data
              </Button>

              {deleteWorkspaceData.error ? (
                <p className="mt-3 text-sm text-ember">{getErrorMessage(deleteWorkspaceData.error)}</p>
              ) : null}
            </div>
          </div>
        </div>
      </SectionShell>

      <ConfirmDialog
        confirmLabel={deleteWorkspaceData.isPending ? "Deleting..." : "Delete data"}
        description="This clears saved subscriptions, payment rails, upload history, raw transactions, payment history, and dashboard layout for the current user."
        onConfirm={() => {
          void deleteWorkspaceData.mutateAsync().then(() => {
            setIsDeleteDialogOpen(false);
          });
        }}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
        title="Delete all workspace data?"
        tone="danger"
      />
    </div>
  );
}
