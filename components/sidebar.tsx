"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  GraduationCap,
  Home,
  Receipt,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { getPortalNavGroups, type PortalArea, type PortalNavGroup, type PortalNavItem } from "@/lib/portal"

type SidebarProps = {
  area: PortalArea
  links: PortalNavGroup[]
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  variant: "desktop" | "mobile"
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

function getIcon(slug: string): LucideIcon {
  const normalizedSlug = slug.toLowerCase()

  if (normalizedSlug.includes("dashboard")) return Home
  if (normalizedSlug.includes("student")) return GraduationCap
  if (normalizedSlug.includes("class") || normalizedSlug.includes("division")) return BookOpen
  if (normalizedSlug.includes("staff") || normalizedSlug.includes("admission") || normalizedSlug.includes("user")) return Users
  if (normalizedSlug.includes("fee") || normalizedSlug.includes("charge") || normalizedSlug.includes("discount") || normalizedSlug.includes("refund") || normalizedSlug.includes("collection") || normalizedSlug.includes("expense") || normalizedSlug.includes("payroll") || normalizedSlug.includes("vendor") || normalizedSlug.includes("account")) return CircleDollarSign
  if (normalizedSlug.includes("receipt")) return Receipt
  if (normalizedSlug.includes("report") || normalizedSlug.includes("audit")) return FileText
  return Building2
}

function SidebarBody({ area, links, collapsed, setCollapsed, onCloseMobile }: Omit<SidebarProps, "mobileOpen">) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-black/5 px-3 dark:border-white/10">
        <div
          className={`overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 transition-[max-width,opacity] duration-300 ease-in-out dark:text-slate-400 ${
            collapsed ? "max-w-0 opacity-0" : "max-w-28 opacity-100"
          }`}
        >
          Menu
        </div>

        <div className="flex items-center gap-2">
          {onCloseMobile ? (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onCloseMobile} aria-label="Close navigation menu">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 md:inline-flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {links.length ? (
          <div className="space-y-4 px-2">
            {links.map((group) => (
              <div key={group.label} className="space-y-2">
                <div
                  className={`overflow-hidden px-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400 transition-[max-height,opacity,padding] duration-300 ease-in-out dark:text-slate-500 ${
                    collapsed ? "max-h-0 py-0 opacity-0" : "max-h-8 py-1 opacity-100"
                  }`}
                >
                  {group.label}
                </div>

                <ul className="flex flex-col gap-1">
                  {group.items.map((link) => {
                    const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
                    const Icon = getIcon(link.slug)

                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          className={`relative flex items-center rounded-xl px-3 py-2.5 text-sm transition-colors ${
                            active
                              ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                              : "text-slate-600 hover:bg-black/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                          }`}
                          title={link.label}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </span>

                          <span
                            className={`ml-3 overflow-hidden whitespace-nowrap transition-all duration-200 ${
                              collapsed ? "max-w-0 opacity-0" : "max-w-[220px] opacity-100"
                            }`}
                          >
                            {link.label}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className={`px-4 py-3 text-sm leading-6 text-slate-500 dark:text-slate-400 ${collapsed ? "hidden" : "block"}`}>
            No menu items yet for {area}. Workspace menus will appear here once they are available.
          </div>
        )}
      </nav>
    </div>
  )
}

export function Sidebar(props: SidebarProps) {
  if (props.variant === "mobile") {
    if (!props.mobileOpen) {
      return null
    }

    return (
      <div className="fixed inset-0 z-50 flex md:hidden">
        <button type="button" aria-label="Close navigation backdrop" className="absolute inset-0 bg-slate-950/50" onClick={props.onCloseMobile} />
        <aside className="relative z-10 h-full w-[min(18rem,86vw)] bg-white shadow-2xl dark:bg-slate-950">
          <SidebarBody {...props} />
        </aside>
      </div>
    )
  }

  return (
    <aside
      onMouseEnter={() => props.setCollapsed(false)}
      onMouseLeave={() => props.setCollapsed(true)}
      className={`hidden flex-col border-r border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 md:flex ${
        props.collapsed ? "w-16" : "w-64"
      }`}
    >
      <SidebarBody {...props} />
    </aside>
  )
}