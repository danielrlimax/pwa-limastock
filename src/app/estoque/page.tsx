"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  CheckCircle2,
  PackageSearch,
  RotateCcw,
  Search,
  TriangleAlert,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getCurrentTenant, Tenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

type Product = {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  barcode: string | null;
  unit: string;
  cost_price: string;
  sale_price: string;
  current_stock: string;
  min_stock: string;
  active: boolean;
  created_at: string;
};

type MovementType = "in" | "out" | "adjustment";

export default function EstoquePage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [productId, setProductId] = useState("");
  const [movementType, setMovementType] = useState<MovementType>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [search, setSearch] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setError("");

      const currentTenant = await getCurrentTenant();
      setTenant(currentTenant);

      const productsData = await apiFetch<Product[]>(
        `/products?tenant_id=${currentTenant.id}`
      );

      setProducts(productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar estoque.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenant) {
      setError("Tenant não encontrado.");
      return;
    }

    if (!productId) {
      setError("Selecione um produto.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError("Informe uma quantidade maior que zero.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiFetch("/stock/adjust", {
        method: "POST",
        body: {
          tenant_id: tenant.id,
          product_id: productId,
          type: movementType,
          quantity: Number(quantity),
          reason: reason || null,
        },
      });

      setProductId("");
      setMovementType("in");
      setQuantity("");
      setReason("");

      setSuccess("Movimentação registrada com sucesso.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao movimentar estoque."
      );
    } finally {
      setSaving(false);
    }
  }

  const activeProducts = products.filter((product) => product.active);

  const selectedProduct = products.find((product) => product.id === productId);

  const lowStockProducts = products.filter((product) => {
    return (
      product.active &&
      Number(product.current_stock) <= Number(product.min_stock)
    );
  });

  const totalStockValue = products.reduce((total, product) => {
    return total + Number(product.current_stock) * Number(product.sale_price);
  }, 0);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const isLowStock =
        Number(product.current_stock) <= Number(product.min_stock);

      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.barcode || "").toLowerCase().includes(normalizedSearch);

      const matchesLowStock = !onlyLowStock || isLowStock;

      return matchesSearch && matchesLowStock;
    });
  }, [products, search, onlyLowStock]);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-white p-4 text-slate-950">
              <Boxes size={28} />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                LimaStock
              </p>
              <h1 className="text-3xl font-black">Estoque</h1>
              <p className="mt-1 text-slate-300">
                Faça entradas, saídas e ajustes manuais de produtos.
              </p>
            </div>
          </div>

          {tenant && (
            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4">
              <p className="text-sm text-slate-300">Estabelecimento</p>
              <p className="font-bold">{tenant.name}</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Produtos ativos" value={activeProducts.length} />
        <MetricCard
          label="Estoque baixo"
          value={lowStockProducts.length}
          alert={lowStockProducts.length > 0}
        />
        <MetricCard label="Produtos totais" value={products.length} />
        <MetricCard
          label="Valor em estoque"
          value={formatMoney(totalStockValue)}
        />
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

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <PackageSearch size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Movimentar estoque
              </h2>
              <p className="text-sm text-slate-500">
                A API registra e atualiza o estoque do produto.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">
                Produto
              </label>

              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
                required
              >
                <option value="">Selecione um produto</option>

                {activeProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · estoque atual: {product.current_stock}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-700">
                  {selectedProduct.name}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Estoque atual</p>
                    <p className="font-black text-slate-950">
                      {selectedProduct.current_stock}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Estoque mínimo</p>
                    <p className="font-black text-slate-950">
                      {selectedProduct.min_stock}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Preço venda</p>
                    <p className="font-black text-slate-950">
                      {formatMoney(selectedProduct.sale_price)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Código</p>
                    <p className="font-black text-slate-950">
                      {selectedProduct.barcode || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-slate-700">
                Tipo de movimentação
              </label>

              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <MovementButton
                  active={movementType === "in"}
                  icon={ArrowUpCircle}
                  label="Entrada"
                  onClick={() => setMovementType("in")}
                />

                <MovementButton
                  active={movementType === "out"}
                  icon={ArrowDownCircle}
                  label="Saída"
                  onClick={() => setMovementType("out")}
                />

                <MovementButton
                  active={movementType === "adjustment"}
                  icon={RotateCcw}
                  label="Ajuste"
                  onClick={() => setMovementType("adjustment")}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Quantidade
              </label>

              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Ex: 10"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Motivo
              </label>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ex: compra de fornecedor, perda, correção..."
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Registrando..." : "Registrar movimentação"}
          </button>
        </form>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Estoque dos produtos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Produtos carregados pela API.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-950 sm:w-64"
                  />
                </div>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyLowStock}
                    onChange={(event) => setOnlyLowStock(event.target.checked)}
                  />
                  Só estoque baixo
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Produto</th>
                  <th className="px-6 py-4 font-bold">Código</th>
                  <th className="px-6 py-4 font-bold">Estoque</th>
                  <th className="px-6 py-4 font-bold">Mínimo</th>
                  <th className="px-6 py-4 font-bold">Valor unitário</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Carregando estoque...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredProducts.map((product) => {
                    const isLowStock =
                      Number(product.current_stock) <= Number(product.min_stock);

                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-950">
                            {product.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {product.description || "Sem descrição"}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {product.barcode || "-"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isLowStock ? (
                              <TriangleAlert size={16} className="text-red-600" />
                            ) : (
                              <CheckCircle2 size={16} className="text-emerald-600" />
                            )}

                            <span
                              className={
                                isLowStock
                                  ? "font-black text-red-700"
                                  : "font-black text-slate-950"
                              }
                            >
                              {product.current_stock}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {product.min_stock}
                        </td>

                        <td className="px-6 py-4 font-bold text-slate-700">
                          {formatMoney(product.sale_price)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={
                              isLowStock
                                ? "rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700"
                                : "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
                            }
                          >
                            {isLowStock ? "Estoque baixo" : "Ok"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && !filteredProducts.length && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Nenhum produto encontrado.
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

function MovementButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
          : "flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-100"
      }
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function MetricCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number | string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>

      <p
        className={
          alert
            ? "mt-2 text-4xl font-black text-red-600"
            : "mt-2 text-4xl font-black text-slate-950"
        }
      >
        {value}
      </p>
    </div>
  );
}