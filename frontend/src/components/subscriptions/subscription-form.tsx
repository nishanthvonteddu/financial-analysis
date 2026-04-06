"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  buildSubscriptionFormValues,
  subscriptionCadenceOptions,
  subscriptionFormSchema,
  subscriptionStatusOptions,
  toSubscriptionPayload,
  type SubscriptionFormValues,
} from "@/lib/validators";
import type { Category, PaymentMethod, Subscription, SubscriptionUpsertInput } from "@/types";

type SubscriptionFormProps = {
  categories: Category[];
  description: string;
  disabled?: boolean;
  initialSubscription?: Subscription | null;
  onCancel?: () => void;
  onSubmit: (payload: SubscriptionUpsertInput) => Promise<void>;
  paymentMethods: PaymentMethod[];
  submitLabel: string;
  title: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-ember">{message}</p>;
}

export function SubscriptionForm({
  categories,
  description,
  disabled = false,
  initialSubscription,
  onCancel,
  onSubmit,
  paymentMethods,
  submitLabel,
  title,
}: SubscriptionFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<SubscriptionFormValues>({
    defaultValues: buildSubscriptionFormValues(initialSubscription),
    resolver: zodResolver(subscriptionFormSchema),
  });

  useEffect(() => {
    reset(buildSubscriptionFormValues(initialSubscription));
  }, [initialSubscription, reset]);

  const isWorking = disabled || isSubmitting;

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
      <div className="space-y-3 border-b border-black/10 pb-5">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">
          {initialSubscription ? "Edit subscription" : "Manual entry"}
        </p>
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        <p className="text-sm leading-6 text-black/62">{description}</p>
      </div>

      <form
        className="space-y-6 pt-6"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(toSubscriptionPayload(values));
          if (!initialSubscription) {
            reset(buildSubscriptionFormValues());
          }
        })}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-name">
              Subscription name
            </label>
            <input
              id="subscription-name"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              placeholder="Netflix Family"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-vendor">
              Vendor
            </label>
            <input
              id="subscription-vendor"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              placeholder="Netflix"
              {...register("vendor")}
            />
            <FieldError message={errors.vendor?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-amount">
              Amount
            </label>
            <input
              id="subscription-amount"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              inputMode="decimal"
              placeholder="15.49"
              {...register("amount")}
            />
            <FieldError message={errors.amount?.message} />
          </div>

          <div className="grid gap-5 grid-cols-[120px_minmax(0,1fr)]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="subscription-currency">
                Currency
              </label>
              <input
                id="subscription-currency"
                className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm uppercase text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                maxLength={3}
                placeholder="USD"
                {...register("currency")}
              />
              <FieldError message={errors.currency?.message} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="subscription-cadence">
                Frequency
              </label>
              <select
                id="subscription-cadence"
                className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm capitalize text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                {...register("cadence")}
              >
                {subscriptionCadenceOptions.map((option) => (
                  <option className="capitalize" key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-status">
              Status
            </label>
            <select
              id="subscription-status"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm capitalize text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              {...register("status")}
            >
              {subscriptionStatusOptions.map((option) => (
                <option className="capitalize" key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-day-of-month">
              Billing day
            </label>
            <input
              id="subscription-day-of-month"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              inputMode="numeric"
              placeholder="1"
              {...register("day_of_month")}
            />
            <FieldError message={errors.day_of_month?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-start-date">
              Start date
            </label>
            <input
              id="subscription-start-date"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              type="date"
              {...register("start_date")}
            />
            <FieldError message={errors.start_date?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-next-charge-date">
              Next charge date
            </label>
            <input
              id="subscription-next-charge-date"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              type="date"
              {...register("next_charge_date")}
            />
            <FieldError message={errors.next_charge_date?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-end-date">
              End date
            </label>
            <input
              id="subscription-end-date"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              type="date"
              {...register("end_date")}
            />
            <FieldError message={errors.end_date?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-category">
              Category
            </label>
            <select
              id="subscription-category"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              {...register("category_id")}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-payment-method">
              Payment method
            </label>
            <select
              id="subscription-payment-method"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              {...register("payment_method_id")}
            >
              <option value="">No payment method</option>
              {paymentMethods.map((paymentMethod) => (
                <option key={paymentMethod.id} value={String(paymentMethod.id)}>
                  {paymentMethod.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-website-url">
              Website URL
            </label>
            <input
              id="subscription-website-url"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              placeholder="https://www.netflix.com"
              type="url"
              {...register("website_url")}
            />
            <FieldError message={errors.website_url?.message} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-description">
              Description
            </label>
            <textarea
              id="subscription-description"
              className="min-h-24 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 py-3 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              placeholder="What this plan covers, household usage, or why it exists."
              {...register("description")}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-ink" htmlFor="subscription-notes">
              Notes
            </label>
            <textarea
              id="subscription-notes"
              className="min-h-28 w-full rounded-[1rem] border border-black/10 bg-white/82 px-4 py-3 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              placeholder="Capture support info, family sharing notes, or cancellation context."
              {...register("notes")}
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-[1.2rem] border border-black/10 bg-stone/65 px-4 py-4 text-sm text-black/70">
          <input className="mt-1 size-4 rounded border-black/20" type="checkbox" {...register("auto_renew")} />
          <span>
            <span className="block font-medium text-ink">Auto renew enabled</span>
            <span className="mt-1 block">Keep this on when the subscription renews automatically each cycle.</span>
          </span>
        </label>

        {errors.root ? <FieldError message={errors.root.message} /> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-black/52">
            {categories.length === 0 && paymentMethods.length === 0
              ? "Categories and payment methods are optional until those catalogs are populated."
              : "Use the detail page after save to change status or remove a plan."}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            {onCancel ? (
              <Button onClick={onCancel} type="button" variant="outline">
                Cancel
              </Button>
            ) : null}
            <Button className="rounded-full px-6" disabled={isWorking} type="submit">
              {isWorking ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
