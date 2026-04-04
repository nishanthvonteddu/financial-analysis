import { API_BASE_URL } from "@/lib/constants";
import type { AuthResponse, HealthResponse, LoginInput, RegisterInput, User } from "@/types";

type RequestOptions = {
  token?: string;
};

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: RequestOptions,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  getHealth() {
    return request<HealthResponse>("/health");
  },
  getMe(token: string) {
    return request<User>("/auth/me", undefined, { token });
  },
  login(payload: LoginInput) {
    return request<AuthResponse>("/auth/login", {
      body: JSON.stringify(payload),
      method: "POST",
    });
  },
  refresh(refreshToken: string) {
    return request<AuthResponse>("/auth/refresh", {
      body: JSON.stringify({ refresh_token: refreshToken }),
      method: "POST",
    });
  },
  register(payload: RegisterInput) {
    return request<AuthResponse>("/auth/register", {
      body: JSON.stringify(payload),
      method: "POST",
    });
  },
};
