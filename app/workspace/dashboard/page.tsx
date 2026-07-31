import Link from "next/link"
import {
  BanknoteArrowDown,
  FileCheck2,
  Wallet,
  Wrench,
  Clock,
  FileText,
  Search,
  BarChart3,
  Send,
  Settings,
} from "lucide-react"

/* ─── Stats ─── */
const stats = [
  { label: "Today's Collection", value: "₹48,250", change: "↑ 8.5%", positive: true },
  { label: "Pending Dues", value: "₹3.2L", change: "142 invoices", positive: false },
  { label: "Today's Expenses", value: "₹12,800", change: "8 entries", positive: false },
  { label: "Receipts Issued", value: "86", change: "All verified", positive: true },
]

/* ─── Quick Links (10 items) ─── */
const quickLinks = [
  {
    href: "/workspace/fee-management/collection",
    title: "Collect Fees",
    description: "Open due invoices & collect payments.",
    Icon: Wallet,
  },
  {
    href: "/workspace/fee-management/receipts",
    title: "Receipt Register",
    description: "Review and verify daily receipts.",
    Icon: FileCheck2,
  },
  {
    href: "/workspace/expense-management/createExpense",
    title: "New Expense",
    description: "Log expense & payment method.",
    Icon: BanknoteArrowDown,
  },
  {
    href: "/workspace/reports/vehicle-allocation",
    title: "Vehicle Allocation",
    description: "Manage routes & daily operations.",
    Icon: Wrench,
  },
  {
    href: "/workspace/daily-closure",
    title: "Daily Closure",
    description: "End-of-day cash & summary.",
    Icon: Clock,
  },
  {
    href: "/workspace/reports/fee",
    title: "Fee Reports",
    description: "Collection & dues analytics.",
    Icon: FileText,
  },
  {
    href: "/workspace/students/search",
    title: "Student Search",
    description: "Find student & fee status.",
    Icon: Search,
  },
  {
    href: "/workspace/reports/expense",
    title: "Expense Report",
    description: "Monthly spending summary.",
    Icon: BarChart3,
  },
  {
    href: "/workspace/notices/send",
    title: "Send Reminder",
    description: "Fee due SMS & notices.",
    Icon: Send,
  },
  {
    href: "/workspace/settings",
    title: "Settings",
    description: "Workspace preferences.",
    Icon: Settings,
  },
]

/* ─── Chart Data ─── */
const dailyData = [
  { day: "Mon", amount: 35 },
  { day: "Tue", amount: 42 },
  { day: "Wed", amount: 48 },
  { day: "Thu", amount: 30 },
  { day: "Fri", amount: 45 },
  { day: "Sat", amount: 52 },
  { day: "Sun", amount: 38 },
]

const expenseBreakdown = [
  { label: "Salaries", value: 40, color: "#4b563d" },
  { label: "Utilities", value: 24, color: "#6b7a5a" },
  { label: "Transport", value: 16, color: "#8a9a78" },
  { label: "Misc", value: 12, color: "#a8b896" },
]

const monthlyFee = [
  { month: "Apr", collected: 12, target: 20 },
  { month: "May", collected: 14, target: 20 },
  { month: "Jun", collected: 16, target: 20 },
  { month: "Jul", collected: 18, target: 20 },
  { month: "Aug", collected: 19, target: 20 },
  { month: "Sep", collected: 20, target: 20 },
  { month: "Oct", collected: 21, target: 20 },
  { month: "Nov", collected: 22, target: 20 },
  { month: "Dec", collected: 23, target: 20 },
  { month: "Jan", collected: 24, target: 20 },
  { month: "Feb", collected: 24.5, target: 20 },
  { month: "Mar", collected: 25, target: 20 },
]

/* ─── Reusable Charts ─── */
function DailyBarChart() {
  const max = Math.max(...dailyData.map((d) => d.amount))
  const barW = 32
  const gap = 18
  const chartH = 140
  const chartW = dailyData.length * (barW + gap) + gap
  const startX = gap

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Daily Collection (Last 7 Days)</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">in ₹ thousands</span>
      </div>
      <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line
            key={i}
            x1={startX}
            y1={chartH - p * chartH + 10}
            x2={chartW - gap}
            y2={chartH - p * chartH + 10}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={0.5}
          />
        ))}
        {dailyData.map((d, i) => {
          const h = (d.amount / max) * chartH
          const x = startX + i * (barW + gap)
          const y = chartH - h + 10
          return (
            <g key={d.day}>
              <rect x={x} y={y} width={barW} height={h} rx={4} fill="#4b563d" opacity={i % 2 === 0 ? 0.9 : 0.7} />
              <text
                x={x + barW / 2}
                y={chartH + 24}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400"
                fontSize={10}
              >
                {d.day}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ExpenseDonut() {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Expense Breakdown</h3>
      <svg viewBox="0 0 200 170" className="mx-auto w-full max-w-[200px]">
        <g transform="rotate(-90 100 75)">
          {expenseBreakdown.map((seg) => {
            const dash = (seg.value / 100) * circumference
            const el = (
              <circle
                key={seg.label}
                cx="100"
                cy="75"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={20}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return el
          })}
        </g>
        <text x="100" y="68" textAnchor="middle" className="fill-slate-900 dark:fill-white" fontSize={18} fontWeight={700}>
          ₹3.8L
        </text>
        <text x="100" y="86" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize={10}>
          This Month
        </text>
        {/* Legend */}
        <rect x="20" y="138" width="10" height="10" rx={2} fill="#4b563d" />
        <text x="35" y="147" className="fill-slate-600 dark:fill-slate-300" fontSize={10}>
          Salaries 40%
        </text>
        <rect x="105" y="138" width="10" height="10" rx={2} fill="#6b7a5a" />
        <text x="120" y="147" className="fill-slate-600 dark:fill-slate-300" fontSize={10}>
          Utilities 24%
        </text>
        <rect x="20" y="155" width="10" height="10" rx={2} fill="#8a9a78" />
        <text x="35" y="164" className="fill-slate-600 dark:fill-slate-300" fontSize={10}>
          Transport 16%
        </text>
        <rect x="105" y="155" width="10" height="10" rx={2} fill="#a8b896" />
        <text x="120" y="164" className="fill-slate-600 dark:fill-slate-300" fontSize={10}>
          Misc 12%
        </text>
      </svg>
    </div>
  )
}

function FeeLineChart() {
  const chartW = 560
  const chartH = 120
  const padding = { left: 40, right: 20, top: 10, bottom: 30 }
  const maxVal = Math.max(...monthlyFee.map((d) => Math.max(d.collected, d.target)))
  const xStep = (chartW - padding.left - padding.right) / (monthlyFee.length - 1)

  const toX = (i: number) => padding.left + i * xStep
  const toY = (v: number) => padding.top + chartH - (v / maxVal) * chartH

  const collectedPoints = monthlyFee.map((d, i) => `${toX(i)},${toY(d.collected)}`).join(" ")
  const targetPoints = monthlyFee.map((d, i) => `${toX(i)},${toY(d.target)}`).join(" ")

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Collection vs Target</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-[#4b563d]" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Collected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-slate-300 dark:bg-slate-600" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Target</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full">
        {[0, 0.33, 0.66, 1].map((p, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + chartH * p}
            x2={chartW - padding.right}
            y2={padding.top + chartH * p}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={0.5}
          />
        ))}
        <polyline
          points={targetPoints}
          fill="none"
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-600"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
        <polyline
          points={collectedPoints}
          fill="none"
          stroke="#4b563d"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`${padding.left},${padding.top + chartH} ${collectedPoints} ${toX(monthlyFee.length - 1)},${padding.top + chartH}`}
          fill="#4b563d"
          opacity={0.06}
        />
        {monthlyFee.map((d, i) => (
          <circle key={d.month} cx={toX(i)} cy={toY(d.collected)} r={3} fill="#4b563d" />
        ))}
        {monthlyFee.map((d, i) => (
          <text
            key={d.month}
            x={toX(i)}
            y={padding.top + chartH + 16}
            textAnchor="middle"
            className="fill-slate-500 dark:fill-slate-400"
            fontSize={9}
          >
            {d.month}
          </text>
        ))}
      </svg>
    </div>
  )
}

/* ─── Page ─── */
export default function WorkspaceDashboardPage() {
  return (
    <section className="space-y-6 px-4 py-4">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-white">
              {s.value}
            </div>
            <div
              className={`mt-0.5 text-[11px] font-medium ${
                s.positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links — 5 columns, smaller cards, green gradient */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickLinks.map(({ href, title, description, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl bg-gradient-to-br from-[#3f4a32] via-[#4b563d] to-[#2f3726] p-3.5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/75">{description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DailyBarChart />
        </div>
        <ExpenseDonut />
      </div>
      <FeeLineChart />
    </section>
  )
}