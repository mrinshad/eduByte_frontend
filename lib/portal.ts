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
  { slug: "academic-profile", label: "Academic Setup", area: "admin", purpose: "Manage academic years, classes, and divisions", group: "Academic" },
  { slug: "staff", label: "Staff Directory", area: "admin", purpose: "Manage staff master data", group: "Academic" },

  { slug: "students", label: "Student Directory", area: "admin", purpose: "Manage student master data", group: "Academic" },
  { slug: "admissions", label: "Admissions", area: "admin", purpose: "Handle admissions", group: "Academic" },
  { slug: "promotion", label: "Student Promotion", area: "admin", purpose: "Promote students to next class", group: "Academic" },
  { slug: "relieving", label: "Student Relieving", area: "admin", purpose: "Relieve graduating or exiting students", group: "Academic" },

  { slug: "charge-types", label: "Fee Types", area: "admin", purpose: "Define fee types", group: "Fee Configuration" },
  { slug: "fee-structures", label: "Fee Structures", area: "admin", purpose: "Define fee structures", group: "Fee Configuration" },
  { slug: "fee-structures/bulk-assign", label: "Bulk Assign Fees", area: "admin", purpose: "Bulk assign fee structures to students", group: "Fee Configuration" },
  { slug: "cca", label: "Co-Curricular (CCA)", area: "admin", purpose: "Manage CCA activities and student allocations", group: "Fee Configuration" },
  { slug: "accounts", label: "Accounts", area: "admin", purpose: "Define account types", group: "Fee Configuration" },

  { slug: "vehicles", label: "Transport", area: "admin", purpose: "Manage transport vehicles", group: "Transport Management" },

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

  { slug: "fine-management/student-fines", label: "Student Fines", area: "workspace", purpose: "Fine management", group: "Finance", subgroup: "Fee Management" },

  { slug: "student-charges/student-charges", label: "Fee Ledgers", area: "workspace", purpose: "Show fees owed by students", group: "Finance", subgroup: "Accounting" },
  { slug: "student-charges/generate-charges", label: "Generate Fees", area: "workspace", purpose: "Preview and generate recurring student charges", group: "Finance", subgroup: "Accounting" },

  // --- WORKSPACE REPORTS (REBUILT & EXPANDED) ---
  // A. Executive Overview
  { slug: "reports/academic-year-summary", label: "Academic Year Summary", area: "workspace", purpose: "Executive operational and financial performance overview for academic years", group: "Report", subgroup: "Overview" },
  { slug: "reports/daybook", label: "Consolidated Daybook", area: "workspace", purpose: "Daily chronological register of cash and bank receipts and disbursements", group: "Report", subgroup: "Overview" },

  // B. Receipts (Income)
  { slug: "reports/admissions-master", label: "Admissions Master", area: "workspace", purpose: "Master roster of all student admissions with full details", group: "Report", subgroup: "Receipts (Income)" },
  { slug: "reports/cca-report", label: "CCA Report", area: "workspace", purpose: "Financial P&L and student roster for Co-Curricular activities", group: "Report", subgroup: "Receipts (Income)" },
  { slug: "reports/cca-activity-profit", label: "CCA Activity Profit & Loss", area: "workspace", purpose: "Individual activity profitability with separate income and expense breakdown", group: "Report", subgroup: "Receipts (Income)" },
  { slug: "reports/daily-receipts", label: "Daily Receipts", area: "workspace", purpose: "Consolidated daily receipts register with Cash and Bank split", group: "Report", subgroup: "Receipts (Income)" },
  { slug: "reports/fee-defaulters", label: "Fee Defaulters & Aging", area: "workspace", purpose: "Unpaid dues segmented into aging brackets with parent contacts", group: "Report", subgroup: "Receipts (Income)" },
  { slug: "reports/fines-register", label: "Fines & Penalties Register", area: "workspace", purpose: "Categorical audit of levied, collected, and waived fines", group: "Report", subgroup: "Receipts (Income)" },

  // C. Payments (Expenses)
  { slug: "reports/salary", label: "Salary", area: "workspace", purpose: "Staff payroll, advances, and compensation", group: "Report", subgroup: "Payments (Expenses)" },
  { slug: "reports/transport-expenses", label: "Transportation Expenses", area: "workspace", purpose: "Vehicle operational costs, fuel, and repairs", group: "Report", subgroup: "Payments (Expenses)" },
  { slug: "reports/category-expenses", label: "Expenses by Category", area: "workspace", purpose: "Category & subcategory expense ledger", group: "Report", subgroup: "Payments (Expenses)" },
  { slug: "reports/daily-expenses", label: "Daily Expenses", area: "workspace", purpose: "Consolidated daily outgoing expenses register", group: "Report", subgroup: "Payments (Expenses)" },

  // D. Transportation
  { slug: "reports/transport-roster", label: "Vehicle Route Roster", area: "workspace", purpose: "Fleet seating capacity and student passenger manifests", group: "Report", subgroup: "Transportation" },
  { slug: "reports/transport-profitability", label: "Vehicle Profitability (P&L)", area: "workspace", purpose: "Transport fee collections vs operating costs per vehicle", group: "Report", subgroup: "Transportation" },

  // E. Admissions & Academics

  { slug: "reports/class-demographics", label: "Class Demographics Census", area: "workspace", purpose: "Standard class and division census with gender parity ratio", group: "Report", subgroup: "Admissions & Academics" },
  { slug: "reports/student-progression", label: "Student Progression & TC", area: "workspace", purpose: "Annual promotion flows, retainees, and TC withdrawals", group: "Report", subgroup: "Admissions & Academics" },

  // --- PREVIOUS REPORTS (COMMENTED OUT DURING STEP-BY-STEP REBUILD) ---
  // { slug: "reports/vehicle-wise-report", label: "Transport Financials", area: "workspace", purpose: "expense and income report", group: "Report", subgroup: "Vehicle" },
  // { slug: "reports/vehicle-allocation", label: "Bus Passenger Roster", area: "workspace", purpose: "Shows which students are assigned to each vehicle. Useful for transport management", group: "Report", subgroup: "Vehicle" },
  // { slug: "reports/daily-collection", label: "Daily Collection", area: "workspace", purpose: "View daily collection from different fees and by payment methods", group: "Report", subgroup: "Fee Collection" },
  // { slug: "reports/term-fee-collection-report", label: "Term Collection Report", area: "workspace", purpose: "View term-wise fee collection", group: "Report", subgroup: "Fee Collection" },
  // { slug: "reports/daily-fee-collection", label: "Daily Receipts Register", area: "workspace", purpose: "View daily fee collection", group: "Report", subgroup: "Fee Collection" },
  // { slug: "reports/student-outstanding", label: "Outstanding Fees", area: "workspace", purpose: "View student fees", group: "Report", subgroup: "Fee Collection" },
  // { slug: "reports/categories-by-expense", label: "Expenses by Category", area: "workspace", purpose: "View expenses by category", group: "Report", subgroup: "Expense" },
  // { slug: "reports/expense-summary", label: "Expense Summary", area: "workspace", purpose: "View expenses by chargetype", group: "Report", subgroup: "Expense" },
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

export function permissionForSlug(slug: string, area?: PortalArea): string {
  if (slug === "dashboard") {
    if (area === "admin") return "admindashboard.listOnNavbar"
    if (area === "workspace") return "workspacedashboard.listOnNavbar"
    return "dashboard.listOnNavbar"
  }

  const map: Record<string, string> = {
    "academic-profile": "academics.listOnNavbar",
    "staff": "staff.listOnNavbar",
    "students": "students.listOnNavbar",
    "admissions": "admissions.listOnNavbar",
    "promotion": "students.listOnNavbar",
    "relieving": "students.listOnNavbar",
    "charge-types": "chargetypes.listOnNavbar",
    "fee-structures": "feestructures.listOnNavbar",
    "fee-structures/bulk-assign": "feestructures.listOnNavbar",
    "cca": "cca.listOnNavbar",
    "accounts": "accounts.listOnNavbar",
    "vehicles": "vehicle.listOnNavbar",
    "users": "users.listOnNavbar",
    "roles": "roles.listOnNavbar",
    "permissions": "permissions.listOnNavbar",
    "permission": "permissions.listOnNavbar",
    "fee-management": "feecollection.listOnNavbar",
    "expense-management": "expense.listOnNavbar",
    "fine-management/student-fines": "fine.listOnNavbar",
    "student-charges/student-charges": "studentcharges.listOnNavbar",
    "student-charges/generate-charges": "feegeneration.listOnNavbar",

    // --- ACTIVE REPORT PERMISSIONS ---
    // A. Executive Overview
    "reports/academic-year-summary": "academicyearsummary.listOnNavbar",
    "reports/daybook": "daybook.listOnNavbar",

    // B. Receipts (Income)
    "reports/admissions-master": "admissionsreport.listOnNavbar",
    "reports/cca-report": "ccareport.listOnNavbar",
    "reports/cca-activity-profit": "ccaactivityprofit.listOnNavbar",
    "reports/daily-receipts": "dailyreceipts.listOnNavbar",
    "reports/fee-defaulters": "feedefaulters.listOnNavbar",
    "reports/fines-register": "finesregister.listOnNavbar",
    "reports/fee-type": "feetypecollection.listOnNavbar",

    // C. Payments (Expenses)
    "reports/salary": "salaryreport.listOnNavbar",
    "reports/transport-expenses": "transportexpensereport.listOnNavbar",
    "reports/category-expenses": "expensecategorywise.listOnNavbar",
    "reports/daily-expenses": "dailyexpenses.listOnNavbar",

    // D. Transportation
    "reports/transport-roster": "transportroster.listOnNavbar",
    "reports/transport-profitability": "transportprofitability.listOnNavbar",

    // E. Admissions & Academics
    "reports/class-demographics": "classdemographics.listOnNavbar",
    "reports/student-progression": "studentprogression.listOnNavbar",

    // --- PREVIOUS REPORTS (COMMENTED OUT) ---
    // "reports/vehicle-wise-report": "vehiclefinancialreport.listOnNavbar",
    // "reports/vehicle-allocation": "vehicleallocationreport.listOnNavbar",
    // "reports/daily-collection": "dailycollection.listOnNavbar",
    // "reports/term-fee-collection-report": "feecollectionreport.listOnNavbar",
    // "reports/daily-fee-collection": "dailyfeecollection.listOnNavbar",
    // "reports/student-outstanding": "studentoutstanding.listOnNavbar",
    // "reports/categories-by-expense": "expensecategorywise.listOnNavbar",
    // "reports/expense-summary": "expensesummary.listOnNavbar",
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

  const areaSections = portalSections.filter((s) => s.area === area)
  return areaSections.some((s) => {
    const permKey = permissionForSlug(s.slug, area)
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

export function getInitialUserRoute(
  permissions: string[] = [],
  role?: string | null,
  defaultPortal?: string | null,
  targetArea?: PortalArea
): string | null {
  const area = targetArea || getUserAccessiblePortal(permissions, role, defaultPortal)
  if (!area) return null

  if (area === "student") {
    return "/student/dashboard"
  }

  if (Array.isArray(permissions) && permissions.includes("*")) {
    return `/${area}/dashboard`
  }

  // Check if user has access to the dashboard section of this area
  const dashboardPerm = permissionForSlug("dashboard", area)
  if (checkPermission(permissions, dashboardPerm)) {
    return `/${area}/dashboard`
  }

  // Find the first section in this area that the user HAS permission to access
  const areaSections = portalSections.filter((s) => s.area === area && s.slug !== "dashboard")
  for (const section of areaSections) {
    const permKey = permissionForSlug(section.slug, area)
    if (checkPermission(permissions, permKey)) {
      return `/${area}/${section.slug}`
    }
  }

  return `/${area}/dashboard`
}

export function getAlternateAccessiblePortal(
  currentArea: PortalArea,
  permissions: string[] = [],
  role?: string | null
): PortalArea | null {
  const checkOrder: PortalArea[] =
    currentArea === "workspace"
      ? ["admin", "student"]
      : currentArea === "admin"
        ? ["workspace", "student"]
        : ["workspace", "admin"]

  for (const altArea of checkOrder) {
    if (canAccessPortalArea(altArea, permissions, role)) {
      return altArea
    }
  }

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
  const areaSections = portalSections.filter((s) => s.area === area)
  const requiredKeys = areaSections.map((s) => permissionForSlug(s.slug, area))
  return Array.from(new Set(requiredKeys))
}

export function getPermissionPortal(permName: string): "ADMIN" | "WORKSPACE" | "STUDENT" | "GLOBAL" {
  if (!permName) return "ADMIN"
  if (permName === "*") return "GLOBAL"

  const lower = permName.toLowerCase()

  const workspaceDomains = [
    "academicyearsummary",
    "feecollection",
    "expense",
    "fine",
    "studentcharges",
    "feegeneration",
    "admissionsreport",
    "dailyreceipts",
    "feetype",
    "salaryreport",
    "transportexpensereport",
    "dailyexpenses",
    "dailycollection",
    "studentoutstanding",
    "expensesummary",
    "vehiclefinancialreport",
    "vehicleallocationreport",
    "dailyfeecollection",
    "feecollectionreport",
    "expensecategorywise",
    "ccareport",
    "ccaactivityprofit",
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
  const section = parts[0].toLowerCase()

  const requiredNavbarPerm = (section === "permission" || section === "permissions")
    ? "roles.listOnNavbar"
    : `${parts[0]}.listOnNavbar`

  if (!rolePermissions.some((p) => p.toLowerCase() === requiredNavbarPerm.toLowerCase())) {
    return requiredNavbarPerm
  }

  return null
}

export function getRequiredPermissionForPath(
  pathname: string,
  area: PortalArea
): { permKey: string; sectionLabel: string } | null {
  if (!pathname || area === "student") return null

  const prefix = `/${area}/`
  if (!pathname.startsWith(prefix)) return null

  const relativePath = pathname.slice(prefix.length).split("?")[0].replace(/\/+$/, "")
  if (!relativePath || relativePath === "dashboard") {
    const permKey = permissionForSlug("dashboard", area)
    return {
      permKey,
      sectionLabel: "Dashboard",
    }
  }

  const areaSections = portalSections.filter((s) => s.area === area)

  let matchedSection = areaSections.find((s) => s.slug === relativePath)

  if (!matchedSection) {
    matchedSection = areaSections.find(
      (s) => s.slug !== "dashboard" && (relativePath.startsWith(`${s.slug}/`) || relativePath === s.slug)
    )
  }

  if (!matchedSection) {
    const firstSegment = relativePath.split("/")[0]
    matchedSection = areaSections.find(
      (s) => s.slug !== "dashboard" && s.slug.split("/")[0] === firstSegment
    )
  }

  if (!matchedSection) return null

  const permKey = permissionForSlug(matchedSection.slug, area)
  return {
    permKey,
    sectionLabel: matchedSection.label,
  }
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