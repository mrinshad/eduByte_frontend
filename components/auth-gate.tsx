"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, LayoutDashboard, Loader2, LogOut, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { clearAccessToken, getCurrentSession, logoutUser } from "@/lib/auth"
import {
  canAccessPortalArea,
  getAlternateAccessiblePortal,
  getInitialUserRoute,
  getRequiredPermissionForPath,
  type PortalArea,
} from "@/lib/portal"
import { checkPermission } from "@/hooks/usePermission"
import { PortalShell } from "@/components/portal-shell"

type AuthGateProps = {
  area: PortalArea
  children: React.ReactNode
}

type AccessErrorState = {
  username: string
  role: string
  area: PortalArea
  isSectionRestriction?: boolean
  sectionLabel?: string
  requiredPermission?: string
  reason: string
}

export function AuthGate({ area, children }: AuthGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = React.useState(true)
  const [accessError, setAccessError] = React.useState<AccessErrorState | null>(null)

  React.useEffect(() => {
    let active = true

    async function verify() {
      const session = await (async () => {
        try {
          return await getCurrentSession()
        } catch {
          return null
        }
      })()

      if (!session) {
        clearAccessToken()
        router.replace("/")
        return
      }

      const permissions = session.user.permissions || []
      const role = session.user.role || null

      if (!canAccessPortalArea(area, permissions, role)) {
        const altPortal = getAlternateAccessiblePortal(area, permissions, role)

        if (altPortal) {
          if (active) {
            const targetRoute = getInitialUserRoute(permissions, role, session.user.defaultPortal, altPortal)
            router.replace(targetRoute || `/${altPortal}/dashboard`)
          }
          return
        }

        if (active) {
          setIsChecking(false)
          setAccessError({
            username: session.user.username || session.user.name || "User",
            role: role || "No role assigned",
            area,
            reason: !role
              ? "Your account does not have any system role assigned."
              : permissions.length === 0
                ? "Your assigned role has no active permissions."
                : `Your account role '${role}' does not have permissions to access the ${area} portal area.`,
          })
        }
        return
      }

      // Check section-level navigation permission requirement
      const sectionReq = getRequiredPermissionForPath(pathname, area)
      if (sectionReq) {
        const { permKey, sectionLabel } = sectionReq
        if (!checkPermission(permissions, permKey)) {
          if (active) {
            setIsChecking(false)
            setAccessError({
              username: session.user.username || session.user.name || "User",
              role: role || "No role assigned",
              area,
              isSectionRestriction: true,
              sectionLabel,
              requiredPermission: permKey,
              reason: `Your account role '${role || "User"}' does not have the '${permKey}' permission required to access the '${sectionLabel}' section.`,
            })
          }
          return
        }
      }

      if (active) {
        setIsChecking(false)
        setAccessError(null)
      }
    }

    void verify()

    return () => {
      active = false
    }
  }, [area, router, pathname])

  async function handleSignOut() {
    try {
      await logoutUser()
    } catch {
      clearAccessToken()
    } finally {
      router.replace("/")
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[linear-gradient(135deg,_#f5f1ea_0%,_#fff_55%,_#e8eef8_100%)] text-slate-700 dark:bg-[linear-gradient(135deg,_#0d1117_0%,_#111827_100%)] dark:text-slate-200">
        <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white/75 px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          Opening the school workspace...
        </div>
      </div>
    )
  }

  if (accessError) {
    // In-layout section access restricted view (preserves Sidebar, Navbar, and Header)
    if (accessError.isSectionRestriction) {
      return (
        <PortalShell area={area}>
          <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Access Restricted</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  You do not have permission to access this section. Please contact your administrator if you need access.
                </p>
              </div>
              {!pathname.replace(/\/+$/, "").endsWith("/dashboard") ? (
                <Button
                  type="button"
                  onClick={() => router.replace(`/${area}/dashboard`)}
                  className="w-full h-10 rounded-xl bg-[#556043] text-xs font-semibold text-white hover:bg-[#475138] dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 shadow-sm font-medium"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              ) : (
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pt-1">
                  Select an accessible section from the sidebar to continue.
                </p>
              )}
            </div>
          </div>
        </PortalShell>
      )
    }

    // Full-screen signout error card (for accounts with no roles/no portal access)
    return (
      <div className="flex min-h-svh items-center justify-center bg-[linear-gradient(135deg,_#f7f1e7_0%,_#ffffff_48%,_#eef3f8_100%)] px-4 py-8 text-slate-950 dark:bg-[linear-gradient(135deg,_#0c1118_0%,_#111827_50%,_#1b2433_100%)] dark:text-slate-50">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-red-500/20 bg-white/80 p-6 sm:p-8 shadow-xl backdrop-blur-xl dark:border-red-500/30 dark:bg-slate-900/90">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 dark:bg-red-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Access Restricted</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Missing Role or Permissions</p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Username:</span>
              <span className="font-semibold">{accessError.username}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Assigned Role:</span>
              <span className="font-semibold">{accessError.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Target Area:</span>
              <span className="font-semibold capitalize">{accessError.area}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-700 dark:bg-red-500/15 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{accessError.reason}</span>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => router.replace(`/${area}/dashboard`)}
              className="w-full h-11 rounded-2xl bg-[#556043] text-xs font-semibold text-white hover:bg-[#475138] dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 shadow-md"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="w-full h-10 rounded-2xl text-xs font-medium text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out & return to login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}