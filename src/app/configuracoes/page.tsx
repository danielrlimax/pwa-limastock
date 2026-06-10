"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Crown,
  Gauge,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getCurrentTenant, Tenant } from "@/lib/tenant";
import {
  clearSubscriptionCache,
  getCurrentPlanUsage,
  getCurrentSubscription,
  PlanUsage,
  SubscriptionStatus,
} from "@/lib/subscription";
import { formatMoney } from "@/lib/utils";

type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price_monthly: string | number;
  max_products: number | null;
  max_users: number | null;
  active?: boolean;
};

type ChangePlanResponse = {
  message: string;
  subscription: unknown;
  plan: Plan;
};

export default function ConfiguracoesPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [loading, setLoading] = useState(true);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentPlanCode = subscription?.plan_code || usage?.plan.code || null;

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      return Number(a.price_monthly || 0) - Number(b.price_monthly || 0);
    });
  }, [plans]);

  async function loadData(force = false) {
    try {
      setLoading(true);
      setError("");

      if (force) {
        clearSubscriptionCache();
      }

      const currentTenant = await getCurrentTenant(force);

      const [subscriptionData, usageData, plansData] = await Promise.all([
        getCurrentSubscription(force).catch(() => null),
        getCurrentPlanUsage(force).catch(() => null),
        apiFetch<Plan[]>("/subscriptions/plans"),
      ]);

      setTenant(currentTenant);
      setSubscription(subscriptionData);
      setUsage(usageData);
      setPlans(plansData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar configurações."
      );
    } finally {
      setLoading(false);
    }
  }

  async function changePlan(plan: Plan) {
    if (!tenant) {
      setError("Estabelecimento não encontrado.");
      return;
    }

    const confirmed = window.confirm(
      `Deseja mudar o estabelecimento para o plano "${plan.name}"?\n\nPor enquanto essa troca é manual/simulada e não gera cobrança real.`
    );

    if (!confirmed) return;

    try {
      setChangingPlanId(plan.id);
      setError("");
      setSuccess("");

      const response = await apiFetch<ChangePlanResponse>(
        "/subscriptions/change-plan",
        {
          method: "POST",
          body: {
            tenant_id: tenant.id,
            plan_id: plan.id,
          },
        }
      );

      clearSubscriptionCache();

      setSuccess(response.message || `Plano alterado para ${plan.name}.`);

      await loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar plano.");
    } finally {
      setChangingPlanId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-white p-4 text-slate-950">
              <Settings size={28} />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                LimaStock
              </p>

              <h1 className="text-3xl font-black">Configurações</h1>

              <p className="mt-1 max-w-2xl text-slate-300">
                Gerencie estabelecimento, plano, limites e assinatura.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950"
          >
            <RefreshCcw size={18} />
            Atualizar
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-4">
        <InfoCard
          icon={<Store size={22} />}
          label="Estabelecimento"
          value={tenant?.name || "-"}
          helper={tenant?.status ? `Status: ${tenant.status}` : undefined}
        />

        <InfoCard
          icon={<Crown size={22} />}
          label="Plano atual"
          value={subscription?.plan_name || usage?.plan.name || "Sem plano"}
          helper={subscription?.status ? `Assinatura: ${subscription.status}` : ""}
        />

        <InfoCard
          icon={<Gauge size={22} />}
          label="Produtos"
          value={
            usage
              ? `${usage.usage.products} / ${
                  usage.limits.products ?? "Ilimitado"
                }`
              : "-"
          }
          helper="Uso do plano"
        />

        <InfoCard
          icon={<Users size={22} />}
          label="Usuários"
          value={
            usage
              ? `${usage.usage.users} / ${usage.limits.users ?? "Ilimitado"}`
              : "-"
          }
          helper="Membros do estabelecimento"
        />
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Assinatura
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Planos disponíveis
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Escolha um plano para este estabelecimento. Por enquanto a troca é
              manual/simulada. Depois, este botão será conectado ao checkout do
              Asaas.
            </p>
          </div>

          <div className="rounded-2xl bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-800">
            Modo manual, sem cobrança real
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {sortedPlans.map((plan) => {
            const isCurrent =
              currentPlanCode === plan.code || usage?.plan.id === plan.id;

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrent}
                changing={changingPlanId === plan.id}
                onChange={() => changePlan(plan)}
              />
            );
          })}

          {!sortedPlans.length && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500 lg:col-span-3">
              Nenhum plano cadastrado no banco.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-950">
              Próximo passo: assinatura real com Asaas
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Quando você validar que o sistema está pronto para uso, o botão de
              troca de plano pode deixar de alterar o banco diretamente e passar
              a criar uma assinatura real no Asaas. O fluxo ideal será:
              selecionar plano, criar/atualizar cliente no Asaas, criar
              assinatura, receber webhook de pagamento e só então ativar o
              plano no LimaStock.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>

      <p className="mt-1 line-clamp-2 text-2xl font-black text-slate-950">
        {value}
      </p>

      {helper && <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>}
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  changing,
  onChange,
}: {
  plan: Plan;
  isCurrent: boolean;
  changing: boolean;
  onChange: () => void;
}) {
  const maxProducts =
    plan.max_products === null || plan.max_products === undefined
      ? "Produtos ilimitados"
      : `${plan.max_products} produtos`;

  const maxUsers =
    plan.max_users === null || plan.max_users === undefined
      ? "Usuários ilimitados"
      : `${plan.max_users} usuários`;

  return (
    <div
      className={
        isCurrent
          ? "rounded-[2rem] border-2 border-slate-950 bg-slate-950 p-6 text-white shadow-sm"
          : "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={
              isCurrent
                ? "text-sm font-bold uppercase tracking-wide text-slate-300"
                : "text-sm font-bold uppercase tracking-wide text-slate-400"
            }
          >
            Plano
          </p>

          <h3 className="mt-1 text-2xl font-black">{plan.name}</h3>
        </div>

        {isCurrent && (
          <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
            Atual
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-4xl font-black">{formatMoney(plan.price_monthly)}</p>
        <p className={isCurrent ? "text-sm text-slate-300" : "text-sm text-slate-500"}>
          por mês
        </p>
      </div>

      {plan.description && (
        <p className={isCurrent ? "mt-4 text-sm text-slate-300" : "mt-4 text-sm text-slate-500"}>
          {plan.description}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <Feature active={isCurrent} text={maxProducts} />
        <Feature active={isCurrent} text={maxUsers} />
        <Feature active={isCurrent} text="Controle de estoque" />
        <Feature active={isCurrent} text="Vendas e PDV" />
      </div>

      <button
        type="button"
        onClick={onChange}
        disabled={isCurrent || changing}
        className={
          isCurrent
            ? "mt-6 flex w-full items-center justify-center rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white disabled:opacity-70"
            : "mt-6 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
        }
      >
        {isCurrent ? "Plano atual" : changing ? "Alterando..." : "Mudar para este plano"}
      </button>
    </div>
  );
}

function Feature({ active, text }: { active: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={
          active
            ? "rounded-full bg-white p-1 text-slate-950"
            : "rounded-full bg-emerald-50 p-1 text-emerald-700"
        }
      >
        <CheckCircle2 size={14} />
      </div>

      <p className={active ? "text-sm font-bold text-slate-100" : "text-sm font-bold text-slate-700"}>
        {text}
      </p>
    </div>
  );
}