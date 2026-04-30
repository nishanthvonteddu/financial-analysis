import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MySubscription Tracker handles account, subscription, upload, notification, and household data.",
};

const sections = [
  {
    body: "We collect account details, subscription records, uploaded statement files, parsed transaction data, settings, notification preferences, and family sharing choices that you provide while using the workspace.",
    title: "Information we handle",
  },
  {
    body: "We use workspace data to authenticate access, detect recurring charges, show renewal and analytics views, generate exports, deliver reminders, and keep household sharing controls working.",
    title: "How the product uses data",
  },
  {
    body: "Uploaded files are used for parsing and detection. Parsed transaction data stays scoped to the authenticated user and powers reports, dashboards, and subscription suggestions.",
    title: "Uploads and parsing",
  },
  {
    body: "Security controls include authenticated access, refreshable sessions, CSRF checks for browser state changes, request size limits, rate limiting, private cache headers, and encrypted sensitive notification fields.",
    title: "Security controls",
  },
  {
    body: "Family features only share household metrics according to membership and privacy settings. Members can leave a family workspace, and privacy controls can limit shared plan visibility.",
    title: "Family sharing",
  },
  {
    body: "You can export subscription data from the exports workspace and delete workspace-owned data from settings. Some operational logs and required security records may remain for service integrity.",
    title: "Choices and deletion",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(231,237,242,0.72)),hsl(var(--background))] px-6 py-8 text-ink dark:bg-[linear-gradient(180deg,rgba(10,16,24,0.98),rgba(17,24,33,0.96))] dark:text-white sm:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <Link className="font-serif text-2xl tracking-tight" href="/">
            MySubscription Tracker
          </Link>
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Back home
            </Link>
          </Button>
        </header>

        <section className="py-16 sm:py-20">
          <div className="inline-flex size-14 items-center justify-center rounded-[1.25rem] border border-black/10 bg-white/70 shadow-line dark:border-white/10 dark:bg-white/10">
            <ShieldCheck className="size-6" />
          </div>
          <p className="mt-8 text-xs uppercase tracking-[0.32em] text-black/45 dark:text-white/45">
            Privacy policy
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.96] sm:text-6xl">
            Workspace data stays scoped to the subscription work you ask the product to do.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-black/66 dark:text-white/66">
            This policy summarizes the data handled by the current product surface. It is written
            for the application in this repository and should be reviewed before production launch
            with the final hosting, support, and legal ownership details.
          </p>
        </section>

        <section className="grid gap-5 pb-16 md:grid-cols-2">
          {sections.map((section) => (
            <article
              className="border-t border-black/10 py-6 dark:border-white/10"
              key={section.title}
            >
              <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-black/64 dark:text-white/64">
                {section.body}
              </p>
            </article>
          ))}
        </section>

        <footer className="border-t border-black/10 py-8 text-sm text-black/58 dark:border-white/10 dark:text-white/58">
          Last updated: April 30, 2026
        </footer>
      </div>
    </main>
  );
}
