import { apiFetch } from "./api";

export type TenantRole = "owner" | "admin" | "manager" | "member" | string;

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  role?: TenantRole;
};

let cachedTenant: Tenant | null = null;
let cachedTenants: Tenant[] | null = null;
let tenantsPromise: Promise<Tenant[]> | null = null;

const CACHE_TIME_MS = 5 * 60 * 1000;
let tenantsCheckedAt = 0;

function isFresh() {
  return Date.now() - tenantsCheckedAt < CACHE_TIME_MS;
}

function pickMainTenant(tenants: Tenant[]) {
  return (
    tenants.find((tenant) => tenant.role === "owner") ||
    tenants.find((tenant) => tenant.role === "admin") ||
    tenants[0]
  );
}

export function getCachedTenant() {
  return cachedTenant;
}

export function hasTenantCache() {
  return cachedTenant !== null && isFresh();
}

export async function getCurrentTenant(force = false) {
  if (!force && cachedTenant && isFresh()) {
    return cachedTenant;
  }

  const tenants = await getMyTenants(force);

  if (!tenants.length) {
    throw new Error("Nenhum estabelecimento vinculado a este usuário.");
  }

  cachedTenant = pickMainTenant(tenants);

  return cachedTenant;
}

export async function getMyTenants(force = false) {
  if (!force && cachedTenants && isFresh()) {
    return cachedTenants;
  }

  if (!force && tenantsPromise) {
    return tenantsPromise;
  }

  tenantsPromise = apiFetch<Tenant[]>("/tenants/me")
    .then((tenants) => {
      cachedTenants = tenants;
      tenantsCheckedAt = Date.now();

      if (!cachedTenant && tenants.length) {
        cachedTenant = pickMainTenant(tenants);
      }

      return tenants;
    })
    .finally(() => {
      tenantsPromise = null;
    });

  return tenantsPromise;
}

export function setCachedTenant(tenant: Tenant) {
  cachedTenant = tenant;
  tenantsCheckedAt = Date.now();
}

export function clearCachedTenant() {
  cachedTenant = null;
  cachedTenants = null;
  tenantsPromise = null;
  tenantsCheckedAt = 0;
}