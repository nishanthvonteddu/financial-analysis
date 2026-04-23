import { API_BASE_URL } from "@/lib/constants";
import type {
  AnalyticsRangeKey,
  AuthResponse,
  CalendarRenewalResponse,
  Category,
  CategoryInput,
  CategoryListResponse,
  DashboardLayout,
  DashboardLayoutPayload,
  DashboardSummary,
  ExpenseAnalytics,
  ExpenseReport,
  ExpenseReportListResponse,
  HealthResponse,
  LoginInput,
  NotificationListResponse,
  NotificationPreferencesResponse,
  NotificationPreferencesUpdate,
  PaymentMethod,
  PaymentMethodInput,
  PaymentMethodListResponse,
  RegisterInput,
  SupportedCurrencyListResponse,
  Subscription,
  SubscriptionFilters,
  SubscriptionListResponse,
  SubscriptionPaymentHistory,
  SubscriptionUpsertInput,
  TelegramLinkTokenResponse,
  Upload,
  UploadListResponse,
  User,
  UserUpdateInput,
} from "@/types";

type RequestOptions = {
  query?: Record<string, boolean | number | string | undefined>;
  token?: string;
};

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return text.trim() || null;
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

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
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(buildUrl(path, options?.query), {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    throw new Error(getErrorMessage(response.status, body));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await parseResponseBody(response);
  if (body === null || typeof body !== "object") {
    return undefined as T;
  }

  return body as T;
}

function getErrorMessage(status: number, response: unknown) {
  if (response && typeof response === "object" && "detail" in response) {
    const detail = response.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  return `Request failed with ${status}`;
}

function uploadFile(
  token: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Upload> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", buildUrl("/uploads"));
    xhr.responseType = "json";
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    });

    xhr.addEventListener("load", () => {
      let response: unknown = null;
      if (xhr.response && typeof xhr.response === "object") {
        response = xhr.response;
      } else if (xhr.responseText) {
        try {
          response = JSON.parse(xhr.responseText) as unknown;
        } catch {
          response = xhr.responseText;
        }
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(getErrorMessage(xhr.status, response)));
        return;
      }

      resolve(response as Upload);
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network request failed."));
    });

    xhr.send(formData);
  });
}

export const apiClient = {
  getHealth() {
    return request<HealthResponse>("/health");
  },
  getMe(token: string) {
    return request<User>("/auth/me", undefined, { token });
  },
  updateMe(token: string, payload: UserUpdateInput) {
    return request<User>("/auth/me", {
      body: JSON.stringify(payload),
      method: "PATCH",
    }, { token });
  },
  getCurrencies(token: string) {
    return request<SupportedCurrencyListResponse>("/currencies", undefined, { token });
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
  createCategory(token: string, payload: CategoryInput) {
    return request<Category>("/categories", {
      body: JSON.stringify(payload),
      method: "POST",
    }, { token });
  },
  updateCategory(token: string, categoryId: number, payload: CategoryInput) {
    return request<Category>(`/categories/${categoryId}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    }, { token });
  },
  deleteCategory(token: string, categoryId: number) {
    return request<void>(`/categories/${categoryId}`, {
      method: "DELETE",
    }, { token });
  },
  getPaymentMethods(token: string) {
    return request<PaymentMethodListResponse>("/payment-methods", undefined, { token });
  },
  createPaymentMethod(token: string, payload: PaymentMethodInput) {
    return request<PaymentMethod>("/payment-methods", {
      body: JSON.stringify(payload),
      method: "POST",
    }, { token });
  },
  updatePaymentMethod(token: string, paymentMethodId: number, payload: PaymentMethodInput) {
    return request<PaymentMethod>(`/payment-methods/${paymentMethodId}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    }, { token });
  },
  deletePaymentMethod(token: string, paymentMethodId: number) {
    return request<void>(`/payment-methods/${paymentMethodId}`, {
      method: "DELETE",
    }, { token });
  },
  getDashboardSummary(token: string) {
    return request<DashboardSummary>("/dashboard/summary", undefined, { token });
  },
  getDashboardLayout(token: string) {
    return request<DashboardLayout>("/dashboard/layout", undefined, { token });
  },
  updateDashboardLayout(token: string, payload: DashboardLayoutPayload) {
    return request<DashboardLayout>(
      "/dashboard/layout",
      {
        body: JSON.stringify(payload),
        method: "PUT",
      },
      { token },
    );
  },
  getExpenseReports(token: string) {
    return request<ExpenseReportListResponse>("/expense-reports", undefined, { token });
  },
  getExpenseAnalytics(token: string, range: AnalyticsRangeKey) {
    return request<ExpenseAnalytics>("/expense-reports/analytics", undefined, {
      query: { range },
      token,
    });
  },
  getExpenseReport(token: string, reportId: number) {
    return request<ExpenseReport>(`/expense-reports/${reportId}`, undefined, { token });
  },
  getNotifications(token: string) {
    return request<NotificationListResponse>("/notifications", undefined, { token });
  },
  markNotificationRead(token: string, notificationId: number) {
    return request<NotificationListResponse["items"][number]>(
      `/notifications/${notificationId}/read`,
      { method: "POST" },
      { token },
    );
  },
  markAllNotificationsRead(token: string) {
    return request<{ updated: number }>("/notifications/read-all", {
      method: "POST",
    }, { token });
  },
  getNotificationPreferences(token: string) {
    return request<NotificationPreferencesResponse>("/notifications/preferences", undefined, {
      token,
    });
  },
  updateNotificationPreferences(token: string, payload: NotificationPreferencesUpdate) {
    return request<NotificationPreferencesResponse>("/notifications/preferences", {
      body: JSON.stringify(payload),
      method: "PUT",
    }, { token });
  },
  createTelegramLinkToken(token: string) {
    return request<TelegramLinkTokenResponse>("/notifications/telegram/link-token", {
      method: "POST",
    }, { token });
  },
  unlinkTelegram(token: string) {
    return request<{ telegram_linked: boolean }>("/notifications/telegram/link", {
      method: "DELETE",
    }, { token });
  },
  getUploads(token: string) {
    return request<UploadListResponse>("/uploads", undefined, { token });
  },
  getUploadStatus(token: string, uploadId: number) {
    return request<Upload>(`/uploads/${uploadId}/status`, undefined, { token });
  },
  uploadFile,
  getSubscriptions(token: string, filters?: SubscriptionFilters) {
    return request<SubscriptionListResponse>("/subscriptions", undefined, {
      query: filters,
      token,
    });
  },
  getSubscription(token: string, subscriptionId: number) {
    return request<Subscription>(`/subscriptions/${subscriptionId}`, undefined, { token });
  },
  getSubscriptionPaymentHistory(token: string, subscriptionId: number) {
    return request<SubscriptionPaymentHistory>(
      `/subscriptions/${subscriptionId}/payment-history`,
      undefined,
      { token },
    );
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
  deleteUpload(token: string, uploadId: number) {
    return request<void>(`/uploads/${uploadId}`, {
      method: "DELETE",
    }, { token });
  },
  getCalendarRenewals(token: string, year: number, month: number) {
    return request<CalendarRenewalResponse>("/calendar", undefined, {
      query: { month, year },
      token,
    });
  },
  deleteWorkspaceData(token: string) {
    return request<void>("/auth/me/data", {
      method: "DELETE",
    }, { token });
  },
};
