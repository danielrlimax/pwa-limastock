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

export function getCachedTenant() {
  return cachedTenant;
}

export async function getCurrentTenant(force = false) {
  if (!force && cachedTenant) return cachedTenant;

  const tenants = await apiFetch<Tenant[]>("/tenants/me");

  cachedTenants = tenants;

  if (!tenants.length) {
    throw new Error("Nenhum estabelecimento vinculado a este usuário.");
  }

  const ownerTenant =
    tenants.find((tenant) => tenant.role === "owner") ||
    tenants.find((tenant) => tenant.role === "admin") ||
    tenants[0];

  cachedTenant = ownerTenant;

  return cachedTenant;
}

export async function getMyTenants(force = false) {
  if (!force && cachedTenants) return cachedTenants;

  const tenants = await apiFetch<Tenant[]>("/tenants/me");

  cachedTenants = tenants;

  if (!cachedTenant && tenants.length) {
    cachedTenant =
      tenants.find((tenant) => tenant.role === "owner") ||
      tenants.find((tenant) => tenant.role === "admin") ||
      tenants[0];
  }

  return tenants;
}

export function setCachedTenant(tenant: Tenant) {
  cachedTenant = tenant;
}

export function clearCachedTenant() {
  cachedTenant = null;
  cachedTenants = null;
}