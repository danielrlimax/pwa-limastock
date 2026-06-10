"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  Camera,
  CheckCircle2,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { apiFetch } from "@/lib/api";
import { getCurrentTenant } from "@/lib/tenant";
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
};

type Sale = {
  id: string;
  tenant_id: string;
  customer_name: string | null;
  payment_method: string;
  subtotal: string;
  discount: string;
  total: string;
  status: string;
  created_at: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const SCANNER_ELEMENT_ID = "limastock-sale-scanner";

const paymentOptions = [
  {
    label: "Pix",
    value: "pix",
  },
  {
    label: "Dinheiro",
    value: "cash",
  },
  {
    label: "Crédito",
    value: "credit_card",
  },
  {
    label: "Débito",
    value: "debit_card",
  },
];

export default function VendasPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [discount, setDiscount] = useState("0");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products
      .filter((product) => product.active)
      .filter((product) => {
        if (!normalizedSearch) return true;

        return (
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.barcode?.toLowerCase().includes(normalizedSearch)
        );
      });
  }, [products, search]);

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + Number(item.product.sale_price || 0) * item.quantity;
    }, 0);
  }, [cart]);

  const discountNumber = Number(discount || 0);

  const total = Math.max(subtotal - discountNumber, 0);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const tenant = await getCurrentTenant();

      const [productsData, salesData] = await Promise.all([
        apiFetch<Product[]>(`/products?tenant_id=${tenant.id}`),
        apiFetch<Sale[]>(`/sales?tenant_id=${tenant.id}`),
      ]);

      setProducts(productsData);
      setRecentSales(salesData.slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar vendas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    return () => {
      stopScanner();
    };
  }, []);

  function getStock(product: Product) {
    return Number(product.current_stock || 0);
  }

  function getCartQuantity(productId: string) {
    return cart.find((item) => item.product.id === productId)?.quantity || 0;
  }

  function addProductToCart(product: Product, quantity = 1) {
    setError("");
    setSuccess("");

    if (!product.active) {
      setError("Este produto está inativo.");
      return;
    }

    const stock = getStock(product);
    const currentQuantity = getCartQuantity(product.id);
    const nextQuantity = currentQuantity + quantity;

    if (nextQuantity > stock) {
      setError(`Estoque insuficiente para ${product.name}. Disponível: ${stock}.`);
      return;
    }

    setCart((current) => {
      const exists = current.find((item) => item.product.id === product.id);

      if (exists) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        );
      }

      return [
        ...current,
        {
          product,
          quantity,
        },
      ];
    });

    setSuccess(`${product.name} adicionado ao carrinho.`);
  }

  function decreaseProduct(productId: string) {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeProduct(productId: string) {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setCustomerName("");
    setDiscount("0");
    setPaymentMethod("pix");
  }

  async function findProductByBarcode(code: string) {
    const cleanCode = code.trim();

    if (!cleanCode) return;

    try {
      setError("");
      setSuccess("");
      setScannerMessage("Buscando produto no banco...");

      const tenant = await getCurrentTenant();

      const product = await apiFetch<Product>(
        `/products/barcode/${encodeURIComponent(cleanCode)}?tenant_id=${tenant.id}`
      );

      addProductToCart(product, 1);
      setScannerMessage(`Produto encontrado: ${product.name}`);
      setBarcodeInput("");
    } catch {
      setScannerMessage("");
      setError(
        `Produto com código ${cleanCode} não encontrado. Cadastre o produto antes de vender.`
      );
    }
  }

  async function handleBarcodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await findProductByBarcode(barcodeInput);
  }

  async function stopScanner() {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {
      // ignora erro ao parar câmera
    } finally {
      setScannerStarted(false);
    }
  }

  async function startScanner() {
    try {
      setError("");
      setSuccess("");
      setScannerMessage("");
      lastScannedRef.current = null;

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      setScannerStarted(true);

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 260,
            height: 160,
          },
          aspectRatio: 1.777,
        },
        async (decodedText) => {
          const cleanCode = decodedText.trim();

          if (!cleanCode) return;

          if (lastScannedRef.current === cleanCode) {
            return;
          }

          lastScannedRef.current = cleanCode;

          await stopScanner();
          await findProductByBarcode(cleanCode);
        },
        () => {
          // frames sem código são normais
        }
      );
    } catch (err) {
      setScannerStarted(false);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar a câmera."
      );
    }
  }

  async function openScanner() {
    setScannerOpen(true);

    setTimeout(() => {
      startScanner();
    }, 300);
  }

  async function closeScanner() {
    await stopScanner();
    setScannerOpen(false);
    setScannerMessage("");
  }

  async function handleCreateSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cart.length) {
      setError("Adicione pelo menos um produto ao carrinho.");
      return;
    }

    if (discountNumber > subtotal) {
      setError("O desconto não pode ser maior que o subtotal.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const tenant = await getCurrentTenant();

      await apiFetch("/sales", {
        method: "POST",
        body: {
          tenant_id: tenant.id,
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
          payment_method: paymentMethod,
          discount: discountNumber,
          customer_name: customerName.trim() || null,
          notes: null,
        },
      });

      setSuccess("Venda finalizada com sucesso.");
      clearCart();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao finalizar venda.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando vendas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-white p-4 text-slate-950">
              <ShoppingCart size={28} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">
                PDV
              </p>

              <h1 className="text-2xl font-black sm:text-3xl">Vendas</h1>

              <p className="mt-1 text-sm text-slate-300">
                Monte o carrinho manualmente ou lendo código de barras.
              </p>
            </div>
          </div>

          <button
            onClick={openScanner}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950"
          >
            <Camera size={18} />
            Ler código
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_430px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar produto por nome ou código..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
                />
              </div>

              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <input
                  value={barcodeInput}
                  onChange={(event) => setBarcodeInput(event.target.value)}
                  placeholder="Código manual"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
                />

                <button
                  type="submit"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-white"
                >
                  <Barcode size={20} />
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {activeProducts.map((product) => {
              const stock = getStock(product);
              const inCart = getCartQuantity(product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => addProductToCart(product)}
                  disabled={stock <= 0}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-950">
                        {product.name}
                      </p>

                      <p className="mt-1 truncate font-mono text-xs font-semibold text-slate-400">
                        {product.barcode || "Sem código"}
                      </p>
                    </div>

                    {inCart > 0 && (
                      <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                        {inCart}x
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Preço
                      </p>

                      <p className="text-2xl font-black text-slate-950">
                        {formatMoney(product.sale_price)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Estoque
                      </p>

                      <p
                        className={
                          stock <= 0
                            ? "font-black text-red-600"
                            : "font-black text-slate-700"
                        }
                      >
                        {stock}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {!activeProducts.length && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 md:col-span-2 2xl:col-span-3">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleCreateSale}
          className="h-fit rounded-[2rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-28"
        >
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <Receipt size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Carrinho
                </h2>

                <p className="text-sm text-slate-500">
                  {cart.length} item(ns) na venda
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto p-5">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">
                      {item.product.name}
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {formatMoney(item.product.sale_price)} un.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProduct(item.product.id)}
                    className="rounded-xl bg-white p-2 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => decreaseProduct(item.product.id)}
                      className="rounded-xl bg-white p-2 text-slate-700 shadow-sm"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="w-10 text-center text-lg font-black text-slate-950">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => addProductToCart(item.product)}
                      className="rounded-xl bg-white p-2 text-slate-700 shadow-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <p className="font-black text-slate-950">
                    {formatMoney(Number(item.product.sale_price) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}

            {!cart.length && (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                Nenhum produto no carrinho.
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-slate-100 p-5">
            <div>
              <label className="text-sm font-bold text-slate-700">
                Cliente
              </label>

              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Consumidor final"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Pagamento
              </label>

              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              >
                {paymentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Desconto
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              />
            </div>

            <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
              <TotalRow label="Subtotal" value={formatMoney(subtotal)} />
              <TotalRow label="Desconto" value={formatMoney(discountNumber)} />

              <div className="border-t border-slate-200 pt-2">
                <TotalRow label="Total" value={formatMoney(total)} strong />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !cart.length}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              {saving ? "Finalizando..." : "Finalizar venda"}
            </button>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700"
              >
                <X size={18} />
                Limpar carrinho
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-black text-slate-950">
            Vendas recentes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Últimas vendas finalizadas.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Pagamento</th>
                <th className="px-6 py-4 font-bold">Subtotal</th>
                <th className="px-6 py-4 font-bold">Desconto</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 font-bold">Data</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 font-bold text-slate-950">
                    {sale.customer_name || "Consumidor final"}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {paymentOptions.find(
                      (option) => option.value === sale.payment_method
                    )?.label || sale.payment_method}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {formatMoney(sale.subtotal)}
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
      </section>

      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-xl flex-col justify-center">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                    Scanner de venda
                  </p>

                  <h2 className="text-2xl font-black text-slate-950">
                    Ler produto
                  </h2>
                </div>

                <button
                  onClick={closeScanner}
                  className="rounded-2xl bg-slate-100 p-3 text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-black p-3">
                <div
                  id={SCANNER_ELEMENT_ID}
                  className="min-h-[360px] overflow-hidden rounded-[1.5rem] bg-slate-950 sm:min-h-[320px]"
                />
              </div>

              <div className="space-y-3 p-5">
                {scannerMessage && (
                  <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    {scannerMessage}
                  </div>
                )}

                {!scannerStarted && (
                  <button
                    onClick={startScanner}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"
                  >
                    <RotateCcw size={18} />
                    Ler outro código
                  </button>
                )}

                <p className="text-center text-xs font-semibold text-slate-400">
                  Aponte a câmera para o código de barras do produto.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p
        className={
          strong
            ? "text-lg font-black text-slate-950"
            : "text-sm font-bold text-slate-500"
        }
      >
        {label}
      </p>

      <p
        className={
          strong
            ? "text-2xl font-black text-slate-950"
            : "text-sm font-black text-slate-700"
        }
      >
        {value}
      </p>
    </div>
  );
}