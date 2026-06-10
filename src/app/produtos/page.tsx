"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Barcode,
  CheckCircle2,
  FolderPlus,
  Package,
  Pencil,
  Plus,
  Search,
  Tags,
  TriangleAlert,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { getCurrentTenant, Tenant } from "@/lib/tenant";

type Category = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  active?: boolean;
  is_active?: boolean;
  created_at: string;
};

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
  active?: boolean;
  is_active?: boolean;
  created_at: string;
};

type ProductForm = {
  name: string;
  description: string;
  barcode: string;
  category_id: string;
  unit: string;
  cost_price: string;
  sale_price: string;
  current_stock: string;
  min_stock: string;
  active: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  barcode: "",
  category_id: "",
  unit: "un",
  cost_price: "",
  sale_price: "",
  current_stock: "0",
  min_stock: "0",
  active: true,
};

function isActive(entity: { active?: boolean; is_active?: boolean }) {
  if (typeof entity.active === "boolean") return entity.active;
  if (typeof entity.is_active === "boolean") return entity.is_active;
  return true;
}

function normalizeBarcode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export default function ProdutosPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const [activeTab, setActiveTab] = useState<"products" | "categories">(
    "products"
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setError("");

      const currentTenant = await getCurrentTenant();
      setTenant(currentTenant);

      const [productsData, categoriesData] = await Promise.all([
        apiFetch<Product[]>(`/products?tenant_id=${currentTenant.id}`),
        apiFetch<Category[]>(`/categories?tenant_id=${currentTenant.id}`),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function startEdit(product: Product) {
    setEditingProduct(product);

    setForm({
      name: product.name,
      description: product.description || "",
      barcode: product.barcode || "",
      category_id: product.category_id || "",
      unit: product.unit || "un",
      cost_price: String(product.cost_price || ""),
      sale_price: String(product.sale_price || ""),
      current_stock: String(product.current_stock || "0"),
      min_stock: String(product.min_stock || "0"),
      active: isActive(product),
    });

    setActiveTab("products");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setEditingProduct(null);
    setForm(emptyForm);
  }

  async function handleSubmitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenant) {
      setError("Tenant não encontrado.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        throw new Error("Informe o nome do produto.");
      }

      if (!form.sale_price.trim()) {
        throw new Error("Informe o preço de venda.");
      }

      const payload = {
        tenant_id: tenant.id,
        category_id: form.category_id || null,
        name: form.name.trim(),
        description: form.description.trim() || null,
        barcode: normalizeBarcode(form.barcode) || null,
        unit: form.unit || "un",
        cost_price: Number(form.cost_price || 0),
        sale_price: Number(form.sale_price || 0),
        current_stock: Number(form.current_stock || 0),
        min_stock: Number(form.min_stock || 0),
      };

      if (editingProduct) {
        await apiFetch<Product>(`/products/${editingProduct.id}`, {
          method: "PATCH",
          body: payload,
        });

        setSuccess("Produto atualizado com sucesso.");
      } else {
        await apiFetch<Product>("/products", {
          method: "POST",
          body: payload,
        });

        setSuccess("Produto criado com sucesso.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenant) {
      setError("Tenant não encontrado.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!categoryName.trim()) {
        throw new Error("Informe o nome da categoria.");
      }

      await apiFetch<Category>("/categories", {
        method: "POST",
        body: {
          tenant_id: tenant.id,
          name: categoryName.trim(),
          description: categoryDescription.trim() || null,
        },
      });

      setCategoryName("");
      setCategoryDescription("");
      setSuccess("Categoria criada com sucesso.");

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar categoria.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product: Product) {
    try {
      setError("");
      setSuccess("");

      await apiFetch<Product>(`/products/${product.id}`, {
        method: "PATCH",
        body: {
          active: !isActive(product),
        },
      });

      setSuccess(isActive(product) ? "Produto desativado." : "Produto ativado.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar produto.");
    }
  }

  async function toggleCategory(category: Category) {
    try {
      setError("");
      setSuccess("");

      await apiFetch<Category>(`/categories/${category.id}`, {
        method: "PATCH",
        body: {
          active: !isActive(category),
        },
      });

      setSuccess(
        isActive(category) ? "Categoria desativada." : "Categoria ativada."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao alterar categoria."
      );
    }
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.barcode || "").toLowerCase().includes(normalizedSearch);

      const productActive = isActive(product);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && productActive) ||
        (statusFilter === "inactive" && !productActive);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const activeCategories = categories.filter((category) => isActive(category));

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => isActive(product)).length;
  const lowStockProducts = products.filter((product) => {
    return Number(product.current_stock) <= Number(product.min_stock);
  }).length;

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
            Produtos
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Cadastre produtos, organize categorias e acompanhe o estoque.
          </p>
        </div>

        <Link
          href="/produtos/novo"
          prefetch
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 active:scale-95"
        >
          <Barcode size={18} />
          Cadastrar por código
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Produtos" value={totalProducts} />
        <MetricCard label="Ativos" value={activeProducts} />
        <MetricCard
          label="Estoque baixo"
          value={lowStockProducts}
          alert={lowStockProducts > 0}
        />
        <MetricCard label="Categorias" value={activeCategories.length} />
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={
            activeTab === "products"
              ? "rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              : "rounded-2xl px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-100"
          }
        >
          Produtos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={
            activeTab === "categories"
              ? "rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              : "rounded-2xl px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-100"
          }
        >
          Categorias
        </button>
      </div>

      {tenant && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Estabelecimento atual:{" "}
          <span className="font-black text-slate-950">{tenant.name}</span>
        </div>
      )}

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

      {activeTab === "products" && (
        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSubmitProduct}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                {editingProduct ? <Pencil size={20} /> : <Plus size={20} />}
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {editingProduct ? "Editar produto" : "Novo produto"}
                </h2>
                <p className="text-sm text-slate-500">
                  Cadastro manual rápido.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Nome"
                value={form.name}
                onChange={(value) => updateForm("name", value)}
                placeholder="Coca-Cola 350ml"
                required
              />

              <Input
                label="Descrição"
                value={form.description}
                onChange={(value) => updateForm("description", value)}
                placeholder="Descrição opcional"
              />

              <Input
                label="Código de barras"
                value={form.barcode}
                onChange={(value) =>
                  updateForm("barcode", normalizeBarcode(value))
                }
                placeholder="789..."
              />

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Categoria
                </label>

                <select
                  value={form.category_id}
                  onChange={(event) =>
                    updateForm("category_id", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
                >
                  <option value="">Sem categoria</option>

                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {!activeCategories.length && (
                  <p className="mt-2 text-xs font-semibold text-yellow-700">
                    Nenhuma categoria ativa. Crie uma na aba Categorias.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Unidade
                </label>

                <select
                  value={form.unit}
                  onChange={(event) => updateForm("unit", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
                >
                  <option value="un">Unidade</option>
                  <option value="kg">Kg</option>
                  <option value="g">Gramas</option>
                  <option value="l">Litro</option>
                  <option value="ml">Ml</option>
                  <option value="box">Caixa</option>
                  <option value="pack">Pacote</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Preço de custo"
                  type="number"
                  value={form.cost_price}
                  onChange={(value) => updateForm("cost_price", value)}
                  placeholder="0.00"
                  required
                />

                <Input
                  label="Preço de venda"
                  type="number"
                  value={form.sale_price}
                  onChange={(value) => updateForm("sale_price", value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Estoque atual"
                  type="number"
                  value={form.current_stock}
                  onChange={(value) => updateForm("current_stock", value)}
                  placeholder="0"
                />

                <Input
                  label="Estoque mínimo"
                  type="number"
                  value={form.min_stock}
                  onChange={(value) => updateForm("min_stock", value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving
                  ? "Salvando..."
                  : editingProduct
                  ? "Salvar alterações"
                  : "Criar produto"}
              </button>

              {editingProduct && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <ProductsTable
            loading={loading}
            products={filteredProducts}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            startEdit={startEdit}
            toggleProduct={toggleProduct}
          />
        </section>
      )}

      {activeTab === "categories" && (
        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleCreateCategory}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <FolderPlus size={20} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Nova categoria
                </h2>
                <p className="text-sm text-slate-500">
                  Organize seus produtos por grupos.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Nome da categoria"
                value={categoryName}
                onChange={setCategoryName}
                placeholder="Bebidas"
                required
              />

              <Input
                label="Descrição"
                value={categoryDescription}
                onChange={setCategoryDescription}
                placeholder="Descrição opcional"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Criando..." : "Criar categoria"}
            </button>
          </form>

          <CategoriesTable
            loading={loading}
            categories={categories}
            toggleCategory={toggleCategory}
          />
        </section>
      )}
    </div>
  );
}

function ProductsTable({
  loading,
  products,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  startEdit,
  toggleProduct,
}: {
  loading: boolean;
  products: Product[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: "all" | "active" | "inactive";
  setStatusFilter: (value: "all" | "active" | "inactive") => void;
  startEdit: (product: Product) => void;
  toggleProduct: (product: Product) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Lista de produtos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Produtos cadastrados no estabelecimento.
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

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive"
                )
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-950"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
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
              <th className="px-6 py-4 font-bold">Preço</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Carregando produtos...
                </td>
              </tr>
            )}

            {!loading &&
              products.map((product) => {
                const productActive = isActive(product);
                const isLowStock =
                  Number(product.current_stock) <= Number(product.min_stock);

                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-slate-950">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.description || "Sem descrição"}
                        </p>
                      </div>
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
                              : "font-bold text-slate-700"
                          }
                        >
                          {product.current_stock}
                        </span>

                        <span className="text-slate-400">
                          / mín. {product.min_stock}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700">
                      {formatMoney(product.sale_price)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={
                          productActive
                            ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"
                        }
                      >
                        {productActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleProduct(product)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                        >
                          {productActive ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && !products.length && (
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
  );
}

function CategoriesTable({
  loading,
  categories,
  toggleCategory,
}: {
  loading: boolean;
  categories: Category[];
  toggleCategory: (category: Category) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <Tags size={20} />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-950">Categorias</h2>
            <p className="mt-1 text-sm text-slate-500">
              Categorias cadastradas.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold">Nome</th>
              <th className="px-6 py-4 font-bold">Descrição</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Criada em</th>
              <th className="px-6 py-4 font-bold">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Carregando categorias...
                </td>
              </tr>
            )}

            {!loading &&
              categories.map((category) => {
                const categoryActive = isActive(category);

                return (
                  <tr key={category.id}>
                    <td className="px-6 py-4 font-black text-slate-950">
                      {category.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {category.description || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={
                          categoryActive
                            ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"
                        }
                      >
                        {categoryActive ? "Ativa" : "Inativa"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {category.created_at
                        ? new Date(category.created_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        {categoryActive ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                );
              })}

            {!loading && !categories.length && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Nenhuma categoria encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
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
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
      />
    </div>
  );
}