"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, TicketPercent } from "lucide-react";
import { apiFetch } from "@/lib/api";

type AdminCoupon = {
  id: string;
  code: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: string;
  active: boolean;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");

  async function loadCoupons() {
    try {
      setError("");
      const data = await apiFetch<AdminCoupon[]>("/admin/coupons");
      setCoupons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar cupons.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");

      await apiFetch<AdminCoupon>("/admin/coupons", {
        method: "POST",
        body: {
          code,
          description: description || null,
          type,
          value: Number(value),
          max_uses: maxUses ? Number(maxUses) : null,
          active: true,
        },
      });

      setCode("");
      setDescription("");
      setType("percentage");
      setValue("");
      setMaxUses("");

      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cupom.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleCoupon(coupon: AdminCoupon) {
    try {
      await apiFetch<AdminCoupon>(`/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        body: {
          active: !coupon.active,
        },
      });

      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar cupom.");
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl bg-white p-4 text-slate-950">
            <TicketPercent size={28} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <h1 className="text-3xl font-black">Cupons</h1>
            <p className="mt-1 text-slate-300">
              Crie, ative, desative e acompanhe os cupons da plataforma.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleCreateCoupon}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Plus size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Criar cupom
              </h2>
              <p className="text-sm text-slate-500">
                A API valida e salva tudo.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Código" value={code} onChange={setCode} placeholder="MVP100" required />
            <Input label="Descrição" value={description} onChange={setDescription} placeholder="Cupom de lançamento" />

            <div>
              <label className="text-sm font-bold text-slate-700">Tipo</label>
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as "percentage" | "fixed")
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              >
                <option value="percentage">Porcentagem</option>
                <option value="fixed">Valor fixo</option>
              </select>
            </div>

            <Input
              label="Valor"
              value={value}
              onChange={setValue}
              type="number"
              placeholder={type === "percentage" ? "100" : "29.90"}
              required
            />

            <Input
              label="Limite de usos"
              value={maxUses}
              onChange={setMaxUses}
              type="number"
              placeholder="Opcional"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {creating ? "Criando..." : "Criar cupom"}
          </button>
        </form>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-black text-slate-950">
              Cupons cadastrados
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Lista carregada diretamente da API.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Código</th>
                  <th className="px-6 py-4 font-bold">Tipo</th>
                  <th className="px-6 py-4 font-bold">Valor</th>
                  <th className="px-6 py-4 font-bold">Usos</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Ação</th>
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
                  coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 font-black text-slate-950">
                        {coupon.code}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {coupon.type === "percentage" ? "Porcentagem" : "Fixo"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {coupon.type === "percentage"
                          ? `${coupon.value}%`
                          : `R$ ${coupon.value}`}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {coupon.used_count}
                        {coupon.max_uses ? `/${coupon.max_uses}` : ""}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {coupon.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCoupon(coupon)}
                          className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                        >
                          {coupon.active ? "Desativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}

                {!loading && !coupons.length && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Nenhum cupom encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
      />
    </div>
  );
}