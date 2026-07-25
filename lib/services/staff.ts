import { apiFetch } from "@/lib/api";

export interface StaffInput {
  employeeCode: string;
  name: string;
  phone: string;
  email: string;
  joiningDate: string; // ISO date-time string, e.g. "2026-07-01T00:00:00Z"
  status ?: "ACTIVE" | "INACTIVE";
}

export interface Staff {
  id: string;
  employeeCode: string;
  name: string;
  phone: string;
  email: string;
  joiningDate: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffListItem {
  id: string;
  employeeCode: string;
  name: string;
  phone: string;
  email: string;
  joiningDate: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export interface StaffListResponse {
  success: boolean;
  message?: string;
  data: {
    items: StaffListItem[];
    pagination: StaffPagination;
  };
}


export interface GetStaffParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

// POST /api/staff and PUT /api/staff/:id only return { success, message } —
// no `data` payload is echoed back.
export interface StaffMutationResponse {
  success: boolean;
  message: string;
}

const DEFAULT_PAGINATION: StaffPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

// ── Get All Staff ──
// Server-side pagination, search, status filter, and sort.
export async function getStaff(params: GetStaffParams = {}): Promise<StaffListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.order) query.set("order", params.order);

  const qs = query.toString();
  const payload = (await apiFetch(`/api/staff${qs ? `?${qs}` : ""}`)) as ApiSuccess<{
    items: StaffListItem[];
    pagination: StaffPagination;
  }>;

  return {
    success: payload.success,
    message: payload.message,
    data: {
      items: payload.data?.items ?? [],
      pagination: payload.data?.pagination ?? DEFAULT_PAGINATION,
    },
  };
}

// ── Get Staff By Id ──
export async function getStaffById(id: string): Promise<Staff | null> {
  const payload = (await apiFetch(`/api/staff/${id}`)) as ApiSuccess<Staff>;
  return payload.data ?? null;
}

// ── Create Staff ──
export async function createStaff(input: StaffInput): Promise<StaffMutationResponse> {
  return apiFetch("/api/staff", {
    method: "POST",
    body: JSON.stringify(input),
  }) as Promise<StaffMutationResponse>;
}

// ── Update Staff ──
export async function updateStaff(id: string, input: StaffInput): Promise<StaffMutationResponse> {
  return apiFetch(`/api/staff/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  }) as Promise<StaffMutationResponse>;
}

// ── Delete Staff ──
export async function deleteStaff(id: string): Promise<StaffMutationResponse> {
  return apiFetch(`/api/staff/${id}`, {
    method: "DELETE",
  }) as Promise<StaffMutationResponse>;
}