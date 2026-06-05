import { apiFetch } from "@/lib/api"

export type SchoolClass = {
  id: string
  name: string
}

type ApiSuccess<T> = {
  success: boolean
  message?: string
  data?: T
}

export async function getClasses() {
  const payload = (await apiFetch("/api/classes")) as ApiSuccess<SchoolClass[]>
  return payload.data ?? []
}

export async function createClass(name: string) {
  const payload = (await apiFetch("/api/classes", {
    method: "POST",
    body: JSON.stringify({ name }),
  })) as ApiSuccess<null>

  return payload
}

export async function updateClass(id: string, name: string) {
  const payload = (await apiFetch(`/api/classes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })) as ApiSuccess<null>

  return payload
}