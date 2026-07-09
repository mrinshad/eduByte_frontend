"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { clearAccessToken, getCurrentSession } from "@/lib/auth"
import { canAccessPortalArea, getPortalRoute, type PortalArea } from "@/lib/portal"

type AuthGateProps = {
  area: PortalArea
  children: React.ReactNode
}

export function AuthGate({ area, children }: AuthGateProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = React.useState(true)

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

      try {
        if (!canAccessPortalArea(area, session.user.role)) {
          if (active) {
            router.replace(getPortalRoute(session.user.role))
          }
          return
        }

        if (active) {
          setIsChecking(false)
        }
      } catch {
        if (active) {
          router.replace(getPortalRoute(session.user.role))
        }
      }
    }

    void verify()

    return () => {
      active = false
    }
  }, [area, router])

  if (isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[linear-gradient(135deg,_#f5f1ea_0%,_#fff_55%,_#e8eef8_100%)] text-slate-700 dark:bg-[linear-gradient(135deg,_#0d1117_0%,_#111827_100%)] dark:text-slate-200">
        <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white/75 px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening the school workspace
        </div>
      </div>
    )
  }

  return <>{children}</>
}