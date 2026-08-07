"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ShieldCheck, LayoutGrid } from "lucide-react"

import { getCurrentSession } from "@/lib/auth"
import { canSwitchPortals, type PortalArea } from "@/lib/portal"

function SwitchPortalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const target = (searchParams.get("target") || "workspace") as PortalArea

  React.useEffect(() => {
    let active = true

    async function processSwitch() {
      try {
        const session = await getCurrentSession()
        if (!active) return

        if (!canSwitchPortals(session.user.permissions, session.user.role)) {
          router.replace("/")
          return
        }

        const timer = setTimeout(() => {
          if (active) {
            router.replace(`/${target === "admin" ? "admin" : "workspace"}/dashboard`)
          }
        }, 1200)

        return () => clearTimeout(timer)
      } catch {
        if (active) {
          router.replace("/")
        }
      }
    }

    void processSwitch()

    return () => {
      active = false
    }
  }, [router, target])

  const targetTitle = target === "admin" ? "Administration Portal" : "Operations Workspace"
  const TargetIcon = target === "admin" ? ShieldCheck : LayoutGrid

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(245,241,234,0.8)_0%,_#ffffff_50%,_#e8eef8_100%)] text-slate-900 dark:bg-[radial-gradient(ellipse_at_top,_rgba(13,17,23,0.9)_0%,_#111827_55%,_#0b101b_100%)] dark:text-slate-100">
      
      {/* Ambient Animated Glow Elements */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl dark:bg-amber-500/10 animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-500/10 animate-pulse" />

      {/* Main Switching Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center p-6 text-center">
        
        {/* Animated Graphic & Orbit Ring */}
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 opacity-20 blur-md dark:from-amber-400 dark:to-orange-500 animate-pulse" />
          <span className="absolute -inset-2 rounded-full border border-dashed border-amber-500/30 dark:border-amber-400/30 animate-[spin_10s_linear_infinite]" />
          
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-400 to-amber-600 shadow-xl shadow-amber-500/25">
            <TargetIcon className="h-10 w-10 text-white animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent dark:from-white dark:via-slate-100 dark:to-slate-300">
          Switching Portals
        </h1>

        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Preparing your access for <span className="font-bold text-amber-600 dark:text-amber-400">{targetTitle}</span>
        </p>

        {/* Loading Pill */}
        <div className="mt-8 flex items-center gap-3 rounded-full border border-black/[0.08] bg-white/80 px-5 py-2.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500 dark:text-amber-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Opening portal workspace...
          </span>
        </div>
      </div>
    </main>
  )
}

export default function SwitchPortalPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-slate-950 text-white">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      }
    >
      <SwitchPortalContent />
    </React.Suspense>
  )
}
