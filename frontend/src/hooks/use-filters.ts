"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { subscriptionCadenceOptions, subscriptionStatusOptions } from "@/lib/validators";
import type { SubscriptionCadence, SubscriptionFilters, SubscriptionStatus } from "@/types";

export type SubscriptionFilterState = {
  cadence: "all" | SubscriptionCadence;
  categoryId: string;
  maxAmount: string;
  minAmount: string;
  paymentMethodId: string;
  search: string;
  status: "all" | SubscriptionStatus;
};

type UseFiltersOptions = {
  searchDelay?: number;
};

const defaultFilterState: SubscriptionFilterState = {
  cadence: "all",
  categoryId: "all",
  maxAmount: "",
  minAmount: "",
  paymentMethodId: "all",
  search: "",
  status: "all",
};

function sanitizeAmount(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^\d+(?:\.\d{0,2})?$/);
  return match ? match[0] : "";
}

function parseSelectValue(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return "all";
  }

  return value;
}

function parseAmount(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readFilterState(searchParams: { get: (key: string) => string | null }) {
  const status = searchParams.get("status");
  const cadence = searchParams.get("cadence");

  return {
    cadence:
      cadence && subscriptionCadenceOptions.includes(cadence as SubscriptionCadence)
        ? (cadence as SubscriptionFilterState["cadence"])
        : "all",
    categoryId: parseSelectValue(searchParams.get("category_id")),
    maxAmount: sanitizeAmount(searchParams.get("max_amount") ?? ""),
    minAmount: sanitizeAmount(searchParams.get("min_amount") ?? ""),
    paymentMethodId: parseSelectValue(searchParams.get("payment_method_id")),
    search: searchParams.get("search") ?? "",
    status:
      status && subscriptionStatusOptions.includes(status as SubscriptionStatus)
        ? (status as SubscriptionFilterState["status"])
        : "all",
  };
}

function areStatesEqual(left: SubscriptionFilterState, right: SubscriptionFilterState) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergePendingFilterState(
  current: SubscriptionFilterState,
  next: SubscriptionFilterState,
  pendingQueries: string[],
) {
  if (pendingQueries.length === 0) {
    return next;
  }

  const pendingStates = pendingQueries.map((query) => readFilterState(new URLSearchParams(query)));

  const shouldPreserveValue = <Key extends keyof SubscriptionFilterState>(key: Key) =>
    current[key] !== defaultFilterState[key] &&
    next[key] === defaultFilterState[key] &&
    pendingStates.some((state) => state[key] === current[key]);

  return {
    cadence: shouldPreserveValue("cadence") ? current.cadence : next.cadence,
    categoryId: shouldPreserveValue("categoryId") ? current.categoryId : next.categoryId,
    maxAmount: shouldPreserveValue("maxAmount") ? current.maxAmount : next.maxAmount,
    minAmount: shouldPreserveValue("minAmount") ? current.minAmount : next.minAmount,
    paymentMethodId: shouldPreserveValue("paymentMethodId")
      ? current.paymentMethodId
      : next.paymentMethodId,
    search: shouldPreserveValue("search") ? current.search : next.search,
    status: shouldPreserveValue("status") ? current.status : next.status,
  };
}

export function useFilters(options: UseFiltersOptions = {}) {
  const { searchDelay = 300 } = options;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SubscriptionFilterState>(() => readFilterState(searchParams));
  const pendingQuerySyncsRef = useRef<string[]>([]);
  const debouncedSearch = useDebounce(filters.search, searchDelay);
  const effectiveSearch = filters.search.trim() ? debouncedSearch.trim() : "";

  useEffect(() => {
    const currentQuery = searchParams.toString();
    const pendingIndex = pendingQuerySyncsRef.current.indexOf(currentQuery);

    if (pendingIndex !== -1) {
      pendingQuerySyncsRef.current = pendingQuerySyncsRef.current.slice(pendingIndex + 1);
      return;
    }

    const nextFilters = readFilterState(searchParams);
    setFilters((current) => {
      const mergedFilters = mergePendingFilterState(
        current,
        nextFilters,
        pendingQuerySyncsRef.current,
      );
      return areStatesEqual(current, mergedFilters) ? current : mergedFilters;
    });
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());

    const updates: Record<string, string | undefined> = {
      cadence: filters.cadence === "all" ? undefined : filters.cadence,
      category_id: filters.categoryId === "all" ? undefined : filters.categoryId,
      max_amount: filters.maxAmount || undefined,
      min_amount: filters.minAmount || undefined,
      payment_method_id: filters.paymentMethodId === "all" ? undefined : filters.paymentMethodId,
      search: effectiveSearch || undefined,
      status: filters.status === "all" ? undefined : filters.status,
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    }

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    if (pendingQuerySyncsRef.current.at(-1) !== nextQuery) {
      pendingQuerySyncsRef.current.push(nextQuery);
    }

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    });
  }, [
    effectiveSearch,
    filters.cadence,
    filters.categoryId,
    filters.maxAmount,
    filters.minAmount,
    filters.paymentMethodId,
    filters.status,
    pathname,
    router,
    searchParams,
  ]);

  const queryFilters: SubscriptionFilters = {
    cadence: filters.cadence === "all" ? undefined : filters.cadence,
    category_id: filters.categoryId === "all" ? undefined : Number(filters.categoryId),
    max_amount: parseAmount(filters.maxAmount),
    min_amount: parseAmount(filters.minAmount),
    payment_method_id:
      filters.paymentMethodId === "all" ? undefined : Number(filters.paymentMethodId),
    search: effectiveSearch || undefined,
    status: filters.status === "all" ? undefined : filters.status,
  };

  const activeFilterCount = [
    queryFilters.search,
    queryFilters.status,
    queryFilters.category_id,
    queryFilters.payment_method_id,
    queryFilters.cadence,
    queryFilters.min_amount,
    queryFilters.max_amount,
  ].filter((value) => value !== undefined).length;

  return {
    activeFilterCount,
    clearFilters: () => setFilters(defaultFilterState),
    filters,
    hasActiveFilters: activeFilterCount > 0,
    queryFilters,
    setCadence: (value: SubscriptionFilterState["cadence"]) =>
      setFilters((current) => ({ ...current, cadence: value })),
    setCategoryId: (value: string) => setFilters((current) => ({ ...current, categoryId: value })),
    setMaxAmount: (value: string) =>
      setFilters((current) => ({ ...current, maxAmount: sanitizeAmount(value) })),
    setMinAmount: (value: string) =>
      setFilters((current) => ({ ...current, minAmount: sanitizeAmount(value) })),
    setPaymentMethodId: (value: string) =>
      setFilters((current) => ({ ...current, paymentMethodId: value })),
    setSearch: (value: string) => setFilters((current) => ({ ...current, search: value })),
    setStatus: (value: SubscriptionFilterState["status"]) =>
      setFilters((current) => ({ ...current, status: value })),
  };
}
