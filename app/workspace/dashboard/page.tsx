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
  Wallet,
  BanknoteArrowDown,
  AlertTriangle,
  ClipboardList,
  Calculator,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Bus,
  Receipt,
  type LucideIcon,
} from "lucide-react"

// ---------------------------------------------------------------------
// MOCK DATA — everything in this block is placeholder. Swap each of
// these for a real API call once the corresponding endpoint exists;
// the shapes below are what the UI expects, so wiring real data later
// should just mean replacing the constant with a fetched value of the
// same shape (see the workspace dashboard we built earlier for the
// live-fetch pattern with useEffect + loading states).
// ---------------------------------------------------------------------

const MOCK_STATS = {
  todayCollection: 42500,
  todayCollectionDelta: 8.2, // % vs yesterday
  weekCollection: 268400,
  weekCollectionDelta: 12.5, // % vs last week
  outstandingFees: 184300,
  outstandingFeesDelta: -4.1, // % vs last week (negative = improving)
  monthExpenses: 96750,
  monthExpensesDelta: 3.6, // % vs last month
  pendingFines: 27,
  pendingFinesDelta: -9.0, // % vs last week
}

const MOCK_WEEKLY_COLLECTION = [
  { label: "Mon", amount: 31200 },
  { label: "Tue", amount: 28800 },
  { label: "Wed", amount: 45600 },
  { label: "Thu", amount: 39100 },
  { label: "Fri", amount: 52300 },
  { label: "Sat", amount: 28900 },
  { label: "Sun", amount: 42500 },
]

const MOCK_PAYMENT_METHODS = [
  { name: "UPI", value: 148200 },
  { name: "Cash", value: 62400 },
  { name: "Bank Transfer", value: 41800 },
  { name: "Card", value: 16000 },
]

const MOCK_EXPENSE_CATEGORIES = [
  { name: "Salaries & Staff", value: 38500 },
  { name: "Transport", value: 21200 },
  { name: "Maintenance", value: 14800 },
  { name: "Academic Supplies", value: 12600 },
  { name: "Utilities", value: 9650 },
]

// ---------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount)
}

const BRAND = "#556043"
const BRAND_LIGHT = "#8a9678"
const CHART_COLORS = ["#556043", "#8a9678", "#b7c0a8", "#3f4a32", "#d8dfcd"]

// ---------------------------------------------------------------------
// Stat card — value plus a small delta badge (up/down vs a prior period)
// ---------------------------------------------------------------------

function StatCard({
  label,
  value,
  delta,
  deltaGoodDirection = "up",
  Icon,
}: {
  label: string
  value: string
  delta: number
  deltaGoodDirection?: "up" | "down"
  Icon: LucideIcon
}) {
  const isPositive = delta >= 0
  // For most stats, "up" is good (more collected). For outstanding/fines,
  // a decrease is the good direction — deltaGoodDirection flips the color.
  const isGood = deltaGoodDirection === "up" ? isPositive : !isPositive

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#556043]/10 text-[#556043] dark:bg-[#556043]/20">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${isGood
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            }`}
        >
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-xl font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------
// Quick actions — compact chips
// ---------------------------------------------------------------------

const quickActions: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/workspace/fee-management", label: "Collect Fees", Icon: Wallet },
  { href: "/workspace/expense-management/createExpense", label: "New Expense", Icon: BanknoteArrowDown },
  { href: "/workspace/fine-management/student-fines", label: "Student Fines", Icon: AlertTriangle },
  { href: "/workspace/student-charges/student-charges", label: "Student Charges", Icon: ClipboardList },
  { href: "/workspace/student-charges/generate-charges", label: "Fee Generation", Icon: Calculator },
  { href: "/workspace/reports/student-outstanding", label: "Outstanding Fees", Icon: AlertCircle },
  { href: "/workspace/reports/vehicle-allocation", label: "Vehicle Allocation", Icon: Bus },
  { href: "/workspace/reports/expense-summary", label: "Expense Summary", Icon: Receipt },
]

// ---------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------

export default function WorkspaceDashboardPage() {
  return (
    <section className="space-y-6 px-1 py-1">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Workspace Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daily operations, payments, and academic controls.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Today's Collection"
          value={formatCurrency(MOCK_STATS.todayCollection)}
          delta={MOCK_STATS.todayCollectionDelta}
          Icon={Wallet}
        />
        <StatCard
          label="This Week's Collection"
          value={formatCurrency(MOCK_STATS.weekCollection)}
          delta={MOCK_STATS.weekCollectionDelta}
          Icon={TrendingUp}
        />
        <StatCard
          label="Outstanding Fees"
          value={formatCurrency(MOCK_STATS.outstandingFees)}
          delta={MOCK_STATS.outstandingFeesDelta}
          deltaGoodDirection="down"
          Icon={AlertCircle}
        />
        <StatCard
          label="This Month's Expenses"
          value={formatCurrency(MOCK_STATS.monthExpenses)}
          delta={MOCK_STATS.monthExpensesDelta}
          deltaGoodDirection="down"
          Icon={BanknoteArrowDown}
        />
        <StatCard
          label="Pending Fines"
          value={MOCK_STATS.pendingFines.toLocaleString()}
          delta={MOCK_STATS.pendingFinesDelta}
          deltaGoodDirection="down"
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
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total: {formatCurrency(MOCK_WEEKLY_COLLECTION.reduce((s, d) => s + d.amount, 0))}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_WEEKLY_COLLECTION}>
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
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Payment Method Split
          </h2>

          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={MOCK_PAYMENT_METHODS}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
              >
                {MOCK_PAYMENT_METHODS.map((entry, index) => (
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
            {MOCK_PAYMENT_METHODS.map((entry, index) => (
              <span key={entry.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                {entry.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts — row 2: expense by category */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Expenses by Category — This Month
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total: {formatCurrency(MOCK_EXPENSE_CATEGORIES.reduce((s, d) => s + d.value, 0))}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={MOCK_EXPENSE_CATEGORIES} layout="vertical" margin={{ left: 24 }}>
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
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#556043]/40 hover:bg-[#556043]/5 hover:text-[#556043] dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-[#556043]/10"
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color: BRAND_LIGHT }} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}