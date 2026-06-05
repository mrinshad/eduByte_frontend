import { apiFetch } from "@/lib/api"

export type AcademicYearSummary = {
  id: string
  name: string
  isActive: boolean
}

export type AcademicYearDetails = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type AcademicYearInput = {
  name: string
  startDate: string
  endDate: string
}

type ApiSuccess<T> = {
  success: boolean
  message?: string
  data?: T
}

export async function getAcademicYears() {
  const payload = (await apiFetch("/api/academicyear")) as ApiSuccess<AcademicYearSummary[]>
  return payload.data ?? []
}

export async function getAcademicYearById(id: string) {
  const payload = (await apiFetch(`/api/academicyear/${id}`)) as ApiSuccess<AcademicYearDetails>
  return payload.data ?? null
}

export async function createAcademicYear(input: AcademicYearInput) {
  const payload = (await apiFetch("/api/academicyear", {
    method: "POST",
    body: JSON.stringify(input),
  })) as ApiSuccess<null>

  return payload
}

export async function updateAcademicYear(id: string, input: AcademicYearInput) {
  const payload = (await apiFetch(`/api/academicyear/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })) as ApiSuccess<null>

  return payload
}

export async function getDefaultAcademicYear() {
  const payload = (await apiFetch("/api/academicyear/get/default")) as ApiSuccess<{
    name: string
    startDate: string
    endDate: string
  }>

  return payload.data ?? null
}

export async function setDefaultAcademicYear(id: string) {
  const payload = (await apiFetch("/api/academicyear/set/default", {
    method: "PUT",
    body: JSON.stringify({ id }),
  })) as ApiSuccess<null>

  return payload
}