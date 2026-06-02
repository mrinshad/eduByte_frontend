"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { clearAccessToken, getCurrentSession, logoutUser } from "@/lib/auth"
import { currentAcademicYear, getPortalNavGroups, normalizeRole, type PortalArea } from "@/lib/portal"

type AppShellProps = {
  area: PortalArea
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AppShell({ area, title, subtitle, children }: AppShellProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(true)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [userLabel, setUserLabel] = React.useState<string | undefined>()
  const [role, setRole] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const session = await getCurrentSession()

        if (!active) {
          return
        }

        const normalized = normalizeRole(session.user.role)
        const displayRole = normalized ? normalized[0] + normalized.slice(1).toLowerCase() : undefined

        setUserLabel(displayRole)
        setRole(session.user.role || null)
      } catch {
        if (active) {
          setUserLabel(undefined)
          setRole(null)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [])

  const links = React.useMemo(() => getPortalNavGroups(area, role), [area, role])

  async function handleLogout() {
    try {
      await logoutUser()
    } catch {
      clearAccessToken()
    } finally {
      router.replace("/")
    }
  }

  return (
    <div className="flex h-svh flex-col bg-[linear-gradient(135deg,_#f7f1e7_0%,_#ffffff_48%,_#eef3f8_100%)] text-slate-950 dark:bg-[linear-gradient(135deg,_#0c1118_0%,_#111827_50%,_#1b2433_100%)] dark:text-slate-50">
      <Navbar
        title={title}
        subtitle={subtitle}
        academicYear={currentAcademicYear}
        userLabel={userLabel}
        onOpenMobileMenu={() => setMobileOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar area={area} links={links} collapsed={collapsed} setCollapsed={setCollapsed} variant="desktop" />

        <main className="min-w-0 flex-1 overflow-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>

      <Sidebar
        area={area}
        links={links}
        collapsed={false}
        setCollapsed={setCollapsed}
        variant="mobile"
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
    </div>
  )
}