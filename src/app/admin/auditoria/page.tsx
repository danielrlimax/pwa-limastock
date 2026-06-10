"use client";

import { useEffect, useState } from "react";
import { FileClock, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";

type AuditLog = {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export default function AdminAuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actorEmail, setActorEmail] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (actorEmail) {
        params.set("actor_email", actorEmail);
      }

      if (action) {
        params.set("action", action);
      }

      if (entityType) {
        params.set("entity_type", entityType);
      }

      const query = params.toString();

      const data = await apiFetch<AuditLog[]>(
        `/admin/audit-logs${query ? `?${query}` : ""}`
      );

      setLogs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar auditoria."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl bg-white p-4 text-slate-950">
            <FileClock size={28} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <h1 className="text-3xl font-black">Auditoria</h1>
            <p className="mt-1 text-slate-300">
              Acompanhe ações importantes realizadas no sistema.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="text-sm font-bold text-slate-700">
              E-mail do usuário
            </label>

            <input
              value={actorEmail}
              onChange={(event) => setActorEmail(event.target.value)}
              placeholder="usuario@email.com"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Ação</label>

            <input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="auth.login"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Entidade
            </label>

            <input
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              placeholder="product, sale, tenant..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadLogs}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
            >
              <Search size={18} />
              Filtrar
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-black text-slate-950">
            Logs recentes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Registros carregados diretamente da API.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Data</th>
                <th className="px-6 py-4 font-bold">Usuário</th>
                <th className="px-6 py-4 font-bold">Ação</th>
                <th className="px-6 py-4 font-bold">Entidade</th>
                <th className="px-6 py-4 font-bold">Descrição</th>
                <th className="px-6 py-4 font-bold">IP</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Carregando logs...
                  </td>
                </tr>
              )}

              {!loading &&
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-950">
                      {log.actor_email || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {log.entity_type}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {log.description || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {log.ip_address || "-"}
                    </td>
                  </tr>
                ))}

              {!loading && !logs.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Nenhum log encontrado.
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