"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BadgeIndianRupee,
  BarChart3,
  Bell,
  BookOpen,
  BookOpenCheck,
  Boxes,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Coins,
  Contact,
  CopyCheck,
  CreditCard,
  FileMinus,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderTree,
  Fuel,
  GraduationCap,
  History,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart,
  Medal,
  Milestone,
  PieChart,
  Receipt,
  ReceiptText,
  RotateCcw,
  Route,
  Scale,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  Split,
  Tag,
  Ticket,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { checkPermission } from "@/hooks/usePermission"
import { permissionForSlug, type PortalArea, type PortalNavGroup, type PortalNavItem } from "@/lib/portal"
import { getChargeTypes, type ChargeTypes } from "@/lib/services/chargeTypes"

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

const SUBGROUP_ICONS: Record<string, LucideIcon> = {
  "Fee Management": CreditCard,
  "Accounting": Landmark,
  "Overview & Accounts": BarChart3,
  "Student Fees": BadgeIndianRupee,
  "Expenses & Payroll": ReceiptText,
  "Transport & Fleet": Bus,
  "Students & Admissions": GraduationCap,
}

function getSubgroupIcon(subgroup: string): LucideIcon {
  if (SUBGROUP_ICONS[subgroup]) return SUBGROUP_ICONS[subgroup]
  const s = subgroup.toLowerCase()
  if (s.includes("overview")) return BarChart3
  if (s.includes("transport") || s.includes("fleet")) return Bus
  if (s.includes("admission") || s.includes("student")) return GraduationCap
  if (s.includes("fee") || s.includes("receipt") || s.includes("income")) return BadgeIndianRupee
  if (s.includes("payment") || s.includes("expense") || s.includes("payroll")) return ReceiptText
  if (s.includes("setup")) return Settings
  if (s.includes("account") || s.includes("finance")) return Landmark
  if (s.includes("operation")) return Briefcase
  return Folder
}

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  // --- Admin Area ---
  dashboard: LayoutDashboard,
  "academic-profile": School,
  staff: Contact,
  students: GraduationCap,
  admissions: UserPlus,
  promotion: ArrowUpRight,
  relieving: UserMinus,
  "charge-types": Tag,
  "fee-structures": Layers,
  "fee-structures/bulk-assign": CopyCheck,
  cca: Trophy,
  accounts: Landmark,
  assets: Boxes,
  vehicles: Bus,
  users: Users,
  roles: ShieldCheck,
  "audit-logs": ClipboardList,

  // --- Workspace Operations ---
  "fee-management": BadgeIndianRupee,
  "fine-management/student-fines": AlertCircle,
  "expense-management": ReceiptText,
  "salary-slips": Wallet,
  "student-charges/student-charges": FileSpreadsheet,
  "student-charges/generate-charges": Sparkles,

  // --- Workspace Reports ---
  "reports/academic-year-summary": LineChart,
  "reports/daybook": BookOpenCheck,
  "reports/revolving-fund": Coins,
  "reports/asset-performance": Wrench,
  "reports/daily-receipts": Receipt,
  "reports/fee-type": PieChart,
  "reports/fee-defaulters": AlertTriangle,
  "reports/fines-register": Clock,
  "reports/cca-report": Medal,
  "reports/cca-activity-profit": Scale,
  "reports/salary": Briefcase,
  "reports/daily-expenses": FileMinus,
  "reports/category-expenses": FolderTree,
  "reports/transport-expenses": Fuel,
  "reports/transport-profitability": TrendingUp,
  "reports/transport-roster": Route,
  "reports/admissions-master": UserCheck,
  "reports/class-demographics": UsersRound,
  "reports/student-progression": Milestone,

  // --- Student Area ---
  "profile/personal-details": User,
  "profile/parent-details": Users,
  "profile/academic-details": GraduationCap,
  "academic-history/academic-years": Calendar,
  "academic-history/classes": BookOpen,
  "academic-history/divisions": Split,
  "fees/current-charges": CircleDollarSign,
  "fees/outstanding-fees": AlertCircle,
  "fees/fine-details": Clock,
  "fees/payment-history": History,
  "fees/receipts": Receipt,
  "fees/refund-history": RotateCcw,
  "transport/assigned-vehicle": Bus,
  "transport/transport-fee-details": Ticket,
  "notifications/fee-reminders": Bell,
}

function getIcon(link: PortalNavItem): LucideIcon {
  // Dynamic individual fee type reports under /workspace/reports/fee-type/:id
  if (link.slug === "reports/fee-type" && link.href && link.href.includes("/fee-type/")) {
    return Tag
  }

  if (ICON_BY_SLUG[link.slug]) {
    return ICON_BY_SLUG[link.slug]
  }

  // Fallback pattern matching if an unmapped slug is encountered
  const normalized = link.slug.toLowerCase()
  if (normalized.includes("dashboard")) return LayoutDashboard
  if (normalized.includes("student")) return GraduationCap
  if (normalized.includes("class") || normalized.includes("division")) return BookOpen
  if (normalized.includes("staff")) return Contact
  if (normalized.includes("admission")) return UserPlus
  if (normalized.includes("user")) return Users
  if (normalized.includes("role") || normalized.includes("permission")) return ShieldCheck
  if (normalized.includes("asset")) return Boxes
  if (normalized.includes("vehicle") || normalized.includes("transport")) return Bus
  if (normalized.includes("receipt")) return Receipt
  if (normalized.includes("fine")) return AlertCircle
  if (normalized.includes("salary") || normalized.includes("payroll")) return Wallet
  if (normalized.includes("expense")) return ReceiptText
  if (normalized.includes("fee") || normalized.includes("charge")) return BadgeIndianRupee
  if (normalized.includes("report") || normalized.includes("audit")) return FileText
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
          {React.createElement(getIcon(link), {
            className: isSubItem ? "h-3.5 w-3.5" : "h-4 w-4",
            strokeWidth: active ? 2.2 : 1.8,
          })}
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

function isLinkActive(linkHref: string, currentPathname: string, allHrefs: string[]) {
  if (currentPathname === linkHref) {
    return true
  }
  const isOverviewLink = linkHref.endsWith("/fee-management")
  if (!isOverviewLink && currentPathname.startsWith(`${linkHref}/`)) {
    // If another sidebar link matches currentPathname exactly or with a longer prefix,
    // this parent link should not be marked active.
    const hasMoreSpecificMatch = allHrefs.some(
      (otherHref) =>
        otherHref !== linkHref &&
        (currentPathname === otherHref || currentPathname.startsWith(`${otherHref}/`)) &&
        otherHref.length > linkHref.length
    )
    return !hasMoreSpecificMatch
  }
  return false
}

function SidebarSubgroup({
  subgroup,
  items,
  collapsed,
  pathname,
  allHrefs,
  onNavigate,
}: {
  subgroup: string
  items: PortalNavItem[]
  collapsed: boolean
  pathname: string
  allHrefs: string[]
  onNavigate?: () => void
}) {
  const mountaineerActive = items.some((item) => isLinkActive(item.href, pathname, allHrefs))
  const [isOpen, setIsOpen] = React.useState<boolean>(mountaineerActive || true)

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
            {React.createElement(getSubgroupIcon(subgroup), {
              className: "h-4 w-4",
              strokeWidth: mountaineerActive && collapsed ? 2.2 : 1.8,
            })}
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
                const active = isLinkActive(link.href, pathname, allHrefs)
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

  const permissions = React.useMemo(() => userPermissions || [], [userPermissions])

  const [chargeTypes, setChargeTypes] = React.useState<ChargeTypes[]>([])

  React.useEffect(() => {
    if (area === "workspace") {
      getChargeTypes()
        .then(setChargeTypes)
        .catch(() => {})
    }
  }, [area])

  const isAllowed = React.useCallback(
    (item: PortalNavItem) => {
      if (area === "student") {
        return true
      }
      const permKey = permissionForSlug(item.slug, area)
      return checkPermission(permissions, permKey)
    },
    [area, permissions]
  )

  const enhancedLinks = React.useMemo(() => {
    if (area !== "workspace" || chargeTypes.length === 0) {
      return links
    }

    return links.map((group) => {
      if (group.label !== "Report") return group

      const dynamicFeeItems: PortalNavItem[] = chargeTypes.map((ct) => ({
        slug: "reports/fee-type",
        href: `/workspace/reports/fee-type/${ct.id}`,
        label: ct.name,
        purpose: `Receipts report for ${ct.name}`,
        group: "Report",
        subgroup: "Student Fees",
      }))

      return {
        ...group,
        items: [...group.items, ...dynamicFeeItems],
      }
    })
  }, [links, area, chargeTypes])

  const filteredLinks = React.useMemo(() => {
    return enhancedLinks
      .map((group) => ({
        ...group,
        items: group.items.filter(isAllowed),
      }))
      .filter((group) => group.items.length > 0)
  }, [enhancedLinks, isAllowed])

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

  const allHrefs = React.useMemo(() => {
    return filteredLinks.flatMap((group) => group.items.map((item) => item.href))
  }, [filteredLinks])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
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
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-4 pb-6 scrollbar-none">
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
                        allHrefs={allHrefs}
                        onNavigate={onCloseMobile}
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {group.items.map((link) => {
                      const active = isLinkActive(link.href, pathname, allHrefs)
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

        {/* Physical spacer to guarantee scrolling past bottom items in mobile viewports & simulator device frames */}
        <div className="h-28 w-full shrink-0 pointer-events-none" aria-hidden="true" />
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
        <aside className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-[17rem] flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-950 border-r border-black/[0.04] dark:border-white/[0.06]">
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