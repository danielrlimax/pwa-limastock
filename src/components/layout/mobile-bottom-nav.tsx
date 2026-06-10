"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Barcode,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  {
    label: "Início",
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
    label: "Vendas",
    href: "/vendas",
    icon: ShoppingCart,
  },
  {
    label: "Config",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isAdminArea = pathname.startsWith("/admin");

  if (isAdminArea) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl xl:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-black transition",
                active
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <Icon size={20} />
              <span className="mt-1 leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}