import { API_BASE_URL } from "@/lib/constants";
import type {
  AuthResponse,
  CategoryListResponse,
  HealthResponse,
  LoginInput,
  PaymentMethodListResponse,
  RegisterInput,
  Subscription,
  SubscriptionFilters,
  SubscriptionListResponse,
  SubscriptionUpsertInput,
  User,
} from "@/types";

type RequestOptions = {
  query?: Record<string, boolean | number | string | undefined>;
  token?: string;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: RequestOptions,
): Promise<T> {
  const response = await fetch(buildUrl(path, options?.query), {
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

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
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
  getCategories(token: string) {
    return request<CategoryListResponse>("/categories", undefined, { token });
  },
  getPaymentMethods(token: string) {
    return request<PaymentMethodListResponse>("/payment-methods", undefined, { token });
  },
  getSubscriptions(token: string, filters?: SubscriptionFilters) {
    return request<SubscriptionListResponse>("/subscriptions", undefined, {
      query: filters,
      token,
    });
  },
  getSubscription(token: string, subscriptionId: number) {
    return request<Subscription>(`/subscriptions/${subscriptionId}`, undefined, { token });
  },
  createSubscription(token: string, payload: SubscriptionUpsertInput) {
    return request<Subscription>("/subscriptions", {
      body: JSON.stringify(payload),
      method: "POST",
    }, { token });
  },
  updateSubscription(token: string, subscriptionId: number, payload: Partial<SubscriptionUpsertInput>) {
    return request<Subscription>(`/subscriptions/${subscriptionId}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    }, { token });
  },
  deleteSubscription(token: string, subscriptionId: number) {
    return request<void>(`/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    }, { token });
  },
};
