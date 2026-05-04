"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthComponent } from "@/components/ui/sign-up";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, register: registerAccount } = useAuth();
  const [serverError, setServerError] = useState<string | undefined>();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async ({ email, password, full_name }: { email: string; password: string; full_name?: string }) => {
    setServerError(undefined);
    try {
      await registerAccount({ email, full_name: full_name ?? email.split("@")[0], password });
      router.replace("/dashboard");
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "A user with that email already exists."
          ? "An account with that email already exists."
          : err instanceof Error
            ? err.message
            : "Could not create your account. Please try again.";
      setServerError(msg);
      throw new Error(msg);
    }
  };

  return <AuthComponent mode="register" onSubmit={handleSubmit} serverError={serverError} />;
}
