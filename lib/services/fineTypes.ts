import { apiFetch } from "@/lib/api"
export type FineStatus = "PENDING" | "PAID" | "PARTIAL" | string
 
export type StudentFine = {
  id: string
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
 
export async function getStudentFines(params?: {
  search?: string
  page?: number
  limit?: number
}): Promise<GetStudentFinesResult> {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))
 
  const qs = query.toString()
  const payload = (await apiFetch(`/api/stdfines${qs ? `?${qs}` : ""}`)) as {
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
 
export async function getFineTypes(params?: { search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))
 
  const qs = query.toString()
  const payload = (await apiFetch(`/api/finetypes${qs ? `?${qs}` : ""}`)) as {
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