import { SubscriptionGuard } from "@/components/auth/subscription-guard";
import { AppShell } from "@/components/layout/app-shell";
import { TenantGuard } from "@/components/business/tenant-guard";

export default function ProdutosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <TenantGuard>
        <SubscriptionGuard>{children}</SubscriptionGuard>
      </TenantGuard>
    </AppShell>
  );
}