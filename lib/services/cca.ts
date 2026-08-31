import { apiFetch } from "@/lib/api";

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type FeeFrequency = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME" | string;

export interface CCAActivityIncomeAccount {
  id: string;
  name: string;
}

export interface CCAActivity {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  incomeAccountId?: string | null;
  feeAmount: number | string;
  defaultFee: number;
  frequency: FeeFrequency;
  status: "ACTIVE" | "INACTIVE" | string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  incomeAccount?: CCAActivityIncomeAccount | null;
  incomeAccountName?: string;
  activeStudentCount?: number;
}

export interface CreateCCAActivityInput {
  name: string;
  code?: string | null;
  description?: string | null;
  incomeAccountId?: string | null;
  feeAmount?: number | string;
  frequency?: FeeFrequency;
}

export interface UpdateCCAActivityInput {
  name?: string;
  code?: string | null;
  description?: string | null;
  incomeAccountId?: string | null;
  feeAmount?: number | string;
  frequency?: FeeFrequency;
  status?: "ACTIVE" | "INACTIVE" | string;
}

export interface GetCCAActivitiesParams {
  status?: "ACTIVE" | "INACTIVE" | "ALL" | string;
  search?: string;
}

export interface CCAAssignmentItem {
  id: string;
  startDate: string;
  endDate?: string | null;
  status: "ACTIVE" | "DROPPED" | "INACTIVE" | string;
  discountAmount?: number | null;
  studentName: string;
  admissionNumber: string;
  activityName: string;
  activityCode?: string | null;
  studentId?: string;
  ccaActivityId?: string;
  feeAmount?: number;
  class?: string;
  division?: string;
  parentPhone?: string;
}

export interface CCAAssignmentsListResponse {
  pagination?: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
  ccaAssignments: CCAAssignmentItem[];
}

export interface CCAAssignmentPayload {
  studentId: string;
  ccaActivityIds: string[];
  startDate: string;
  endDate?: string | null;
  discountAmount?: number | null;
}

// ---------------------------------------------------------------------------
// CCA Activities API
// ---------------------------------------------------------------------------

export async function getCCAActivities(params?: GetCCAActivitiesParams): Promise<CCAActivity[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  const qs = query.toString() ? `?${query.toString()}` : "";

  const payload = (await apiFetch(`/api/cca-activities${qs}`)) as ApiSuccess<CCAActivity[]>;
  const rawList = payload.data ?? [];

  return rawList.map((item) => {
    const fee = typeof item.feeAmount === "number" ? item.feeAmount : (parseFloat(String(item.feeAmount || 0)) || 0);
    return {
      ...item,
      feeAmount: fee,
      defaultFee: fee,
      incomeAccountName: item.incomeAccount?.name || item.incomeAccountName || "",
      frequency: item.frequency || "MONTHLY",
      status: item.status || "ACTIVE",
      activeStudentCount: item.activeStudentCount ?? 0,
    };
  });
}

export async function createCCAActivity(input: CreateCCAActivityInput): Promise<ApiSuccess<null>> {
  const feeAmount = input.feeAmount !== undefined ? Number(input.feeAmount) : 0;

  const payload = (await apiFetch("/api/cca-activities", {
    method: "POST",
    body: JSON.stringify({
      name: input.name?.trim(),
      code: input.code ? input.code.trim() : undefined,
      description: input.description ? input.description.trim() : undefined,
      incomeAccountId: input.incomeAccountId || undefined,
      feeAmount: isNaN(feeAmount) ? 0 : feeAmount,
      frequency: input.frequency || "MONTHLY",
    }),
  })) as ApiSuccess<null>;

  return payload;
}

export async function updateCCAActivity(
  id: string,
  input: UpdateCCAActivityInput
): Promise<ApiSuccess<null>> {
  const feeAmount = input.feeAmount !== undefined ? Number(input.feeAmount) : undefined;

  const payload = (await apiFetch(`/api/cca-activities/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.name ? input.name.trim() : undefined,
      code: input.code !== undefined ? (input.code ? input.code.trim() : null) : undefined,
      description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
      incomeAccountId: input.incomeAccountId !== undefined ? (input.incomeAccountId || null) : undefined,
      feeAmount: feeAmount !== undefined ? (isNaN(feeAmount) ? 0 : feeAmount) : undefined,
      frequency: input.frequency,
      status: input.status,
    }),
  })) as ApiSuccess<null>;

  return payload;
}

export async function deleteCCAActivity(id: string): Promise<ApiSuccess<null>> {
  return (await apiFetch(`/api/cca-activities/${id}`, {
    method: "DELETE",
  })) as ApiSuccess<null>;
}

// ---------------------------------------------------------------------------
// CCA Assignments API
// ---------------------------------------------------------------------------

export async function getCCAAssignments(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<CCAAssignmentsListResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "ALL") query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  const qs = query.toString() ? `?${query.toString()}` : "";

  const res = (await apiFetch(`/api/cca-assignments${qs}`)) as any;
  const dataObj = res?.data || res;

  if (dataObj?.ccaAssignments && Array.isArray(dataObj.ccaAssignments)) {
    return dataObj;
  }
  if (Array.isArray(dataObj)) {
    return { ccaAssignments: dataObj };
  }
  if (Array.isArray(res)) {
    return { ccaAssignments: res };
  }
  return { ccaAssignments: [] };
}

export async function assignStudentToCCAActivities(
  payload: CCAAssignmentPayload
): Promise<ApiSuccess<any>> {
  const body: Record<string, any> = {
    studentId: payload.studentId,
    ccaActivityIds: payload.ccaActivityIds,
    startDate: payload.startDate,
  };
  if (payload.endDate) {
    body.endDate = payload.endDate;
  }
  if (
    payload.discountAmount !== undefined &&
    payload.discountAmount !== null &&
    !isNaN(Number(payload.discountAmount))
  ) {
    body.discountAmount = Number(payload.discountAmount);
  }

  return (await apiFetch("/api/cca-assignments", {
    method: "POST",
    body: JSON.stringify(body),
  })) as ApiSuccess<any>;
}

export async function bulkAssignStudentToCCAActivity(payload: {
  ccaActivityId: string;
  studentIds: string[];
  startDate: string;
  endDate?: string | null;
  discountAmount?: number | null;
}): Promise<ApiSuccess<{ assignedCount: number; skippedCount: number }>> {
  const body: Record<string, any> = {
    ccaActivityId: payload.ccaActivityId,
    studentIds: payload.studentIds,
    startDate: payload.startDate,
  };
  if (payload.endDate) {
    body.endDate = payload.endDate;
  }
  if (
    payload.discountAmount !== undefined &&
    payload.discountAmount !== null &&
    !isNaN(Number(payload.discountAmount))
  ) {
    body.discountAmount = Number(payload.discountAmount);
  }

  return (await apiFetch("/api/cca-assignments/bulk", {
    method: "POST",
    body: JSON.stringify(body),
  })) as ApiSuccess<{ assignedCount: number; skippedCount: number }>;
}

export async function updateCCAAssignment(
  id: string,
  payload: {
    startDate?: string;
    endDate?: string | null;
    discountAmount?: number | "";
    feeAmount?: number | "";
  }
): Promise<ApiSuccess<any>> {
  const body: Record<string, any> = {};
  if (payload.startDate !== undefined && payload.startDate !== "") {
    body.startDate = payload.startDate;
  }
  if (payload.endDate !== undefined) {
    body.endDate = payload.endDate ? payload.endDate : null;
  }
  if (payload.discountAmount !== undefined && payload.discountAmount !== null) {
    body.discountAmount = payload.discountAmount === "" ? 0 : Number(payload.discountAmount);
  }
  if (payload.feeAmount !== undefined && payload.feeAmount !== null) {
    body.feeAmount = payload.feeAmount === "" ? 0 : Number(payload.feeAmount);
  }

  return (await apiFetch(`/api/cca-assignments/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })) as ApiSuccess<any>;
}

export async function dropCCAAssignment(id: string): Promise<ApiSuccess<null>> {
  return (await apiFetch(`/api/cca-assignments/drop/${id}`, {
    method: "PUT",
  })) as ApiSuccess<null>;
}

export async function deleteCCAAssignment(id: string): Promise<ApiSuccess<null>> {
  return (await apiFetch(`/api/cca-assignments/${id}`, {
    method: "DELETE",
  })) as ApiSuccess<null>;
}

// ---------------------------------------------------------------------------
// CCA Charges (Fee Generation) API
// ---------------------------------------------------------------------------

export interface CCAChargePreviewSummary {
  chargesToGenerate: number;
  alreadyGenerated: number;
  zeroAmountSkipped: number;
  totalEstimatedAmount: number;
}

export interface CCAChargePreviewData {
  academicYear: { id: string; name: string };
  lastGeneratedAcademicMonth: number;
  totalAcademicMonths: number;
  message?: string | null;
  activeAssignmentCount: number;
  summary: CCAChargePreviewSummary;
  byActivity: Record<string, number>;
  financialByActivity: Record<string, number>;
  generatedMonths: string[];
}

export interface CCAChargeGenerateResult {
  academicYear: { id: string; name: string };
  activeAssignments: number;
  chargesGenerated: number;
  chargesSkipped: number;
  totalEstimatedAmount: number;
  byActivity: Record<string, number>;
  financialByActivity: Record<string, number>;
}

export async function previewCcaCharges(academicYearId: string): Promise<CCAChargePreviewData | null> {
  const res = (await apiFetch("/api/cca-charges/preview", {
    method: "POST",
    body: JSON.stringify({ academicYearId }),
  })) as ApiSuccess<CCAChargePreviewData>;
  return res.data ?? null;
}

export async function generateCcaCharges(academicYearId: string): Promise<CCAChargeGenerateResult | null> {
  const res = (await apiFetch("/api/cca-charges/generate", {
    method: "POST",
    body: JSON.stringify({ academicYearId }),
  })) as ApiSuccess<CCAChargeGenerateResult>;
  return res.data ?? null;
}

// ---------------------------------------------------------------------------
// Student CCA Charges & Fee Collection API
// ---------------------------------------------------------------------------

export interface StudentCcaCharge {
  id: string;
  assignmentId: string;
  activityId: string;
  activityName: string;
  activityCode?: string | null;
  description: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  balance: number;
  periodMonth: number;
  periodYear: number;
  periodLabel: string;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | string;
  canCollect: boolean;
  createdAt: string;
}

export interface CollectCcaPayload {
  studentId?: string;
  enrollmentId?: string;
  payments: Array<{
    accountId?: string | null;
    amount: number;
    paymentMethod?: string;
  }>;
  allocations: Array<{
    ccaChargeId: string;
    amount: number;
  }>;
}

export interface CollectCcaResult {
  paymentId: string;
  receiptNumber: string;
  totalAmount: number;
  updatedCount: number;
}

export async function getStudentCcaCharges(
  enrollmentOrStudentId: string,
  type: "enrollment" | "student" = "enrollment"
): Promise<StudentCcaCharge[]> {
  const endpoint =
    type === "student"
      ? `/api/cca-charges/student/${enrollmentOrStudentId}`
      : `/api/cca-charges/enrollment/${enrollmentOrStudentId}`;

  const res = (await apiFetch(endpoint)) as ApiSuccess<StudentCcaCharge[]>;
  return res.data ?? [];
}

export async function collectCcaFee(
  payload: CollectCcaPayload
): Promise<CollectCcaResult> {
  const res = (await apiFetch("/api/cca-charges/collect", {
    method: "POST",
    body: JSON.stringify(payload),
  })) as ApiSuccess<CollectCcaResult>;

  if (!res.data) {
    throw new Error(res.message || "Failed to collect CCA fee");
  }
  return res.data;
}


