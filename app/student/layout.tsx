import { AuthGate } from "@/components/auth-gate"
import { PortalShell } from "@/components/portal-shell"

export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGate area="student">
      <PortalShell area="student">{children}</PortalShell>
    </AuthGate>
  )
}