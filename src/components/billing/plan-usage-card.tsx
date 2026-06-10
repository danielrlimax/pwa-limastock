"use client";

import { Boxes, Package, Users } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { PlanUsage } from "@/lib/subscription";

function percent(used: number, limit: number | null) {
  if (!limit) return 0;

  return Math.min((used / limit) * 100, 100);
}

function limitText(limit: number | null) {
  if (!limit) return "Ilimitado";

  return String(limit);
}

function remainingText(value: number | null) {
  if (value === null) return "Ilimitado";

  return String(value);
}

function UsageBar({
  label,
  used,
  limit,
  remaining,
  icon: Icon,
}: {
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  icon: React.ElementType;
}) {
  const percentage = percent(used, limit);

  const danger = limit !== null && percentage >= 90;
  const warning = limit !== null && percentage >= 70 && percentage < 90;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={
              danger
                ? "rounded-2xl bg-red-50 p-3 text-red-700"
                : warning
                  ? "rounded-2xl bg-amber-50 p-3 text-amber-700"
                  : "rounded-2xl bg-slate-950 p-3 text-white"
            }
          >
            <Icon size={20} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-500">{label}</p>

            <p className="text-2xl font-black text-slate-950">
              {used} / {limitText(limit)}
            </p>
          </div>
        </div>

        <span
          className={
            danger
              ? "w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700"
              : warning
                ? "w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"
                : "w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
          }
        >
          Restam {remainingText(remaining)}
        </span>
      </div>

      {limit !== null && (
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={
              danger
                ? "h-full rounded-full bg-red-600"
                : warning
                  ? "h-full rounded-full bg-amber-500"
                  : "h-full rounded-full bg-slate-950"
            }
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      )}

      {limit === null && (
        <p className="mt-4 text-sm font-semibold text-slate-400">
          Este recurso não possui limite no plano atual.
        </p>
      )}
    </div>
  );
}

export function PlanUsageCard({ usage }: { usage: PlanUsage }) {
  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Uso do plano
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Plano {usage.plan.name}
            </h2>

            <p className="mt-2 text-slate-300">
              {formatMoney(usage.plan.price_monthly)} / mês
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="flex items-center gap-3">
              <Boxes size={22} />

              <div>
                <p className="text-sm text-slate-300">Código do plano</p>
                <p className="font-mono text-lg font-black uppercase">
                  {usage.plan.code}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UsageBar
          label="Produtos ativos"
          used={usage.usage.products}
          limit={usage.limits.products}
          remaining={usage.remaining.products}
          icon={Package}
        />

        <UsageBar
          label="Usuários do estabelecimento"
          used={usage.usage.users}
          limit={usage.limits.users}
          remaining={usage.remaining.users}
          icon={Users}
        />
      </div>
    </section>
  );
}