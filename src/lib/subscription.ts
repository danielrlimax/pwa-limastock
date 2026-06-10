import { apiFetch } from "./api";
import { getCurrentTenant } from "./tenant";

export type SubscriptionStatus = {
  tenant_id: string;
  status: string;
  is_active: boolean;
  plan_code: string | null;
  plan_name: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
};

export type PlanUsage = {
  tenant_id: string;
  plan: {
    id: string;
    code: string;
    name: string;
    price_monthly: string | number;
    max_products: number | null;
    max_users: number | null;
  };
  usage: {
    products: number;
    users: number;
  };
  limits: {
    products: number | null;
    users: number | null;
  };
  remaining: {
    products: number | null;
    users: number | null;
  };
};

let cachedSubscription: SubscriptionStatus | null = null;
let cachedPlanUsage: PlanUsage | null = null;

export function getCachedSubscription() {
  return cachedSubscription;
}

export function getCachedPlanUsage() {
  return cachedPlanUsage;
}

export async function getCurrentSubscription(force = false) {
  if (!force && cachedSubscription) {
    return cachedSubscription;
  }

  const tenant = await getCurrentTenant();

  const subscription = await apiFetch<SubscriptionStatus>(
    `/subscriptions/status?tenant_id=${tenant.id}`
  );

  cachedSubscription = subscription;

  return subscription;
}

export async function getCurrentPlanUsage(force = false) {
  if (!force && cachedPlanUsage) {
    return cachedPlanUsage;
  }

  const tenant = await getCurrentTenant();

  const usage = await apiFetch<PlanUsage>(
    `/subscriptions/usage?tenant_id=${tenant.id}`
  );

  cachedPlanUsage = usage;

  return usage;
}

export function clearSubscriptionCache() {
  cachedSubscription = null;
  cachedPlanUsage = null;
}