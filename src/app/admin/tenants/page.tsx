"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Plus,
  RefreshCcw,
  ShieldBan,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type AdminTenant = {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  status: string;
  created_at?: string;
};

type CreateTenantResponse = AdminTenant & {
  owner?: {
    id?: string;
    email?: string | null;
  };
  subscription?: {
    id?: string;
    status?: string;
  };
  plan?: {
    id?: string;
    code?: string;
    name?: string;
  };
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const generatedSlug = useMemo(() => {
    return slugify(name);
  }, [name]);

  async function loadTenants(force = false) {
    try {
      if (force) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await apiFetch<AdminTenant[]>("/admin/tenants");
      setTenants(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar estabelecimentos."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCreateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const finalSlug = slugify(slug || generatedSlug || name);

      if (!name.trim()) {
        throw new Error("Informe o nome do estabelecimento.");
      }

      if (!finalSlug) {
        throw new Error("Informe um nome válido para gerar o slug.");
      }

      const result = await apiFetch<CreateTenantResponse>("/admin/tenants", {
        method: "POST",
        body: {
          name: name.trim(),
          slug: finalSlug,
          email: email.trim() || null,
          phone: phone.trim() || null,
          document: document.trim() || null,
          owner_email: ownerEmail.trim() || null,
          status: "trialing",
        },
      });

      setName("");
      setSlug("");
      setEmail("");
      setPhone("");
      setDocument("");
      setOwnerEmail("");

      setSuccess(
        `Estabelecimento "${result.name}" criado com sucesso no plano ${
          result.plan?.name || "Starter"
        }.`
      );

      await loadTenants(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar estabelecimento."
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(tenantId: string, nextStatus: string) {
    try {
      setError("");
      setSuccess("");

      await apiFetch<AdminTenant>(`/admin/tenants/${tenantId}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });

      setSuccess("Status atualizado com sucesso.");
      await loadTenants(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status.");
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-white p-4 text-slate-950">
              <Building2 size={28} />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Admin
              </p>

              <h1 className="text-3xl font-black">Estabelecimentos</h1>

              <p className="mt-1 max-w-2xl text-slate-300">
                Crie estabelecimentos, vincule o dono, gere assinatura trial e
                controle o status dos clientes.
              </p>
            </div>
          </div>

          <button
            onClick={() => loadTenants(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 disabled:opacity-60"
          >
            <RefreshCcw size={18} />
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <span>{success}</span>
          </div>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleCreateTenant}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Plus size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Criar estabelecimento
              </h2>

              <p className="text-sm text-slate-500">
                Cria tenant, vínculo do dono e assinatura trial.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Nome"
              value={name}
              onChange={(value) => {
                setName(value);

                if (!slug.trim()) {
                  setSlug(slugify(value));
                }
              }}
              required
            />

            <Input
              label="Slug"
              value={slug}
              onChange={(value) => setSlug(slugify(value))}
              placeholder={generatedSlug || "bar-do-joao"}
              helper="Usado internamente na URL e identificação do estabelecimento."
              required
            />

            <Input
              label="E-mail do estabelecimento"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="contato@empresa.com"
            />

            <Input
              label="Telefone"
              value={phone}
              onChange={setPhone}
              placeholder="(19) 99999-9999"
            />

            <Input
              label="Documento"
              value={document}
              onChange={setDocument}
              placeholder="CNPJ ou CPF"
            />

            <Input
              label="E-mail do dono"
              value={ownerEmail}
              onChange={setOwnerEmail}
              type="email"
              placeholder="dono@email.com"
              helper="Opcional. Se ficar vazio, o admin logado será vinculado como dono."
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {creating ? "Criando..." : "Criar estabelecimento"}
          </button>
        </form>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-black text-slate-950">
              Estabelecimentos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Controle total de acesso dos clientes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Empresa</th>
                  <th className="px-6 py-4 font-bold">Slug</th>
                  <th className="px-6 py-4 font-bold">E-mail</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Criada em</th>
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
                      Carregando...
                    </td>
                  </tr>
                )}

                {!loading &&
                  tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="px-6 py-4 font-black text-slate-950">
                        {tenant.name}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                        {tenant.slug}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {tenant.email || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={tenant.status} />
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {tenant.created_at
                          ? new Date(tenant.created_at).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <select
                            value={tenant.status}
                            onChange={(event) =>
                              updateStatus(tenant.id, event.target.value)
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                          >
                            <option value="trialing">trialing</option>
                            <option value="active">active</option>
                            <option value="suspended">suspended</option>
                            <option value="canceled">canceled</option>
                            <option value="banned">banned</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => updateStatus(tenant.id, "banned")}
                            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            <span className="inline-flex items-center gap-1">
                              <ShieldBan size={14} />
                              Banir
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && !tenants.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Nenhum estabelecimento encontrado.
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
  helper,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  helper?: string;
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

      {helper && (
        <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    trialing: "bg-blue-50 text-blue-700",
    suspended: "bg-yellow-50 text-yellow-700",
    canceled: "bg-slate-100 text-slate-700",
    cancelled: "bg-slate-100 text-slate-700",
    banned: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}