import { apiFetch } from "@/lib/api"

export const ACCOUNT_TYPES = [
  "Asset",
  "Income",
  "Expense",
  "Liability",
  "Equity",
] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]

export interface AccountInput {
  name: string
  type: AccountType
  description: string
  isActive: boolean
}

// List item — returned by GET /api/accounts
export interface Account {
  id: string
  name: string
  type: AccountType
  description: string
  isActive: boolean
}

// Detail item — returned by GET /api/accounts/:id
export interface AccountDetail {
  id: string
  name: string
  type: AccountType
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function createAccount(input: AccountInput) {
  return apiFetch("/api/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function getAllAccounts(search?: string) {
  const url = search
    ? `/api/accounts?search=${encodeURIComponent(search)}`
    : "/api/accounts"

  const payload = (await apiFetch(url)) as {
    success: boolean
    message?: string
    data?: Account[]
  }

  return payload.data ?? []
}

export async function getAccountById(id: string) {
  const payload = (await apiFetch(`/api/accounts/${id}`)) as {
    success: boolean
    message?: string
    data?: AccountDetail
  }

  return payload.data ?? null
}

export function updateAccount(id: string, input: AccountInput) {
  return apiFetch(`/api/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteAccount(id: string) {
  return apiFetch(`/api/accounts/${id}`, {
    method: "DELETE",
  })
}