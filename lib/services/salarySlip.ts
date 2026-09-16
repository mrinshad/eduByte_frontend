import { apiFetch } from "@/lib/api";

export interface SalarySlipStaff {
  id: string;
  name: string;
  employeeCode: string;
  phone?: string | null;
  email?: string | null;
  status?: string;
  user?: {
    role?: {
      name?: string;
    };
  };
}

export interface SalarySlipAccount {
  id: string;
  name: string;
  type: string;
}

export interface SalarySlipExpense {
  id: string;
  expenseNumber: string;
  expenseDate?: string;
  transaction?: {
    id: string;
    transactionNumber: string;
    transactionDate: string;
  };
}

export interface SalarySlip {
  id: string;
  slipNumber: string;
  staffId: string;
  salaryMonth: string;
  basicSalary: number;
  overtime: number;
  bonus: number;
  otherEarnings: number;
  totalEarnings: number;
  advanceSalary: number;
  lossOfPay: number;
  fine: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  casualLeaves: number;
  remarks: string | null;
  paymentAccountId: string | null;
  paymentDate: string;
  expenseId: string | null;
  status: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  staff?: SalarySlipStaff;
  paymentAccount?: SalarySlipAccount;
  expense?: SalarySlipExpense;
}

export interface CreateSalarySlipInput {
  staffId: string;
  salaryMonth: string;
  basicSalary: number;
  overtime?: number;
  bonus?: number;
  otherEarnings?: number;
  advanceSalary?: number;
  lossOfPay?: number;
  fine?: number;
  otherDeductions?: number;
  casualLeaves?: number;
  remarks?: string;
  paymentAccountId?: string;
  paymentDate?: string;
}

export interface SalarySlipPrintData {
  institutionName: string;
  voucherTitle: string;
  slipNumber: string;
  salaryMonth: string;
  generatedDate: string;
  disbursementDate: string;
  employee: {
    id: string;
    name: string;
    code: string;
    phone?: string;
    email?: string;
    role?: string;
    joiningDate?: string;
  };
  earnings: Array<{ name: string; amount: number }>;
  totalEarnings: number;
  deductions: Array<{ name: string; amount: number }>;
  totalDeductions: number;
  netSalary: number;
  netSalaryWords: string;
  casualLeaves: number;
  remarks: string | null;
  paymentMethod: string;
  expenseNumber: string | null;
}

export interface SalarySlipsListResponse {
  items: SalarySlip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalDisbursed: number;
    totalEarnings: number;
    totalDeductions: number;
    totalSlips: number;
  };
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function createSalarySlip(input: CreateSalarySlipInput) {
  return apiFetch("/api/salary-slips", {
    method: "POST",
    body: JSON.stringify(input),
  }) as Promise<ApiSuccess<SalarySlip>>;
}

export interface GetSalarySlipsParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  paymentAccountId?: string;
  staffId?: string;
  salaryMonth?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export async function getSalarySlips(params?: GetSalarySlipsParams) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.paymentAccountId && params.paymentAccountId !== "all") query.set("paymentAccountId", params.paymentAccountId);
  if (params?.staffId && params.staffId !== "all") query.set("staffId", params.staffId);
  if (params?.salaryMonth && params.salaryMonth !== "all") query.set("salaryMonth", params.salaryMonth);
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.order) query.set("order", params.order);

  const qs = query.toString() ? `?${query.toString()}` : "";
  const payload = (await apiFetch(`/api/salary-slips${qs}`)) as ApiSuccess<SalarySlipsListResponse>;
  return payload.data;
}

export async function getSalarySlipById(id: string) {
  const payload = (await apiFetch(`/api/salary-slips/${id}`)) as ApiSuccess<SalarySlip>;
  return payload.data;
}

export async function getSalarySlipPrint(id: string) {
  const payload = (await apiFetch(`/api/salary-slips/${id}/print`)) as ApiSuccess<SalarySlipPrintData>;
  return payload.data;
}

export async function deleteSalarySlip(id: string) {
  return apiFetch(`/api/salary-slips/${id}`, {
    method: "DELETE",
  }) as Promise<ApiSuccess<{ id: string }>>;
}

export interface StaffPendingAdvanceItem {
  id: string;
  expenseNumber: string;
  amount: number;
  expenseDate: string;
  notes?: string | null;
  account?: {
    id: string;
    name: string;
  } | null;
}

export interface StaffPendingAdvanceResponse {
  staffId: string;
  staffName: string;
  employeeCode: string;
  totalPendingAdvance: number;
  advances: StaffPendingAdvanceItem[];
}

export async function getStaffPendingAdvance(staffId: string) {
  const payload = (await apiFetch(
    `/api/salary-slips/staff/${staffId}/pending-advance`
  )) as ApiSuccess<StaffPendingAdvanceResponse>;
  return payload.data;
}
