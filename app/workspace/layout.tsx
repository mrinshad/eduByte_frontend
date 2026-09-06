import { AuthGate } from "@/components/auth-gate"
import { PortalShell } from "@/components/portal-shell"

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGate area="workspace">
      <PortalShell area="workspace">{children}</PortalShell>
    </AuthGate>
  )
}