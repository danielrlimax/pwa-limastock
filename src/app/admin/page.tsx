"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  CreditCard,
  FileClock,
  Layers3,
  ShieldCheck,
  TicketPercent,
  TriangleAlert,
  Webhook,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type AdminSummary = {
  total_tenants: number;
  active_tenants: number;
  trialing_tenants: number;
  suspended_tenants: number;
  canceled_tenants: number;
  banned_tenants: number;
  total_subscriptions: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  past_due_subscriptions: number;
  canceled_subscriptions: number;
  total_coupons: number;
  active_coupons: number;
  total_asaas_events: number;
};

export default function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdmin() {
      try {
        setError("");

        const data = await apiFetch<AdminSummary>("/admin/summary");

        setSummary(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar admin."
        );
      }
    }

    loadAdmin();
  }, []);

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-700">
        <p className="text-sm font-bold uppercase tracking-wide">Erro</p>

        <h1 className="mt-2 text-2xl font-black">
          Não foi possível carregar o painel admin.
        </h1>

        <p className="mt-2">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando painel admin...</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Empresas totais",
      value: summary.total_tenants,
      helper: "Todos os estabelecimentos cadastrados",
      icon: Building2,
      danger: false,
    },
    {
      label: "Empresas ativas",
      value: summary.active_tenants,
      helper: "Clientes liberados para uso",
      icon: ShieldCheck,
      danger: false,
    },
    {
      label: "Empresas em teste",
      value: summary.trialing_tenants,
      helper: "Estabelecimentos no período trial",
      icon: Activity,
      danger: false,
    },
    {
      label: "Empresas suspensas",
      value: summary.suspended_tenants,
      helper: "Clientes temporariamente bloqueados",
      icon: TriangleAlert,
      danger: summary.suspended_tenants > 0,
    },
    {
      label: "Empresas banidas",
      value: summary.banned_tenants,
      helper: "Acesso permanentemente bloqueado",
      icon: TriangleAlert,
      danger: summary.banned_tenants > 0,
    },
    {
      label: "Assinaturas totais",
      value: summary.total_subscriptions,
      helper: "Todas as assinaturas criadas",
      icon: CreditCard,
      danger: false,
    },
    {
      label: "Assinaturas ativas",
      value: summary.active_subscriptions,
      helper: "Planos pagos ou liberados",
      icon: CreditCard,
      danger: false,
    },
    {
      label: "Assinaturas em teste",
      value: summary.trialing_subscriptions,
      helper: "Clientes no período de teste",
      icon: Activity,
      danger: false,
    },
    {
      label: "Assinaturas vencidas",
      value: summary.past_due_subscriptions,
      helper: "Clientes com pagamento pendente",
      icon: TriangleAlert,
      danger: summary.past_due_subscriptions > 0,
    },
    {
      label: "Assinaturas canceladas",
      value: summary.canceled_subscriptions,
      helper: "Clientes que cancelaram",
      icon: TriangleAlert,
      danger: summary.canceled_subscriptions > 0,
    },
    {
      label: "Cupons ativos",
      value: summary.active_coupons,
      helper: `${summary.total_coupons} cupons cadastrados`,
      icon: TicketPercent,
      danger: false,
    },
    {
      label: "Eventos Asaas",
      value: summary.total_asaas_events,
      helper: "Webhooks recebidos pela API",
      icon: Webhook,
      danger: false,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-300">
              Acesso exclusivo do criador
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight">
              Painel administrativo LimaStock
            </h1>

            <p className="mt-3 max-w-2xl text-slate-300">
              Controle empresas, planos, assinaturas, cupons, bloqueios,
              auditoria e eventos de pagamento da plataforma.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <p className="text-sm text-slate-300">Status da plataforma</p>

            <div className="mt-2 flex items-center gap-2 text-lg font-bold">
              <Activity size={20} />
              Online
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminLinkCard
          href="/admin/tenants"
          icon={Building2}
          title="Empresas"
          description="Crie estabelecimentos, altere status, suspenda ou bana clientes."
        />

        <AdminLinkCard
          href="/admin/planos"
          icon={Layers3}
          title="Planos"
          description="Crie, edite e desative planos comerciais do SaaS."
        />

        <AdminLinkCard
          href="/admin/assinaturas"
          icon={CreditCard}
          title="Assinaturas"
          description="Veja planos, inadimplência e status das assinaturas."
        />

        <AdminLinkCard
          href="/admin/cupons"
          icon={TicketPercent}
          title="Cupons"
          description="Crie, ative, desative e acompanhe cupons da plataforma."
        />

        <AdminLinkCard
          href="/admin/webhooks"
          icon={Webhook}
          title="Webhooks"
          description="Monitore eventos recebidos do Asaas pela API."
        />

        <AdminLinkCard
          href="/admin/auditoria"
          icon={FileClock}
          title="Auditoria"
          description="Veja ações críticas feitas por usuários e administradores."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={
                    card.danger
                      ? "rounded-2xl bg-red-50 p-3 text-red-700"
                      : "rounded-2xl bg-slate-950 p-3 text-white"
                  }
                >
                  <Icon size={20} />
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  Admin
                </span>
              </div>

              <p className="mt-6 text-sm font-semibold text-slate-500">
                {card.label}
              </p>

              <p
                className={
                  card.danger
                    ? "mt-2 text-4xl font-black text-red-600"
                    : "mt-2 text-4xl font-black text-slate-950"
                }
              >
                {card.value}
              </p>

              <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function AdminLinkCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-white transition group-hover:scale-105">
        <Icon size={24} />
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>

      <p className="mt-2 text-sm text-slate-600">{description}</p>

      <p className="mt-5 text-sm font-bold text-slate-950 group-hover:underline">
        Abrir →
      </p>
    </Link>
  );
}