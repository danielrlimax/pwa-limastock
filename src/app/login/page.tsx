"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Store } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { LoginResponse, saveAuthSession } from "@/lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: {
          email,
          password,
        },
      });

      saveAuthSession(response);
      router.replace(redirect);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível fazer login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.25),_transparent_30%)]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
            <Store />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-300">LimaStock</p>
            <h1 className="text-xl font-black">Controle de estoque SaaS</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-300">
            Plataforma protegida por API
          </p>

          <h2 className="text-5xl font-black tracking-tight">
            Gestão simples, segura e rápida para pequenos negócios.
          </h2>

          <p className="mt-5 text-lg text-slate-300">
            Produtos, vendas, estoque, assinaturas e painel administrativo com
            autorização validada no backend.
          </p>
        </div>

        <p className="relative z-10 text-sm text-slate-500">© LimaStock V1</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-8 shadow-2xl"
        >
          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <LockKeyhole />
            </div>

            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Acesso seguro
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Entrar no LimaStock
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              O login é feito pela API e salvo em cookie httpOnly.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">E-mail</label>
              <input
                type="email"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-950 focus:bg-white"
                placeholder="voce@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Senha</label>
              <input
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-950 focus:bg-white"
                placeholder="Sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="mt-5 text-center text-xs text-slate-400">
            Nenhum token é salvo no localStorage.
          </p>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}