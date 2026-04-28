"use client";

import type { ReactNode } from "react";
import { createContext, useEffect, useState } from "react";

import { apiClient, setApiCsrfToken } from "@/lib/api-client";
import type { AuthResponse, LoginInput, RegisterInput, User, UserUpdateInput } from "@/types";

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isRefreshing: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  updateProfile: (input: UserUpdateInput) => Promise<User>;
  user: User | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
const E2E_SESSION_COOKIE = "mysubscription.e2e_session";

declare global {
  interface Window {
    __MYSUBSCRIPTION_TEST_SESSION__?: AuthResponse;
  }
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AuthResponse>;
  return (
    typeof session.access_token === "string" &&
    typeof session.refresh_token === "string" &&
    typeof session.token_type === "string" &&
    typeof session.access_token_expires_at === "string" &&
    typeof session.refresh_token_expires_at === "string" &&
    Boolean(session.user) &&
    typeof session.user?.email === "string"
  );
}

function createCsrfToken() {
  if (!window.crypto?.getRandomValues) {
    return Math.random().toString(36).slice(2);
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readBootstrapSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const session = window.__MYSUBSCRIPTION_TEST_SESSION__;
  if (isAuthResponse(session)) {
    return session;
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    const cookie = document.cookie
      .split("; ")
      .find((value) => value.startsWith(`${E2E_SESSION_COOKIE}=`));
    const rawSession = cookie?.split("=").slice(1).join("=");
    if (rawSession) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rawSession)) as unknown;
        if (isAuthResponse(parsed)) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
  }

  return null;
}

function getRefreshDelay(expiresAt: string): number {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  if (Number.isNaN(remainingMs)) {
    return 5_000;
  }

  return Math.max(remainingMs - 30_000, 1_000);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const applySession = (nextSession: AuthResponse) => {
    setCsrfToken((current) => current ?? createCsrfToken());
    setSession(nextSession);
  };

  const logout = () => {
    setCsrfToken(null);
    setSession(null);
  };

  useEffect(() => {
    const bootstrapSession = readBootstrapSession();
    if (bootstrapSession) {
      applySession(bootstrapSession);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    setApiCsrfToken(csrfToken);
    return () => setApiCsrfToken(null);
  }, [csrfToken]);

  useEffect(() => {
    if (!isReady) {
      return undefined;
    }

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
  }, [isReady, session]);

  const value: AuthContextValue = {
    accessToken: session?.access_token ?? null,
    isAuthenticated: Boolean(session?.access_token),
    isReady,
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
    updateProfile: async (input: UserUpdateInput) => {
      if (!session?.access_token) {
        throw new Error("You must be signed in to update your profile.");
      }
      const user = await apiClient.updateMe(session.access_token, input);
      setSession((current) => (current ? { ...current, user } : current));
      return user;
    },
    user: session?.user ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
