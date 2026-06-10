"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly: string;
  features: string[];
  max_products: number | null;
  max_users: number | null;
  active: boolean;
  created_at: string;
  updated_at: string | null;
};

type PlanForm = {
  code: string;
  name: string;
  description: string;
  price_monthly: string;
  features: string;
  max_products: string;
  max_users: string;
  active: boolean;
};

const emptyForm: PlanForm = {
  code: "",
  name: "",
  description: "",
  price_monthly: "",
  features: "",
  max_products: "",
  max_users: "",
  active: true,
};

export default function AdminPlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPlans() {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch<Plan[]>("/admin/plans");

      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingPlan(null);
  }

  function startEdit(plan: Plan) {
    setEditingPlan(plan);

    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description || "",
      price_monthly: String(plan.price_monthly || ""),
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      max_products: plan.max_products !== null ? String(plan.max_products) : "",
      max_users: plan.max_users !== null ? String(plan.max_users) : "",
      active: plan.active,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function buildPayload() {
    return {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_monthly: Number(form.price_monthly || 0),
      features: form.features
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      max_products: form.max_products ? Number(form.max_products) : null,
      max_users: form.max_users ? Number(form.max_users) : null,
      active: form.active,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = buildPayload();

      if (editingPlan) {
        await apiFetch(`/admin/plans/${editingPlan.id}`, {
          method: "PATCH",
          body: payload,
        });

        setSuccess("Plano atualizado com sucesso.");
      } else {
        await apiFetch("/admin/plans", {
          method: "POST",
          body: payload,
        });

        setSuccess("Plano criado com sucesso.");
      }

      resetForm();
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  }

  async function disablePlan(plan: Plan) {
    const confirmed = window.confirm(
      `Tem certeza que deseja desativar o plano "${plan.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiFetch(`/admin/plans/${plan.id}`, {
        method: "DELETE",
      });

      setSuccess("Plano desativado com sucesso.");
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desativar plano.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Admin
        </p>

        <h1 className="mt-2 text-4xl font-black">Planos do SaaS</h1>

        <p className="mt-3 max-w-2xl text-slate-300">
          Crie, edite e desative os planos disponíveis para os estabelecimentos
          assinarem o LimaStock.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              {editingPlan ? "Editar plano" : "Novo plano"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Os planos ativos podem ser usados no fluxo de assinatura.
            </p>
          </div>

          {editingPlan && (
            <button
              onClick={resetForm}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-700">
              Código do plano
            </label>

            <input
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value,
                }))
              }
              placeholder="starter, pro, enterprise"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Nome do plano
            </label>

            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Starter"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Preço mensal
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price_monthly}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price_monthly: event.target.value,
                }))
              }
              placeholder="29.90"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-700">
                Máx. produtos
              </label>

              <input
                type="number"
                min="0"
                value={form.max_products}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    max_products: event.target.value,
                  }))
                }
                placeholder="100"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Máx. usuários
              </label>

              <input
                type="number"
                min="0"
                value={form.max_users}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    max_users: event.target.value,
                  }))
                }
                placeholder="3"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              />
            </div>
          </div>

          <div className="xl:col-span-2">
            <label className="text-sm font-bold text-slate-700">
              Descrição
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Plano ideal para pequenos negócios começando..."
              className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
            />
          </div>

          <div className="xl:col-span-2">
            <label className="text-sm font-bold text-slate-700">
              Recursos do plano
            </label>

            <textarea
              value={form.features}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  features: event.target.value,
                }))
              }
              placeholder={"Controle de estoque\nVendas\nDashboard\nSuporte básico"}
              className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
            />

            <p className="mt-2 text-xs font-semibold text-slate-400">
              Coloque um recurso por linha.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  active: event.target.checked,
                }))
              }
              className="h-5 w-5"
            />

            <span className="text-sm font-bold text-slate-700">
              Plano ativo
            </span>
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingPlan ? <Save size={18} /> : <Plus size={18} />}
              {saving
                ? "Salvando..."
                : editingPlan
                  ? "Salvar alterações"
                  : "Criar plano"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-2xl font-black text-slate-950">
            Planos cadastrados
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Desative planos antigos em vez de apagar o histórico.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Plano</th>
                <th className="px-6 py-4 font-bold">Código</th>
                <th className="px-6 py-4 font-bold">Preço</th>
                <th className="px-6 py-4 font-bold">Limites</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Carregando planos...
                  </td>
                </tr>
              )}

              {!loading &&
                plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-950">{plan.name}</p>
                      <p className="mt-1 max-w-md text-xs text-slate-500">
                        {plan.description || "Sem descrição"}
                      </p>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                      {plan.code}
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {formatMoney(plan.price_monthly)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <p>Produtos: {plan.max_products ?? "Ilimitado"}</p>
                      <p>Usuários: {plan.max_users ?? "Ilimitado"}</p>
                    </td>

                    <td className="px-6 py-4">
                      {plan.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          <CheckCircle2 size={14} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                          <XCircle size={14} />
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(plan)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                        >
                          <Edit3 size={15} />
                          Editar
                        </button>

                        <button
                          onClick={() => disablePlan(plan)}
                          disabled={!plan.active}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Desativar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && !plans.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Nenhum plano cadastrado.
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