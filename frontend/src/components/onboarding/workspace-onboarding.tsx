"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, MoonStar, Palette, Sparkles, SunMedium, WalletCards } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";
import { cn } from "@/lib/utils";

const currencyOptions = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "Pound Sterling" },
  { code: "INR", label: "Indian Rupee" },
] as const;

const setupActions = [
  {
    description: "Manual entry with your saved currency already filled in.",
    href: "/subscriptions",
    label: "Add a subscription",
  },
  {
    description: "Pull a statement in and let the queue seed the workspace.",
    href: "/uploads",
    label: "Upload a statement",
  },
  {
    description: "Tune categories, payment rails, and display settings.",
    href: "/settings",
    label: "Open settings",
  },
] as const;

function StepBadge({ currentStep }: { currentStep: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/76 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black/48">
      <span>Setup guide</span>
      <span className="rounded-full bg-[#101922] px-2 py-1 text-[10px] text-white">
        {currentStep + 1}/3
      </span>
    </div>
  );
}

export function WorkspaceOnboarding() {
  const { completeOnboarding, preferredCurrency, setPreferredCurrency } = useOnboarding();
  const { resolvedTheme, setTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [customCurrency, setCustomCurrency] = useState(
    currencyOptions.some((option) => option.code === preferredCurrency) ? "" : preferredCurrency,
  );

  const effectiveCurrency = useMemo(() => {
    const normalized = customCurrency.trim().toUpperCase().slice(0, 3);
    return normalized.length === 3 ? normalized : preferredCurrency;
  }, [customCurrency, preferredCurrency]);

  const stepContent = [
    {
      description: "Pick the currency you want manual entry to suggest first. You can still override any individual plan later.",
      eyebrow: "Currency",
      icon: <WalletCards className="size-5" />,
      title: "Start with the billing code you see most often",
    },
    {
      description: "Choose the shell mood before the workspace fills up. The setting applies immediately and stays available in Settings.",
      eyebrow: "Theme",
      icon: <Palette className="size-5" />,
      title: "Set the visual mode you want to operate in",
    },
    {
      description: "The quickest way to light up the dashboard is either one manual subscription or one uploaded statement. Both paths stay one click away.",
      eyebrow: "Get started",
      icon: <Sparkles className="size-5" />,
      title: "Use the next action that gets real data into the workspace",
    },
  ] as const;

  return (
    <section className="overflow-hidden rounded-[2.25rem] border border-black/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(247,239,230,0.95))] shadow-[0_28px_90px_rgba(17,20,24,0.12)] animate-page-enter">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="border-b border-black/10 p-6 sm:p-7 xl:border-b-0 xl:border-r">
          <StepBadge currentStep={currentStep} />

          <div className="mt-6 max-w-2xl space-y-4">
            <div className="inline-flex size-14 items-center justify-center rounded-[1.4rem] border border-black/10 bg-[#101922] text-white">
              {stepContent[currentStep].icon}
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-black/45">
                {stepContent[currentStep].eyebrow}
              </p>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {stepContent[currentStep].title}
              </h2>
              <p className="max-w-2xl text-base leading-7 text-black/66">
                {stepContent[currentStep].description}
              </p>
            </div>
          </div>

          {currentStep === 0 ? (
            <div className="mt-8 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {currencyOptions.map((option) => {
                  const active = effectiveCurrency === option.code;

                  return (
                    <button
                      className={cn(
                        "rounded-[1.5rem] border px-4 py-4 text-left transition",
                        active
                          ? "border-[#101922] bg-[#101922] text-white"
                          : "border-black/10 bg-white/76 text-ink hover:border-black/20",
                      )}
                      key={option.code}
                      onClick={() => {
                        setCustomCurrency("");
                        setPreferredCurrency(option.code);
                      }}
                      type="button"
                    >
                      <p className="text-xs uppercase tracking-[0.28em] opacity-60">{option.code}</p>
                      <p className="mt-3 text-lg font-semibold">{option.label}</p>
                    </button>
                  );
                })}
              </div>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.28em] text-black/42">Custom code</span>
                <input
                  className="h-12 w-full rounded-[1.1rem] border border-black/10 bg-white/84 px-4 text-sm uppercase text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/20"
                  inputMode="text"
                  maxLength={3}
                  onBlur={() => {
                    if (customCurrency.trim().length === 3) {
                      setPreferredCurrency(customCurrency);
                    }
                  }}
                  onChange={(event) => setCustomCurrency(event.target.value.toUpperCase())}
                  placeholder="AUD"
                  value={customCurrency}
                />
              </label>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  description: "Warm surfaces, higher contrast text, and the default editorial shell.",
                  icon: <SunMedium className="size-5" />,
                  label: "Light mode",
                  theme: "light",
                },
                {
                  description: "Darker backdrop with the same layout, better for lower-light sessions.",
                  icon: <MoonStar className="size-5" />,
                  label: "Dark mode",
                  theme: "dark",
                },
              ].map((option) => {
                const active = resolvedTheme === option.theme;

                return (
                  <button
                    className={cn(
                      "rounded-[1.6rem] border px-5 py-5 text-left transition",
                      active
                        ? "border-[#101922] bg-[#101922] text-white"
                        : "border-black/10 bg-white/80 text-ink hover:border-black/20",
                    )}
                    key={option.theme}
                    onClick={() => setTheme(option.theme)}
                    type="button"
                  >
                    <div className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-current/15 bg-current/10">
                      {option.icon}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{option.label}</h3>
                    <p className={cn("mt-2 text-sm leading-6", active ? "text-white/74" : "text-black/62")}>
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="mt-8 grid gap-4">
              {setupActions.map((action) => (
                <Link
                  className="rounded-[1.6rem] border border-black/10 bg-white/80 px-5 py-5 transition hover:border-black/20 hover:bg-white"
                  href={action.href}
                  key={action.href}
                >
                  <p className="text-lg font-semibold text-ink">{action.label}</p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-black/62">{action.description}</p>
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-black/52">
              Preferred currency: <span className="font-semibold text-ink">{effectiveCurrency}</span>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              {currentStep > 0 ? (
                <Button className="rounded-full px-5" onClick={() => setCurrentStep((step) => step - 1)} type="button" variant="ghost">
                  Back
                </Button>
              ) : null}
              {currentStep < 2 ? (
                <Button
                  className="rounded-full px-5"
                  onClick={() => {
                    if (currentStep === 0 && customCurrency.trim() && customCurrency.trim().length !== 3) {
                      return;
                    }
                    setCurrentStep((step) => step + 1);
                  }}
                  type="button"
                >
                  Continue
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button
                  className="rounded-full px-5"
                  onClick={() => completeOnboarding(effectiveCurrency)}
                  type="button"
                >
                  Finish setup
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="bg-[#101922] p-6 text-white sm:p-7">
          <p className="text-xs uppercase tracking-[0.32em] text-white/42">Why this first</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">A cleaner first run avoids a blank dashboard</h3>
          <p className="mt-3 text-sm leading-6 text-white/68">
            Day 14 is about making the workspace readable before it is full. Save one preference, keep the layout stable, then move into the first real action.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Responsive pass</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Navigation, empty states, and setup actions now compress cleanly from phone widths up through desktop workspace layouts.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Performance pass</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Query cache defaults and skeleton states keep surfaces populated while filters, uploads, and dashboard data refresh.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Next action</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                The dashboard becomes useful after either one manual subscription or one successful statement upload. Both are linked in the final step.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
