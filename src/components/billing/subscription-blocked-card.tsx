import Link from "next/link";
import { CreditCard, LockKeyhole } from "lucide-react";

export function SubscriptionBlockedCard({
  message = "Sua assinatura precisa ser regularizada para continuar usando esta área.",
}: {
  message?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="rounded-3xl bg-red-100 p-4 text-red-700">
          <LockKeyhole size={32} />
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-wide text-red-600">
            Acesso bloqueado
          </p>

          <h1 className="mt-2 text-3xl font-black text-red-950">
            Assinatura inativa
          </h1>

          <p className="mt-3 text-red-700">{message}</p>

          <Link
            href="/configuracoes"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800"
          >
            <CreditCard size={18} />
            Regularizar assinatura
          </Link>
        </div>
      </div>
    </div>
  );
}