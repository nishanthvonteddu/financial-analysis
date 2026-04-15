"use client";

import type { ReactNode } from "react";
import { createContext, useEffect, useState } from "react";

import { ONBOARDING_STORAGE_KEY } from "@/lib/constants";

type OnboardingState = {
  completedAt: string | null;
  preferredCurrency: string;
};

export type OnboardingContextValue = {
  completeOnboarding: (preferredCurrency?: string) => void;
  isComplete: boolean;
  isReady: boolean;
  preferredCurrency: string;
  resetOnboarding: () => void;
  setPreferredCurrency: (currency: string) => void;
};

const defaultOnboardingState: OnboardingState = {
  completedAt: null,
  preferredCurrency: "USD",
};

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function normalizeCurrency(value: string | undefined) {
  const normalized = value?.trim().toUpperCase().slice(0, 3) ?? "";
  return normalized.length === 3 ? normalized : "USD";
}

function isOnboardingState(value: unknown): value is OnboardingState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<OnboardingState>;
  return (
    (state.completedAt === null || typeof state.completedAt === "string") &&
    typeof state.preferredCurrency === "string"
  );
}

function readStoredOnboardingState() {
  if (typeof window === "undefined") {
    return defaultOnboardingState;
  }

  const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!stored) {
    return defaultOnboardingState;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (isOnboardingState(parsed)) {
      return {
        completedAt: parsed.completedAt,
        preferredCurrency: normalizeCurrency(parsed.preferredCurrency),
      };
    }
  } catch {
    // Fall through to clearing malformed data.
  }

  window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  return defaultOnboardingState;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultOnboardingState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setState(readStoredOnboardingState());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  }, [isReady, state]);

  const value: OnboardingContextValue = {
    completeOnboarding: (preferredCurrency) => {
      setState((current) => ({
        completedAt: new Date().toISOString(),
        preferredCurrency: normalizeCurrency(preferredCurrency ?? current.preferredCurrency),
      }));
    },
    isComplete: Boolean(state.completedAt),
    isReady,
    preferredCurrency: state.preferredCurrency,
    resetOnboarding: () => setState(defaultOnboardingState),
    setPreferredCurrency: (currency) => {
      setState((current) => ({
        ...current,
        preferredCurrency: normalizeCurrency(currency),
      }));
    },
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
