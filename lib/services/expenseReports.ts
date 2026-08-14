import { apiFetch } from "@/lib/api";

type ApiSuccess<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

export interface ExpensePaymentMethodItem {
    method: string;
    amount: number;
}

//
// 1. Salary Expense Report Types
//

export interface SalaryExpenseItem {
    expenseId: string;
    expenseNumber: string;
    expenseDate: string;
    staffName: string;
    employeeCode: string;
    staffPhone: string;
    categoryName: string;
    subCategoryName: string;
    amount: number;
    cashAmount: number;
    bankAmount: number;
    notes: string;
    paymentMethods: ExpensePaymentMethodItem[];
}

export interface SalaryExpenseReportResponse {
    summary: {
        totalSalaryPaid: number;
        cashPaid: number;
        bankPaid: number;
        count: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    items: SalaryExpenseItem[];
}

export async function getSalaryExpenseReport(params: {
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    search?: string;
    staffId?: string;
    paymentMethod?: string;
}): Promise<SalaryExpenseReportResponse> {
    const {
        fromDate = "",
        toDate = "",
        page = 1,
        limit = 10,
        search = "",
        staffId = "",
        paymentMethod = "",
    } = params;

    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    if (search.trim()) query.set("search", search.trim());
    if (staffId) query.set("staffId", staffId);
    if (paymentMethod) query.set("paymentMethod", paymentMethod);

    const payload = (await apiFetch(
        `/api/reports/expenses/salary?${query.toString()}`
    )) as ApiSuccess<SalaryExpenseReportResponse>;

    return (
        payload.data ?? {
            summary: { totalSalaryPaid: 0, cashPaid: 0, bankPaid: 0, count: 0 },
            pagination: { page, limit, total: 0, totalPages: 1 },
            items: [],
        }
    );
}

//
// 2. Transportation Expenses Report Types
//

export interface TransportationExpenseItem {
    expenseId: string;
    expenseNumber: string;
    expenseDate: string;
    vehicleName: string;
    vehicleNumber: string;
    driverName: string;
    categoryName: string;
    subCategoryName: string;
    amount: number;
    cashAmount: number;
    bankAmount: number;
    notes: string;
    paymentMethods: ExpensePaymentMethodItem[];
}

export interface TransportationExpenseReportResponse {
    summary: {
        totalTransportExpense: number;
        fuelTotal: number;
        serviceTotal: number;
        partsTotal: number;
        cashPaid: number;
        bankPaid: number;
        count: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    items: TransportationExpenseItem[];
}

export async function getTransportationExpenseReport(params: {
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    search?: string;
    vehicleId?: string;
    subCategoryId?: string;
    paymentMethod?: string;
}): Promise<TransportationExpenseReportResponse> {
    const {
        fromDate = "",
        toDate = "",
        page = 1,
        limit = 10,
        search = "",
        vehicleId = "",
        subCategoryId = "",
        paymentMethod = "",
    } = params;

    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    if (search.trim()) query.set("search", search.trim());
    if (vehicleId) query.set("vehicleId", vehicleId);
    if (subCategoryId) query.set("subCategoryId", subCategoryId);
    if (paymentMethod) query.set("paymentMethod", paymentMethod);

    const payload = (await apiFetch(
        `/api/reports/expenses/transportation?${query.toString()}`
    )) as ApiSuccess<TransportationExpenseReportResponse>;

    return (
        payload.data ?? {
            summary: {
                totalTransportExpense: 0,
                fuelTotal: 0,
                serviceTotal: 0,
                partsTotal: 0,
                cashPaid: 0,
                bankPaid: 0,
                count: 0,
            },
            pagination: { page, limit, total: 0, totalPages: 1 },
            items: [],
        }
    );
}

//
// 3. Category & Subcategory Expense Report Types
//

export interface CategoryExpenseItem {
    expenseId: string;
    expenseNumber: string;
    expenseDate: string;
    categoryName: string;
    subCategoryName: string;
    linkedEntity: string;
    amount: number;
    cashAmount: number;
    bankAmount: number;
    notes: string;
    paymentMethods: ExpensePaymentMethodItem[];
}

export interface CategoryExpenseReportResponse {
    summary: {
        totalExpenses: number;
        cashPaid: number;
        bankPaid: number;
        expenseCount: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    items: CategoryExpenseItem[];
}

export async function getCategoryExpenseReport(params: {
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    subCategoryId?: string;
    paymentMethod?: string;
}): Promise<CategoryExpenseReportResponse> {
    const {
        fromDate = "",
        toDate = "",
        page = 1,
        limit = 10,
        search = "",
        categoryId = "",
        subCategoryId = "",
        paymentMethod = "",
    } = params;

    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    if (search.trim()) query.set("search", search.trim());
    if (categoryId) query.set("categoryId", categoryId);
    if (subCategoryId) query.set("subCategoryId", subCategoryId);
    if (paymentMethod) query.set("paymentMethod", paymentMethod);

    const payload = (await apiFetch(
        `/api/reports/expenses/by-category?${query.toString()}`
    )) as ApiSuccess<CategoryExpenseReportResponse>;

    return (
        payload.data ?? {
            summary: { totalExpenses: 0, cashPaid: 0, bankPaid: 0, expenseCount: 0 },
            pagination: { page, limit, total: 0, totalPages: 1 },
            items: [],
        }
    );
}

//
// 4. Daily Expenses Register Report Types
//

export interface DailyExpenseVoucher {
    expenseId: string;
    expenseNumber: string;
    expenseDate: string;
    categoryName: string;
    subCategoryName: string;
    linkedEntity: string;
    totalAmount: number;
    notes: string;
    paymentMethods: ExpensePaymentMethodItem[];
}

export interface DailyExpensesRegisterResponse {
    summary: {
        totalExpenses: number;
        cashPaid: number;
        bankPaid: number;
        voucherCount: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    vouchers: DailyExpenseVoucher[];
}

export async function getDailyExpensesRegisterReport(params: {
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    paymentMethod?: string;
}): Promise<DailyExpensesRegisterResponse> {
    const {
        fromDate = "",
        toDate = "",
        page = 1,
        limit = 10,
        search = "",
        categoryId = "",
        paymentMethod = "",
    } = params;

    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    if (search.trim()) query.set("search", search.trim());
    if (categoryId) query.set("categoryId", categoryId);
    if (paymentMethod) query.set("paymentMethod", paymentMethod);

    const payload = (await apiFetch(
        `/api/reports/expenses/daily-expenses?${query.toString()}`
    )) as ApiSuccess<DailyExpensesRegisterResponse>;

    return (
        payload.data ?? {
            summary: { totalExpenses: 0, cashPaid: 0, bankPaid: 0, voucherCount: 0 },
            pagination: { page, limit, total: 0, totalPages: 1 },
            vouchers: [],
        }
    );
}
