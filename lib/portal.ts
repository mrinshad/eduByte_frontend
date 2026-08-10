import { checkPermission } from "@/hooks/usePermission"

export type PortalArea = "workspace" | "admin" | "student"

export type PortalSection = {
  slug: string
  label: string
  area: PortalArea
  purpose: string
  group: string
  subgroup?: string
}

export type PortalNavItem = {
  slug: string
  href: string
  label: string
  purpose: string
  group: string
  subgroup?: string
}

export type PortalNavGroup = {
  label: string
  items: PortalNavItem[]
}

export const portalSections: PortalSection[] = [
  // --- ADMIN AREA ---
  { slug: "dashboard", label: "Dashboard", area: "admin", purpose: "Admin dashboard", group: "Admin" },
  { slug: "academic-profile", label: "Academics", area: "admin", purpose: "Manage academic years", group: "Academic" },
  { slug: "staff", label: "Staff", area: "admin", purpose: "Manage student master data", group: "Academic" },

  { slug: "students", label: "Students", area: "admin", purpose: "Manage student master data", group: "Academic" },
  { slug: "admissions", label: "Admissions", area: "admin", purpose: "Handle admissions", group: "Academic" },

  { slug: "charge-types", label: "Charge Types", area: "admin", purpose: "Define charge types", group: "Fee Configuration" },
  { slug: "fee-structures", label: "Fee Structures", area: "admin", purpose: "Define fee structures", group: "Fee Configuration" },
  { slug: "accounts", label: "Accounts", area: "admin", purpose: "Define account types", group: "Fee Configuration" },

  { slug: "vehicles", label: "Vehicles", area: "admin", purpose: "Manage vehicles", group: "Transport Management" },

  { slug: "users", label: "Users", area: "admin", purpose: "User accounts", group: "User Management" },
  { slug: "roles", label: "Roles & Permissions", area: "admin", purpose: "Role management", group: "User Management" },

  // --- STUDENT AREA ---
  { slug: "dashboard", label: "Dashboard", area: "student", purpose: "Student dashboard", group: "Student" },
  { slug: "profile/personal-details", label: "Personal Details", area: "student", purpose: "Student personal info", group: "Profile" },
  { slug: "profile/parent-details", label: "Parent Details", area: "student", purpose: "Parent contact info", group: "Profile" },
  { slug: "profile/academic-details", label: "Academic Details", area: "student", purpose: "Student academic info", group: "Profile" },

  { slug: "academic-history/academic-years", label: "Academic Years", area: "student", purpose: "Academic history years", group: "Academic History" },
  { slug: "academic-history/classes", label: "Classes", area: "student", purpose: "Academic history classes", group: "Academic History" },
  { slug: "academic-history/divisions", label: "Divisions", area: "student", purpose: "Academic history divisions", group: "Academic History" },

  { slug: "fees/current-charges", label: "Current Charges", area: "student", purpose: "Current fee charges", group: "Fees" },
  { slug: "fees/outstanding-fees", label: "Outstanding Fees", area: "student", purpose: "Outstanding fee summary", group: "Fees" },
  { slug: "fees/fine-details", label: "Fine Details", area: "student", purpose: "Fine information", group: "Fees" },
  { slug: "fees/payment-history", label: "Payment History", area: "student", purpose: "Payment history", group: "Fees" },
  { slug: "fees/receipts", label: "Receipts", area: "student", purpose: "Receipts", group: "Fees" },
  { slug: "fees/refund-history", label: "Refund History", area: "student", purpose: "Refunds", group: "Fees" },

  { slug: "transport/assigned-vehicle", label: "Assigned Vehicle", area: "student", purpose: "Transport assignment", group: "Transport" },
  { slug: "transport/transport-fee-details", label: "Transport Fee Details", area: "student", purpose: "Transport fees", group: "Transport" },

  { slug: "notifications/fee-reminders", label: "Fee Reminders", area: "student", purpose: "Fee reminders", group: "Notifications" },

  // --- WORKSPACE AREA ---
  { slug: "dashboard", label: "Dashboard", area: "workspace", purpose: "Quick overview of collections, expenses, and pending fees", group: "Overview" },

  { slug: "fee-management", label: "Fee Collection", area: "workspace", purpose: "Collect student payments", group: "Finance", subgroup: "Fee Management" },
  { slug: "expense-management", label: "Expenses", area: "workspace", purpose: "Record expenses", group: "Finance", subgroup: "Accounting" },

  { slug: "fine-management/student-fines", label: "Fines", area: "workspace", purpose: "Fine management", group: "Finance", subgroup: "Fee Management" },

  { slug: "student-charges/student-charges", label: "Student Charge", area: "workspace", purpose: "Show fees owed by students", group: "Finance", subgroup: "Accounting" },
  { slug: "student-charges/generate-charges", label: "Fee Generation", area: "workspace", purpose: "Preview and generate recurring student charges", group: "Finance", subgroup: "Accounting" },

  // Reports
  { slug: "reports/vehicle-wise-report", label: "Vehicle Financial Report", area: "workspace", purpose: "expense and income report", group: "Report", subgroup: "Vehicle" },
  { slug: "reports/vehicle-allocation", label: "Vehicle Allocation Report", area: "workspace", purpose: "Shows which students are assigned to each vehicle. Useful for transport management", group: "Report", subgroup: "Vehicle" },

  { slug: "reports/daily-collection", label: "Daily Collection", area: "workspace", purpose: "View daily collection from different fees and by payment methods", group: "Report", subgroup: "Fee Collection" },
  { slug: "reports/term-fee-collection-report", label: "Term Fee Collection Report", area: "workspace", purpose: "View term-wise fee collection", group: "Report", subgroup: "Fee Collection" },
  { slug: "reports/daily-fee-collection", label: "Daily Fee Collection", area: "workspace", purpose: "View daily fee collection", group: "Report", subgroup: "Fee Collection" },

  { slug: "reports/student-outstanding", label: "Student Outstanding", area: "workspace", purpose: "View student fees", group: "Report", subgroup: "Fee Collection" },

  { slug: "reports/categories-by-expense", label: "Category wise ", area: "workspace", purpose: "View expenses by category", group: "Report", subgroup: "Expense" },
  { slug: "reports/expense-summary", label: "Summary", area: "workspace", purpose: "View expenses by chargetype", group: "Report", subgroup: "Expense" },
]

export const portalAreas: Record<PortalArea, { title: string; subtitle: string }> = {
  workspace: {
    title: "Operations Workspace",
    subtitle: "",
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

export function normalizeRole(role?: string | null) {
  return (role || "").replace(/\s+/g, " ").trim().toUpperCase()
}

export function permissionForSlug(slug: string): string {
  const map: Record<string, string> = {
    "academic-profile": "academics.listOnNavbar",
    "staff": "staff.listOnNavbar",
    "students": "students.listOnNavbar",
    "admissions": "admissions.listOnNavbar",
    "charge-types": "chargetypes.listOnNavbar",
    "fee-structures": "feestuctures.listOnNavbar",
    "accounts": "accounts.listOnNavbar",
    "vehicles": "vehicle.listOnNavbar",
    "fee-management": "feecollection.listOnNavbar",
    "expense-management": "expense.listOnNavbar",
    "fine-management/student-fines": "fine.listOnNavbar",
    "student-charges/student-charges": "studentcharges.listOnNavbar",
    "student-charges/generate-charges": "feegeneration.listOnNavbar",
    "reports/vehicle-wise-report": "vehiclefinancialreport.listOnNavbar",
    "reports/vehicle-allocation": "vehicleallocationreport.listOnNavbar",
    "reports/daily-collection": "dailycollection.listOnNavbar",
    "reports/term-fee-collection-report": "feecollectionreport.listOnNavbar",
    "reports/daily-fee-collection": "dailyfeecollection.listOnNavbar",
    "reports/student-outstanding": "studentoutstanding.listOnNavbar",
    "reports/categories-by-expense": "expensecategorywise.listOnNavbar",
    "reports/expense-summary": "expensesummary.listOnNavbar",
  }
  return map[slug] || `${slug.split("/")[0].replace(/-/g, "")}.listOnNavbar`
}

export function getPortalRoute(defaultPortal?: string | null) {
  const normalized = (defaultPortal || "").toLowerCase()

  if (normalized === "student") {
    return "/student/dashboard"
  }

  if (normalized === "admin") {
    return "/admin/dashboard"
  }

  return "/workspace/dashboard"
}

export function canAccessPortalArea(area: PortalArea, permissions: string[] = [], role?: string | null) {
  if (Array.isArray(permissions) && permissions.includes("*")) {
    return true
  }

  const normalizedRole = normalizeRole(role)
  if (area === "student") {
    return normalizedRole === "STUDENT"
  }

  const areaSections = portalSections.filter((s) => s.area === area && s.slug !== "dashboard")
  return areaSections.some((s) => {
    const permKey = permissionForSlug(s.slug)
    return checkPermission(permissions, permKey)
  })
}

export function getUserAccessiblePortal(
  permissions: string[] = [],
  role?: string | null,
  defaultPortal?: string | null
): PortalArea | null {
  const preferred = (defaultPortal || "").toLowerCase() as PortalArea
  if (preferred && ["admin", "workspace", "student"].includes(preferred) && canAccessPortalArea(preferred, permissions, role)) {
    return preferred
  }
  if (canAccessPortalArea("workspace", permissions, role)) return "workspace"
  if (canAccessPortalArea("admin", permissions, role)) return "admin"
  if (canAccessPortalArea("student", permissions, role)) return "student"
  return null
}

export function canSwitchPortals(permissions: string[] = [], role?: string | null): boolean {
  return canAccessPortalArea("admin", permissions, role) && canAccessPortalArea("workspace", permissions, role)
}

export function getUserPortalAccessSummary(permissions: string[] = [], role?: string | null) {
  const canAdmin = canAccessPortalArea("admin", permissions, role)
  const canWorkspace = canAccessPortalArea("workspace", permissions, role)
  const canStudent = canAccessPortalArea("student", permissions, role)
  const canSwitch = canSwitchPortals(permissions, role)

  let type: "BOTH" | "ADMIN_ONLY" | "WORKSPACE_ONLY" | "STUDENT_ONLY" | "NONE" = "NONE"
  if (canAdmin && canWorkspace) type = "BOTH"
  else if (canAdmin) type = "ADMIN_ONLY"
  else if (canWorkspace) type = "WORKSPACE_ONLY"
  else if (canStudent) type = "STUDENT_ONLY"

  return {
    type,
    canAdmin,
    canWorkspace,
    canStudent,
    canSwitch,
    totalPermissions: permissions.length,
  }
}

export function getRequiredPermissionsForArea(area: PortalArea): string[] {
  if (area === "student") {
    return ["STUDENT role", "*"]
  }
  const areaSections = portalSections.filter((s) => s.area === area && s.slug !== "dashboard")
  const requiredKeys = areaSections.map((s) => permissionForSlug(s.slug))
  return Array.from(new Set(requiredKeys))
}

export function getPermissionPortal(permName: string): "ADMIN" | "WORKSPACE" | "STUDENT" | "GLOBAL" {
  if (!permName) return "ADMIN"
  if (permName === "*") return "GLOBAL"

  const lower = permName.toLowerCase()

  const workspaceDomains = [
    "feecollection",
    "expense",
    "fine",
    "studentcharges",
    "feegeneration",
    "dailycollection",
    "studentoutstanding",
    "expensesummary",
    "vehiclefinancialreport",
    "vehicleallocationreport",
    "dailyfeecollection",
    "feecollectionreport",
    "expensecategorywise",
  ]

  if (workspaceDomains.some((d) => lower.startsWith(d))) {
    return "WORKSPACE"
  }

  if (lower.startsWith("student.")) {
    return "STUDENT"
  }

  return "ADMIN"
}

export function hasOrphanedActionPermissions(
  area: PortalArea,
  permissions: string[] = [],
  role?: string | null
): boolean {
  if (!Array.isArray(permissions) || permissions.length === 0) return false
  if (canAccessPortalArea(area, permissions, role)) return false

  return permissions.some((perm) => getPermissionPortal(perm) === area.toUpperCase())
}

export function isNavbarPermission(permName: string): boolean {
  if (!permName) return false
  return permName === "*" || permName.toLowerCase().endsWith(".listonnavbar")
}

export function getMissingNavbarPermissionFor(permName: string, rolePermissions: string[] = []): string | null {
  if (!permName || isNavbarPermission(permName)) return null
  if (rolePermissions.includes("*")) return null

  const parts = permName.split(".")
  if (parts.length < 2) return null
  const section = parts[0]
  const requiredNavbarPerm = `${section}.listOnNavbar`

  if (!rolePermissions.some((p) => p.toLowerCase() === requiredNavbarPerm.toLowerCase())) {
    return requiredNavbarPerm
  }

  return null
}

export function getPortalNavItems(area: PortalArea) {
  return portalSections
    .filter((section) => section.area === area)
    .map((section) => ({
      slug: section.slug,
      href: section.slug === "dashboard" ? `/${area}/dashboard` : `/${area}/${section.slug}`,
      label: section.label,
      purpose: section.purpose,
      group: section.group,
      subgroup: section.subgroup,
    }))
}

export function getPortalNavGroups(area: PortalArea): PortalNavGroup[] {
  const groupedItems = getPortalNavItems(area).reduce<Record<string, PortalNavItem[]>>((accumulator, item) => {
    if (!accumulator[item.group]) {
      accumulator[item.group] = []
    }

    accumulator[item.group].push(item)
    return accumulator
  }, {})

  return Object.entries(groupedItems).map(([label, items]) => ({ label, items }))
}

export function titleFromSlug(slug: string) {
  return slug
    .split("/")
    .map((segment) =>
      segment
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    )
    .join(" / ")
}

export function getPortalSection(slug: string) {
  return portalSections.find((section) => section.slug === slug) ?? {
    slug,
    label: titleFromSlug(slug),
    area: "workspace" as PortalArea,
    purpose: "Section placeholder",
  }
}