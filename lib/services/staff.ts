import { apiFetch } from "@/lib/api";

export interface StaffInput {
  employeeCode: string;
  name: string;
  phone: string;
  email: string;
  joiningDate: string; // ISO date-time string, e.g. "2026-07-01T00:00:00Z"
  status: "ACTIVE" | "INACTIVE";
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

// The GET /api/staff endpoint returns the full staff list directly under
// `data`, so the list item shape is the same as the full Staff record.
export type StaffListItem = Staff;

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export interface StaffListResponse {
  success: boolean;
  message?: string;
  data: StaffListItem[];
}

// POST /api/staff and PUT /api/staff/:id only return { success, message } —
// no `data` payload is echoed back.
export interface StaffMutationResponse {
  success: boolean;
  message: string;
}

// ── Get All Staff ──
// NOTE: unlike /api/students, /api/staff does not currently return
// pagination metadata — it returns the full array in `data`. If the
// backend adds page/limit/search/pagination later, mirror getStudents()
// in student.ts (send params, read payload.data.items + pagination).
export async function getStaff(): Promise<StaffListResponse> {
  const payload = (await apiFetch("/api/staff")) as ApiSuccess<StaffListItem[]>;

  return {
    success: payload.success,
    message: payload.message,
    data: Array.isArray(payload.data) ? payload.data : [],
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