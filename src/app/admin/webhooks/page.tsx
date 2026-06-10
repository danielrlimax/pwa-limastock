"use client";

import { useEffect, useState } from "react";
import { Webhook } from "lucide-react";
import { apiFetch } from "@/lib/api";

type AdminAsaasEvent = {
  id: string;
  event_id: string | null;
  event_type: string | null;
  payment_id: string | null;
  subscription_id: string | null;
  customer_id: string | null;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
};

export default function AdminWebhooksPage() {
  const [events, setEvents] = useState<AdminAsaasEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setError("");
        const data = await apiFetch<AdminAsaasEvent[]>("/admin/asaas-events");
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar eventos.");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl bg-white p-4 text-slate-950">
            <Webhook size={28} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <h1 className="text-3xl font-black">Webhooks Asaas</h1>
            <p className="mt-1 text-slate-300">
              Monitore todos os eventos recebidos pela API.
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
                <th className="px-6 py-4 font-bold">Evento</th>
                <th className="px-6 py-4 font-bold">Pagamento</th>
                <th className="px-6 py-4 font-bold">Assinatura</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Processado</th>
                <th className="px-6 py-4 font-bold">Criado em</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              )}

              {!loading &&
                events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 font-black text-slate-950">
                      {event.event_type || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {event.payment_id || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {event.subscription_id || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {event.customer_id || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {event.processed ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(event.created_at).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}

              {!loading && !events.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum evento encontrado.
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