import { apiFetch } from "@/lib/api"

export const ACCOUNT_TYPES = [
  "PAYMENT_METHOD",
  "INCOME",
  "EXPENSE",
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
  balance?: number
  totalIn?: number
  totalOut?: number
}

// Detail item — returned by GET /api/accounts/:id
export interface AccountDetail {
  id: string
  name: string
  type: AccountType
  description: string
  isActive: boolean
  balance?: number
  totalIn?: number
  totalOut?: number
  createdAt: string
  updatedAt: string
}

export interface TransferFundsInput {
  fromAccountId: string
  toAccountId: string
  amount: number
  date?: string
  notes?: string
}

export interface AccountSummary {
  account: Account
  balance: number
  totalIn: number
  totalOut: number
  recentTransactions: Array<{
    id: string
    transactionId: string
    date: string
    description: string
    referenceType: string
    type: "DEBIT" | "CREDIT"
    amount: number
  }>
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

export async function transferFunds(input: TransferFundsInput) {
  return apiFetch("/api/accounts/transfer", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function getAccountSummary(id: string) {
  const payload = (await apiFetch(`/api/accounts/${id}/summary`)) as {
    success: boolean
    message?: string
    data?: AccountSummary
  }

  return payload.data ?? null
}

export interface RevolvingFundTransaction {
  id: string
  transactionId?: string
  transactionNumber: string
  date: string
  description: string
  notes?: string | null
  flowType: "INFLOW" | "OUTFLOW"
  inflow: number
  outflow: number
  runningBalance: number
}

export interface RevolvingFundStatementResponse {
  account: {
    id: string
    name: string
    type: string
    liveBalance: number
  }
  period: {
    from: string
    to: string
  }
  summary: {
    openingBalance: number
    totalInflow: number
    totalOutflow: number
    netMovement: number
    closingBalance: number
    liveBalance: number
    transactionCount: number
  }
  transactions: RevolvingFundTransaction[]
}

export async function getRevolvingFundStatement(params?: { from?: string; to?: string }) {
  const query = new URLSearchParams()
  if (params?.from) query.set("from", params.from)
  if (params?.to) query.set("to", params.to)

  const qs = query.toString() ? `?${query.toString()}` : ""
  const payload = (await apiFetch(`/api/accounts/revolving-fund/statement${qs}`)) as {
    success: boolean
    message?: string
    data?: RevolvingFundStatementResponse
  }

  return payload.data ?? null
}