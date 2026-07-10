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

// A single split-payment line: how much of the total is paid from a given account.
export interface ExpensePaymentInput {
  accountId: string;
  amount: number;
}

export interface ExpenseInput {
  expenseNumber: string;
  categoryId: string;
  vehicleId?: string | null;
  subCategoryId: string;
  notes?: string;
  amount: number;
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

export async function getExpenseSubCategories() {
  const payload = (await apiFetch(
    "/api/expensesubcategory"
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
// Expense
// ---------------------------------------------------------------------

export async function createExpense(input: ExpenseInput) {
  return apiFetch("/api/expense", {
    method: "POST",
    body: JSON.stringify(input),
  });
}