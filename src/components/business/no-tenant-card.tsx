import { Store, TriangleAlert } from "lucide-react";

export function NoTenantCard({
  message = "Sua conta ainda não está vinculada a nenhum estabelecimento.",
}: {
  message?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-100 bg-amber-50 p-8 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="rounded-3xl bg-amber-100 p-4 text-amber-700">
          <TriangleAlert size={32} />
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-wide text-amber-600">
            Estabelecimento não encontrado
          </p>

          <h1 className="mt-2 text-3xl font-black text-amber-950">
            Nenhum estabelecimento vinculado
          </h1>

          <p className="mt-3 text-amber-800">{message}</p>

          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/70 p-4 text-sm font-semibold text-amber-900">
            <Store size={18} />
            Peça para o administrador da plataforma vincular sua conta a um
            estabelecimento.
          </div>
        </div>
      </div>
    </div>
  );
}