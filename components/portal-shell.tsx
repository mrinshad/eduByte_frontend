"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { portalAreas, getPortalSection, type PortalArea } from "@/lib/portal"

type PortalShellProps = {
  area: PortalArea
  section?: string
  children: React.ReactNode
}

export function PortalShell({ area, section, children }: PortalShellProps) {
  const areaCopy = portalAreas[area]
  const activeSection = section ? getPortalSection(section) : null

  return (
    <div className="min-h-svh bg-[linear-gradient(135deg,_#f7f1e7_0%,_#ffffff_48%,_#eef3f8_100%)] text-slate-950 dark:bg-[linear-gradient(135deg,_#0c1118_0%,_#111827_50%,_#1b2433_100%)] dark:text-slate-50">
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-black/5 bg-white/80 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Sunrise School Management</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{areaCopy.title}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activeSection ? activeSection.label : areaCopy.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-black/10 bg-transparent dark:border-white/10 dark:text-white">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="outline" className="border-black/10 bg-transparent dark:border-white/10 dark:text-white">
              <Link href="/workspace">Workspace</Link>
            </Button>
            <Button asChild variant="outline" className="border-black/10 bg-transparent dark:border-white/10 dark:text-white">
              <Link href="/admin">Admin</Link>
            </Button>
            <Button asChild variant="outline" className="border-black/10 bg-transparent dark:border-white/10 dark:text-white">
              <Link href="/student">Student</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  )
}