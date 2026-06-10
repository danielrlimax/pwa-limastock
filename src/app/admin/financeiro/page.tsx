"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  BarChart3,
  CreditCard,
  LineChart,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

type RevenueByPlan = {
  plan_id: string;
  plan_code: string;
  plan_name: string;
  price_monthly: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  past_due_subscriptions: number;
  canceled_subscriptions: number;
  mrr: number;
};

type RecentPayment = {
  id: string;
  event: string;
  value: number;
  customer: string | null;
  billing_type: string | null;
  created_at: string;
};

type FinanceiroResponse = {
  mrr: number;
  arr: number;
  estimated_lost_mrr: number;
  received_from_asaas_events: number;
  average_revenue_per_active_subscription: number;

  total_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  banned_tenants: number;

  total_plans: number;
  active_plans: number;

  total_subscriptions: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  past_due_subscriptions: number;
  canceled_subscriptions: number;

  total_coupons: number;
  active_coupons: number;

  total_asaas_events: number;
  confirmed_payment_events: number;

  revenue_by_plan: RevenueByPlan[];
  recent_payments: RecentPayment[];
};

export default function AdminFinanceiroPage() {
  const [data, setData] = useState<FinanceiroResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFinanceiro() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch<FinanceiroResponse>("/admin/financeiro");

      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar financeiro."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceiro();
  }, []);

  const conversionRate = useMemo(() => {
    if (!data?.total_tenants) return 0;

    return (data.active_tenants / data.total_tenants) * 100;
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando financeiro...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-700">
        <p className="text-sm font-bold uppercase tracking-wide">Erro</p>

        <h1 className="mt-2 text-2xl font-black">
          Não foi possível carregar o financeiro.
        </h1>

        <p className="mt-2">{error}</p>
      </div>
    );
  }

  const cards = [
    {
      title: "MRR estimado",
      value: formatMoney(data.mrr),
      helper: "Receita mensal recorrente de assinaturas ativas",
      icon: TrendingUp,
      tone: "dark",
    },
    {
      title: "ARR estimado",
      value: formatMoney(data.arr),
      helper: "Projeção anual baseada no MRR atual",
      icon: LineChart,
      tone: "dark",
    },
    {
      title: "Receita confirmada",
      value: formatMoney(data.received_from_asaas_events),
      helper: "Soma estimada dos eventos confirmados do Asaas",
      icon: Banknote,
      tone: "green",
    },
    {
      title: "Ticket médio",
      value: formatMoney(data.average_revenue_per_active_subscription),
      helper: "Média por assinatura ativa",
      icon: Receipt,
      tone: "dark",
    },
    {
      title: "MRR perdido",
      value: formatMoney(data.estimated_lost_mrr),
      helper: "Estimativa com assinaturas canceladas",
      icon: TrendingDown,
      tone: "red",
    },
    {
      title: "Inadimplentes",
      value: String(data.past_due_subscriptions),
      helper: "Assinaturas vencidas ou pendentes",
      icon: AlertTriangle,
      tone: data.past_due_subscriptions > 0 ? "red" : "dark",
    },
    {
      title: "Assinaturas ativas",
      value: String(data.active_subscriptions),
      helper: `${data.trialing_subscriptions} em teste`,
      icon: CreditCard,
      tone: "dark",
    },
    {
      title: "Clientes ativos",
      value: String(data.active_tenants),
      helper: `${data.total_tenants} empresas cadastradas`,
      icon: Users,
      tone: "dark",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Admin financeiro
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Receita e assinaturas
            </h1>

            <p className="mt-3 max-w-2xl text-slate-300">
              Acompanhe MRR, ARR, inadimplência, receita por plano e eventos de
              pagamento recebidos pelo Asaas.
            </p>
          </div>

          <button
            onClick={loadFinanceiro}
            className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950"
          >
            Atualizar dados
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={
                    card.tone === "green"
                      ? "rounded-2xl bg-emerald-50 p-3 text-emerald-700"
                      : card.tone === "red"
                        ? "rounded-2xl bg-red-50 p-3 text-red-700"
                        : "rounded-2xl bg-slate-950 p-3 text-white"
                  }
                >
                  <Icon size={22} />
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  SaaS
                </span>
              </div>

              <p className="mt-6 text-sm font-bold text-slate-500">
                {card.title}
              </p>

              <p
                className={
                  card.tone === "red"
                    ? "mt-2 text-3xl font-black text-red-600"
                    : card.tone === "green"
                      ? "mt-2 text-3xl font-black text-emerald-700"
                      : "mt-2 text-3xl font-black text-slate-950"
                }
              >
                {card.value}
              </p>

              <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <BarChart3 size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Receita por plano
                </h2>

                <p className="text-sm text-slate-500">
                  Distribuição estimada do MRR por plano comercial.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Plano</th>
                  <th className="px-6 py-4 font-bold">Preço</th>
                  <th className="px-6 py-4 font-bold">Ativas</th>
                  <th className="px-6 py-4 font-bold">Trial</th>
                  <th className="px-6 py-4 font-bold">Vencidas</th>
                  <th className="px-6 py-4 font-bold">Canceladas</th>
                  <th className="px-6 py-4 font-bold">MRR</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.revenue_by_plan.map((plan) => (
                  <tr key={plan.plan_id}>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-950">
                        {plan.plan_name}
                      </p>

                      <p className="mt-1 font-mono text-xs font-bold text-slate-400">
                        {plan.plan_code}
                      </p>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700">
                      {formatMoney(plan.price_monthly)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {plan.active_subscriptions}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {plan.trialing_subscriptions}
                    </td>

                    <td className="px-6 py-4 text-red-600">
                      {plan.past_due_subscriptions}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {plan.canceled_subscriptions}
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {formatMoney(plan.mrr)}
                    </td>
                  </tr>
                ))}

                {!data.revenue_by_plan.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Nenhum plano com assinatura encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <Activity size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Saúde da operação
                </h2>

                <p className="text-sm text-slate-500">
                  Indicadores gerais do SaaS.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Metric
                label="Conversão ativa"
                value={`${conversionRate.toFixed(1)}%`}
              />

              <Metric
                label="Planos ativos"
                value={`${data.active_plans}/${data.total_plans}`}
              />

              <Metric
                label="Cupons ativos"
                value={`${data.active_coupons}/${data.total_coupons}`}
              />

              <Metric
                label="Eventos Asaas"
                value={`${data.confirmed_payment_events}/${data.total_asaas_events}`}
              />

              <Metric
                label="Empresas suspensas"
                value={String(data.suspended_tenants)}
                danger={data.suspended_tenants > 0}
              />

              <Metric
                label="Empresas banidas"
                value={String(data.banned_tenants)}
                danger={data.banned_tenants > 0}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6 text-amber-900">
            <p className="text-sm font-black uppercase tracking-wide">
              Observação
            </p>

            <p className="mt-2 text-sm font-semibold">
              O MRR é calculado pelas assinaturas ativas no banco. A receita
              confirmada vem dos eventos recentes do Asaas salvos em
              asaas_events.
            </p>
          </div>
        </aside>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-2xl font-black text-slate-950">
            Pagamentos recentes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Eventos financeiros confirmados recebidos pelo webhook do Asaas.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Evento</th>
                <th className="px-6 py-4 font-bold">Valor</th>
                <th className="px-6 py-4 font-bold">Cliente Asaas</th>
                <th className="px-6 py-4 font-bold">Pagamento</th>
                <th className="px-6 py-4 font-bold">Data</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {data.recent_payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 font-mono text-xs font-black text-slate-700">
                    {payment.event}
                  </td>

                  <td className="px-6 py-4 font-black text-slate-950">
                    {formatMoney(payment.value)}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {payment.customer || "Não informado"}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {payment.billing_type || "Não informado"}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {payment.created_at
                      ? new Date(payment.created_at).toLocaleString("pt-BR")
                      : "-"}
                  </td>
                </tr>
              ))}

              {!data.recent_payments.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Nenhum pagamento confirmado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-500">{label}</p>

      <p
        className={
          danger
            ? "text-lg font-black text-red-600"
            : "text-lg font-black text-slate-950"
        }
      >
        {value}
      </p>
    </div>
  );
}