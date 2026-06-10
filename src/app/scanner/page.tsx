"use client";

import { useEffect, useRef, useState } from "react";
import { Barcode, Camera, Package, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { apiFetch } from "@/lib/api";
import { getCurrentTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

type Product = {
  id: string;
  tenant_id: string;
  name: string;
  barcode: string | null;
  sale_price: string;
  current_stock: string;
  min_stock: string;
  active: boolean;
};

const SCANNER_ELEMENT_ID = "limastock-barcode-scanner";

export default function ScannerPage() {
  const router = useRouter();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  const [started, setStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function stopScanner() {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {
      // ignora erro ao parar câmera
    } finally {
      setScanning(false);
    }
  }

  async function handleBarcodeDetected(code: string) {
    const cleanCode = code.trim();

    if (!cleanCode) return;

    if (lastScannedRef.current === cleanCode) {
      return;
    }

    lastScannedRef.current = cleanCode;

    setBarcode(cleanCode);
    setMessage("Código lido. Consultando produto...");
    setError("");

    await stopScanner();

    try {
      const tenant = await getCurrentTenant();

      const foundProduct = await apiFetch<Product>(
        `/products/barcode/${encodeURIComponent(cleanCode)}?tenant_id=${tenant.id}`
      );

      setProduct(foundProduct);
      setMessage("Produto encontrado.");
    } catch {
      setProduct(null);
      setMessage("Produto não encontrado. Você pode cadastrar agora.");
    }
  }

  async function startScanner() {
    try {
      setError("");
      setMessage("");
      setProduct(null);
      lastScannedRef.current = null;

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      setStarted(true);
      setScanning(true);

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
          await handleBarcodeDetected(decodedText);
        },
        () => {
          // frames sem código são normais
        }
      );
    } catch (err) {
      setScanning(false);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar a câmera."
      );
    }
  }

  async function resetScanner() {
    await stopScanner();

    setBarcode("");
    setProduct(null);
    setMessage("");
    setError("");
    lastScannedRef.current = null;

    await startScanner();
  }

  function goToProduct() {
    if (!product) return;

    router.push(`/produtos?product_id=${product.id}`);
  }

  function goToCreateProduct() {
    if (!barcode) return;

    router.push(`/produtos/novo?barcode=${encodeURIComponent(barcode)}`);
  }

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl bg-white p-4 text-slate-950">
            <Barcode size={28} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">
              Scanner
            </p>

            <h1 className="text-2xl font-black sm:text-3xl">
              Ler código de barras
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Aponte a câmera para o código do produto.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-black p-3">
          <div
            id={SCANNER_ELEMENT_ID}
            className="min-h-[360px] overflow-hidden rounded-[1.5rem] bg-slate-950 sm:min-h-[300px]"
          />
        </div>

        <div className="space-y-4 p-5">
          {!started && (
            <button
              onClick={startScanner}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"
            >
              <Camera size={18} />
              Iniciar câmera
            </button>
          )}

          {started && !scanning && (
            <button
              onClick={resetScanner}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700"
            >
              <RotateCcw size={18} />
              Ler outro código
            </button>
          )}

          {barcode && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Código lido
              </p>

              <p className="mt-1 break-all font-mono text-lg font-black text-slate-950">
                {barcode}
              </p>
            </div>
          )}

          {message && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {product && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Produto encontrado
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {product.name}
              </h2>

              <p className="mt-1 font-mono text-xs font-semibold text-slate-400">
                {product.barcode || "Sem código"}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Info label="Preço" value={formatMoney(product.sale_price)} />
                <Info label="Estoque" value={product.current_stock} />
                <Info label="Mínimo" value={product.min_stock} />
              </div>

              <button
                onClick={goToProduct}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"
              >
                <Package size={18} />
                Abrir produto
              </button>
            </div>
          )}

          {barcode && !product && !scanning && (
            <button
              onClick={goToCreateProduct}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"
            >
              <Plus size={18} />
              Cadastrar produto com este código
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}