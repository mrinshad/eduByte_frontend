import Link from "next/link"
import {
  Receipt,
  TrendingUp,
  Search,
  FileCheck,
  CalendarDays,
  Bus,
  Megaphone,
} from "lucide-react"

/* ─── Workspace Stats ─── */
const stats = [
  { label: "Total Students", value: "2,847", change: "View only", positive: true },
  { label: "Fee Collected Today", value: "₹48,200", change: "↑ 8%", positive: true },
  { label: "Attendance Today", value: "94.6%", change: "↓ 1.1%", positive: false },
  { label: "Pending Dues", value: "142 students", change: "₹3.2L total", positive: false },
]

/* ─── Quick Links — Daily Operations Only ─── */
const quickLinks = [
  {
    href: "/workspace/fees/collect",
    title: "Fee Collection",
    description: "Collect fees, print receipts & view dues.",
    Icon: Receipt,
  },
  {
    href: "/workspace/attendance",
    title: "Attendance",
    description: "Daily class-wise attendance entry.",
    Icon: TrendingUp,
  },
  {
    href: "/workspace/students",
    title: "Student Lookup",
    description: "Search profiles, enrollment & charges.",
    Icon: Search,
  },
  {
    href: "/workspace/exams",
    title: "Exams & Results",
    description: "Enter marks & publish results.",
    Icon: FileCheck,
  },
  {
    href: "/workspace/timetable",
    title: "Timetable",
    description: "View & manage class schedules.",
    Icon: CalendarDays,
  },
  {
    href: "/workspace/vehicles",
    title: "Transport",
    description: "Student vehicle assignments & routes.",
    Icon: Bus,
  },
  {
    href: "/workspace/notices",
    title: "Notices",
    description: "Post announcements & circulars.",
    Icon: Megaphone,
  },
]

/* ─── Chart Data ─── */
const classData = [
  { class: "1st", count: 320 },
  { class: "2nd", count: 380 },
  { class: "3rd", count: 420 },
  { class: "4th", count: 350 },
  { class: "5th", count: 400 },
  { class: "6th", count: 370 },
  { class: "7th", count: 310 },
  { class: "8th", count: 280 },
]

const feeData = [
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

/* ─── Charts (unchanged) ─── */
function BarChart() {
  const max = Math.max(...classData.map((d) => d.count))
  const barW = 28
  const gap = 16
  const chartH = 140
  const chartW = classData.length * (barW + gap) + gap
  const startX = gap

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Students by Class</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Current Academic Year</span>
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
        {classData.map((d, i) => {
          const h = (d.count / max) * chartH
          const x = startX + i * (barW + gap)
          const y = chartH - h + 10
          return (
            <g key={d.class}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                className="fill-slate-900 dark:fill-white"
                opacity={i % 2 === 0 ? 0.9 : 0.6}
              />
              <text
                x={x + barW / 2}
                y={chartH + 24}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400"
                fontSize={10}
              >
                {d.class}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function DonutChart() {
  const boys = 60
  const girls = 40
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const boysDash = (boys / 100) * circumference
  const girlsDash = (girls / 100) * circumference

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Gender Ratio</h3>
      <svg viewBox="0 0 200 160" className="mx-auto w-full max-w-[200px]">
        <g transform="rotate(-90 100 75)">
          <circle
            cx="100"
            cy="75"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-900 dark:text-white"
            strokeWidth={18}
            strokeDasharray={`${boysDash} ${circumference - boysDash}`}
            opacity={0.85}
          />
          <circle
            cx="100"
            cy="75"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-400 dark:text-slate-500"
            strokeWidth={18}
            strokeDasharray={`${girlsDash} ${circumference - girlsDash}`}
            strokeDashoffset={-boysDash}
            opacity={0.85}
          />
        </g>
        <text x="100" y="70" textAnchor="middle" className="fill-slate-900 dark:fill-white" fontSize={20} fontWeight={700}>
          2,847
        </text>
        <text x="100" y="88" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize={10}>
          Total Students
        </text>
        <rect x="45" y="135" width="10" height="10" rx={2} className="fill-slate-900 dark:fill-white" />
        <text x="60" y="144" className="fill-slate-600 dark:fill-slate-300" fontSize={11}>
          Boys {boys}%
        </text>
        <rect x="115" y="135" width="10" height="10" rx={2} className="fill-slate-400 dark:fill-slate-500" />
        <text x="130" y="144" className="fill-slate-600 dark:fill-slate-300" fontSize={11}>
          Girls {girls}%
        </text>
      </svg>
    </div>
  )
}

function LineChart() {
  const chartW = 560
  const chartH = 120
  const padding = { left: 40, right: 20, top: 10, bottom: 30 }

  const maxVal = Math.max(...feeData.map((d) => Math.max(d.collected, d.target)))
  const xStep = (chartW - padding.left - padding.right) / (feeData.length - 1)

  const toX = (i: number) => padding.left + i * xStep
  const toY = (v: number) => padding.top + chartH - (v / maxVal) * chartH

  const collectedPoints = feeData.map((d, i) => `${toX(i)},${toY(d.collected)}`).join(" ")
  const targetPoints = feeData.map((d, i) => `${toX(i)},${toY(d.target)}`).join(" ")

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Fee Collection</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-slate-900 dark:bg-white" />
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
          stroke="currentColor"
          className="text-slate-900 dark:text-white"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`${padding.left},${padding.top + chartH} ${collectedPoints} ${toX(feeData.length - 1)},${padding.top + chartH}`}
          className="fill-slate-900 dark:fill-white"
          opacity={0.06}
        />
        {feeData.map((d, i) => (
          <circle
            key={d.month}
            cx={toX(i)}
            cy={toY(d.collected)}
            r={3}
            className="fill-slate-900 dark:fill-white"
          />
        ))}
        {feeData.map((d, i) => (
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
export default function Page() {
  return (
    <section className="space-y-6 px-4 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Workspace
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Daily operations, fee collection & student-facing tools.
        </p>
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
                s.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {quickLinks.map(({ href, title, description, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-3.5 shadow-md transition hover:shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"
            >
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
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
          <BarChart />
        </div>
        <DonutChart />
      </div>
      <LineChart />
    </section>
  )
}