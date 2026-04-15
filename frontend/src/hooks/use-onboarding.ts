"use client";

import { useContext } from "react";

import { OnboardingContext } from "@/components/providers/onboarding-provider";

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (context === null) {
    throw new Error("useOnboarding must be used within OnboardingProvider.");
  }

  return context;
}
