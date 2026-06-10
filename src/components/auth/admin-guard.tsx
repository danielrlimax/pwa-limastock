"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getAdminStatusCached,
  getCachedAdmin,
  hasAdminCache,
} from "@/lib/session";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const cachedAdmin = getCachedAdmin();

  const [allowed, setAllowed] = useState(
    hasAdminCache() && cachedAdmin?.is_admin === true
  );
  const [checking, setChecking] = useState(
    !(hasAdminCache() && cachedAdmin?.is_admin === true)
  );
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      try {
        const data = await getAdminStatusCached();

        if (cancelled) return;

        if (!data.is_admin) {
          setForbidden(true);
          setChecking(false);

          window.setTimeout(() => {
            router.replace("/dashboard");
          }, 700);

          return;
        }

        setAllowed(true);
      } catch {
        if (cancelled) return;

        setForbidden(true);

        window.setTimeout(() => {
          router.replace("/dashboard");
        }, 700);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    if (hasAdminCache() && cachedAdmin?.is_admin === true) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [router, cachedAdmin?.is_admin]);

  if (forbidden) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-red-100 p-3 text-red-700">
            <ShieldAlert size={24} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
              Acesso bloqueado
            </p>

            <h1 className="text-2xl font-bold text-red-950">
              Você não tem permissão para acessar o painel admin.
            </h1>
          </div>
        </div>

        <p className="mt-4 text-red-700">Redirecionando para o dashboard...</p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando painel admin...</p>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}