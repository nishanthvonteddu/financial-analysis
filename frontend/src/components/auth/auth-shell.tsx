import Link from "next/link";
import type { ReactNode } from "react";

import { APP_NAME } from "@/lib/constants";

type AuthShellProps = {
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

const cues = [
  "Access the dashboard, then move into manual entry and uploads without re-authing.",
  "Keep the session in memory and refresh tokens quietly before the access window closes.",
  "Treat auth as a working surface, not a marketing detour.",
];

export function AuthShell({
  alternateHref,
  alternateLabel,
  alternateText,
  children,
  description,
  eyebrow,
  title,
}: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(244,202,174,0.32),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.8),rgba(232,238,242,0.72)),hsl(var(--background))]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between border-b border-black/10 px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-10">
          <header className="animate-page-enter space-y-4">
            <div>
              <p className="font-serif text-3xl tracking-tight text-ink">{APP_NAME}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.34em] text-black/45">{eyebrow}</p>
            </div>
            <div className="max-w-xl space-y-4">
              <h1 className="font-serif text-5xl leading-none text-ink sm:text-6xl">
                {title}
              </h1>
              <p className="max-w-lg text-base leading-7 text-black/68 sm:text-lg">{description}</p>
            </div>
          </header>

          <div className="animate-page-enter-delayed space-y-6">
            <div className="grid gap-4 border-t border-black/10 pt-6 sm:grid-cols-3 sm:gap-6">
              {cues.map((cue) => (
                <p key={cue} className="text-sm leading-6 text-black/62">
                  {cue}
                </p>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-black/10 pt-5 text-sm text-black/55">
              <Link href="/" className="transition-colors hover:text-ink">
                Back to home
              </Link>
              <div className="space-x-2">
                <span>{alternateText}</span>
                <Link href={alternateHref} className="font-medium text-ink transition-colors hover:text-ember">
                  {alternateLabel}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="animate-page-enter max-w-md flex-1 border-t border-black/10 pt-10">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
