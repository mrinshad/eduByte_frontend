"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Folder,
  GraduationCap,
  Home,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { checkPermission } from "@/hooks/usePermission"
import { permissionForSlug, type PortalArea, type PortalNavGroup, type PortalNavItem } from "@/lib/portal"

type SidebarProps = {
  area: PortalArea
  links: PortalNavGroup[]
  userPermissions?: string[]
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  variant: "desktop" | "mobile"
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

type SidebarGroupView = {
  label: string
  items: PortalNavGroup["items"]
  subgroups?: Record<string, PortalNavItem[]>
}

function getSubgroupIcon(subgroup: string): LucideIcon {
  const s = subgroup.toLowerCase()
  if (s.includes("setup")) return Settings
  if (s.includes("collection")) return Banknote
  if (s.includes("operation")) return Briefcase
  if (s.includes("fee") || s.includes("finance")) return CircleDollarSign
  if (s.includes("account")) return Receipt
  return Folder
}

function getIcon(slug: string): LucideIcon {
  const normalizedSlug = slug.toLowerCase()

  if (normalizedSlug.includes("dashboard")) return Home
  if (normalizedSlug.includes("student")) return GraduationCap
  if (normalizedSlug.includes("class") || normalizedSlug.includes("division")) return BookOpen
  if (normalizedSlug.includes("staff") || normalizedSlug.includes("admission") || normalizedSlug.includes("user")) return Users
  if (
    normalizedSlug.includes("fee") ||
    normalizedSlug.includes("charge") ||
    normalizedSlug.includes("discount") ||
    normalizedSlug.includes("refund") ||
    normalizedSlug.includes("collection") ||
    normalizedSlug.includes("expense") ||
    normalizedSlug.includes("payroll") ||
    normalizedSlug.includes("vendor") ||
    normalizedSlug.includes("account")
  )
    return CircleDollarSign
  if (normalizedSlug.includes("receipt")) return Receipt
  if (normalizedSlug.includes("report") || normalizedSlug.includes("audit")) return FileText
  return Building2
}

function SidebarItem({
  link,
  active,
  collapsed,
  isSubItem = false,
  onNavigate,
}: {
  link: PortalNavItem
  active: boolean
  collapsed: boolean
  isSubItem?: boolean
  onNavigate?: () => void
}) {
  const Icon = getIcon(link.slug)

  const activeClass = isSubItem
    ? "bg-white shadow-sm ring-1 ring-black/[0.05] text-slate-900 dark:bg-slate-800 dark:ring-white/[0.08] dark:text-slate-100 font-semibold"
    : "bg-gradient-to-r from-amber-500/10 to-orange-500/[0.02] border-l-2 border-amber-500 font-semibold text-amber-900 dark:from-amber-500/10 dark:to-transparent dark:text-amber-200"

  const hoverClass = isSubItem
    ? "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:translate-x-0.5"
    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.02] dark:hover:text-slate-200"

  return (
    <li>
      <Link
        href={link.href}
        aria-current={active ? "page" : undefined}
        onClick={() => onNavigate?.()}
        className={`group relative flex items-center transition-all duration-200 outline-none rounded-xl text-xs font-medium py-2.5 ${
          isSubItem ? "px-3" : "px-3.5"
        } ${active ? activeClass : hoverClass} ${collapsed ? "justify-center px-0" : ""}`}
        title={link.label}
      >
        <span
          className={`flex shrink-0 items-center justify-center transition-transform group-hover:scale-105 ${
            active
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
          }`}
        >
          <Icon className={isSubItem ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={active ? 2.2 : 1.8} />
        </span>

        <span
          className={`ml-3 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
            collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100"
          }`}
        >
          {link.label}
        </span>
      </Link>
    </li>
  )
}

function SidebarSubgroup({
  subgroup,
  items,
  collapsed,
  pathname,
  onNavigate,
}: {
  subgroup: string
  items: PortalNavItem[]
  collapsed: boolean
  pathname: string
  onNavigate?: () => void
}) {
  const mountaineerActive = items.some((item) => {
    const isOverviewLink = item.href.endsWith("/fee-management")
    return pathname === item.href || (!isOverviewLink && pathname.startsWith(`${item.href}/`))
  })
  const [isOpen, setIsOpen] = React.useState<boolean>(mountaineerActive || true)
  const SubgroupIcon = getSubgroupIcon(subgroup)

  return (
    <div
      className={`transition-all duration-300 rounded-xl p-1 ${
        mountaineerActive && !collapsed
          ? "bg-slate-50/60 ring-1 ring-black/[0.02] dark:bg-slate-900/40 dark:ring-white/[0.02]"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex w-full items-center justify-between rounded-xl transition-all duration-200 outline-none ${
          collapsed ? "px-2 py-2.5 justify-center" : "px-2.5 py-2"
        } ${
          mountaineerActive && collapsed
            ? "bg-amber-500/10 text-amber-600 shadow-sm dark:bg-amber-500/20 dark:text-amber-400"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.02] dark:hover:text-slate-200"
        }`}
      >
        <div className="flex items-center min-w-0">
          <span
            className={`flex shrink-0 items-center justify-center transition-colors ${
              mountaineerActive && collapsed
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
            }`}
          >
            <SubgroupIcon className="h-4 w-4" strokeWidth={mountaineerActive && collapsed ? 2.2 : 1.8} />
          </span>
          {!collapsed && (
            <span
              className={`ml-2.5 text-[0.72rem] font-bold uppercase tracking-wider transition-colors truncate ${
                mountaineerActive
                  ? "text-slate-800 dark:text-slate-200"
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200"
              }`}
            >
              {subgroup}
            </span>
          )}
        </div>
        {!collapsed && (
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-90 text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"
            }`}
          />
        )}
      </button>

      {!collapsed && (
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <ul className="relative space-y-1 ml-4.5 border-l border-slate-200/60 pl-2.5 dark:border-slate-800/80 my-1">
              {items.map((link) => {
                const isOverviewLink = link.href.endsWith("/fee-management")
                const active =
                  pathname === link.href || (!isOverviewLink && pathname.startsWith(`${link.href}/`))
                return (
                  <SidebarItem
                    key={link.href}
                    link={link}
                    active={active}
                    collapsed={collapsed}
                    isSubItem={true}
                    onNavigate={onNavigate}
                  />
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarBody({
  area,
  links,
  userPermissions,
  collapsed,
  setCollapsed,
  onCloseMobile,
}: Omit<SidebarProps, "mobileOpen">) {
  const pathname = usePathname()

  const permissions = userPermissions || []

  const isAllowed = React.useCallback(
    (item: PortalNavItem) => {
      if (item.slug === "dashboard" || area === "student") {
        return true
      }
      const permKey = permissionForSlug(item.slug)
      return checkPermission(permissions, permKey)
    },
    [area, permissions]
  )

  const filteredLinks = React.useMemo(() => {
    return links
      .map((group) => ({
        ...group,
        items: group.items.filter(isAllowed),
      }))
      .filter((group) => group.items.length > 0)
  }, [links, isAllowed])

  const groupedLinks: SidebarGroupView[] = filteredLinks.map((group) => {
    const hasSubgroups = group.items.some((item) => item.subgroup)
    return {
      label: group.label,
      items: group.items.filter((item) => !item.subgroup),
      subgroups: hasSubgroups
        ? group.items
            .filter((item) => item.subgroup)
            .reduce<Record<string, PortalNavItem[]>>((accumulator, item) => {
              const subgroup = item.subgroup!
              if (!accumulator[subgroup]) {
                accumulator[subgroup] = []
              }
              accumulator[subgroup].push(item)
              return accumulator
            }, {})
        : undefined,
    }
  })

  return (
    <div className="flex h-full flex-col">
      {/* Header Panel */}
      <div className="flex h-16 items-center justify-between border-b border-black/[0.04] px-4 dark:border-white/[0.06]">
        <div
          className={`overflow-hidden whitespace-nowrap text-[0.68rem] font-bold uppercase tracking-[0.2em] text-slate-400 transition-[max-width,opacity] duration-300 ease-in-out dark:text-slate-500 ${
            collapsed ? "max-w-0 opacity-0" : "max-w-28 opacity-100"
          }`}
        >
          Navigation
        </div>

        <div className="flex items-center gap-1.5">
          {onCloseMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl md:hidden hover:bg-black/5 dark:hover:bg-white/5"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-white/[0.04] dark:hover:text-slate-50 md:inline-flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation Streams */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
        {links.length ? (
          <div className="space-y-5">
            {groupedLinks.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <div
                  className={`overflow-hidden px-3.5 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400/80 transition-all duration-300 ease-in-out dark:text-slate-500/80 ${
                    collapsed ? "max-h-0 py-0 opacity-0" : "max-h-8 py-1 opacity-100"
                  }`}
                >
                  {group.label}
                </div>

                {group.subgroups ? (
                  <div className="space-y-1">
                    {Object.entries(group.subgroups).map(([subgroup, subgroupItems]) => (
                      <SidebarSubgroup
                        key={subgroup}
                        subgroup={subgroup}
                        items={subgroupItems}
                        collapsed={collapsed}
                        pathname={pathname}
                        onNavigate={onCloseMobile}
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {group.items.map((link) => {
                      const isOverviewLink = link.href.endsWith("/fee-management")
                      const active =
                        pathname === link.href ||
                        (!isOverviewLink && pathname.startsWith(`${link.href}/`))
                      return (
                        <SidebarItem
                          key={link.href}
                          link={link}
                          active={active}
                          collapsed={collapsed}
                          onNavigate={onCloseMobile}
                        />
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`px-4 py-3 text-xs leading-relaxed text-slate-400 dark:text-slate-500 ${
              collapsed ? "hidden" : "block"
            }`}
          >
            No workspace options for {area}.
          </div>
        )}
      </nav>
    </div>
  )
}

export function Sidebar(props: SidebarProps) {
  if (props.variant === "mobile") {
    if (!props.mobileOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
        <button
          type="button"
          aria-label="Close navigation backdrop"
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
          onClick={props.onCloseMobile}
        />
        <aside className="relative z-10 h-full w-[17rem] bg-white shadow-2xl dark:bg-slate-950 border-r border-black/[0.04] dark:border-white/[0.06]">
          <SidebarBody {...props} />
        </aside>
      </div>
    )
  }

  return (
    <div className="sticky top-16 h-[calc(100vh-4rem)] pt-3 pb-4 pl-4 hidden md:block">
      <aside
        onMouseEnter={() => props.setCollapsed(false)}
        onMouseLeave={() => props.setCollapsed(true)}
        className={`h-full flex flex-col rounded-2xl border border-black/[0.05] bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-white/[0.06] dark:bg-slate-950/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] ${
          props.collapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarBody {...props} />
      </aside>
    </div>
  )
}