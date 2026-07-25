export type PortalArea = "workspace" | "admin" | "student"

export type PortalSection = {
  slug: string
  label: string
  area: PortalArea
  purpose: string
  roles: string[]
  group: string
  subgroup?: string
}

export type PortalNavItem = {
  slug: string
  href: string
  label: string
  purpose: string
  roles: string[]
  group: string
  subgroup?: string
}

export type PortalNavGroup = {
  label: string
  items: PortalNavItem[]
}

export const portalSections: PortalSection[] = [
  // --- ADMIN AREA ---
  { slug: "dashboard", label: "Dashboard", area: "admin", purpose: "Admin dashboard", roles: ["Admin"], group: "Admin" },
  { slug: "academic-profile", label: "Academics", area: "admin", purpose: "Manage academic years", roles: ["Admin"], group: "Academic" },
  { slug: "staff", label: "Staff", area: "admin", purpose: "Manage student master data", roles: ["Admin"], group: "Academic" },

  { slug: "students", label: "Students", area: "admin", purpose: "Manage student master data", roles: ["Admin"], group: "Academic" },
  { slug: "admissions", label: "Admissions", area: "admin", purpose: "Handle admissions", roles: ["Admin"], group: "Academic" },

  { slug: "charge-types", label: "Charge Types", area: "admin", purpose: "Define charge types", roles: ["Admin"], group: "Fee Configuration" },
  { slug: "fee-structures", label: "Fee Structures", area: "admin", purpose: "Define fee structures", roles: ["Admin"], group: "Fee Configuration" },
  { slug: "payment-account", label: "Accounts", area: "admin", purpose: "Define account types", roles: ["Admin"], group: "Fee Configuration" },

  { slug: "vehicles", label: "Vehicles", area: "admin", purpose: "Manage vehicles", roles: ["Admin"], group: "Transport Management" },
  
  // { slug: "staff", label: "Staff", area: "admin", purpose: "Manage staff", roles: ["Admin"], group: "Staff Management" },
  // { slug: "departments", label: "Departments", area: "admin", purpose: "Manage departments", roles: ["Admin"], group: "Staff Management" },
  // { slug: "designations", label: "Designations", area: "admin", purpose: "Manage designations", roles: ["Admin"], group: "Staff Management" },

  // { slug: "users", label: "Users", area: "admin", purpose: "User accounts", roles: ["Admin"], group: "User Management" },
  // { slug: "roles", label: "Roles", area: "admin", purpose: "Role management", roles: ["Admin"], group: "User Management" },
  // { slug: "permissions", label: "Permissions", area: "admin", purpose: "Permission sets", roles: ["Admin"], group: "User Management" },

  // { slug: "admission-numbers", label: "Admission Nos.", area: "admin", purpose: "Admission numbering", roles: ["Admin"], group: "Numbering" },
  // { slug: "receipt-numbers", label: "Receipt Nos.", area: "admin", purpose: "Receipt numbering", roles: ["Admin"], group: "Numbering" },
  // { slug: "expense-numbers", label: "Expense Nos.", area: "admin", purpose: "Expense numbering", roles: ["Admin"], group: "Numbering" },
  // { slug: "transaction-numbers", label: "Transaction Nos.", area: "admin", purpose: "Transaction numbering", roles: ["Admin"], group: "Numbering" },

  // --- STUDENT AREA ---
  { slug: "dashboard", label: "Dashboard", area: "student", purpose: "Student dashboard", roles: ["Student"], group: "Student" },
  { slug: "profile/personal-details", label: "Personal Details", area: "student", purpose: "Student personal info", roles: ["Student"], group: "Profile" },
  { slug: "profile/parent-details", label: "Parent Details", area: "student", purpose: "Parent contact info", roles: ["Student"], group: "Profile" },
  { slug: "profile/academic-details", label: "Academic Details", area: "student", purpose: "Student academic info", roles: ["Student"], group: "Profile" },

  { slug: "academic-history/academic-years", label: "Academic Years", area: "student", purpose: "Academic history years", roles: ["Student"], group: "Academic History" },
  { slug: "academic-history/classes", label: "Classes", area: "student", purpose: "Academic history classes", roles: ["Student"], group: "Academic History" },
  { slug: "academic-history/divisions", label: "Divisions", area: "student", purpose: "Academic history divisions", roles: ["Student"], group: "Academic History" },

  { slug: "fees/current-charges", label: "Current Charges", area: "student", purpose: "Current fee charges", roles: ["Student"], group: "Fees" },
  { slug: "fees/outstanding-fees", label: "Outstanding Fees", area: "student", purpose: "Outstanding fee summary", roles: ["Student"], group: "Fees" },
  { slug: "fees/fine-details", label: "Fine Details", area: "student", purpose: "Fine information", roles: ["Student"], group: "Fees" },
  { slug: "fees/payment-history", label: "Payment History", area: "student", purpose: "Payment history", roles: ["Student"], group: "Fees" },
  { slug: "fees/receipts", label: "Receipts", area: "student", purpose: "Receipts", roles: ["Student"], group: "Fees" },
  { slug: "fees/refund-history", label: "Refund History", area: "student", purpose: "Refunds", roles: ["Student"], group: "Fees" },
  
  { slug: "transport/assigned-vehicle", label: "Assigned Vehicle", area: "student", purpose: "Transport assignment", roles: ["Student"], group: "Transport" },
  { slug: "transport/transport-fee-details", label: "Transport Fee Details", area: "student", purpose: "Transport fees", roles: ["Student"], group: "Transport" },
  
  { slug: "notifications/fee-reminders", label: "Fee Reminders", area: "student", purpose: "Fee reminders", roles: ["Student"], group: "Notifications" },
  
  // --- WORKSPACE AREA ---
  { slug: "dashboard", label: "Dashboard", area: "workspace", purpose: "Quick overview of collections, expenses, and pending fees", roles: ["Admin", "Accountant", "Principal"], group: "Overview" },
  { slug: "students", label: "Students", area: "workspace", purpose: "Manage student records", roles: ["Office Staff", "Admin"], group: "Academic Setup" },
  
  { slug: "fee-management", label: "Fee Collection", area: "workspace", purpose: "Collect student payments", roles: ["Accountant", "Office Staff"], group: "Finance", subgroup: "Fee Management" },
  { slug: "expense-management", label: "Expenses", area: "workspace", purpose: "Record expenses", roles: ["Accountant"], group: "Finance", subgroup: "Accounting" },

  { slug: "fine-management/student-fines", label: "Fines", area: "workspace", purpose: "Fine management", roles: ["Admin", "Accountant", "Office Staff"], group: "Finance", subgroup: "Fee Management" },
  
  { slug: "student-charges/student-charges", label: "Student Charge", area: "workspace", purpose: "Show fees owed by students", roles: ["Accountant"], group: "Finance", subgroup: "Accounting" },
  { slug: "student-charges/generate-charges", label: "Fee Generation", area: "workspace", purpose: "Preview and generate recurring student charges", roles: ["Admin", "Accountant"], group: "Finance", subgroup: "Accounting" },
  
  //reports
  { slug: "reports/vehicle-wise-report", label: "Vehicle Financial Report", area: "workspace", purpose: "expense and income report", roles: ["Accountant", "Admin"], group: "Report", subgroup: "Vehicle" },
  { slug: "reports/vehicle-allocation", label: "Vehicle Allocation Report", area: "workspace", purpose: "Shows which students are assigned to each vehicle. Useful for transport management", roles: ["Accountant", "Admin"], group: "Report", subgroup: "Vehicle" },
  
  
  { slug: "reports/daily-collection", label: "Daily Collection", area: "workspace", purpose: "View daily collection from different fees and by payment methods", roles: ["Accountant", "Admin"], group: "Report", subgroup: "Fee Collection" },
  { slug: "reports/daily-fee-collection", label: "Daily Fee Collection", area: "workspace", purpose: "View daily fee collection", roles: ["Accountant", "Admin"], group: "Report", subgroup: "Fee Collection" },
  
  { slug: "reports/student-outstanding", label: "Student Outstanding", area: "workspace", purpose: "View student fees", roles: ["Accountant", "Admin"], group: "Report", subgroup: "Fee Collection" },
  
  
  { slug: "reports/categories-by-expense", label: "Category wise ", area: "workspace", purpose: "View expenses by category", roles: ["Accountant", "Admin"], group: "Report", subgroup: "Expense" },
  { slug: "reports/expense-summary", label: "Summary", area: "workspace", purpose: "View expenses by chargetype", roles: ["Accountant", "Admin"], group: "Report", subgroup: "Expense" },
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

const workspaceRoles = new Set(["ACCOUNTANT", "PRINCIPAL", "OFFICE STAFF", "TEACHER"])

export function normalizeRole(role?: string | null) {
  return (role || "").replace(/\s+/g, " ").trim().toUpperCase()
}

export function getPortalRoute(role?: string | null) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === "STUDENT") {
    return "/student/dashboard"
  }

  if (normalizedRole === "ADMIN") {
    return "/admin/dashboard"
  }

  return "/workspace/dashboard"
}

export function canAccessPortalArea(area: PortalArea, role?: string | null) {
  const normalizedRole = normalizeRole(role)

  if (area === "admin") {
    return normalizedRole === "ADMIN"
  }

  if (area === "student") {
    return normalizedRole === "STUDENT"
  }

  return workspaceRoles.has(normalizedRole)
}

export function getPortalNavItems(area: PortalArea, role?: string | null) {
  const normalizedRole = normalizeRole(role)

  return portalSections
    .filter((section) => section.area === area)
    .filter((section) => {
      if (!normalizedRole) {
        return true
      }

      const allowedRoles = section.roles.map((item) => normalizeRole(item))

      return allowedRoles.length === 0 || allowedRoles.includes(normalizedRole)
    })
    .map((section) => ({
      slug: section.slug,
      href: section.slug === "dashboard" ? `/${area}/dashboard` : `/${area}/${section.slug}`,
      label: section.label,
      purpose: section.purpose,
      roles: section.roles,
      group: section.group,
      subgroup: section.subgroup,
    }))
}

export function getPortalNavGroups(area: PortalArea, role?: string | null): PortalNavGroup[] {
  const groupedItems = getPortalNavItems(area, role).reduce<Record<string, PortalNavItem[]>>((accumulator, item) => {
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
    roles: [],
  }
}