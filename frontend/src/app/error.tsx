"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[linear-gradient(160deg,rgba(250,246,240,0.96),rgba(231,238,244,0.84)_42%,rgba(247,239,228,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(253,180,118,0.16),transparent_24%),linear-gradient(155deg,rgba(10,18,26,0.98),rgba(16,24,35,0.92)_45%,rgba(29,17,9,0.82))]">
        <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16 sm:px-10">
          <section className="w-full rounded-[2.5rem] border border-black/10 bg-white/82 p-8 shadow-line backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-white sm:p-10">
            <div className="inline-flex size-14 items-center justify-center rounded-[1.4rem] border border-black/10 bg-stone text-ink dark:border-white/10 dark:bg-white/10 dark:text-white">
              <AlertTriangle className="size-6" />
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.32em] text-black/45 dark:text-white/45">
              Unexpected error
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ink dark:text-white sm:text-5xl">
              This view broke before the workspace could finish loading.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-black/64 dark:text-white/64">
              Retry the route first. If the error keeps returning, head back to the dashboard or re-open the app from the landing page.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button className="rounded-full px-6" onClick={reset} type="button">
                <RefreshCw className="mr-2 size-4" />
                Try again
              </Button>
              <Button asChild className="rounded-full px-6" variant="outline">
                <Link href="/dashboard">
                  Go to dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
