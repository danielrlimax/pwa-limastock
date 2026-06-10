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

let cachedSubscription: SubscriptionStatus | null = null;

export function getCachedSubscription() {
  return cachedSubscription;
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

export function clearSubscriptionCache() {
  cachedSubscription = null;
}