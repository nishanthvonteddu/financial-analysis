import { z } from "zod";

import type {
  Subscription,
  SubscriptionCadence,
  SubscriptionStatus,
  SubscriptionUpsertInput,
} from "@/types";

export const subscriptionCadenceOptions: SubscriptionCadence[] = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

export const subscriptionStatusOptions: SubscriptionStatus[] = [
  "active",
  "paused",
  "cancelled",
];

const optionalDateField = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")]);
const optionalNumberField = z
  .string()
  .trim()
  .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 31), {
    message: "Choose a day between 1 and 31.",
  });
const optionalSelectField = z.string().trim().refine((value) => value === "" || /^\d+$/.test(value), {
  message: "Select a valid option.",
});
const optionalUrlField = z.string().trim().refine((value) => value === "" || z.url().safeParse(value).success, {
  message: "Enter a valid URL.",
});

export const subscriptionFormSchema = z
  .object({
    amount: z.string().trim().refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "Amount must be greater than zero.",
    }),
    auto_renew: z.boolean(),
    cadence: z.enum(subscriptionCadenceOptions),
    category_id: optionalSelectField,
    currency: z.string().trim().length(3, "Use a 3-letter currency code."),
    day_of_month: optionalNumberField,
    description: z.string().trim(),
    end_date: optionalDateField,
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    next_charge_date: optionalDateField,
    notes: z.string().trim(),
    payment_method_id: optionalSelectField,
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date."),
    status: z.enum(subscriptionStatusOptions),
    vendor: z.string().trim().min(2, "Vendor must be at least 2 characters."),
    website_url: optionalUrlField,
  })
  .superRefine((values, context) => {
    if (values.end_date !== "" && values.end_date < values.start_date) {
      context.addIssue({
        code: "custom",
        message: "End date must be on or after the start date.",
        path: ["end_date"],
      });
    }

    if (values.next_charge_date !== "" && values.next_charge_date < values.start_date) {
      context.addIssue({
        code: "custom",
        message: "Next charge date must be on or after the start date.",
        path: ["next_charge_date"],
      });
    }
  });

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

export function buildSubscriptionFormValues(subscription?: Subscription | null): SubscriptionFormValues {
  if (!subscription) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      amount: "",
      auto_renew: true,
      cadence: "monthly",
      category_id: "",
      currency: "USD",
      day_of_month: "",
      description: "",
      end_date: "",
      name: "",
      next_charge_date: "",
      notes: "",
      payment_method_id: "",
      start_date: today,
      status: "active",
      vendor: "",
      website_url: "",
    };
  }

  return {
    amount: subscription.amount,
    auto_renew: subscription.auto_renew,
    cadence: (subscription.cadence as SubscriptionCadence) ?? "monthly",
    category_id: subscription.category_id ? String(subscription.category_id) : "",
    currency: subscription.currency,
    day_of_month: subscription.day_of_month ? String(subscription.day_of_month) : "",
    description: subscription.description ?? "",
    end_date: subscription.end_date ?? "",
    name: subscription.name,
    next_charge_date: subscription.next_charge_date ?? "",
    notes: subscription.notes ?? "",
    payment_method_id: subscription.payment_method_id ? String(subscription.payment_method_id) : "",
    start_date: subscription.start_date,
    status: (subscription.status as SubscriptionStatus) ?? "active",
    vendor: subscription.vendor,
    website_url: subscription.website_url ?? "",
  };
}

export function toSubscriptionPayload(values: SubscriptionFormValues): SubscriptionUpsertInput {
  const categoryId = values.category_id === "" ? undefined : Number(values.category_id);
  const paymentMethodId = values.payment_method_id === "" ? undefined : Number(values.payment_method_id);
  const dayOfMonth = values.day_of_month === "" ? undefined : Number(values.day_of_month);

  return {
    amount: Number(values.amount).toFixed(2),
    auto_renew: values.auto_renew,
    cadence: values.cadence,
    category_id: categoryId,
    currency: values.currency.trim().toUpperCase(),
    day_of_month: dayOfMonth,
    description: values.description || undefined,
    end_date: values.end_date || undefined,
    name: values.name.trim(),
    next_charge_date: values.next_charge_date || undefined,
    notes: values.notes || undefined,
    payment_method_id: paymentMethodId,
    start_date: values.start_date,
    status: values.status,
    vendor: values.vendor.trim(),
    website_url: values.website_url || undefined,
  };
}
