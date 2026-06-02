export type PortalArea = "workspace" | "admin" | "student"

export type PortalSection = {
  slug: string
  label: string
  area: PortalArea
  purpose: string
  roles: string[]
}

export const portalSections: PortalSection[] = [
  { slug: "dashboard", label: "Dashboard", area: "workspace", purpose: "Quick overview of collections, expenses, and pending fees", roles: ["Admin", "Accountant", "Principal"] },
  { slug: "academic-year", label: "Academic Year", area: "workspace", purpose: "Manage active academic years", roles: ["Admin"] },
  { slug: "classes-divisions", label: "Classes & Divisions", area: "workspace", purpose: "Create classes and divisions", roles: ["Admin"] },
  { slug: "students", label: "Students", area: "workspace", purpose: "Manage student records", roles: ["Office Staff", "Admin"] },
  { slug: "admissions", label: "Admissions", area: "workspace", purpose: "New admissions and admission charges", roles: ["Office Staff"] },
  { slug: "fee-types", label: "Fee Types", area: "workspace", purpose: "Configure term fee and similar charge types", roles: ["Admin"] },
  { slug: "fee-structures", label: "Fee Structures", area: "workspace", purpose: "Define fee templates", roles: ["Admin"] },
  { slug: "student-charges", label: "Student Charges", area: "workspace", purpose: "Generate and manage charges", roles: ["Admin", "Office Staff"] },
  { slug: "discounts", label: "Discounts", area: "workspace", purpose: "Apply sibling and scholarship discounts", roles: ["Admin"] },
  { slug: "fine-management", label: "Fine Management", area: "workspace", purpose: "Configure and reverse fines", roles: ["Admin"] },
  { slug: "fee-collection", label: "Fee Collection", area: "workspace", purpose: "Collect student payments", roles: ["Accountant", "Office Staff"] },
  { slug: "receipts", label: "Receipts", area: "workspace", purpose: "View, print, and reverse receipts", roles: ["Accountant"] },
  { slug: "refunds", label: "Refunds", area: "workspace", purpose: "Handle admission cancellation and overpayment refunds", roles: ["Accountant", "Admin"] },
  { slug: "events", label: "Events", area: "workspace", purpose: "Create events and contributions", roles: ["Admin"] },
  { slug: "event-collections", label: "Event Collections", area: "workspace", purpose: "Collect event contributions", roles: ["Accountant"] },
  { slug: "expenses", label: "Expenses", area: "workspace", purpose: "Record expenses", roles: ["Accountant"] },
  { slug: "vendors", label: "Vendors", area: "workspace", purpose: "Manage vendors", roles: ["Accountant"] },
  { slug: "accounts", label: "Accounts", area: "workspace", purpose: "Manage income and expense accounts", roles: ["Admin"] },
  { slug: "payroll", label: "Payroll", area: "workspace", purpose: "Generate and track salaries", roles: ["Accountant"] },
  { slug: "staff-deductions", label: "Staff Deductions", area: "workspace", purpose: "Manage recoveries and deductions", roles: ["Accountant"] },
  { slug: "staff-management", label: "Staff Management", area: "workspace", purpose: "Manage teachers and staff", roles: ["Admin"] },
  { slug: "attendance-student", label: "Attendance (Student)", area: "workspace", purpose: "Record student attendance", roles: ["Teachers", "Office Staff"] },
  { slug: "attendance-staff", label: "Attendance (Staff)", area: "workspace", purpose: "Record staff attendance", roles: ["Admin", "Office Staff"] },
  { slug: "transport-assignment", label: "Transport Assignment", area: "workspace", purpose: "Assign vehicle and transport fee", roles: ["Admin", "Office Staff"] },
  { slug: "late-fee-reminders", label: "Late Fee Reminders", area: "workspace", purpose: "Send payment reminders", roles: ["Accountant", "Office Staff"] },
  { slug: "reports", label: "Reports", area: "workspace", purpose: "View reports", roles: ["Admin", "Principal", "Accountant"] },
  { slug: "audit-logs", label: "Audit Logs", area: "workspace", purpose: "View system activity history", roles: ["Admin"] },
]

export const portalAreas: Record<PortalArea, { title: string; subtitle: string }> = {
  workspace: {
    title: "Operations Workspace",
    subtitle: "All staff-facing school operations in one place.",
  },
  admin: {
    title: "Administration",
    subtitle: "Governance, structure, and system oversight.",
  },
  student: {
    title: "Student Portal",
    subtitle: "A focused view for learners and families.",
  },
}

export function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getPortalSection(slug: string) {
  return portalSections.find((section) => section.slug === slug) ?? {
    slug,
    label: titleFromSlug(slug),
    area: "workspace" as PortalArea,
    purpose: "Section placeholder",
    roles: [],
  }
}