"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const providerDomains: Record<string, string> = {
  amex: "americanexpress.com",
  bank_of_america: "bankofamerica.com",
  capital_one: "capitalone.com",
  chase: "chase.com",
  citi: "citi.com",
  wells_fargo: "wellsfargo.com",
};

function formatProvider(provider: string) {
  if (provider === "pending") {
    return "Pending source";
  }

  return provider
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fallbackTone(provider: string) {
  const tones = [
    "from-[#111827] to-[#334155]",
    "from-[#7c2d12] to-[#ea580c]",
    "from-[#14532d] to-[#22c55e]",
    "from-[#1d4ed8] to-[#60a5fa]",
    "from-[#4c1d95] to-[#a78bfa]",
  ];

  const hash = Array.from(provider).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

type ServiceLogoProps = {
  provider: string;
  size?: "lg" | "md" | "sm";
};

export function ServiceLogo({ provider, size = "md" }: ServiceLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const normalizedProvider = provider.toLowerCase();

  useEffect(() => {
    setImageFailed(false);
  }, [normalizedProvider]);

  const label = useMemo(() => formatProvider(normalizedProvider), [normalizedProvider]);
  const domain = providerDomains[normalizedProvider];
  const initials = label
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const sizeClasses = {
    lg: "size-14 rounded-[1.35rem] text-base",
    md: "size-12 rounded-2xl text-sm",
    sm: "size-10 rounded-xl text-xs",
  }[size];

  if (domain && !imageFailed) {
    return (
      <div
        aria-label={`${label} logo`}
        className={cn(
          "overflow-hidden border border-black/10 bg-white shadow-[0_18px_32px_rgba(15,23,42,0.08)]",
          sizeClasses,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Clearbit is a remote logo source and this fallback path only needs a lightweight image tag. */}
        <img
          alt={`${label} logo`}
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
          src={`https://logo.clearbit.com/${domain}`}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`${label} fallback`}
      className={cn(
        "inline-flex items-center justify-center border border-black/10 bg-gradient-to-br font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_32px_rgba(15,23,42,0.08)]",
        fallbackTone(normalizedProvider),
        sizeClasses,
      )}
    >
      {initials || "MS"}
    </div>
  );
}
