import { SubscriptionGuard } from "@/components/auth/subscription-guard";
import { TenantGuard } from "@/components/business/tenant-guard";
import { AppShell } from "@/components/layout/app-shell";

export default function ScannerLayout({
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