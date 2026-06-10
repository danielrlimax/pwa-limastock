"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CreditCard,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getCurrentTenant, Tenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

type DashboardSummary = {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  total_sales: number;
  sales_today: number;
  revenue_today: string;
  revenue_month: string;
};

type LowStockProduct = {
  id: string;
  name: string;
  barcode: string | null;
  current_stock: string;
  min_stock: string;
  sale_price: string;
};

type RecentSale = {
  id: string;
  status: string;
  payment_method: string;
  subtotal: string;
  discount: string;
  total: string;
  customer_name: string | null;
  created_at: string;
};

type SubscriptionStatus = {
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

const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  credit_card: "Crédito",
  debit_card: "Débito",
};

export default function DashboardPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setError("");

      const currentTenant = await getCurrentTenant();
      setTenant(currentTenant);

      const [summaryData, lowStockData, recentSalesData, subscriptionData] =
        await Promise.all([
          apiFetch<DashboardSummary>(
            `/dashboard/summary?tenant_id=${currentTenant.id}`
          ),
          apiFetch<LowStockProduct[]>(
            `/dashboard/low-stock?tenant_id=${currentTenant.id}`
          ),
          apiFetch<RecentSale[]>(
            `/dashboard/recent-sales?tenant_id=${currentTenant.id}`
          ),
          apiFetch<SubscriptionStatus>(
            `/subscriptions/status?tenant_id=${currentTenant.id}`
          ),
        ]);

      setSummary(summaryData);
      setLowStock(lowStockData);
      setRecentSales(recentSalesData);
      setSubscription(subscriptionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-700">
        <p className="text-sm font-bold uppercase tracking-wide">Erro</p>
        <h1 className="mt-2 text-2xl font-black">
          Não foi possível carregar o dashboard.
        </h1>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-300">
              LimaStock V1
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight">
              Bem-vindo ao painel do seu estoque
            </h1>

            <p className="mt-3 max-w-2xl text-slate-300">
              Acompanhe vendas, produtos, estoque baixo e assinatura em tempo
              real pela API.
            </p>
          </div>

          {tenant && (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Estabelecimento</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold">
                <Store size={20} />
                {tenant.name}
              </div>
            </div>
          )}
        </div>
      </section>

      {subscription && !subscription.is_active && (
        <section className="rounded-[2rem] border border-red-100 bg-red-50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-red-100 p-3 text-red-700">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h2 className="text-xl font-black text-red-950">
                  Sua assinatura está inativa
                </h2>
                <p className="mt-1 text-sm font-medium text-red-700">
                  Regularize sua assinatura para manter o acesso completo ao
                  sistema.
                </p>
              </div>
            </div>

            <Link
              href="/configuracoes"
              className="rounded-2xl bg-red-700 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-red-800"
            >
              Regularizar assinatura
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Faturamento hoje"
          value={formatMoney(summary?.revenue_today || 0)}
          helper={`${summary?.sales_today || 0} venda(s) hoje`}
        />

        <MetricCard
          icon={Receipt}
          label="Faturamento mês"
          value={formatMoney(summary?.revenue_month || 0)}
          helper={`${summary?.total_sales || 0} venda(s) no total`}
        />

        <MetricCard
          icon={Package}
          label="Produtos ativos"
          value={String(summary?.active_products || 0)}
          helper={`${summary?.total_products || 0} produto(s) cadastrados`}
        />

        <MetricCard
          icon={Boxes}
          label="Estoque baixo"
          value={String(summary?.low_stock_products || 0)}
          helper="Produtos abaixo do mínimo"
          alert={(summary?.low_stock_products || 0) > 0}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickAction
          href="/produtos"
          icon={Package}
          title="Produtos"
          description="Cadastrar e editar produtos"
        />

        <QuickAction
          href="/estoque"
          icon={Boxes}
          title="Estoque"
          description="Entrada, saída e ajuste"
        />

        <QuickAction
          href="/vendas"
          icon={ShoppingCart}
          title="Vendas"
          description="Finalizar nova venda"
        />

        <QuickAction
          href="/configuracoes"
          icon={Settings}
          title="Configurações"
          description="Assinatura e dados"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_430px]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Últimas vendas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Vendas recentes registradas pela API.
                </p>
              </div>

              <Link
                href="/vendas"
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                Nova venda
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Cliente</th>
                  <th className="px-6 py-4 font-bold">Pagamento</th>
                  <th className="px-6 py-4 font-bold">Desconto</th>
                  <th className="px-6 py-4 font-bold">Total</th>
                  <th className="px-6 py-4 font-bold">Data</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 font-black text-slate-950">
                      {sale.customer_name || "Consumidor final"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {paymentLabels[sale.payment_method] || sale.payment_method}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatMoney(sale.discount)}
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {formatMoney(sale.total)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {new Date(sale.created_at).toLocaleString("pt-BR")}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {!recentSales.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div
                className={
                  subscription?.is_active
                    ? "rounded-2xl bg-emerald-50 p-3 text-emerald-700"
                    : "rounded-2xl bg-red-50 p-3 text-red-700"
                }
              >
                {subscription?.is_active ? (
                  <ShieldCheck size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Assinatura
                </h2>
                <p className="text-sm text-slate-500">
                  Status validado pela API.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow
                label="Status"
                value={subscription?.status || "-"}
              />

              <InfoRow
                label="Plano"
                value={subscription?.plan_name || "Não identificado"}
              />

              <InfoRow
                label="Acesso"
                value={subscription?.is_active ? "Liberado" : "Bloqueado"}
              />

              <InfoRow
                label="Período até"
                value={
                  subscription?.current_period_end
                    ? new Date(
                        subscription.current_period_end
                      ).toLocaleDateString("pt-BR")
                    : "-"
                }
              />
            </div>

            <Link
              href="/configuracoes"
              className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Ver configuração
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-950">
                Estoque baixo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Produtos que precisam de reposição.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {lowStock.map((product) => (
                <div key={product.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {product.barcode || "Sem código"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-black text-red-700">
                      {product.current_stock}/{product.min_stock}
                    </div>
                  </div>
                </div>
              ))}

              {!lowStock.length && (
                <div className="p-6 text-center text-sm font-semibold text-slate-500">
                  Nenhum produto com estoque baixo.
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4">
              <Link
                href="/estoque"
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                Ir para estoque
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  alert = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  helper: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={
          alert
            ? "mb-5 inline-flex rounded-2xl bg-red-50 p-3 text-red-700"
            : "mb-5 inline-flex rounded-2xl bg-slate-950 p-3 text-white"
        }
      >
        <Icon size={20} />
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>

      <p
        className={
          alert
            ? "mt-2 text-3xl font-black text-red-600"
            : "mt-2 text-3xl font-black text-slate-950"
        }
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function QuickAction({
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
      <Icon className="text-slate-950" size={28} />

      <h2 className="mt-5 text-lg font-black text-slate-950">{title}</h2>

      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <p className="mt-4 flex items-center gap-2 text-sm font-black text-slate-950 group-hover:underline">
        Abrir
        <ArrowRight size={16} />
      </p>
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="text-right text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}