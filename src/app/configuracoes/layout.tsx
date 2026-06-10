import { AppShell } from "@/components/layout/app-shell";
import { TenantGuard } from "@/components/business/tenant-guard";

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <TenantGuard>{children}</TenantGuard>
    </AppShell>
  );
}