"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { apiFetch } from "@/lib/api";

type AdminSubscription = {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  status: string;
  provider: string;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSubscriptions() {
    try {
      setError("");
      const data = await apiFetch<AdminSubscription[]>("/admin/subscriptions");
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar assinaturas.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(subscriptionId: string, status: string) {
    try {
      await apiFetch<AdminSubscription>(`/admin/subscriptions/${subscriptionId}/status`, {
        method: "PATCH",
        body: { status },
      });

      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar assinatura.");
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl bg-white p-4 text-slate-950">
            <CreditCard size={28} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <h1 className="text-3xl font-black">Assinaturas</h1>
            <p className="mt-1 text-slate-300">
              Gerencie status, inadimplência e vínculos com o Asaas.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Empresa</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Provider</th>
                <th className="px-6 py-4 font-bold">Asaas Customer</th>
                <th className="px-6 py-4 font-bold">Asaas Subscription</th>
                <th className="px-6 py-4 font-bold">Criada em</th>
                <th className="px-6 py-4 font-bold">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              )}

              {!loading &&
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className="px-6 py-4 font-black text-slate-950">
                      {subscription.tenant_name || subscription.tenant_id}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={subscription.status} />
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {subscription.provider}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {subscription.asaas_customer_id || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {subscription.asaas_subscription_id || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {new Date(subscription.created_at).toLocaleDateString("pt-BR")}
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={subscription.status}
                        onChange={(event) =>
                          updateStatus(subscription.id, event.target.value)
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                      >
                        <option value="trialing">trialing</option>
                        <option value="active">active</option>
                        <option value="past_due">past_due</option>
                        <option value="canceled">canceled</option>
                        <option value="expired">expired</option>
                      </select>
                    </td>
                  </tr>
                ))}

              {!loading && !subscriptions.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    trialing: "bg-blue-50 text-blue-700",
    past_due: "bg-yellow-50 text-yellow-700",
    canceled: "bg-slate-100 text-slate-700",
    expired: "bg-red-50 text-red-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${map[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}