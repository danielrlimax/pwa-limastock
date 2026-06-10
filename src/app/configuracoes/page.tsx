"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  Gift,
  Settings,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getCurrentTenant, Tenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

type SubscriptionStatus = {
  tenant_id: string;
  status: string;
  is_active: boolean;
  plan_code: string | null;
  plan_name: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
};

type CouponValidation = {
  valid: boolean;
  code: string;
  type: string | null;
  value: string | null;
  discount_amount: string;
  final_amount: string;
  message: string;
};

type StartSubscriptionResponse = {
  tenant_id: string;
  asaas_customer_id: string;
  asaas_subscription_id: string;
  status: string;
  original_price: number;
  discount_amount: number;
  final_price: number;
  coupon_code: string | null;
};

export default function ConfiguracoesPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [billingType, setBillingType] = useState<"PIX" | "CREDIT_CARD" | "BOLETO">(
    "PIX"
  );

  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [startingSubscription, setStartingSubscription] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setError("");

      const currentTenant = await getCurrentTenant();
      setTenant(currentTenant);

      setCustomerName(currentTenant.name);

      const subscriptionData = await apiFetch<SubscriptionStatus>(
        `/subscriptions/status?tenant_id=${currentTenant.id}`
      );

      setSubscription(subscriptionData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar configurações."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setValidatingCoupon(true);
      setError("");
      setSuccess("");
      setCouponResult(null);

      const data = await apiFetch<CouponValidation>("/coupons/validate", {
        method: "POST",
        body: {
          code: couponCode,
          amount: 29.9,
        },
      });

      setCouponResult(data);

      if (data.valid) {
        setSuccess("Cupom válido.");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao validar cupom.");
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handleStartSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenant) {
      setError("Estabelecimento não encontrado.");
      return;
    }

    try {
      setStartingSubscription(true);
      setError("");
      setSuccess("");

      const data = await apiFetch<StartSubscriptionResponse>(
        "/billing/start-subscription",
        {
          method: "POST",
          body: {
            tenant_id: tenant.id,
            customer_name: customerName,
            customer_email: customerEmail,
            cpf_cnpj: cpfCnpj || null,
            phone: phone || null,
            billing_type: billingType,
            coupon_code: couponCode || null,
          },
        }
      );

      setSuccess(
        `Assinatura criada com sucesso. Valor final: ${formatMoney(
          data.final_price
        )}`
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao iniciar assinatura."
      );
    } finally {
      setStartingSubscription(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-slate-600">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-white p-4 text-slate-950">
              <Settings size={28} />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                LimaStock
              </p>
              <h1 className="text-3xl font-black">Configurações</h1>
              <p className="mt-1 text-slate-300">
                Gerencie estabelecimento, assinatura e cupons.
              </p>
            </div>
          </div>

          {subscription && (
            <div
              className={
                subscription.is_active
                  ? "rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4"
                  : "rounded-3xl border border-red-400/20 bg-red-400/10 px-5 py-4"
              }
            >
              <p className="text-sm text-slate-300">Acesso</p>
              <p className="font-bold">
                {subscription.is_active ? "Ativo" : "Inativo"}
              </p>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={Building2}
          label="Estabelecimento"
          value={tenant?.name || "-"}
          helper={tenant?.slug || ""}
        />

        <InfoCard
          icon={CreditCard}
          label="Assinatura"
          value={subscription?.status || "-"}
          helper={subscription?.plan_name || "Plano não identificado"}
        />

        <InfoCard
          icon={subscription?.is_active ? ShieldCheck : TriangleAlert}
          label="Status de acesso"
          value={subscription?.is_active ? "Liberado" : "Bloqueado"}
          helper={
            subscription?.current_period_end
              ? `Período até ${new Date(
                  subscription.current_period_end
                ).toLocaleDateString("pt-BR")}`
              : "Sem período definido"
          }
          alert={!subscription?.is_active}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <form
          onSubmit={handleStartSubscription}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <CreditCard size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Assinatura Asaas
              </h2>
              <p className="text-sm text-slate-500">
                A API cria o cliente e a assinatura no Asaas.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Nome do cliente"
              value={customerName}
              onChange={setCustomerName}
              placeholder="Nome do estabelecimento"
              required
            />

            <Input
              label="E-mail de cobrança"
              value={customerEmail}
              onChange={setCustomerEmail}
              type="email"
              placeholder="cliente@email.com"
              required
            />

            <Input
              label="CPF/CNPJ"
              value={cpfCnpj}
              onChange={setCpfCnpj}
              placeholder="Opcional"
            />

            <Input
              label="Telefone"
              value={phone}
              onChange={setPhone}
              placeholder="Opcional"
            />

            <div>
              <label className="text-sm font-bold text-slate-700">
                Forma de cobrança
              </label>

              <select
                value={billingType}
                onChange={(event) =>
                  setBillingType(
                    event.target.value as "PIX" | "CREDIT_CARD" | "BOLETO"
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
              >
                <option value="PIX">Pix</option>
                <option value="BOLETO">Boleto</option>
                <option value="CREDIT_CARD">Cartão de crédito</option>
              </select>
            </div>

            <Input
              label="Cupom"
              value={couponCode}
              onChange={setCouponCode}
              placeholder="Opcional"
            />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-700">Plano Starter</p>
              <p className="text-xl font-black text-slate-950">
                {couponResult?.valid
                  ? formatMoney(couponResult.final_amount)
                  : formatMoney(29.9)}
              </p>
            </div>

            {couponResult?.valid && (
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                Desconto aplicado: {formatMoney(couponResult.discount_amount)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={startingSubscription}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-4 font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {startingSubscription ? "Criando assinatura..." : "Iniciar assinatura"}
          </button>
        </form>

        <div className="space-y-6">
          <form
            onSubmit={handleValidateCoupon}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <Gift size={20} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Validar cupom
                </h2>
                <p className="text-sm text-slate-500">
                  Validação feita pela API.
                </p>
              </div>
            </div>

            <Input
              label="Código do cupom"
              value={couponCode}
              onChange={setCouponCode}
              placeholder="MVP100"
              required
            />

            <button
              type="submit"
              disabled={validatingCoupon}
              className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-3 font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {validatingCoupon ? "Validando..." : "Validar cupom"}
            </button>

            {couponResult && (
              <div
                className={
                  couponResult.valid
                    ? "mt-5 rounded-2xl bg-emerald-50 p-4 text-emerald-800"
                    : "mt-5 rounded-2xl bg-red-50 p-4 text-red-800"
                }
              >
                <p className="font-black">{couponResult.message}</p>

                <div className="mt-3 space-y-1 text-sm font-semibold">
                  <p>Código: {couponResult.code}</p>
                  <p>Desconto: {formatMoney(couponResult.discount_amount)}</p>
                  <p>Valor final: {formatMoney(couponResult.final_amount)}</p>
                </div>
              </div>
            )}
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <BadgeCheck size={20} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Dados técnicos
                </h2>
                <p className="text-sm text-slate-500">
                  IDs retornados pela API.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <TechRow label="Tenant ID" value={tenant?.id || "-"} />
              <TechRow
                label="Asaas Customer"
                value={subscription?.asaas_customer_id || "-"}
              />
              <TechRow
                label="Asaas Subscription"
                value={subscription?.asaas_subscription_id || "-"}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  helper,
  alert = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  helper: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={
          alert
            ? "mb-5 inline-flex rounded-2xl bg-red-50 p-3 text-red-700"
            : "mb-5 inline-flex rounded-2xl bg-slate-950 p-3 text-white"
        }
      >
        <Icon size={20} />
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950"
      />
    </div>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}