import { apiFetch } from "@/lib/api";

type ApiSuccess<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

// =====================================================================
// Expense Summary — single item operations (edit / view / delete)
//
// NOTE: These endpoints (/api/reports/expense-summary/:id) are actively
// utilized by the core Expense Management section:
// - `frontend/app/workspace/expense-management/createExpense/page.tsx`
//   loads an existing expense for editing using `getExpenseSummaryById`
//   and submits changes using `updateExpenseSummary`.
// =====================================================================

export interface ExpenseDetail {
  id: string;
  expenseNumber: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  category: string | null; // Category ID
  subCategory: string | null; // SubCategory ID
  vehicle: string | null; // Vehicle ID
  staff: string | null; // Staff ID
  ccaActivity?: string | null; // CCA Activity ID
  payments: { accountId: string; amount: number }[];
}

export async function getExpenseSummaryById(id: string): Promise<ExpenseDetail | null> {
  const payload = (await apiFetch(
    `/api/reports/expense-summary/${id}`
  )) as ApiSuccess<ExpenseDetail>;
  return payload.data ?? null;
}

export async function updateExpenseSummary(
  id: string,
  data: {
    categoryId: string;
    subCategoryId: string;
    vehicleId?: string | null;
    staffId?: string | null;
    ccaActivityId?: string | null;
    notes?: string;
    amount: number;
    expenseDate: string;
    payments: { accountId: string; amount: number }[];
  }
): Promise<ApiSuccess<ExpenseDetail>> {
  const payload = (await apiFetch(`/api/reports/expense-summary/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })) as ApiSuccess<ExpenseDetail>;
  return payload;
}

export async function deleteExpenseSummary(id: string): Promise<ApiSuccess<null>> {
  const payload = (await apiFetch(`/api/reports/expense-summary/${id}`, {
    method: "DELETE",
  })) as ApiSuccess<null>;
  return payload;
}