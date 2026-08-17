"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  UserPlus,
  GraduationCap,
  CalendarRange,
  Bus,
  UserRound,
  Users,
  Layers3,
  Wallet,
  Tags,
  Landmark,
  TrendingUp,
  TrendingDown,
  Loader2,
  type LucideIcon,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/PermissionGate"
import { usePermission } from "@/hooks/usePermission"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getAdminDashboardCards,
  getDivisionCounts,
  getStudentStatusCounts,
  type AdminDashboardCards,
  type DivisionCountPoint,
  type StudentStatusPoint,
} from "@/lib/services/adminDashboard"

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

const ACCENT = "#556043"
const PIE_COLORS = ["#556043", "#8a9678", "#b7c0a8", "#3f4a32", "#d8dfcd"]

const EMPTY_CARDS: AdminDashboardCards = {
  totalStudents: 0,
  totalStudentsDelta: null,
  totalStaff: 0,
  totalStaffDelta: null,
  totalClasses: 0,
  totalVehicles: 0,
  activeAcademicYear: "—",
}

// ---------------------------------------------------------------------
// Stat card — delta badge only renders when a delta value is present.
// ---------------------------------------------------------------------

function StatCard({
  label,
  value,
  delta,
  loading,
  Icon,
}: {
  label: string
  value: string
  delta?: number | null
  loading: boolean
  Icon: LucideIcon
}) {
  const hasDelta = typeof delta === "number"
  const isPositive = hasDelta && delta! >= 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white">
          <Icon className="h-4.5 w-4.5" />
        </div>
        {!loading && hasDelta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta!).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-6 w-24" />
      ) : (
        <p className="mt-0.5 truncate text-xl font-semibold text-slate-950 dark:text-white">{value}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------
// Quick actions — compact chips. Routes come from portalSections
// (area: "admin") in lib/portal.ts.
// ---------------------------------------------------------------------

const quickActions: { href: string; label: string; Icon: LucideIcon; permission: string }[] = [
  { href: "/admin/admissions/createAdmission", label: "New Admission", Icon: UserPlus, permission: "admissions.newAdmissionButton" },
  { href: "/admin/students/createStudent", label: "New Student", Icon: GraduationCap, permission: "students.createStudentButton" },
  { href: "/admin/academic-profile", label: "Academic Profile", Icon: CalendarRange, permission: "academics.listOnNavbar" },
  { href: "/admin/staff", label: "Staff", Icon: UserRound, permission: "staff.listOnNavbar" },
  { href: "/admin/students", label: "Students", Icon: Users, permission: "students.listOnNavbar" },
  { href: "/admin/charge-types", label: "Charge Types", Icon: Tags, permission: "chargetypes.listOnNavbar" },
  { href: "/admin/fee-structures", label: "Fee Structures", Icon: Wallet, permission: "feestructures.listOnNavbar" },
  { href: "/admin/accounts", label: "Accounts", Icon: Landmark, permission: "accounts.listOnNavbar" },
  { href: "/admin/vehicles", label: "Vehicles", Icon: Bus, permission: "vehicle.listOnNavbar" },
]

// ---------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------

export default function Page() {
  const { hasPermission } = usePermission()
  const [loadingCards, setLoadingCards] = useState(true)
  const [loadingDivisions, setLoadingDivisions] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const [cards, setCards] = useState<AdminDashboardCards>(EMPTY_CARDS)
  const [divisionCounts, setDivisionCounts] = useState<DivisionCountPoint[]>([])
  const [studentStatus, setStudentStatus] = useState<StudentStatusPoint[]>([])

  const visibleQuickActions = useMemo(
    () => quickActions.filter((act) => hasPermission(act.permission)),
    [hasPermission]
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingCards(true)
      try {
        const data = await getAdminDashboardCards()
        if (!cancelled) setCards(data)
      } catch (error) {
        console.error("Failed to load admin dashboard cards:", error)
      } finally {
        if (!cancelled) setLoadingCards(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingDivisions(true)
      try {
        const data = await getDivisionCounts()
        if (!cancelled) setDivisionCounts(data)
      } catch (error) {
        console.error("Failed to load division counts:", error)
      } finally {
        if (!cancelled) setLoadingDivisions(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingStatus(true)
      try {
        const data = await getStudentStatusCounts()
        if (!cancelled) setStudentStatus(data)
      } catch (error) {
        console.error("Failed to load student status counts:", error)
      } finally {
        if (!cancelled) setLoadingStatus(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const studentStatusTotal = useMemo(
    () => studentStatus.reduce((sum, s) => sum + s.value, 0),
    [studentStatus]
  )

  return (
    <PermissionGate permission="admindashboard.listOnNavbar">
      <section className="space-y-6 px-1 py-1">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Governance, structure, and system oversight.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="Total Students"
            value={(cards?.totalStudents ?? 0).toLocaleString()}
            delta={cards?.totalStudentsDelta}
            loading={loadingCards}
            Icon={Users}
          />
          <StatCard
            label="Total Staff"
            value={(cards?.totalStaff ?? 0).toLocaleString()}
            delta={cards?.totalStaffDelta}
            loading={loadingCards}
            Icon={UserRound}
          />
          <StatCard
            label="Total Classes"
            value={(cards?.totalClasses ?? 0).toLocaleString()}
            loading={loadingCards}
            Icon={Layers3}
          />
          <StatCard
            label="Total Vehicles"
            value={(cards?.totalVehicles ?? 0).toLocaleString()}
            loading={loadingCards}
            Icon={Bus}
          />
          <StatCard
            label="Active Academic Year"
            value={cards?.activeAcademicYear ?? "—"}
            loading={loadingCards}
            Icon={CalendarRange}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Divisions per class */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Divisions per Class
            </h2>

            {loadingDivisions ? (
              <div className="flex h-56 items-center justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : divisionCounts.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-400">
                No classes set up yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={divisionCounts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={divisionCounts.length > 6 ? -25 : 0}
                    textAnchor={divisionCounts.length > 6 ? "end" : "middle"}
                    height={divisionCounts.length > 6 ? 50 : 30}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCompact(Number(v))}
                    width={32}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const n = Number(value)
                      return [`${n} division${n === 1 ? "" : "s"}`, "Divisions"]
                    }}
                    contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "#e2e8f0" }}
                  />
                  <Bar dataKey="divisions" fill={ACCENT} radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Student status */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Student Status
            </h2>

            {loadingStatus ? (
              <div className="flex h-56 items-center justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : studentStatusTotal === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-400">
                No student records yet.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={studentStatus}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {studentStatus.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => {
                        const n = Number(value)
                        return [`${n} student${n === 1 ? "" : "s"}`, String(name)]
                      }}
                      contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
                  {studentStatus.map((entry, index) => (
                    <span key={entry.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      {entry.name} ({entry.value})
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                  {studentStatusTotal} students total
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quick actions — compact chips */}
        {visibleQuickActions.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-2">
              {visibleQuickActions.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </PermissionGate>
  )
}