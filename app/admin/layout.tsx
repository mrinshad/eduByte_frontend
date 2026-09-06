import { AuthGate } from "@/components/auth-gate"
import { PortalShell } from "@/components/portal-shell"

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGate area="admin">
      <PortalShell area="admin">{children}</PortalShell>
    </AuthGate>
  )
}