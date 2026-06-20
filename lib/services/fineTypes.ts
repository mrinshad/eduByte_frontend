import { apiFetch } from "@/lib/api"
export type FineStatus = "PENDING" | "PAID" | "PARTIAL" | string
 type ApiSuccess<T> = {
  success: boolean
  message?: string
  data?: T
}
export type StudentFine = {
  id: string
  enrollmentId:string,
  fineId:string,
  admissionNumber: string
  student: string
  fine: string
  reason: string
  amount: string
  paidAmount: string
  balanceAmount: string
  status: FineStatus
}
 
export type StudentFinesMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}
 
export type GetStudentFinesResult = {
  data: StudentFine[]
  meta: StudentFinesMeta | null
}
 export interface StudentAdmissionAndName {
  id: string;
  enrollmentId: string;
  admissionNumber: string;
  studentName: string;
}
export type StudentFineDetail = {
  id: string;
  enrollmentId: string;
  admissionNumber: string;
  student: string;
  class: string | null;
  division: string | null;
  rollNumber: number | string | null;
  fineId: string;
  fine: string;
  reason: string;
  isReversed: boolean;
  reversalReason: string | null;
  amount: string;
  paidAmount: string;
  balanceAmount: string;
  status: string;
};
 
export async function getStudentFineById(id: string) {
  const payload = await apiFetch(`/api/stdfines/${id}`)
  return payload.data
}
 
export async function getStudentFines(params?: {
  search?: string
  page?: number
  limit?: number
}): Promise<GetStudentFinesResult> {
  const query = new URLSearchParams()
 
  const qs = query.toString()
  const payload = (await apiFetch(`/api/stdfines`)) as {
    success: boolean
    message?: string
    data?: StudentFine[]
    meta?: StudentFinesMeta
  }
 
  return {
    data: payload.data ?? [],
    // Will be null until the backend actually sends pagination meta.
    // The page component falls back to client-side slicing in that case.
    meta: payload.meta ?? null,
  }
}
export type FineType = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
 
type FineTypeInput = {
  name: string
}
 
type BulkFineTypeInput = {
  names: string[]
}
export interface StudentFineInput  {
    enrollmentId: string;
    fineTypeId: string;
    amount: number;
    reason: string;
}
 
export function createStudentFine(input: StudentFineInput) {
  return apiFetch("/api/stdfines", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
 
export async function getFineTypes() {
 
  const payload = (await apiFetch(`/api/finetypes`)) as {
    success: boolean
    message?: string
    data?: FineType[]
  }
  return payload.data ?? []
}
 
export function createFineTypes(input: BulkFineTypeInput) {
  return apiFetch("/api/finetypes", {
    method: "POST",
    body: JSON.stringify(input),
  })
}
 
export function updateFineType(id: string, input: FineTypeInput) {
  return apiFetch(`/api/finetypes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}
export async function getStudentAdmissionAndName() {
  const payload = (await apiFetch(
    `/api/stdfines/stdenid-name`
  )) as ApiSuccess<StudentAdmissionAndName[]>;

  return payload.data ?? [];
}
export function updateStudentFine(
  id:string,
  input:StudentFineInput
){
  return apiFetch(`/api/stdfines/${id}`,{
    method:"PUT",
    body:JSON.stringify(input),
  });
}
export function reverseStudentFine(
  id: string,
  reversalReason: string
) {
  return apiFetch(`/api/stdfines/reversed/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      reversalReason,
    }),
  });
}