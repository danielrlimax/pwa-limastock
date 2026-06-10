"use client";

import { Suspense, FormEvent, useEffect, useRef, useState } from "react";
import {
  Barcode,
  Camera,
  Keyboard,
  PackagePlus,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { apiFetch } from "@/lib/api";
import { getCurrentTenant } from "@/lib/tenant";

type ProductCreateResponse = {
  id: string;
  name: string;
  barcode: string | null;
};

type Product = {
  id: string;
  name: string;
  barcode: string | null;
  sale_price: string;
  current_stock: string;
};

const SCANNER_ELEMENT_ID = "limastock-create-product-scanner";

const barcodeFormats = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
];

function onlyBarcodeChars(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\dA-Za-z\-_.]/g, "");
}

function normalizeMoney(value: string) {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) return "0";

  return normalized;
}

export default function NovoProdutoPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="text-slate-600">Carregando cadastro...</p>
        </div>
      }
    >
      <NovoProdutoContent />
    </Suspense>
  );
}

function NovoProdutoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const processingRef = useRef(false);

  const initialBarcode = onlyBarcodeChars(searchParams.get("barcode") || "");

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState(initialBarcode);
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("un");

  const [costPrice, setCostPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
  const [minStock, setMinStock] = useState("0");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");

  const [checkingBarcode, setCheckingBarcode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function stopScanner() {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current?.clear();
    } catch {
      // ignora erro ao parar câmera
    } finally {
      scannerRef.current = null;
      setScannerStarted(false);
    }
  }

  async function findProductByBarcode(code: string) {
    const cleanCode = onlyBarcodeChars(code);

    if (!cleanCode) return null;

    try {
      const tenant = await getCurrentTenant();

      const product = await apiFetch<Product>(
        `/products/barcode/${encodeURIComponent(cleanCode)}?tenant_id=${tenant.id}`
      );

      return product;
    } catch {
      return null;
    }
  }

  async function checkBarcodeExists(code = barcode) {
    const cleanCode = onlyBarcodeChars(code);

    if (!cleanCode) {
      setExistingProduct(null);
      return null;
    }

    try {
      setCheckingBarcode(true);
      setError("");
      setExistingProduct(null);

      const product = await findProductByBarcode(cleanCode);

      if (product) {
        setExistingProduct(product);
      }

      return product;
    } finally {
      setCheckingBarcode(false);
    }
  }

  async function startScanner() {
    try {
      setError("");
      setScannerMessage("Aponte a câmera para o código de barras.");
      processingRef.current = false;

      await stopScanner();

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        formatsToSupport: barcodeFormats,
        verbose: false,
      });

      scannerRef.current = scanner;
      setScannerStarted(true);

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 20,
          qrbox: {
            width: 340,
            height: 160,
          },
          aspectRatio: 1.7777778,
          disableFlip: false,
        },
        async (decodedText) => {
          if (processingRef.current) return;

          const cleanCode = onlyBarcodeChars(decodedText);

          if (!cleanCode) return;

          processingRef.current = true;

          setBarcode(cleanCode);
          setScannerMessage(`Código lido: ${cleanCode}`);

          await stopScanner();
          await checkBarcodeExists(cleanCode);

          window.setTimeout(() => {
            setScannerOpen(false);
            processingRef.current = false;
          }, 700);
        },
        () => {
          // frames sem leitura são normais
        }
      );
    } catch (err) {
      setScannerStarted(false);
      setScannerMessage("");

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar a câmera. Digite o código manualmente."
      );
    }
  }

  async function openScanner() {
    setScannerOpen(true);

    window.setTimeout(() => {
      startScanner();
    }, 500);
  }

  async function closeScanner() {
    await stopScanner();

    setScannerOpen(false);
    setScannerMessage("");
    processingRef.current = false;

    window.setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!name.trim()) {
        throw new Error("Informe o nome do produto.");
      }

      if (!salePrice.trim()) {
        throw new Error("Informe o preço de venda.");
      }

      const cleanBarcode = onlyBarcodeChars(barcode);

      if (cleanBarcode) {
        const productFound = await checkBarcodeExists(cleanBarcode);

        if (productFound) {
          throw new Error("Já existe um produto cadastrado com este código.");
        }
      }

      const tenant = await getCurrentTenant();

      const response = await apiFetch<ProductCreateResponse>("/products", {
        method: "POST",
        body: {
          tenant_id: tenant.id,
          category_id: null,
          name: name.trim(),
          description: description.trim() || null,
          barcode: cleanBarcode || null,
          unit: unit.trim() || "un",
          cost_price: Number(normalizeMoney(costPrice)),
          sale_price: Number(normalizeMoney(salePrice)),
          current_stock: Number(normalizeMoney(currentStock)),
          min_stock: Number(normalizeMoney(minStock)),
        },
      });

      setSuccess(`Produto "${response.name}" cadastrado com sucesso.`);

      window.setTimeout(() => {
        router.push("/produtos");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar produto.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    window.setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 300);

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl bg-white p-4 text-slate-950">
            <PackagePlus size={28} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">
              Produtos
            </p>

            <h1 className="text-2xl font-black sm:text-3xl">
              Cadastrar produto por código
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Digite o código, use leitor físico/Bluetooth ou tente preencher com
              a câmera.
            </p>
          </div>
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

      {existingProduct && (
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm font-bold text-yellow-800">
          Já existe um produto com este código: {existingProduct.name}
        </div>
      )}

      <form
        onSubmit={handleCreateProduct}
        className="grid gap-6 xl:grid-cols-[1fr_420px]"
      >
        <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Código do produto
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Para leitor físico ou Bluetooth, clique no campo abaixo e passe o
              produto no leitor. Ele vai preencher como se fosse um teclado.
            </p>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Código de barras
            </label>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Keyboard
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  ref={barcodeInputRef}
                  value={barcode}
                  onChange={(event) => {
                    const value = onlyBarcodeChars(event.target.value);
                    setBarcode(value);
                    setExistingProduct(null);
                  }}
                  onBlur={() => checkBarcodeExists()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      checkBarcodeExists();
                    }
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Digite, cole ou leia o código"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-mono text-sm font-bold outline-none focus:border-slate-950 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={openScanner}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              >
                <Camera size={18} />
                Usar câmera
              </button>

              <button
                type="button"
                onClick={() => checkBarcodeExists()}
                disabled={checkingBarcode || !barcode}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-60"
              >
                <Search size={18} />
                {checkingBarcode ? "Verificando..." : "Verificar"}
              </button>
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-400">
              A câmera é apenas uma ajuda. Para uso real em loja, leitor
              Bluetooth/USB ou digitação manual é mais confiável.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-xl font-black text-slate-950">
              Dados do produto
            </h2>
          </div>

          <Input
            label="Nome do produto"
            value={name}
            onChange={setName}
            placeholder="Ex: Coca-Cola 350ml"
            required
          />

          <Textarea
            label="Descrição"
            value={description}
            onChange={setDescription}
            placeholder="Informações adicionais do produto"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-700">
                Unidade
              </label>

              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
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

            <Input
              label="Estoque inicial"
              value={currentStock}
              onChange={setCurrentStock}
              type="number"
              step="0.001"
              min="0"
            />
          </div>
        </section>

        <section className="h-fit space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-28">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Preços e controle
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Defina preço de venda, custo e estoque mínimo.
            </p>
          </div>

          <Input
            label="Preço de venda"
            value={salePrice}
            onChange={setSalePrice}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
          />

          <Input
            label="Preço de custo"
            value={costPrice}
            onChange={setCostPrice}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />

          <Input
            label="Estoque mínimo"
            value={minStock}
            onChange={setMinStock}
            type="number"
            step="0.001"
            min="0"
            placeholder="0"
          />

          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <Barcode className="mt-1 text-slate-500" size={20} />

              <div>
                <p className="text-sm font-black text-slate-950">
                  Código atual
                </p>

                <p className="mt-1 break-all font-mono text-sm font-bold text-slate-500">
                  {barcode || "Nenhum código informado"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !!existingProduct}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Salvando..." : "Cadastrar produto"}
          </button>
        </section>
      </form>

      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Ler código
                </h2>

                <p className="text-sm text-slate-500">
                  Aproxime a câmera e alinhe o código horizontalmente.
                </p>
              </div>

              <button
                type="button"
                onClick={closeScanner}
                className="rounded-2xl bg-slate-100 p-3 text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 bg-black p-3">
              <div
                id={SCANNER_ELEMENT_ID}
                className="min-h-[360px] overflow-hidden rounded-[1.5rem] bg-slate-950"
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
                  type="button"
                  onClick={startScanner}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"
                >
                  <RotateCcw size={18} />
                  Tentar câmera novamente
                </button>
              )}

              <button
                type="button"
                onClick={closeScanner}
                className="flex w-full items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700"
              >
                Digitar manualmente
              </button>
            </div>
          </div>
        </div>
      )}
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
  step,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: string;
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
        step={step}
        min={min}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950 focus:bg-white"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700">{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950 focus:bg-white"
      />
    </div>
  );
}