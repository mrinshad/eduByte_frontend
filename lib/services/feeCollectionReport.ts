import { apiFetch } from "@/lib/api";

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export interface ReportTransaction {
  transactionNumber: string;
  transactionDate: string;
  totalAmount: number;
  lines: { accountName: string; debitAmount: number }[];
}

export interface ReportCharge {
  type: "Fee" | "Fine";
  studentName: string;
  class: string;
  frequency: string | null;
  category: string | null;
  label: string;
  amount: number;
  paidAmount: number;
  status: string;
  transactions: ReportTransaction[];
}

export interface ReportPeriodGroup {
  period: string;
  charges: ReportCharge[];
}

export interface ReportYearGroup {
  year: number;
  periods: ReportPeriodGroup[];
}

export interface FeeCollectionReportResponse {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  groups: ReportYearGroup[];
}

export async function getFeeCollectionReport(params: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams({
    category: params.category ?? "",
    search: params.search ?? "",
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  const payload = (await apiFetch(
    `/api/stdCharge/fee-collection?${query.toString()}`
  )) as ApiSuccess<FeeCollectionReportResponse>;

  return (
    payload.data ?? {
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      groups: [],
    }
  );
}