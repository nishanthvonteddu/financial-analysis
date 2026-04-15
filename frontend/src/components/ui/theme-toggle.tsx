"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
  testId?: string;
};

export function ThemeToggle({ className, compact = false, testId }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = mounted ? `Switch to ${nextTheme} mode` : "Toggle theme";

  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 text-sm font-medium text-ink transition hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/35 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/14",
        compact && "w-11 px-0",
        className,
      )}
      data-testid={testId}
      onClick={() => setTheme(nextTheme)}
      title={label}
      type="button"
    >
      {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
      <span className={cn(compact && "sr-only")}>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
