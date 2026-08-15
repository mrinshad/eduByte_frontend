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
  Wallet,
  BanknoteArrowDown,
  AlertTriangle,
  ClipboardList,
  Calculator,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  FileBarChart2,
  type LucideIcon,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/PermissionGate"
import { usePermission } from "@/hooks/usePermission"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getWorkspaceDashboardStats,
  getWeeklyCollection,
  getExpenseByCategory,
  getPaymentMethodSplit,
  type WorkspaceDashboardStats,
  type WeeklyCollectionPoint,
  type ExpenseByCategoryPoint,
  type PaymentMethodPoint,
} from "@/lib/services/workspaceDashboard"

// ---------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
}

function formatCompactCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount ?? 0)
}

const BRAND = "#556043"
const BRAND_LIGHT = "#8a9678"
const CHART_COLORS = ["#556043", "#8a9678", "#b7c0a8", "#3f4a32", "#d8dfcd"]

const EMPTY_STATS: WorkspaceDashboardStats = {
  todayCollection: 0,
  todayCollectionDelta: null,
  weekCollection: 0,
  weekCollectionDelta: null,
  monthExpenses: 0,
  monthExpensesDelta: null,
  outstandingFees: 0,
  pendingFines: 0,
}

// ---------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------

function StatCard({
  label,
  value,
  delta,
  deltaGoodDirection = "up",
  loading,
  Icon,
}: {
  label: string
  value: string
  delta?: number | null
  deltaGoodDirection?: "up" | "down"
  loading: boolean
  Icon: LucideIcon
}) {
  const hasDelta = typeof delta === "number"
  const isPositive = hasDelta && delta! >= 0
  const isGood = deltaGoodDirection === "up" ? isPositive : !isPositive

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#556043]/10 text-[#556043] dark:bg-[#556043]/20">
          <Icon className="h-4.5 w-4.5" />
        </div>
        {!loading && hasDelta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              isGood
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
// Quick actions
// ---------------------------------------------------------------------

const quickActions: { href: string; label: string; Icon: LucideIcon; permission: string }[] = [
  { href: "/workspace/fee-management", label: "Collect Fees", Icon: Wallet, permission: "feecollection.listOnNavbar" },
  { href: "/workspace/expense-management/createExpense", label: "New Expense", Icon: BanknoteArrowDown, permission: "expense.createNewButton" },
  { href: "/workspace/fine-management/student-fines", label: "Student Fines", Icon: AlertTriangle, permission: "fine.listOnNavbar" },
  { href: "/workspace/student-charges/student-charges", label: "Fee Ledgers", Icon: ClipboardList, permission: "studentcharges.listOnNavbar" },
  { href: "/workspace/student-charges/generate-charges", label: "Generate Fees", Icon: Calculator, permission: "feegeneration.listOnNavbar" },
  { href: "/workspace/reports/academic-year-summary", label: "View Reports Center", Icon: FileBarChart2, permission: "report.read" },
]

// ---------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------

export default function WorkspaceDashboardPage() {
  const { hasPermission } = usePermission()
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<WorkspaceDashboardStats>(EMPTY_STATS)
  const [weekly, setWeekly] = useState<WeeklyCollectionPoint[]>([])
  const [expenseByCategory, setExpenseByCategory] = useState<ExpenseByCategoryPoint[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodPoint[]>([])

  const visibleQuickActions = useMemo(
    () => quickActions.filter((act) => hasPermission(act.permission) || act.permission === "report.read"),
    [hasPermission]
  )

  useEffect(() => {
    let cancelled = false

    async function loadDashboardData() {
      setLoading(true)
      try {
        const [statsRes, weeklyRes, expenseRes, paymentRes] = await Promise.allSettled([
          getWorkspaceDashboardStats(),
          getWeeklyCollection(),
          getExpenseByCategory(),
          getPaymentMethodSplit(),
        ])

        if (!cancelled) {
          if (statsRes.status === "fulfilled") setStats(statsRes.value)
          if (weeklyRes.status === "fulfilled") setWeekly(weeklyRes.value)
          if (expenseRes.status === "fulfilled") setExpenseByCategory(expenseRes.value)
          if (paymentRes.status === "fulfilled") setPaymentMethods(paymentRes.value)
        }
      } catch (error) {
        console.error("Failed to load workspace dashboard data:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDashboardData()
    return () => {
      cancelled = true
    }
  }, [])

  const weekTotal = useMemo(() => weekly.reduce((sum, d) => sum + d.amount, 0), [weekly])
  const expenseTotal = useMemo(
    () => expenseByCategory.reduce((sum, d) => sum + d.value, 0),
    [expenseByCategory]
  )

  return (
    <PermissionGate permission="workspacedashboard.listOnNavbar">
      <section className="space-y-6 px-1 py-1 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Workspace Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Daily operations, collections, and financial overview.
            </p>
          </div>
        </div>

        {/* 5 Core Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="Today's Collection"
            value={formatCurrency(stats.todayCollection)}
            delta={stats.todayCollectionDelta}
            loading={loading}
            Icon={Wallet}
          />
          <StatCard
            label="This Week's Collection"
            value={formatCurrency(stats.weekCollection)}
            delta={stats.weekCollectionDelta}
            loading={loading}
            Icon={TrendingUp}
          />
          <StatCard
            label="Outstanding Fees"
            value={formatCurrency(stats.outstandingFees)}
            loading={loading}
            Icon={AlertCircle}
          />
          <StatCard
            label="This Month's Expenses"
            value={formatCurrency(stats.monthExpenses)}
            delta={stats.monthExpensesDelta}
            deltaGoodDirection="down"
            loading={loading}
            Icon={BanknoteArrowDown}
          />
          <StatCard
            label="Pending Fines"
            value={(stats?.pendingFines ?? 0).toLocaleString()}
            loading={loading}
            Icon={AlertTriangle}
          />
        </div>

        {/* Charts — row 1: weekly trend + payment methods */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Collection — Last 7 Days
              </h2>
              {!loading && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Total: {formatCurrency(weekTotal)}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex h-56 items-center justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : weekly.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-400">
                No collection data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCompactCurrency(Number(v))}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "#e2e8f0" }}
                  />
                  <Bar dataKey="amount" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Payment Method Split
            </h2>

            {loading ? (
              <div className="flex h-56 items-center justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-400">
                No payments recorded yet.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
                      contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
                  {paymentMethods.map((entry, index) => (
                    <span key={entry.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      {entry.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts — row 2: expense by category */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Expenses by Category — This Month
            </h2>
            {!loading && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total: {formatCurrency(expenseTotal)}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex h-52 items-center justify-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : expenseByCategory.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-slate-400">
              No expenses recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, Math.min(260, expenseByCategory.length * 42))}>
              <BarChart data={expenseByCategory} layout="vertical" margin={{ left: 24, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompactCurrency(Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "#e2e8f0" }}
                />
                <Bar dataKey="value" fill={BRAND_LIGHT} radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick actions — clean chips */}
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
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#556043]/40 hover:bg-[#556043]/5 hover:text-[#556043] dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-[#556043]/10"
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: BRAND_LIGHT }} />
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