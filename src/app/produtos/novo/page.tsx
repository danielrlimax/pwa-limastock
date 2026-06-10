"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Barcode, PackagePlus, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getCurrentTenant } from "@/lib/tenant";

type Category = {
  id: string;
  name: string;
  active: boolean;
};

function NovoProdutoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const barcodeFromUrl = searchParams.get("barcode") || "";

  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState(barcodeFromUrl);
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const [currentStock, setCurrentStock] = useState("0");
  const [minStock, setMinStock] = useState("0");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      const tenant = await getCurrentTenant();

      const data = await apiFetch<Category[]>(
        `/categories?tenant_id=${tenant.id}`
      );

      setCategories(data.filter((category) => category.active));
    } catch {
      setCategories([]);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const tenant = await getCurrentTenant();

      await apiFetch("/products", {
        method: "POST",
        body: {
          tenant_id: tenant.id,
          category_id: categoryId || null,
          name,
          description: description || null,
          barcode: barcode || null,
          unit: "unit",
          cost_price: Number(costPrice || 0),
          sale_price: Number(salePrice || 0),
          current_stock: Number(currentStock || 0),
          min_stock: Number(minStock || 0),
          active: true,
        },
      });

      router.push("/produtos");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível criar produto."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="flex items-center gap-4">
          <div className="rounded-3xl bg-white p-4 text-slate-950">
            <PackagePlus size={28} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Novo produto
            </p>
            <h1 className="text-3xl font-black">Cadastrar produto</h1>
            <p className="mt-1 text-sm text-slate-300">
              Produto criado no estabelecimento vinculado à sua conta.
            </p>
          </div>
        </div>
      </section>

      {barcodeFromUrl && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-800">
          <div className="flex items-center gap-3">
            <Barcode size={20} />
            <p className="font-bold">
              Código lido pelo scanner: {barcodeFromUrl}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Nome do produto">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Camiseta Dry Fit"
              className="input"
              required
            />
          </Field>

          <Field label="Código de barras">
            <input
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="789..."
              className="input font-mono"
            />
          </Field>

          <Field label="Categoria">
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="input"
            >
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Preço de venda">
            <input
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
              className="input"
              required
            />
          </Field>

          <Field label="Preço de custo">
            <input
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(event) => setCostPrice(event.target.value)}
              className="input"
            />
          </Field>

          <Field label="Estoque atual">
            <input
              type="number"
              min="0"
              step="1"
              value={currentStock}
              onChange={(event) => setCurrentStock(event.target.value)}
              className="input"
            />
          </Field>

          <Field label="Estoque mínimo">
            <input
              type="number"
              min="0"
              step="1"
              value={minStock}
              onChange={(event) => setMinStock(event.target.value)}
              className="input"
            />
          </Field>

          <div className="lg:col-span-2">
            <Field label="Descrição">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descrição opcional"
                className="input min-h-28"
              />
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "Salvando..." : "Salvar produto"}
        </button>
      </form>

      <style jsx>{`
        .input {
          margin-top: 0.5rem;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.85rem 1rem;
          outline: none;
        }

        .input:focus {
          border-color: rgb(15 23 42);
          background: white;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {children}
    </label>
  );
}

export default function NovoProdutoPage() {
  return (
    <Suspense>
      <NovoProdutoContent />
    </Suspense>
  );
}