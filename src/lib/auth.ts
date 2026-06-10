export type AuthUser = {
  id: string;
  email: string | null;
};

export type LoginResponse = {
  authenticated: boolean;
  csrf_token: string;
  user: AuthUser;
};

export type RefreshResponse = {
  refreshed: boolean;
  csrf_token: string;
  user: AuthUser;
};

const CSRF_STORAGE_KEY = "limastock_csrf_token";

export function saveAuthSession(data: LoginResponse | RefreshResponse) {
  if (typeof window === "undefined") return;

  if (data.csrf_token) {
    sessionStorage.setItem(CSRF_STORAGE_KEY, data.csrf_token);
  }
}

export function getCsrfToken() {
  if (typeof window === "undefined") return null;

  return sessionStorage.getItem(CSRF_STORAGE_KEY);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(CSRF_STORAGE_KEY);
}

export function isAuthenticated() {
  return true;
}