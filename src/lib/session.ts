import { apiFetch } from "./api";

export type MeResponse = {
  id: string;
  email: string | null;
};

export type AdminMeResponse = {
  is_admin: boolean;
  email: string | null;
};

let cachedUser: MeResponse | null = null;
let cachedAdmin: AdminMeResponse | null = null;

let authWasChecked = false;
let adminWasChecked = false;

let authPromise: Promise<MeResponse> | null = null;
let adminPromise: Promise<AdminMeResponse> | null = null;

const CACHE_TIME_MS = 5 * 60 * 1000;

let authCheckedAt = 0;
let adminCheckedAt = 0;

function isFresh(timestamp: number) {
  return Date.now() - timestamp < CACHE_TIME_MS;
}

export function hasAuthCache() {
  return authWasChecked && cachedUser !== null && isFresh(authCheckedAt);
}

export function hasAdminCache() {
  return adminWasChecked && cachedAdmin !== null && isFresh(adminCheckedAt);
}

export function getCachedUser() {
  return cachedUser;
}

export function getCachedAdmin() {
  return cachedAdmin;
}

export async function getCurrentUserCached(force = false) {
  if (!force && cachedUser && isFresh(authCheckedAt)) {
    return cachedUser;
  }

  if (!force && authPromise) {
    return authPromise;
  }

  authPromise = apiFetch<MeResponse>("/auth/me")
    .then((user) => {
      cachedUser = user;
      authWasChecked = true;
      authCheckedAt = Date.now();

      return user;
    })
    .finally(() => {
      authPromise = null;
    });

  return authPromise;
}

export async function getAdminStatusCached(force = false) {
  if (!force && cachedAdmin && isFresh(adminCheckedAt)) {
    return cachedAdmin;
  }

  if (!force && adminPromise) {
    return adminPromise;
  }

  adminPromise = apiFetch<AdminMeResponse>("/admin/me")
    .then((admin) => {
      cachedAdmin = admin;
      adminWasChecked = true;
      adminCheckedAt = Date.now();

      return admin;
    })
    .finally(() => {
      adminPromise = null;
    });

  return adminPromise;
}

export function clearSessionCache() {
  cachedUser = null;
  cachedAdmin = null;

  authPromise = null;
  adminPromise = null;

  authWasChecked = false;
  adminWasChecked = false;

  authCheckedAt = 0;
  adminCheckedAt = 0;
}