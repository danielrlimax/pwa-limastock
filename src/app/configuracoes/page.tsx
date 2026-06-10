"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { PlanUsageCard } from "@/components/billing/plan-usage-card";
import {
  getCurrentPlanUsage,
  getCurrentSubscription,
  PlanUsage,
  SubscriptionStatus,
} from "@/lib/subscription";
import { getCurrentTenant, Tenant } from "@/lib/tenant";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Ativa",
    trialing: "Em teste",
    past_due: "Pagamento pendente",
    overdue: "Pagamento vencido",
    canceled: "Cancelada",
    cancelled: "Cancelada",
    suspended: "Suspensa",
    none: "Sem assinatura",
  };

  return labels[status] || status;
}

function statusClass(status: string) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "trialing") {
    return "bg-blue-50 text-blue-700";
  }

  if (["past_due", "overdue"].includes(status)) {
    return "bg-amber-50 text-amber-700";
  }

  if (["canceled", "cancelled", "suspended", "none"].includes(status)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatDate(date: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("pt-BR");
}

export default function ConfiguracoesPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  async function loadSettings(force = false) {
    try {
      if (force) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const currentTenant = await getCurrentTenant(force);

      const [subscriptionData, usageData] = await Promise.all([
        getCurrentSubscription(force),
        getCurrentPlanUsage(force),
      ]);

      setTenant(currentTenant);
      setSubscription(subscriptionData);
      setPlanUsage(usageData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar configurações."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando configurações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-700">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1" size={22} />

          <div>
            <p className="text-sm font-bold uppercase tracking-wide">Erro</p>

            <h1 className="mt-2 text-2xl font-black">
              Não foi possível carregar configurações.
            </h1>

            <p className="mt-2">{error}</p>

            <button
              onClick={() => loadSettings(true)}
              className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Configurações
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Estabelecimento e assinatura
            </h1>

            <p className="mt-3 max-w-2xl text-slate-300">
              Veja o status do estabelecimento, assinatura atual e limites do
              plano contratado.
            </p>
          </div>

          <button
            onClick={() => loadSettings(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={18} />
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Building2 size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Estabelecimento
              </p>

              <h2 className="mt-2 truncate text-2xl font-black text-slate-950">
                {tenant?.name || "Não encontrado"}
              </h2>

              <p className="mt-1 font-mono text-sm font-bold text-slate-400">
                {tenant?.slug || "-"}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  Status: {tenant?.status || "-"}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  Perfil: {tenant?.role || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div
              className={
                subscription?.is_active
                  ? "rounded-2xl bg-emerald-50 p-3 text-emerald-700"
                  : "rounded-2xl bg-red-50 p-3 text-red-700"
              }
            >
              {subscription?.is_active ? (
                <ShieldCheck size={22} />
              ) : (
                <CreditCard size={22} />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Assinatura
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {subscription?.plan_name || "Nenhum plano ativo"}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                    subscription?.status || "none"
                  )}`}
                >
                  {statusLabel(subscription?.status || "none")}
                </span>

                {subscription?.plan_code && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-black uppercase text-slate-700">
                    {subscription.plan_code}
                  </span>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoBox
                  label="Fim do trial"
                  value={formatDate(subscription?.trial_ends_at || null)}
                />

                <InfoBox
                  label="Fim do período"
                  value={formatDate(subscription?.current_period_end || null)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {planUsage && <PlanUsageCard usage={planUsage} />}

      {!subscription?.is_active && (
        <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1" size={22} />

            <div>
              <h2 className="text-xl font-black">
                Assinatura não está ativa
              </h2>

              <p className="mt-2 text-sm font-semibold">
                Regularize ou ative um plano para liberar completamente vendas,
                estoque, produtos e scanner do estabelecimento.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}