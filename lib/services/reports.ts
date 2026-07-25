import { apiFetch } from "@/lib/api";

type ApiSuccess<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

//
// Vehicle Reports
//

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
  driverName: string;
  totalStudents: number; // list endpoint returns this per vehicle
}

export interface VehicleListsResponse {
  success: boolean;
  message: string;
  data: Vehicle[];
}

// Get vehicle list
export async function getVehicleLists() {
  const payload = (await apiFetch(
    "/api/reports/vehicles"
  )) as VehicleListsResponse;

  return payload.data ?? [];
}

//
// Students By Vehicle
//

export interface VehicleInfo {
  vehicleId: string;
  vehicleNumber: string;
  vehicleName: string;
  driverName: string;
}

export interface VehicleStudent {
  admissionNumber: string;
  studentName: string;
  whatsappNumber: string;
  class: string;
}

export interface StudentsByVehicleData {
  vehicle: VehicleInfo;
  Students: VehicleStudent[]; // fixed: API returns "Students" (capital S)
}

export interface StudentsByVehicleResponse {
  success: boolean;
  message: string;
  data: StudentsByVehicleData;
}

// Get students by vehicle
export async function getStudentsByVehicle(vehicleId: string) {
  const payload = (await apiFetch(
    `/api/reports/students-by-vehicle/${vehicleId}`
  )) as StudentsByVehicleResponse;

  return payload.data;
}

//
// Total Financial By Vehicle Report
//

export interface VehicleExpenseBreakdownItem {
  category: string;
  subCategory: string;
  amount: number;
}

export interface FinancialByVehicleData {
  vehicleId: string;
  vehicleName: string;
  vehicleNumber: string;
  income: number;
  transportFeeGenerated: number;
  transportFeePaid: number;
  transportFeePending: number;
  expenseBreakdown: VehicleExpenseBreakdownItem[];
  expense: number;
  profit: number;
}

export interface FinancialByVehicleResponse {
  success: boolean;
  message: string;
  data: FinancialByVehicleData;
}

// Get total financial report (income, expense, profit) for a single vehicle.
// fromDate/toDate are optional — pass them to scope the report to a date
// range (same range picker pattern as the Daily Collection Report).
export async function getFinancialByVehicleReport(
  vehicleId: string,
  fromDate?: string,
  toDate?: string
): Promise<FinancialByVehicleData> {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  const query = params.toString();

  const payload = (await apiFetch(
    `/api/reports/financial-by-vehicle/${vehicleId}${query ? `?${query}` : ""}`
  )) as ApiSuccess<FinancialByVehicleData>;

  return (
    payload.data ?? {
      vehicleId,
      vehicleName: "",
      vehicleNumber: "",
      income: 0,
      transportFeeGenerated: 0,
      transportFeePaid: 0,
      transportFeePending: 0,
      expenseBreakdown: [],
      expense: 0,
      profit: 0,
    }
  );
}

//
// Daily Collection Report (now a date range: fromDate -> toDate)
//

export interface PaymentMethodData {
    paymentMethod: string;
    amount: number;
}

export interface ChargeTypeData {
    chargeType: string;
    amount: number;
}

export interface DailyCollectionData {
    fromDate: string;
    toDate: string;
    totalCollection: number;
    paymentMethodData: PaymentMethodData[];
    collectionByChargeType: ChargeTypeData[];
}

// Get Daily Collection Report
export async function getDailyCollectionReport(
    fromDate: string,
    toDate: string
): Promise<DailyCollectionData> {
    const payload = (await apiFetch(
        `/api/reports/daily-collection?fromDate=${fromDate}&toDate=${toDate}`
    )) as ApiSuccess<DailyCollectionData>;

    return (
        payload.data ?? {
            fromDate,
            toDate,
            totalCollection: 0,
            paymentMethodData: [],
            collectionByChargeType: [],
        }
    );
}


//
// Expense By Category Report
//
 
export interface SubCategoryExpense {
    name: string;
    amount: number;
}
 
export interface CategoryExpense {
    category: string;
    amount: number;
    subCategories: SubCategoryExpense[];
}
 
export interface ExpenseByCategoryData {
    fromDate: string;
    toDate: string;
    totalExpense: number;
    categories: CategoryExpense[];
}
 
// Get Expense By Category Report
export async function getExpenseByCategoryReport(
    fromDate: string,
    toDate: string
): Promise<ExpenseByCategoryData> {
    const payload = (await apiFetch(
        `/api/reports/expense-by-category?fromDate=${fromDate}&toDate=${toDate}`
    )) as ApiSuccess<ExpenseByCategoryData>;
 
    return (
        payload.data ?? {
            fromDate,
            toDate,
            totalExpense: 0,
            categories: [],
        }
    );
}
//
// Student Outstanding Report
//

export interface StudentOutstanding {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  studentStatus: string;
  class: string;
  feeOutstanding: number;
  fineOutstanding: number;
  totalOutstanding: number;
}

export interface StudentOutstandingPagination {
  page: number;
  limit: number;
  total: number;
}

export interface StudentOutstandingData {
  academicYear: string | null;
  students: StudentOutstanding[];
  totalPendingAmount: number;
  pagination: StudentOutstandingPagination;
}

export interface StudentOutstandingResponse {
  success: boolean;
  message?: string;
  data: StudentOutstandingData;
}

// Get Student Outstanding Report
export async function getStudentOutstandingReport(
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<StudentOutstandingData> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) {
    params.set("search", search.trim());
  }

  const payload = (await apiFetch(
    `/api/reports/student-outstanding?${params.toString()}`
  )) as ApiSuccess<StudentOutstandingData>;

  return (
    payload.data ?? {
      academicYear: null,
      students: [],
      totalPendingAmount: 0,
      pagination: { page, limit, total: 0 },
    }
  );
}
//
// Expense Summary Report
//

export interface CategoryExpenseSummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  expenseCount: number;
  percentageOfTotal: number;
}

export interface ExpenseSummaryByCategoryData {
  totalExpenses: number;
  categorySummary: CategoryExpenseSummary[];
  grandTotal?: number;
}

//
// Expense Summary Report (list of individual expenses, newest first)
//

export interface ExpenseItem {
  id: string;
  expenseNumber: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  category: string | null;
  subCategory: string | null;
  account: string | null;
  vehicle: string | null;
  staff: string | null;
}

export interface ExpenseSummaryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpenseSummaryData {
  totalExpenses: number;
  items: ExpenseItem[];
  pagination: ExpenseSummaryPagination;
}

export interface ExpenseSummaryResponse {
  success: boolean;
  message?: string;
  data: ExpenseSummaryData;
}

// Get Expense Summary Report — paginated list of expenses, ordered by
// createdAt desc (last added first) by default.
export async function getExpenseSummaryReport(
  from?: string,
  to?: string,
  page: number = 1,
  limit: number = 10
): Promise<ExpenseSummaryData> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const payload = (await apiFetch(
    `/api/reports/expense-summary?${params.toString()}`
  )) as ApiSuccess<ExpenseSummaryData>;

  return (
    payload.data ?? {
      totalExpenses: 0,
      items: [],
      pagination: { page, limit, total: 0, totalPages: 1 },
    }
  );
}

// Get Expense Summary Report
export async function getExpenseSummaryByCategoryReport(
  from?: string,
  to?: string
): Promise<ExpenseSummaryByCategoryData> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const query = params.toString();
  const payload = (await apiFetch(
    `/api/reports/expense-summary-by-category${query ? `?${query}` : ""}`
  )) as ApiSuccess<ExpenseSummaryByCategoryData>;

  return (
    payload.data ?? {
      totalExpenses: 0,
      categorySummary: [],
    }
  );
}


// Daily fee collection report - by transaction (with pagination and filters)
export interface DailyCollectionPaymentMethod {
  paymentMethod: string;
  amount: number;
}

export interface DailyCollectionItem {
  type?: string;
  chargeType?: string;
  category?: string;
  fineType?: string;
  amount: number;
}

export interface DailyCollectionTransaction {
  transactionNumber: string;
  transactionDate: string;
  studentName: string;
  class: string;
  paymentMethods: DailyCollectionPaymentMethod[];
  Totalamount_from_allocations: number;
  Totalamount_from_transaction: number;
  collections: DailyCollectionItem[];
}

export interface DailyCollectionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DailyCollectionReportResponse {
  fromDate: string;
  toDate: string;
  totalCollection: number;
  pagination: DailyCollectionPagination;
  studentCollections: DailyCollectionTransaction[];
}

export async function getDailyFeeCollectionReport(params: {
  fromDate: string;
  toDate: string;
  page?: number;
  limit?: number;
  search?: string;
  className?: string;
  paymentMethod?: string;
}) {
  const query = new URLSearchParams({
    fromDate: params.fromDate,
    toDate: params.toDate,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    search: params.search ?? "",
    className: params.className ?? "",
    paymentMethod: params.paymentMethod ?? "",
  });

  const payload = (await apiFetch(
    `/api/reports/daily-collection?${query.toString()}`
  )) as ApiSuccess<DailyCollectionReportResponse>;

  return (
    payload.data ?? {
      fromDate: params.fromDate,
      toDate: params.toDate,
      totalCollection: 0,
      pagination: { page: params.page ?? 1, limit: params.limit ?? 10, total: 0, totalPages: 1 },
      studentCollections: [],
    }
  );
}