# eduByte Frontend API Services — Complete Catalog & Map

This directory encapsulates all HTTP communication with the eduByte backend. All UI components, forms, dialogs, and hooks **must** call these service functions rather than executing raw `fetch` calls.

---

## 1. Services Catalog (31 Service Clients)

| Service File | Backend Base Endpoint | Primary Consumer Pages | Key Exported Functions |
| :--- | :--- | :--- | :--- |
| [academicYear.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/academicYear.ts) | `/api/academic-years` | Admin Academic Profile, Navbar | `getAcademicYears`, `createAcademicYear`, `updateAcademicYear`, `getCurrentAcademicYear` |
| [accountTypes.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/accountTypes.ts) | Static definitions | Accounts, Expenses | Enums and types for chart of accounts |
| [accounts.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/accounts.ts) | `/api/accounts` | Admin Accounts, Expense Management | `getAccounts`, `createAccount`, `updateAccount`, `deleteAccount` |
| [adminDashboard.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/adminDashboard.ts) | `/api/admin-dashboard` | Admin Dashboard | `getAdminDashboardSummary`, `getRecentActivities` |
| [admissions.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/admissions.ts) | `/api/stdenrollment` | Admin Admissions | `getAllStudentEnrollments` (supports `status` filter), `createStudentEnrollment`, `getAdmissionDetails` |
| [advancedReports.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/advancedReports.ts) | `/api/reports/advanced` | Workspace Financial Reports | `getFeeCollectionAnalytics`, `getDefaulterAnalysis`, `getIncomeExpenseReport` |
| [asset.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/asset.ts) | `/api/assets` | Admin Assets | `getAssets`, `createAsset`, `updateAsset`, `deleteAsset` |
| [audit-service.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/audit-service.ts) | `/api/audit-logs` | Admin Audit Logs | `getAuditLogs`, `getAuditLogById` |
| [cca.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/cca.ts) | `/api/cca` | Admin CCA | `getCcaActivities`, `createCcaActivity`, `assignStudentCca`, `getCcaCharges`, `collectCcaFee` |
| [chargeTypes.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/chargeTypes.ts) | `/api/charge-types` | Admin Charge Types, Fee Structures | `getChargeTypes`, `createChargeType`, `updateChargeType`, `deleteChargeType` |
| [class.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/class.ts) | `/api/classes` | Academic Profile, Student Forms | `getClasses`, `createClass`, `updateClass`, `deleteClass` |
| [division.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/division.ts) | `/api/divisions` | Academic Profile, Student Forms | `getDivisions`, `createDivision`, `updateDivision`, `deleteDivision` |
| [expense.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/expense.ts) | `/api/expenses` | Workspace Expense Management | `getExpenses`, `createExpense`, `updateExpense`, `deleteExpense`, `getCategories` |
| [expenseReports.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/expenseReports.ts) | `/api/reports/expense` | Workspace Reports | `getExpenseSummaryReport`, `getCategoryExpenseReport` |
| [feeCollection.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/feeCollection.ts) | `/api/fee-collection` | Workspace Fee Management | `getStudentFeeDetails`, `collectFee`, `getReceiptDetails`, `getCollectionHistory` |
| [feeStructure.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/feeStructure.ts) | `/api/fee-structures` | Admin Fee Structures | `getFeeStructures`, `createFeeStructure`, `updateFeeStructure`, `getFeeStructureById` |
| [feeStructureAssignment.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/feeStructureAssignment.ts) | `/api/fee-structures/assign` | Admin Fee Structures | `assignFeeStructureToClass`, `getAssignments` |
| [fineTypes.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/fineTypes.ts) | `/api/fine-types`, `/api/std-fines` | Workspace Fine Management | `getFineTypes`, `createFineType`, `getStudentFines`, `createStudentFine`, `waiveStudentFine` |
| [incomeReports.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/incomeReports.ts) | `/api/reports/income` | Workspace Financial Reports | `getDailyCollectionReport`, `getHeadwiseIncomeReport` |
| [lateFine.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/lateFine.ts) | `/api/late-fee-fines` | Workspace Fine Management | `getLateFeeRules`, `createLateFeeRule`, `calculateLateFees` |
| [promotion.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/promotion.ts) | `/api/promotion` | Admin Promotion | `getPromotableStudents`, `promoteStudentsBatch` |
| [reports.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/reports.ts) | `/api/reports` | Workspace Reports | General report fetchers and export triggers |
| [roles-permissions.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/roles-permissions.ts) | `/api/roles`, `/api/permissions` | Admin Roles, Permissions | `getRoles`, `createRole`, `updateRolePermissions`, `getPermissions` |
| [salarySlip.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/salarySlip.ts) | `/api/salary-slips` | Workspace Salary Slips | `getSalarySlips`, `generateSalarySlip`, `markDisbursed`, `getSalarySlipPdf` |
| [staff.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/staff.ts) | `/api/staff` | Admin Staff | `getStaffList`, `createStaff`, `updateStaff`, `deleteStaff` |
| [student.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/student.ts) | `/api/students` | Admin Students, Selection Dialogs | `getStudents`, `createStudent`, `getStudentById`, `getAvailableStudentsForAdmission` |
| [studentCharges.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/studentCharges.ts) | `/api/student-charges` | Workspace Student Charges | `getStudentCharges`, `generateMonthlyCharges`, `createCustomCharge`, `deleteCharge` |
| [studentRelieving.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/studentRelieving.ts) | `/api/relieving` | Admin Relieving | `relieveStudent`, `getRelievedStudents`, `generateTransferCertificate` |
| [user-service.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/user-service.ts) | `/api/users` | Admin Users | `getUsers`, `createUser`, `updateUserStatus`, `resetPassword` |
| [vehicle.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/vehicle.ts) | `/api/vehicles`, `/api/student-vehicles` | Admin Vehicles | `getVehicles`, `createVehicle`, `assignStudentVehicle`, `getVehicleRoutes` |
| [workspaceDashboard.ts](file:///Users/apple/Byten/eduByte/frontend/lib/services/workspaceDashboard.ts) | `/api/workspace-dashboard` | Workspace Dashboard | `getWorkspaceDashboardSummary`, `getTodayCollection` |

---

## 2. Recipe: Adding or Modifying a Service Function

All service calls must use the shared [lib/api.ts](file:///Users/apple/Byten/eduByte/frontend/lib/api.ts) helper (`apiFetch`).

```typescript
import { apiFetch } from "@/lib/api";

// 1. Define explicit TypeScript interfaces for input params and responses
export interface GetActiveEnrollmentsParams {
  academicYearId?: string;
  classId?: string;
  divisionId?: string;
  status?: "ACTIVE" | "PROMOTED" | "RELIEVED";
  search?: string;
}

// 2. Format query parameters cleanly using URLSearchParams
export async function getActiveEnrollments(params?: GetActiveEnrollmentsParams) {
  const query = new URLSearchParams();
  if (params?.academicYearId) query.set("academicYearId", params.academicYearId);
  if (params?.classId) query.set("classId", params.classId);
  if (params?.divisionId) query.set("divisionId", params.divisionId);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);

  const queryString = query.toString();
  const endpoint = queryString ? `/api/stdenrollment?${queryString}` : `/api/stdenrollment`;

  // 3. Call apiFetch
  return apiFetch<ApiResponse<StudentEnrollment[]>>(endpoint, {
    method: "GET",
  });
}
```
