"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Barcode,
  Boxes,
  ChevronRight,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  User,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { clearAuthSession } from "@/lib/auth";
import {
  clearSessionCache,
  getAdminStatusCached,
  getCurrentUserCached,
} from "@/lib/session";
import { clearCachedTenant, getCurrentTenant, Tenant } from "@/lib/tenant";
import { clearSubscriptionCache } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/auth-guard";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const baseNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    label: "Scanner",
    href: "/scanner",
    icon: Barcode,
  },
  {
    label: "Produtos",
    href: "/produtos",
    icon: Package,
  },
  {
    label: "Estoque",
    href: "/estoque",
    icon: Boxes,
  },
  {
    label: "Vendas",
    href: "/vendas",
    icon: ShoppingCart,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

const adminItem = {
  label: "Admin",
  href: "/admin",
  icon: Shield,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const isAdminArea = pathname.startsWith("/admin");

  useEffect(() => {
    let cancelled = false;

    async function loadShellData() {
      try {
        const user = await getCurrentUserCached();

        if (!cancelled) {
          setEmail(user.email);
        }
      } catch {
        if (!cancelled) {
          setEmail(null);
        }
      }

      try {
        const admin = await getAdminStatusCached();

        if (!cancelled) {
          setIsAdmin(Boolean(admin.is_admin));
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
        }
      }

      if (!isAdminArea) {
        try {
          const currentTenant = await getCurrentTenant();

          if (!cancelled) {
            setTenant(currentTenant);
          }
        } catch {
          if (!cancelled) {
            setTenant(null);
          }
        }
      } else {
        if (!cancelled) {
          setTenant(null);
        }
      }
    }

    loadShellData();

    return () => {
      cancelled = true;
    };
  }, [isAdminArea]);

  const navItems = useMemo(() => {
    if (isAdmin) {
      return [...baseNavItems, adminItem];
    }

    return baseNavItems;
  }, [isAdmin]);

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
      });
    } finally {
      clearAuthSession();
      clearSessionCache();
      clearCachedTenant();
      clearSubscriptionCache();
      router.push("/login");
    }
  }

  function NavContent() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 rounded-3xl bg-slate-950 p-4 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
            <Store size={24} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              LimaStock
            </p>

            <h1 className="truncate text-lg font-bold">
              {isAdminArea ? "Admin" : "Painel"}
            </h1>
          </div>
        </div>

        {!isAdminArea && tenant && (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Estabelecimento
            </p>

            <p className="mt-1 truncate text-sm font-black text-slate-950">
              {tenant.name}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Status: {tenant.status}
            </p>
          </div>
        )}

        {isAdminArea && (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Modo plataforma
            </p>

            <p className="mt-1 text-sm font-black text-slate-950">
              Gerenciamento global
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Empresas, planos, assinaturas, cupons, auditoria e webhooks
            </p>
          </div>
        )}

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon size={20} />
                  {item.label}
                </span>

                {active && <ChevronRight size={16} />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
              <User size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Usuário
              </p>

              <p className="truncate text-sm font-bold text-slate-700">
                {email || "Conta autenticada"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs font-medium text-slate-500">
            {isAdmin
              ? "Você possui acesso administrativo da plataforma."
              : "Você gerencia apenas o estabelecimento vinculado à sua conta."}
          </p>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-950 hover:text-white"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f3f6fb]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-80 border-r border-slate-200 bg-white p-5 shadow-sm xl:block">
          <NavContent />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              aria-label="Fechar menu"
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-slate-950/40"
            />

            <aside className="absolute inset-y-0 left-0 w-[88%] max-w-80 overflow-y-auto bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl">
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-2xl bg-slate-100 p-3 text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <NavContent />
            </aside>
          </div>
        )}

        <div className="xl:pl-80">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl lg:px-8 lg:py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-2xl bg-slate-100 p-3 text-slate-700 xl:hidden"
                >
                  <Menu size={20} />
                </button>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-xs">
                    {isAdminArea ? "Admin LimaStock" : "LimaStock V1"}
                  </p>

                  <h2 className="truncate text-base font-black text-slate-950 sm:text-xl">
                    {isAdminArea
                      ? "Gerenciamento da plataforma"
                      : tenant?.name || "Controle de estoque"}
                  </h2>
                </div>
              </div>

              {isAdmin && !isAdminArea && (
                <Link
                  href="/admin"
                  className="hidden rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:block"
                >
                  Admin
                </Link>
              )}

              {isAdminArea && (
                <Link
                  href="/dashboard"
                  className="hidden rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-950 hover:text-white sm:block"
                >
                  Painel do tenant
                </Link>
              )}
            </div>
          </header>

          <main className="px-4 pb-28 pt-4 lg:px-8 lg:pb-8 lg:pt-8">
            {children}
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}