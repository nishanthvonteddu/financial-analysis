"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createContext, useState } from "react";

import { ThemeProvider } from "@/components/theme-provider";

type AuthContextValue = {
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ isAuthenticated: false }}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
