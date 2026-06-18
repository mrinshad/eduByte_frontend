import { apiFetch } from "@/lib/api"
 
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