import {
  clearAuthSession,
  getCsrfToken,
  saveAuthSession,
  type RefreshResponse,
} from "./auth";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(
  /\/$/,
  ""
);

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

const methodsThatNeedCsrf = ["POST", "PATCH", "DELETE", "PUT"];

async function refreshSession() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (response.ok && data?.csrf_token) {
    saveAuthSession(data as RefreshResponse);
    return true;
  }

  clearAuthSession();
  return false;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, retry = true } = options;

  const upperMethod = method.toUpperCase();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const csrfToken = getCsrfToken();

  if (methodsThatNeedCsrf.includes(upperMethod) && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (response.status === 401 && retry) {
    const refreshed = await refreshSession();

    if (refreshed) {
      return apiFetch<T>(path, {
        ...options,
        retry: false,
      });
    }

    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }

  const detail =
    typeof data?.detail === "string" ? data.detail : "Erro ao chamar API.";

  if (!response.ok) {
    throw new ApiError(response.status, detail);
  }

  return data as T;
}

export function isSubscriptionBlockedError(error: unknown) {
  return error instanceof ApiError && error.status === 402;
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}