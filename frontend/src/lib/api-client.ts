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
  Upload,
  UploadListResponse,
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
      const response =
        xhr.response && typeof xhr.response === "object"
          ? xhr.response
          : xhr.responseText
            ? (JSON.parse(xhr.responseText) as unknown)
            : null;

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
};
