"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type AdminMeResponse = {
  is_admin: boolean;
  email: string | null;
};

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const data = await apiFetch<AdminMeResponse>("/admin/me");

        if (!data.is_admin) {
          setForbidden(true);
          setTimeout(() => router.replace("/dashboard"), 1000);
          return;
        }

        setAllowed(true);
      } catch {
        setForbidden(true);
        setTimeout(() => router.replace("/dashboard"), 1000);
      } finally {
        setChecking(false);
      }
    }

    checkAdmin();
  }, [router]);

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