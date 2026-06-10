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

export function hasAuthCache() {
  return authWasChecked && cachedUser !== null;
}

export function getCachedUser() {
  return cachedUser;
}

export function getCachedAdmin() {
  return cachedAdmin;
}

export async function getCurrentUserCached(force = false) {
  if (!force && cachedUser) {
    return cachedUser;
  }

  const user = await apiFetch<MeResponse>("/auth/me");

  cachedUser = user;
  authWasChecked = true;

  return user;
}

export async function getAdminStatusCached(force = false) {
  if (!force && cachedAdmin) {
    return cachedAdmin;
  }

  const admin = await apiFetch<AdminMeResponse>("/admin/me");

  cachedAdmin = admin;
  adminWasChecked = true;

  return admin;
}

export function clearSessionCache() {
  cachedUser = null;
  cachedAdmin = null;
  authWasChecked = false;
  adminWasChecked = false;
}