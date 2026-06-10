"use client";

import { useEffect, useState } from "react";
import {
  getCachedSubscription,
  getCurrentSubscription,
  SubscriptionStatus,
} from "@/lib/subscription";
import { SubscriptionBlockedCard } from "@/components/billing/subscription-blocked-card";

export function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const cachedSubscription = getCachedSubscription();

  const [checking, setChecking] = useState(!cachedSubscription);
  const [subscription, setSubscription] =
    useState<SubscriptionStatus | null>(cachedSubscription);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSubscription() {
      try {
        const data = await getCurrentSubscription();

        if (!cancelled) {
          setSubscription(data);

          if (!data.is_active) {
            setMessage(
              "Regularize a assinatura do estabelecimento para continuar usando produtos, estoque, vendas e dashboard."
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(
            err instanceof Error
              ? err.message
              : "Não foi possível validar sua assinatura."
          );
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    if (!cachedSubscription) {
      checkSubscription();
    }

    return () => {
      cancelled = true;
    };
  }, [cachedSubscription]);

  if (checking) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Verificando assinatura...</p>
      </div>
    );
  }

  if (!subscription?.is_active) {
    return (
      <SubscriptionBlockedCard
        message={
          message ||
          "Sua assinatura precisa ser regularizada para continuar usando esta área."
        }
      />
    );
  }

  return <>{children}</>;
}