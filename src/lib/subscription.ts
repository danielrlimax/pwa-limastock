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

let subscriptionPromise: Promise<SubscriptionStatus> | null = null;
let planUsagePromise: Promise<PlanUsage> | null = null;

const CACHE_TIME_MS = 5 * 60 * 1000;

let subscriptionCheckedAt = 0;
let planUsageCheckedAt = 0;

function isFresh(timestamp: number) {
  return Date.now() - timestamp < CACHE_TIME_MS;
}

export function getCachedSubscription() {
  return cachedSubscription;
}

export function getCachedPlanUsage() {
  return cachedPlanUsage;
}

export function hasSubscriptionCache() {
  return cachedSubscription !== null && isFresh(subscriptionCheckedAt);
}

export async function getCurrentSubscription(force = false) {
  if (!force && cachedSubscription && isFresh(subscriptionCheckedAt)) {
    return cachedSubscription;
  }

  if (!force && subscriptionPromise) {
    return subscriptionPromise;
  }

  subscriptionPromise = getCurrentTenant()
    .then((tenant) =>
      apiFetch<SubscriptionStatus>(
        `/subscriptions/status?tenant_id=${tenant.id}`
      )
    )
    .then((subscription) => {
      cachedSubscription = subscription;
      subscriptionCheckedAt = Date.now();

      return subscription;
    })
    .finally(() => {
      subscriptionPromise = null;
    });

  return subscriptionPromise;
}

export async function getCurrentPlanUsage(force = false) {
  if (!force && cachedPlanUsage && isFresh(planUsageCheckedAt)) {
    return cachedPlanUsage;
  }

  if (!force && planUsagePromise) {
    return planUsagePromise;
  }

  planUsagePromise = getCurrentTenant()
    .then((tenant) =>
      apiFetch<PlanUsage>(`/subscriptions/usage?tenant_id=${tenant.id}`)
    )
    .then((usage) => {
      cachedPlanUsage = usage;
      planUsageCheckedAt = Date.now();

      return usage;
    })
    .finally(() => {
      planUsagePromise = null;
    });

  return planUsagePromise;
}

export function clearSubscriptionCache() {
  cachedSubscription = null;
  cachedPlanUsage = null;

  subscriptionPromise = null;
  planUsagePromise = null;

  subscriptionCheckedAt = 0;
  planUsageCheckedAt = 0;
}