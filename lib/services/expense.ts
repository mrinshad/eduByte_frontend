import { apiFetch } from "@/lib/api";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryInput {
  name: string;
  description: string;
}

export interface ExpenseSubCategory {
  id: string;
  categoryId: string;
  name: string;
  expenseAccountId: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSubCategoryInput {
  categoryId: string;
  name: string;
  expenseAccountId: string;
  description: string;
}

export interface AccountName {
  id: string;
  name: string;
}

// Staff, for the "Staff" dropdown on the Create Expense form.
export type StaffStatus = "ACTIVE" | "INACTIVE";

export interface StaffName {
  id: string;
  employeeCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  joiningDate: string | null;
  status: StaffStatus;
}

// A single split-payment line: how much of the total is paid from a given account.
export interface ExpensePaymentInput {
  accountId: string;
  amount: number;
}

export interface CreateExpenseResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    expenseNumber: string;
  };
}

export interface ExpenseInput {
  // expenseNumber is no longer collected on the form — the backend
  // generates it. Kept optional here in case any caller still wants to
  // pass one explicitly.
  expenseNumber?: string;
  categoryId: string;
  vehicleId?: string | null;
  subCategoryId: string;
  staffId?: string | null;
  notes?: string;
  amount: number;
  accountId: string;
  expenseDate: string; // ISO date string
  payments: ExpensePaymentInput[];
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// ---------------------------------------------------------------------
// Expense Category
// ---------------------------------------------------------------------

export async function createExpenseCategory(input: ExpenseCategoryInput) {
  return apiFetch("/api/expensecategory", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getExpenseCategories() {
  const payload = (await apiFetch(
    "/api/expensecategory"
  )) as ApiSuccess<ExpenseCategory[]>;

  return payload.data ?? [];
}

export async function updateExpenseCategory(
  id: string,
  input: ExpenseCategoryInput
) {
  return apiFetch(`/api/expensecategory/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------
// Expense Sub Category
// ---------------------------------------------------------------------

export async function createExpenseSubCategory(
  input: ExpenseSubCategoryInput
) {
  return apiFetch("/api/expensesubcategory", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getExpenseSubCategories(categoryId?: string) {
  const query = categoryId ? `?categoryId=${categoryId}` : "";
  const payload = (await apiFetch(
    `/api/expensesubcategory${query}`
  )) as ApiSuccess<ExpenseSubCategory[]>;

  return payload.data ?? [];
}

export async function updateExpenseSubCategory(
  id: string,
  input: Omit<ExpenseSubCategoryInput, "categoryId">
) {
  return apiFetch(`/api/expensesubcategory/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------
// Accounts (for Expense Account / Payment Account dropdowns)
// ---------------------------------------------------------------------

export async function getAccountNames() {
  const payload = (await apiFetch(
    "/api/accounts/names"
  )) as ApiSuccess<AccountName[]>;

  return payload.data ?? [];
}


// ---------------------------------------------------------------------
// Expense Accounts (for Expense Account / Payment Account dropdowns)
// ---------------------------------------------------------------------

export async function getExpenseAccountsNamesandIds() {
  const payload = (await apiFetch(
    "/api/accounts/expense-accounts"
  )) as ApiSuccess<AccountName[]>;

  return payload.data ?? [];
}

// ---------------------------------------------------------------------
// Staff (for the Staff dropdown on the Create Expense form)
// ---------------------------------------------------------------------

export async function getStaffNamesAndIds(): Promise<StaffName[]> {
  const payload = (await apiFetch("/api/staff")) as ApiSuccess<{
    items: StaffName[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>;
  return payload.data?.items ?? [];
}

// ---------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------

export async function createExpense(
  input: ExpenseInput
): Promise<CreateExpenseResponse> {
  return apiFetch("/api/expense", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface ExpensePrintResponse {
  success: boolean;
  data: {
    id: string;
    expenseNumber: string;
    expenseDate: string;
    amount: number;
    notes?: string;

    category: string;
    subCategory: string;

    vehicle: {
      vehicleName: string;
      vehicleNumber: string;
    } | null;

    staff: {
      name: string;
    } | null;

    ccaActivity?: {
      name: string;
      code?: string | null;
    } | null;

    payments: {
      account: string;
      amount: number;
    }[];
  };
}

export async function getExpensePrint(
  id: string
): Promise<ExpensePrintResponse> {
  return apiFetch(`/api/expense/${id}/print`);
}

export interface PaymentMethodAccount {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
}

export async function getPaymentMethodAccounts() {
  const payload = (await apiFetch(
    "/api/accounts?type=PAYMENT_METHOD&isActive=true"
  )) as { success: boolean; data?: PaymentMethodAccount[] };

  return payload.data ?? [];
}
// ---------------------------------------------------------------------
// Expense Category — delete
// ---------------------------------------------------------------------

export async function deleteExpenseCategory(id: string) {
  return apiFetch(`/api/expensecategory/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------
// Expense Sub Category — delete
// ---------------------------------------------------------------------

export async function deleteExpenseSubCategory(id: string) {
  return apiFetch(`/api/expensesubcategory/${id}`, {
    method: "DELETE",
  });
}