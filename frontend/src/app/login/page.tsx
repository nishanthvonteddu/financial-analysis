"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SignInPage } from "@/components/ui/sign-in";
import { useAuth } from "@/hooks/use-auth";

const TESTIMONIALS = [
  {
    quote: "I uploaded three months of statements and finally understood why I was always broke two weeks before payday. Turns out, subscriptions.",
    author: "Maya R.",
    role: "Freelance designer",
  },
  {
    quote: "FinSight found a $94/month charge I forgot about from 2022. Paid for itself in the first login.",
    author: "Daniel K.",
    role: "Software engineer",
  },
  {
    quote: "I've tried every budgeting app. This is the first one that actually shows me patterns instead of just totals.",
    author: "Priya S.",
    role: "Product manager",
  },
];

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
    <SignInPage
      description="Sign in to your FinSight workspace and pick up right where you left off."
      heroImageSrc="/financial-dashboard-reference.jpg"
      onCreateAccount={() => router.push("/register")}
      onResetPassword={() => {}}
      onSignIn={handleSignIn}
      testimonials={TESTIMONIALS}
      title="Your numbers are waiting."
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
