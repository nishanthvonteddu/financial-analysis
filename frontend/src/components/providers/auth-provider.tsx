"use client";

import type { ReactNode } from "react";
import { createContext, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { AuthResponse, LoginInput, RegisterInput, User } from "@/types";

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  user: User | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function getRefreshDelay(expiresAt: string): number {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  if (Number.isNaN(remainingMs)) {
    return 5_000;
  }

  return Math.max(remainingMs - 30_000, 1_000);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const applySession = (nextSession: AuthResponse) => {
    setSession(nextSession);
  };

  const logout = () => {
    setSession(null);
  };

  useEffect(() => {
    if (!session?.refresh_token) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsRefreshing(true);
        try {
          const nextSession = await apiClient.refresh(session.refresh_token);
          applySession(nextSession);
        } catch {
          logout();
        } finally {
          setIsRefreshing(false);
        }
      })();
    }, getRefreshDelay(session.access_token_expires_at));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [session]);

  const value: AuthContextValue = {
    accessToken: session?.access_token ?? null,
    isAuthenticated: Boolean(session?.access_token),
    isRefreshing,
    login: async (input: LoginInput) => {
      const nextSession = await apiClient.login(input);
      applySession(nextSession);
    },
    logout,
    refreshSession: async () => {
      if (!session?.refresh_token) {
        return;
      }

      setIsRefreshing(true);
      try {
        const nextSession = await apiClient.refresh(session.refresh_token);
        applySession(nextSession);
      } catch {
        logout();
      } finally {
        setIsRefreshing(false);
      }
    },
    register: async (input: RegisterInput) => {
      const nextSession = await apiClient.register(input);
      applySession(nextSession);
    },
    user: session?.user ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
