"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${nextPath}`);
    }
  }, [isAuthenticated, isReady, pathname, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <LoadingSpinner label={isReady ? "Checking session" : "Restoring session"} size="lg" />
        <p className="text-xs uppercase tracking-[0.28em] text-black/45">
          {isReady ? "Redirecting to secure sign-in" : "Restoring secure workspace"}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
