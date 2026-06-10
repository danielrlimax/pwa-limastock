"use client";

import { useEffect, useRef, useState } from "react";
import { Barcode, Camera, Keyboard, Package, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  normalizeBarcodeInput,
  startBarcodeScanner,
  type BarcodeScannerController,
} from "@/lib/barcode-scanner";
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

  const scannerRef = useRef<BarcodeScannerController | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const processingRef = useRef(false);

  const [started, setStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function stopScanner() {
    try {
      await scannerRef.current?.stop();
    } catch {
      // Ignora erro ao parar câmera.
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }

  async function handleBarcodeDetected(code: string) {
    const cleanCode = normalizeBarcodeInput(code);

    if (!cleanCode) return;
    if (processingRef.current) return;
    if (lastScannedRef.current === cleanCode) return;

    processingRef.current = true;
    lastScannedRef.current = cleanCode;

    setBarcode(cleanCode);
    setManualBarcode(cleanCode);
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
    } finally {
      processingRef.current = false;
    }
  }

  async function startScanner() {
    try {
      setError("");
      setMessage("Abrindo câmera...");
      setProduct(null);
      lastScannedRef.current = null;
      processingRef.current = false;

      await stopScanner();

      setStarted(true);
      setScanning(true);

      scannerRef.current = await startBarcodeScanner({
        elementId: SCANNER_ELEMENT_ID,
        onDetected: handleBarcodeDetected,
        onStatus: setMessage,
      });
    } catch (err) {
      setScanning(false);
      setStarted(false);
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
    setManualBarcode("");
    setProduct(null);
    setMessage("");
    setError("");
    lastScannedRef.current = null;
    processingRef.current = false;

    await startScanner();
  }

  async function searchManualBarcode() {
    await handleBarcodeDetected(manualBarcode);
  }

  function goToProduct() {
    if (!product) return;

    router.push(`/produtos?product_id=${product.id}`);
  }

  function goToCreateProduct() {
    const cleanCode = normalizeBarcodeInput(barcode || manualBarcode);

    if (!cleanCode) return;

    router.push(`/produtos/novo?barcode=${encodeURIComponent(cleanCode)}`);
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
              No iPhone, toque em iniciar e mantenha o código bem iluminado na horizontal.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-black p-3">
          <div
            id={SCANNER_ELEMENT_ID}
            className="flex min-h-[380px] items-center justify-center overflow-hidden rounded-[1.5rem] bg-slate-950 text-center text-sm font-bold text-slate-400 sm:min-h-[320px]"
          >
            Toque em “Iniciar câmera” para começar.
          </div>
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

          {started && scanning && (
            <button
              onClick={stopScanner}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700"
            >
              Parar câmera
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

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">
              Código manual ou leitor Bluetooth/USB
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Keyboard
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={manualBarcode}
                  onChange={(event) =>
                    setManualBarcode(normalizeBarcodeInput(event.target.value))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      searchManualBarcode();
                    }
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Digite ou passe o leitor físico"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 font-mono text-sm font-bold outline-none focus:border-slate-950"
                />
              </div>

              <button
                type="button"
                onClick={searchManualBarcode}
                disabled={!manualBarcode}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                Buscar
              </button>
            </div>
          </div>

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

          {(barcode || manualBarcode) && !product && !scanning && (
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
