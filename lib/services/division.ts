import { apiFetch } from "@/lib/api"

export type Division = {
  id: string
  name: string
}

type ApiSuccess<T> = {
  success: boolean
  message?: string
  data?: T
}

export async function getDivisions(classId: string) {
  const payload = (await apiFetch(`/api/divisions/${classId}`)) as ApiSuccess<Division[]>
  return payload.data ?? []
}

export async function createDivisions(classId: string, names: string[]) {
  const payload = (await apiFetch("/api/divisions", {
    method: "POST",
    body: JSON.stringify({ classId, names }),
  })) as ApiSuccess<null>

  return payload
}

export async function updateDivision(id: string, name: string) {
  const payload = (await apiFetch(`/api/divisions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })) as ApiSuccess<null>

  return payload
}