"use client"

import Link from "next/link"
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
  type LucideIcon,
} from "lucide-react"

// ---------------------------------------------------------------------
// MOCK DATA — placeholder only. Swap each constant for a real fetch
// once the corresponding endpoint exists; the shapes below are what the
// UI expects, so wiring live data later just means replacing the
// constant with fetched state of the same shape (see the earlier
// live-fetch version of this page for the useEffect + loading pattern).
// ---------------------------------------------------------------------

const MOCK_STATS = {
  totalStudents: 1284,
  totalStudentsDelta: 3.4, // % vs last month
  totalStaff: 96,
  totalStaffDelta: 1.1, // % vs last month
  totalClasses: 12,
  totalVehicles: 9,
  activeAcademicYear: "2026 - 2027",
}

const MOCK_CLASS_DIVISIONS = [
  { name: "LKG", divisions: 2 },
  { name: "UKG", divisions: 2 },
  { name: "Class 1", divisions: 3 },
  { name: "Class 2", divisions: 3 },
  { name: "Class 3", divisions: 3 },
  { name: "Class 4", divisions: 2 },
  { name: "Class 5", divisions: 2 },
  { name: "Class 6", divisions: 2 },
  { name: "Class 7", divisions: 2 },
  { name: "Class 8", divisions: 2 },
  { name: "Class 9", divisions: 1 },
  { name: "Class 10", divisions: 1 },
]

const MOCK_STUDENT_STATUS = [
  { name: "Active", value: 1142 },
  { name: "Withdrawn", value: 58 },
  { name: "Alumni", value: 84 },
]

// ---------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

const ACCENT = "#556043"
const ACCENT_LIGHT = "#8a9678"
const PIE_COLORS = ["#556043", "#8a9678", "#b7c0a8", "#3f4a32", "#d8dfcd"]

// ---------------------------------------------------------------------
// Stat card — delta badge is optional; omit it for counts that don't
// have a meaningful "vs last period" comparison (e.g. active year).
// ---------------------------------------------------------------------

function StatCard({
  label,
  value,
  delta,
  Icon,
}: {
  label: string
  value: string
  delta?: number
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
        {hasDelta && (
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
      <p className="mt-0.5 truncate text-xl font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------
// Quick actions — compact chips. Routes come from portalSections
// (area: "admin") in lib/portal.ts.
// ---------------------------------------------------------------------

const quickActions: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/admin/admissions/createAdmission", label: "New Admission", Icon: UserPlus },
  { href: "/admin/students/createStudent", label: "New Student", Icon: GraduationCap },
  { href: "/admin/academic-profile", label: "Academic Profile", Icon: CalendarRange },
  { href: "/admin/staff", label: "Staff", Icon: UserRound },
  { href: "/admin/students", label: "Students", Icon: Users },
  { href: "/admin/charge-types", label: "Charge Types", Icon: Tags },
  { href: "/admin/fee-structures", label: "Fee Structures", Icon: Wallet },
  { href: "/admin/accounts", label: "Accounts", Icon: Landmark },
  { href: "/admin/vehicles", label: "Vehicles", Icon: Bus },
]

// ---------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------

export default function Page() {
  const studentStatusTotal = MOCK_STUDENT_STATUS.reduce((sum, s) => sum + s.value, 0)

  return (
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
          value={MOCK_STATS.totalStudents.toLocaleString()}
          delta={MOCK_STATS.totalStudentsDelta}
          Icon={Users}
        />
        <StatCard
          label="Total Staff"
          value={MOCK_STATS.totalStaff.toLocaleString()}
          delta={MOCK_STATS.totalStaffDelta}
          Icon={UserRound}
        />
        <StatCard label="Total Classes" value={MOCK_STATS.totalClasses.toLocaleString()} Icon={Layers3} />
        <StatCard label="Total Vehicles" value={MOCK_STATS.totalVehicles.toLocaleString()} Icon={Bus} />
        <StatCard label="Active Academic Year" value={MOCK_STATS.activeAcademicYear} Icon={CalendarRange} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Divisions per class */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Divisions per Class
          </h2>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_CLASS_DIVISIONS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
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
        </div>

        {/* Student status */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Student Status
          </h2>

          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={MOCK_STUDENT_STATUS}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
              >
                {MOCK_STUDENT_STATUS.map((entry, index) => (
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
            {MOCK_STUDENT_STATUS.map((entry, index) => (
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
        </div>
      </div>

      {/* Quick actions — compact chips */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(({ href, label, Icon }) => (
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
    </section>
  )
}