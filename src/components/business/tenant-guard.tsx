"use client";

import { useEffect, useState } from "react";
import {
  getCachedTenant,
  getCurrentTenant,
  hasTenantCache,
  Tenant,
} from "@/lib/tenant";
import { NoTenantCard } from "@/components/business/no-tenant-card";

export function TenantGuard({ children }: { children: React.ReactNode }) {
  const cachedTenant = getCachedTenant();

  const [checking, setChecking] = useState(!hasTenantCache());
  const [tenant, setTenant] = useState<Tenant | null>(cachedTenant);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTenant() {
      try {
        const currentTenant = await getCurrentTenant();

        if (!cancelled) {
          setTenant(currentTenant);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o estabelecimento."
          );
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    if (hasTenantCache()) {
      setTenant(getCachedTenant());
      setChecking(false);
      return;
    }

    loadTenant();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando estabelecimento...</p>
      </div>
    );
  }

  if (!tenant) {
    return <NoTenantCard message={error} />;
  }

  return <>{children}</>;
}