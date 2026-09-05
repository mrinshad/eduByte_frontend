import { apiFetch } from "@/lib/api";

type ApiSuccess<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

//
// 1. Admissions Master Report Types
//

export interface AdmissionMasterItem {
    enrollmentId: string;
    studentId: string;
    admissionNumber: string;
    studentName: string;
    gender: string;
    dob: string | null;
    bloodGroup: string;
    fatherName: string;
    fatherMobile: string;
    motherName: string;
    motherMobile: string;
    whatsappNumber: string;
    address: string;
    place?: string;
    studentStatus: string;
    enrollmentStatus: string;
    rollNumber: string;
    className: string;
    academicYear: string;
    feeStructure: string;
    assignedVehicle: string;
    driverName: string;
    admissionDate: string;
}

export interface AdmissionsMasterReportResponse {
    summary: {
        totalAdmissions: number;
        activeEnrollments: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    items: AdmissionMasterItem[];
}

export async function getAdmissionsMasterReport(params: {
    page?: number;
    limit?: number;
    search?: string;
    academicYearId?: string;
    classId?: string;
    divisionId?: string;
    status?: string;
}): Promise<AdmissionsMasterReportResponse> {
    const {
        page = 1,
        limit = 10,
        search = "",
        academicYearId = "",
        classId = "",
        divisionId = "",
        status = "",
    } = params;

    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (search.trim()) query.set("search", search.trim());
    if (academicYearId) query.set("academicYearId", academicYearId);
    if (classId) query.set("classId", classId);
    if (divisionId) query.set("divisionId", divisionId);
    if (status) query.set("status", status);

    const payload = (await apiFetch(
        `/api/reports/income/admissions-master?${query.toString()}`
    )) as ApiSuccess<AdmissionsMasterReportResponse>;

    return (
        payload.data ?? {
            summary: { totalAdmissions: 0, activeEnrollments: 0 },
            pagination: { page, limit, total: 0, totalPages: 1 },
            items: [],
        }
    );
}

//
// 2. Dynamic Fee Type Report Types
//

export interface FeeTypePaymentMethodItem {
    method: string;
    amount: number;
}

export interface FeeTypeCollectionItem {
    allocationId: string;
    transactionId: string;
    transactionNumber: string;
    receiptNumber: string;
    transactionDate: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    periodMonth: number | null;
    periodYear: number | null;
    description: string;
    allocatedAmount: number;
    cashAmount: number;
    bankAmount: number;
    paymentMethod?: string;
    totalTransactionAmount: number;
    paymentMethods: FeeTypePaymentMethodItem[];
}

export interface FeeTypeCollectionReportResponse {
    chargeType: {
        id: string;
        name: string;
        category: string | null;
        frequency: string;
        incomeAccount?: { id: string; name: string } | null;
    };
    summary: {
        totalCollected: number;
        cashCollected: number;
        bankCollected: number;
        transactionCount: number;
        paymentMethodBreakdown?: { name: string; amount: number }[];
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    items: FeeTypeCollectionItem[];
}

export async function getFeeTypeCollectionReport(
    chargeTypeId: string,
    params: {
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
        search?: string;
        className?: string;
        paymentMethod?: string;
    }
): Promise<FeeTypeCollectionReportResponse> {
    const {
        fromDate = "",
        toDate = "",
        page = 1,
        limit = 10,
        search = "",
        className = "",
        paymentMethod = "",
    } = params;

    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    if (search.trim()) query.set("search", search.trim());
    if (className) query.set("className", className);
    if (paymentMethod) query.set("paymentMethod", paymentMethod);

    const payload = (await apiFetch(
        `/api/reports/income/fee-type/${chargeTypeId}?${query.toString()}`
    )) as ApiSuccess<FeeTypeCollectionReportResponse>;

    return (
        payload.data ?? {
            chargeType: { id: chargeTypeId, name: "", category: null, frequency: "" },
            summary: { totalCollected: 0, cashCollected: 0, bankCollected: 0, transactionCount: 0 },
            pagination: { page, limit, total: 0, totalPages: 1 },
            items: [],
        }
    );
}

//
// 3. Daily Receipts Register Report Types
//

export interface DailyReceiptItemCollection {
    type: string;
    name: string;
    category?: string;
    amount: number;
}

export interface DailyReceiptPaymentMethod {
    method: string;
    amount: number;
}

export interface DailyReceiptRecord {
    transactionId: string;
    transactionNumber: string;
    receiptNumber: string;
    transactionDate: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    totalAmount: number;
    paymentMethod?: string;
    paymentMethods: DailyReceiptPaymentMethod[];
    collections: DailyReceiptItemCollection[];
}

export interface DailyReceiptsRegisterResponse {
    summary: {
        totalCollected: number;
        cashCollected: number;
        bankCollected: number;
        receiptCount: number;
        paymentMethodBreakdown?: { name: string; amount: number }[];
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    receipts: DailyReceiptRecord[];
}

export async function getDailyReceiptsRegisterReport(params: {
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    search?: string;
    className?: string;
    paymentMethod?: string;
}): Promise<DailyReceiptsRegisterResponse> {
    const {
        fromDate = "",
        toDate = "",
        page = 1,
        limit = 10,
        search = "",
        className = "",
        paymentMethod = "",
    } = params;

    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    if (search.trim()) query.set("search", search.trim());
    if (className) query.set("className", className);
    if (paymentMethod) query.set("paymentMethod", paymentMethod);

    const payload = (await apiFetch(
        `/api/reports/income/daily-receipts?${query.toString()}`
    )) as ApiSuccess<DailyReceiptsRegisterResponse>;

    return (
        payload.data ?? {
            summary: { totalCollected: 0, cashCollected: 0, bankCollected: 0, receiptCount: 0 },
            pagination: { page, limit, total: 0, totalPages: 1 },
            receipts: [],
        }
    );
}

//
// 4. Academic Year Summary Report Types
//

export interface AcademicYearInfo {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface StudentStrengthSummary {
    totalEnrollments: number;
    activeEnrollments: number;
    promotedCount: number;
    completedCount: number;
    withdrawnCount: number;
    genderStats: {
        male: number;
        female: number;
    };
    transportOptedCount: number;
}

export interface AcademicYearFinancialSummary {
    totalBilled: number;
    totalCollected: number;
    cashCollected: number;
    bankCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    totalExpenses: number;
    cashExpenses: number;
    bankExpenses: number;
    netSurplus: number;
    netCashSurplus: number;
    netBankSurplus: number;
}

export interface AcademicYearFeeTypeItem {
    chargeTypeId: string;
    name: string;
    frequency: string;
    billedAmount: number;
    collectedAmount: number;
    cashAmount: number;
    bankAmount: number;
    balanceAmount: number;
    collectionRate: number;
}

export interface AcademicYearExpenseCategoryItem {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    cashAmount: number;
    bankAmount: number;
    percentage: number;
}

export interface AcademicYearClassItem {
    classId: string;
    className: string;
    studentCount: number;
    billedAmount: number;
    collectedAmount: number;
    balanceAmount: number;
    collectionRate: number;
}

export interface AcademicYearMonthlyTrendItem {
    monthKey: string;
    monthName: string;
    year: number;
    month: number;
    income: number;
    expense: number;
    net: number;
}

export interface AcademicYearSummaryResponse {
    academicYear: AcademicYearInfo;
    studentSummary: StudentStrengthSummary;
    financialSummary: AcademicYearFinancialSummary;
    feeTypeBreakdown: AcademicYearFeeTypeItem[];
    expenseCategoryBreakdown: AcademicYearExpenseCategoryItem[];
    classBreakdown: AcademicYearClassItem[];
    monthlyTrend: AcademicYearMonthlyTrendItem[];
}

export async function getAcademicYearSummaryReport(
    academicYearId?: string
): Promise<AcademicYearSummaryResponse | null> {
    const query = new URLSearchParams();
    if (academicYearId) query.set("academicYearId", academicYearId);

    const payload = (await apiFetch(
        `/api/reports/income/academic-year-summary?${query.toString()}`
    )) as ApiSuccess<AcademicYearSummaryResponse>;

    return payload.data ?? null;
}

//
// 6. CCA Income Report
//

export interface CcaIncomeReportItem {
    period: string;
    datePaid: string;
    amountCollected: number;
    studentName: string;
    activityName: string;
}

export interface CcaIncomeReportSummary {
    totalIncome: number;
    chargeCount: number;
    activityFiltered: string;
}

export interface CcaIncomeReportResponse {
    summary: CcaIncomeReportSummary;
    collectedDues: CcaIncomeReportItem[];
}

export async function getCcaIncomeReport(params: {
    startDate?: string;
    endDate?: string;
    ccaActivityId?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<CcaIncomeReportResponse | null> {
    const query = new URLSearchParams();
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.ccaActivityId && params.ccaActivityId !== "all") query.set("ccaActivityId", params.ccaActivityId);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const payload = (await apiFetch(
        `/api/reports/cca/income?${query.toString()}`
    )) as ApiSuccess<CcaIncomeReportResponse>;

    return payload.data ?? null;
}

export interface CcaExpenseItem {
    id: string;
    expenseNumber: string;
    amount: number;
    expenseDate: string;
    notes: string | null;
    createdAt: string;
    category: string | null;
    subCategory: string | null;
    account: string | null;
    ccaActivityName: string | null;
    payments: { accountId: string; amount: number }[];
}

export interface CcaExpenseReportResponse {
    totalCcaExpenses: number;
    items: CcaExpenseItem[];
}

export async function getCcaExpenseSummary(params: {
    startDate?: string;
    endDate?: string;
    ccaActivityId?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<CcaExpenseReportResponse | null> {
    const query = new URLSearchParams();
    if (params.startDate) query.set("from", params.startDate);
    if (params.endDate) query.set("to", params.endDate);
    if (params.ccaActivityId && params.ccaActivityId !== "all") query.set("ccaActivityId", params.ccaActivityId);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const payload = (await apiFetch(
        `/api/reports/cca/expense?${query.toString()}`
    )) as ApiSuccess<CcaExpenseReportResponse>;

    return payload.data ?? null;
}

export interface CcaFinancialSummaryResponse {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
}

export async function getCcaFinancialSummary(): Promise<CcaFinancialSummaryResponse | null> {
    const payload = (await apiFetch(
        `/api/reports/cca/financial`
    )) as ApiSuccess<CcaFinancialSummaryResponse>;

    return payload.data ?? null;
}

export interface ActivityProfitReportResponse {
    activityId: string;
    activityName: string;
    activityCode: string | null;
    financials: {
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
    };
}

export async function getActivityProfitReport(
    activityId: string
): Promise<ActivityProfitReportResponse | null> {
    const payload = (await apiFetch(
        `/api/reports/cca/${activityId}/profit`
    )) as ApiSuccess<ActivityProfitReportResponse>;

    return payload.data ?? null;
}

