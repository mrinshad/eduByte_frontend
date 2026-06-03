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
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Folder,
  GraduationCap,
  Home,
  Receipt,
  Settings,
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
  if (normalizedSlug.includes("fee") || normalizedSlug.includes("charge") || normalizedSlug.includes("discount") || normalizedSlug.includes("refund") || normalizedSlug.includes("collection") || normalizedSlug.includes("expense") || normalizedSlug.includes("payroll") || normalizedSlug.includes("vendor") || normalizedSlug.includes("account")) return CircleDollarSign
  if (normalizedSlug.includes("receipt")) return Receipt
  if (normalizedSlug.includes("report") || normalizedSlug.includes("audit")) return FileText
  return Building2
}

function SidebarItem({
  link,
  active,
  collapsed,
  isSubItem = false,
}: {
  link: PortalNavItem;
  active: boolean;
  collapsed: boolean;
  isSubItem?: boolean;
}) {
  const Icon = getIcon(link.slug)

  const activeClass = isSubItem
    ? "bg-white shadow-sm ring-1 ring-slate-200/50 text-slate-900 dark:bg-slate-800 dark:ring-slate-700/50 dark:text-slate-100 font-medium"
    : "bg-slate-100 font-medium text-slate-900 shadow-sm dark:bg-slate-800/80 dark:text-slate-100"

  const hoverClass = "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"

  return (
    <li>
      <Link
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
          active ? activeClass : hoverClass
        } ${collapsed ? "justify-center" : isSubItem ? "px-3" : ""}`}
        title={link.label}
      >
        <span
          className={`flex shrink-0 items-center justify-center transition-colors ${
            active
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
          }`}
        >
          <Icon className={isSubItem ? "h-3.5 w-3.5" : "h-[1.125rem] w-[1.125rem]"} strokeWidth={active ? 2.5 : 2} />
        </span>

        <span
          className={`ml-3 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
            collapsed ? "max-w-0 opacity-0" : "max-w-[220px] opacity-100"
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
}: {
  subgroup: string;
  items: PortalNavItem[];
  collapsed: boolean;
  pathname: string;
}) {
  const hasActiveItem = items.some((item) => {
    const isOverviewLink = item.href.endsWith("/fee-management")
    return pathname === item.href || (!isOverviewLink && pathname.startsWith(`${item.href}/`))
  })
  const [isOpen, setIsOpen] = React.useState<boolean>(hasActiveItem || true)
  const SubgroupIcon = getSubgroupIcon(subgroup)

  return (
    <div className={`transition-colors duration-300 rounded-[0.85rem] ${hasActiveItem && !collapsed ? "bg-slate-50/80 ring-1 ring-slate-900/5 dark:bg-slate-900/40 dark:ring-white/5 p-1" : "p-1"}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex w-full items-center justify-between rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
          collapsed ? "px-2 py-2 justify-center" : "px-2 py-1.5"
        } ${
          hasActiveItem && collapsed
            ? "bg-slate-100 text-slate-900 shadow-sm dark:bg-slate-800/80 dark:text-slate-100"
            : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
        }`}
      >
        <div className="flex items-center">
          <span
            className={`flex shrink-0 items-center justify-center transition-colors ${
              hasActiveItem && collapsed
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
            }`}
          >
            <SubgroupIcon className="h-[1.125rem] w-[1.125rem]" strokeWidth={hasActiveItem && collapsed ? 2.5 : 2} />
          </span>
          {!collapsed && (
            <span className={`ml-3 text-[0.8rem] font-semibold tracking-wide transition-colors ${hasActiveItem ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
              {subgroup}
            </span>
          )}
        </div>
        {!collapsed && (
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90 text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}
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
            <ul className="relative space-y-0.5 ml-4 border-l border-slate-200/80 pl-2 dark:border-slate-700/80 my-1">
              {items.map((link) => {
                const isOverviewLink = link.href.endsWith("/fee-management")
                const active =
                  pathname === link.href || (!isOverviewLink && pathname.startsWith(`${link.href}/`))
                return <SidebarItem key={link.href} link={link} active={active} collapsed={collapsed} isSubItem={true} />
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarBody({ area, links, collapsed, setCollapsed, onCloseMobile }: Omit<SidebarProps, "mobileOpen">) {
  const pathname = usePathname()

  const groupedLinks: SidebarGroupView[] = links.map((group) => {
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
            {groupedLinks.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <div
                  className={`overflow-hidden px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 transition-all duration-300 ease-in-out dark:text-slate-500 ${
                    collapsed ? "max-h-0 py-0 opacity-0" : "max-h-8 py-1.5 opacity-100"
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
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {group.items.map((link) => {
                      const isOverviewLink = link.href.endsWith("/fee-management")
                      const active =
                        pathname === link.href || (!isOverviewLink && pathname.startsWith(`${link.href}/`))
                      return <SidebarItem key={link.href} link={link} active={active} collapsed={collapsed} />
                    })}
                  </ul>
                )}
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