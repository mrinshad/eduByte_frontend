import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { BanknoteArrowDown, FileCheck2, Wallet, Wrench } from "lucide-react"

const quickLinks = [
  {
    href: "/workspace/fee-management/collection",
    title: "Collect Fees",
    description: "Open due invoices and collect payments fast.",
    Icon: Wallet,
  },
  {
    href: "/workspace/fee-management/receipts",
    title: "Receipt Register",
    description: "Review and verify receipts for daily closure.",
    Icon: FileCheck2,
  },
  {
    href: "/workspace/expense-management/expenses/createExpense",
    title: "New Expense",
    description: "Log a new expense and how it was paid.",
    Icon: BanknoteArrowDown,
  },
  {
    href: "/workspace/reports/vehicle-allocation",
    title: "Vehicle Allocation",
    description: "Manage and allocate vehicles for daily operations.",
    Icon: Wrench,
  },
]

export default function WorkspaceDashboardPage() {
  return (
    <section className="space-y-6 px-1 py-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Workspace Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Daily operations, payments, and academic controls.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map(({ href, title, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl bg-gradient-to-br from-[#3f4a32] via-[#4b563d] to-[#2f3726] p-5 shadow-md transition hover:shadow-lg"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-white/85">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}