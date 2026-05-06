"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Component as SignInCard2 } from "@/components/ui/sign-in-card-2";
import { useAuth } from "@/hooks/use-auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(searchParams.get("next") ?? "/dashboard");
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSignIn = async ({ email, password }: { email: string; password: string; remember: boolean }) => {
    try {
      await login({ email, password });
      router.replace(searchParams.get("next") ?? "/dashboard");
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "Invalid email or password."
          ? "That email and password combination did not match."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
      throw new Error(msg);
    }
  };

  return (
    <SignInCard2
      onCreateAccount={() => router.push("/register")}
      onResetPassword={() => {}}
      onSignIn={handleSignIn}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginPageContent />
    </Suspense>
  );
}
