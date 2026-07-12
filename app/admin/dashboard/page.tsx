import Link from "next/link"
import { CircleDollarSign, GraduationCap, Receipt, UserPlus } from "lucide-react"

const quickLinks = [
  {
    href: "/admin/admissions/createAdmission",
    title: "New Admission",
    description: "Create a fresh admission with class, vehicle, and fee mapping.",
    Icon: UserPlus,
  },
  {
    href: "/admin/students/createStudent",
    title: "New Student",
    description: "Register a new student profile in the system.",
    Icon: GraduationCap,
  },
  {
    href: "/admin/academic-profile",
    title: "Academic Profile",
    description: "Manage academic years , class and division.",
    Icon: CircleDollarSign,
  },
  {
    href: "/admin/vehicles",
    title: "Vehicle Management",
    description: "Manage vehicle records, assignments, routes, and transport-related information.",
    Icon: Receipt,
  },
]

export default function Page() {
  return (
    <section className="space-y-6 px-1 py-1">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quick access to critical operations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map(({ href, title, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 shadow-md transition hover:shadow-lg"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
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
