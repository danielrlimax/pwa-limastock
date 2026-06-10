import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          LimaStock V1
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Controle seu estoque, vendas e assinatura em um único painel.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Uma PWA moderna para pequenos negócios acompanharem produtos,
          movimentações, vendas, estoque baixo e status da assinatura.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Entrar no sistema
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Ir para dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}