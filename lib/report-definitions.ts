/**
 * Centralized Report Definitions & Metadata
 * 
 * Single source of truth for all user-facing report titles, subtitles,
 * categories, badges, permission mappings, and search keywords.
 * 
 * Reused by:
 * - `frontend/lib/portal.ts` (portal navigation & search index)
 * - `frontend/components/sidebar.tsx` (navigation grouping & icons)
 * - `frontend/app/workspace/reports/*` (page headings, subtitles & badges)
 */

export type ReportCategory =
  | "Overview & Accounts"
  | "Student Fees"
  | "Expenses & Payroll"
  | "Transport & Fleet"
  | "Students & Admissions";

export interface ReportConfig {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ReportCategory;
  badge?: string;
  badgeText?: string;
  searchKeywords: string[];
  permissionKey: string;
}

export const REPORT_CONFIGS: Record<string, ReportConfig> = {
  "academic-year-summary": {
    id: "academic-year-summary",
    slug: "reports/academic-year-summary",
    title: "Annual School Overview",
    subtitle: "High-level summary of total income, expenses, and enrollment for the year.",
    category: "Overview & Accounts",
    badge: "Academic Year",
    searchKeywords: ["academic year summary", "operational overview", "kpis", "financial summary", "annual report"],
    permissionKey: "academicyearsummary.listOnNavbar",
  },
  daybook: {
    id: "daybook",
    slug: "reports/daybook",
    title: "Daily Cash & Bank Daybook",
    subtitle: "Day-to-day chronological record of all money received and paid out.",
    category: "Overview & Accounts",
    badge: "Date Range",
    searchKeywords: ["daybook", "daily cashbook", "transactions", "daily register", "cash and bank"],
    permissionKey: "daybook.listOnNavbar",
  },
  "revolving-fund": {
    id: "revolving-fund",
    slug: "reports/revolving-fund",
    title: "Petty Cash & Revolving Fund",
    subtitle: "Day-to-day cash fund for minor school expenses, fuel, and staff advances.",
    category: "Overview & Accounts",
    badge: "Date Range",
    searchKeywords: ["revolving fund", "petty cash", "cash in hand", "internal transfers", "advance payouts"],
    permissionKey: "revolvingfund.listOnNavbar",
  },
  "asset-performance": {
    id: "asset-performance",
    slug: "reports/asset-performance",
    title: "School Assets & Maintenance",
    subtitle: "Record of school vehicles, buildings, and property along with repair and service costs.",
    category: "Overview & Accounts",
    badge: "Academic Year",
    searchKeywords: ["asset performance", "fixed assets", "fleet catalog", "depreciation", "maintenance expense", "vehicles"],
    permissionKey: "assetperformance.listOnNavbar",
  },
  "daily-receipts": {
    id: "daily-receipts",
    slug: "reports/daily-receipts",
    title: "Daily Fee Receipts",
    subtitle: "Chronological list of fee payments received with Cash and Bank split.",
    category: "Student Fees",
    badge: "Date Range",
    searchKeywords: ["daily receipts", "collections register", "income", "fee transactions", "receipts"],
    permissionKey: "dailyreceipts.listOnNavbar",
  },
  "fee-type": {
    id: "fee-type",
    slug: "reports/fee-type",
    title: "Fees by Type",
    subtitle: "Receipts breakdown and collection summary across student fee categories.",
    category: "Student Fees",
    badge: "Date Range",
    searchKeywords: ["fee collection by type", "charge types", "tuition breakdown", "collection summary", "fees by type"],
    permissionKey: "feetypecollection.listOnNavbar",
  },
  "fee-defaulters": {
    id: "fee-defaulters",
    slug: "reports/fee-defaulters",
    title: "Unpaid Fee Defaulters",
    subtitle: "Students with overdue balances, days overdue, and parent phone numbers.",
    category: "Student Fees",
    badge: "Live Dues",
    searchKeywords: ["fee defaulters", "unpaid dues", "aging report", "pending fees", "arrears"],
    permissionKey: "feedefaulters.listOnNavbar",
  },
  "fines-register": {
    id: "fines-register",
    slug: "reports/fines-register",
    title: "Fines & Late Fees",
    subtitle: "Penalties charged, collected, and waived across all students.",
    category: "Student Fees",
    badge: "Academic Year",
    searchKeywords: ["fines register", "penalties report", "waived fines audit", "late fees"],
    permissionKey: "finesregister.listOnNavbar",
  },
  "cca-report": {
    id: "cca-report",
    slug: "reports/cca-report",
    title: "Club & Activity Fees",
    subtitle: "Student enrollments and fee payments for clubs and sports.",
    category: "Student Fees",
    badge: "Academic Year",
    searchKeywords: ["cca report", "co-curricular report", "activity roster", "club fees"],
    permissionKey: "ccareport.listOnNavbar",
  },
  "cca-activity-profit": {
    id: "cca-activity-profit",
    slug: "reports/cca-activity-profit",
    title: "Club Profit & Loss",
    subtitle: "Income earned vs coach & equipment expenses for each club activity.",
    category: "Student Fees",
    badge: "Academic Year",
    searchKeywords: ["cca profit", "p&l", "activity financial breakdown", "club profit"],
    permissionKey: "ccaactivityprofit.listOnNavbar",
  },
  salary: {
    id: "salary",
    slug: "reports/salary",
    title: "Staff Salaries",
    subtitle: "Monthly staff payroll disbursements and advance deductions.",
    category: "Expenses & Payroll",
    badge: "Monthly",
    searchKeywords: ["salary report", "payroll", "staff compensation", "wages", "salary disbursements"],
    permissionKey: "salaryreport.listOnNavbar",
  },
  "daily-expenses": {
    id: "daily-expenses",
    slug: "reports/daily-expenses",
    title: "Daily Expenses",
    subtitle: "Day-to-day outgoing expense vouchers and disbursements.",
    category: "Expenses & Payroll",
    badge: "Date Range",
    searchKeywords: ["daily expenses", "outgoing register", "disbursements", "expense summary"],
    permissionKey: "dailyexpenses.listOnNavbar",
  },
  "category-expenses": {
    id: "category-expenses",
    slug: "reports/category-expenses",
    title: "Expenses by Category",
    subtitle: "Spending breakdown across categories (Fuel, Utilities, Supplies, etc.).",
    category: "Expenses & Payroll",
    badge: "Date Range",
    searchKeywords: ["category expenses", "expense breakdown", "spending by category"],
    permissionKey: "expensecategorywise.listOnNavbar",
  },
  "transport-expenses": {
    id: "transport-expenses",
    slug: "reports/transport-expenses",
    title: "Vehicle Operating Expenses",
    subtitle: "Fuel, repairs, insurance, and maintenance costs per vehicle.",
    category: "Expenses & Payroll",
    badge: "Date Range",
    searchKeywords: ["transport expenses", "fuel", "vehicle maintenance", "repairs", "bus expense"],
    permissionKey: "transportexpensereport.listOnNavbar",
  },
  "transport-profitability": {
    id: "transport-profitability",
    slug: "reports/transport-profitability",
    title: "Vehicle Earnings & Expenses",
    subtitle: "Lifetime summary of transport fees collected, fuel & maintenance spent, and purchase cost recovery for each vehicle.",
    category: "Transport & Fleet",
    badge: "Lifetime",
    searchKeywords: ["transport profitability", "vehicle p&l", "route margins", "fleet roi", "vehicle earnings"],
    permissionKey: "transportprofitability.listOnNavbar",
  },
  "transport-roster": {
    id: "transport-roster",
    slug: "reports/transport-roster",
    title: "Vehicle Routes & Passenger List",
    subtitle: "Assigned vehicles (buses & vans), drivers, student passengers, and pickup routes.",
    category: "Transport & Fleet",
    searchKeywords: ["route roster", "bus passengers", "manifest", "seating capacity", "vehicle routes"],
    permissionKey: "transportroster.listOnNavbar",
  },
  "admissions-master": {
    id: "admissions-master",
    slug: "reports/admissions-master",
    title: "Student Admissions List",
    subtitle: "Complete roster of all newly admitted and enrolled students.",
    category: "Students & Admissions",
    badge: "Academic Year",
    searchKeywords: ["admissions master", "student roster report", "intake report", "new admissions"],
    permissionKey: "admissionsreport.listOnNavbar",
  },
  "class-demographics": {
    id: "class-demographics",
    slug: "reports/class-demographics",
    title: "Class Demographics Census",
    subtitle: "Class-wise and section-wise student strength and boy/girl count.",
    category: "Students & Admissions",
    badge: "Current Roster",
    searchKeywords: ["class demographics", "gender distribution", "student headcount", "enrollment stats"],
    permissionKey: "classdemographics.listOnNavbar",
  },
  "student-progression": {
    id: "student-progression",
    slug: "reports/student-progression",
    title: "Student Promotion & Progression",
    subtitle: "Annual promotion flows, retainees, and TC withdrawals.",
    category: "Students & Admissions",
    badge: "Annual Flow",
    searchKeywords: ["student progression", "promotion history", "pass rate", "year over year transition"],
    permissionKey: "studentprogression.listOnNavbar",
  },
};

/**
 * Helper to retrieve a report configuration by its route slug or short id.
 */
export function getReportConfig(idOrSlug: string): ReportConfig {
  const cleanId = idOrSlug.replace(/^\/?(workspace\/)?reports\//, "");
  if (REPORT_CONFIGS[cleanId]) {
    const config = REPORT_CONFIGS[cleanId];
    return {
      ...config,
      badgeText: config.badgeText || config.badge,
    };
  }
  // Fallback if not found
  return {
    id: cleanId,
    slug: `reports/${cleanId}`,
    title: cleanId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    subtitle: "Report details and analytics.",
    category: "Overview & Accounts",
    searchKeywords: [],
    permissionKey: "",
  };
}
