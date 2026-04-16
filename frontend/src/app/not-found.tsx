import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16 sm:px-10">
      <section className="grid w-full gap-8 rounded-[2.6rem] border border-black/10 bg-white/82 p-8 shadow-line backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-white sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_auto] lg:items-end">
        <div>
          <div className="inline-flex size-14 items-center justify-center rounded-[1.4rem] border border-black/10 bg-stone text-ink dark:border-white/10 dark:bg-white/10 dark:text-white">
            <Compass className="size-6" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.32em] text-black/45 dark:text-white/45">
            Page not found
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-ink dark:text-white sm:text-5xl">
            The route you asked for is outside the current subscription workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-black/64 dark:text-white/64">
            Use the dashboard to get back to the live product surface, or start from the landing page if you meant to sign in or create an account.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 lg:justify-end">
          <Button asChild className="rounded-full px-6">
            <Link href="/dashboard">
              Open dashboard
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild className="rounded-full px-6" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
