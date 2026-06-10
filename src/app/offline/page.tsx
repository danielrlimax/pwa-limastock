import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] p-4">
      <section className="max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
          <WifiOff size={30} />
        </div>

        <h1 className="mt-6 text-3xl font-black text-slate-950">
          Sem conexão
        </h1>

        <p className="mt-3 text-slate-600">
          O LimaStock precisa de internet para consultar produtos, finalizar
          vendas, validar assinatura e sincronizar estoque.
        </p>

        <p className="mt-4 text-sm font-semibold text-slate-400">
          Verifique sua conexão e tente novamente.
        </p>
      </section>
    </main>
  );
}