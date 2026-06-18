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
  { slug: "academic-profile", label: "Academic Profile", area: "admin", purpose: "Manage academic years", roles: ["Admin"], group: "Academic Management" },
  { slug: "student-promotion", label: "Student Promotion", area: "admin", purpose: "Promote students between classes", roles: ["Admin"], group: "Academic Management" },

  { slug: "students", label: "Students", area: "admin", purpose: "Manage student master data", roles: ["Admin"], group: "Student Management" },
  { slug: "admissions", label: "Admissions", area: "admin", purpose: "Handle admissions", roles: ["Admin"], group: "Student Management" },
  { slug: "enrollments", label: "Enrollments", area: "admin", purpose: "Manage enrollments", roles: ["Admin"], group: "Student Management" },
  { slug: "student-withdrawal", label: "Student Withdrawal", area: "admin", purpose: "Process withdrawals", roles: ["Admin"], group: "Student Management" },
  { slug: "alumni", label: "Alumni", area: "admin", purpose: "Alumni records", roles: ["Admin"], group: "Student Management" },

  { slug: "charge-types", label: "Charge Types", area: "admin", purpose: "Define charge types", roles: ["Admin"], group: "Fee Configuration" },
  { slug: "fee-structures", label: "Fee Structures", area: "admin", purpose: "Define fee structures", roles: ["Admin"], group: "Fee Configuration" },
  { slug: "discount-types", label: "Discount Types", area: "admin", purpose: "Define discounts", roles: ["Admin"], group: "Fee Configuration" },
  { slug: "fine-types", label: "Fine Types", area: "admin", purpose: "Fine type configuration", roles: ["Admin"], group: "Fee Configuration" },

  { slug: "vehicles", label: "Vehicles", area: "admin", purpose: "Manage vehicles", roles: ["Admin"], group: "Transport Management" },
  { slug: "student-vehicle-assignments", label: "Student Vehicle Assignments", area: "admin", purpose: "Assign vehicles to students", roles: ["Admin"], group: "Transport Management" },

  { slug: "staff", label: "Staff", area: "admin", purpose: "Manage staff", roles: ["Admin"], group: "Staff Management" },
  { slug: "departments", label: "Departments", area: "admin", purpose: "Manage departments", roles: ["Admin"], group: "Staff Management" },
  { slug: "designations", label: "Designations", area: "admin", purpose: "Manage designations", roles: ["Admin"], group: "Staff Management" },

  { slug: "users", label: "Users", area: "admin", purpose: "User accounts", roles: ["Admin"], group: "User Management" },
  { slug: "roles", label: "Roles", area: "admin", purpose: "Role management", roles: ["Admin"], group: "User Management" },
  { slug: "permissions", label: "Permissions", area: "admin", purpose: "Permission sets", roles: ["Admin"], group: "User Management" },

  { slug: "admission-numbers", label: "Admission Numbers", area: "admin", purpose: "Admission numbering", roles: ["Admin"], group: "Numbering Settings" },
  { slug: "receipt-numbers", label: "Receipt Numbers", area: "admin", purpose: "Receipt numbering", roles: ["Admin"], group: "Numbering Settings" },
  { slug: "expense-numbers", label: "Expense Numbers", area: "admin", purpose: "Expense numbering", roles: ["Admin"], group: "Numbering Settings" },
  { slug: "transaction-numbers", label: "Transaction Numbers", area: "admin", purpose: "Transaction numbering", roles: ["Admin"], group: "Numbering Settings" },

  { slug: "audit-logs", label: "Audit Logs", area: "admin", purpose: "System audit logs", roles: ["Admin"], group: "Admin" },

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
  { slug: "dashboard", label: "Dashboard", area: "workspace", purpose: "Quick overview of collections, expenses, and pending fees", roles: ["Admin", "Accountant", "Principal"], group: "Overview" },
  { slug: "academic-year", label: "Academic Year", area: "workspace", purpose: "Manage active academic years", roles: ["Admin"], group: "Academic Setup" },
  { slug: "classes-divisions", label: "Classes & Divisions", area: "workspace", purpose: "Create classes and divisions", roles: ["Admin"], group: "Academic Setup" },
  { slug: "students", label: "Students", area: "workspace", purpose: "Manage student records", roles: ["Office Staff", "Admin"], group: "Academic Setup" },
  { slug: "admissions", label: "Admissions", area: "workspace", purpose: "New admissions and admission charges", roles: ["Office Staff"], group: "Academic Setup" },
  { slug: "staff-management", label: "Staff Management", area: "workspace", purpose: "Manage teachers and staff", roles: ["Admin"], group: "Academic Setup" },
  { slug: "attendance-student", label: "Attendance (Student)", area: "workspace", purpose: "Record student attendance", roles: ["Teachers", "Office Staff"], group: "Academic Setup" },
  { slug: "attendance-staff", label: "Attendance (Staff)", area: "workspace", purpose: "Record staff attendance", roles: ["Admin", "Office Staff"], group: "Academic Setup" },
  { slug: "transport-assignment", label: "Transport Assignment", area: "workspace", purpose: "Assign vehicle and transport fee", roles: ["Admin", "Office Staff"], group: "Academic Setup" },
  { slug: "fee-management", label: "Overview", area: "workspace", purpose: "Overview of fee operations and billing modules", roles: ["Admin", "Accountant", "Office Staff"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/fee-types", label: "Fee Types", area: "workspace", purpose: "Configure term fee and similar charge types", roles: ["Admin"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/fee-structures", label: "Fee Structures", area: "workspace", purpose: "Define fee templates", roles: ["Admin"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/student-charges", label: "Student Charges", area: "workspace", purpose: "Generate and manage charges", roles: ["Admin", "Office Staff"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/discounts", label: "Discounts", area: "workspace", purpose: "Apply sibling and scholarship discounts", roles: ["Admin"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/fine-management", label: "Fine Management", area: "workspace", purpose: "Configure and reverse fines", roles: ["Admin"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/collection", label: "Fee Collection", area: "workspace", purpose: "Collect student payments", roles: ["Accountant", "Office Staff"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/receipts", label: "Receipts", area: "workspace", purpose: "View, print, and reverse receipts", roles: ["Accountant"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/refunds", label: "Refunds", area: "workspace", purpose: "Handle admission cancellation and overpayment refunds", roles: ["Accountant", "Admin"], group: "Finance", subgroup: "Fee Management" },
  { slug: "fee-management/events", label: "Events", area: "workspace", purpose: "Create events and contributions", roles: ["Admin"], group: "Finance", subgroup: "Accounting" },
  { slug: "fee-management/event-collections", label: "Event Collections", area: "workspace", purpose: "Collect event contributions", roles: ["Accountant"], group: "Finance", subgroup: "Accounting" },
  { slug: "fee-management/expenses", label: "Expenses", area: "workspace", purpose: "Record expenses", roles: ["Accountant"], group: "Finance", subgroup: "Accounting" },
  { slug: "fee-management/vendors", label: "Vendors", area: "workspace", purpose: "Manage vendors", roles: ["Accountant"], group: "Finance", subgroup: "Accounting" },
  { slug: "fee-management/accounts", label: "Accounts", area: "workspace", purpose: "Manage income and expense accounts", roles: ["Admin"], group: "Finance", subgroup: "Accounting" },
  { slug: "fee-management/payroll", label: "Payroll", area: "workspace", purpose: "Generate and track salaries", roles: ["Accountant"], group: "Finance", subgroup: "Accounting" },
  { slug: "fee-management/staff-deductions", label: "Staff Deductions", area: "workspace", purpose: "Manage recoveries and deductions", roles: ["Accountant"], group: "Finance", subgroup: "Accounting" },
  { slug: "fee-management/late-fee-reminders", label: "Late Fee Reminders", area: "workspace", purpose: "Send payment reminders", roles: ["Accountant", "Office Staff"], group: "Finance", subgroup: "Fee Management" },
  { slug: "reports", label: "Reports", area: "workspace", purpose: "View reports", roles: ["Admin", "Principal", "Accountant"], group: "Overview" },
  { slug: "audit-logs", label: "Audit Logs", area: "workspace", purpose: "View system activity history", roles: ["Admin"], group: "Overview" },
  { slug: "fine-management/student-fines", label: "Fines", area: "workspace", purpose: "Fine management", roles: ["Admin", "Accountant", "Office Staff"], group: "Finance", subgroup: "Fee Management" },

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

const workspaceRoles = new Set(["ADMIN", "ACCOUNTANT", "PRINCIPAL", "OFFICE STAFF", "TEACHER"])

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