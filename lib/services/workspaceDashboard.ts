import { apiFetch } from "@/lib/api"

type ApiSuccess<T> = {
  success: boolean
  message?: string
  data?: T
}

// ---------------------------------------------------------------------
// GET /api/workspacedashboard/dashboard-stats
// ---------------------------------------------------------------------

export type WorkspaceDashboardStats = {
  todayCollection: number
  todayCollectionDelta: number | null
  weekCollection: number
  weekCollectionDelta: number | null
  monthExpenses: number
  monthExpensesDelta: number | null
  outstandingFees: number
  pendingFines: number
}

const EMPTY_WORKSPACE_STATS: WorkspaceDashboardStats = {
  todayCollection: 0,
  todayCollectionDelta: null,
  weekCollection: 0,
  weekCollectionDelta: null,
  monthExpenses: 0,
  monthExpensesDelta: null,
  outstandingFees: 0,
  pendingFines: 0,
}

export async function getWorkspaceDashboardStats(): Promise<WorkspaceDashboardStats> {
  const payload = (await apiFetch(
    "/api/workspacedashboard/dashboard-stats"
  )) as ApiSuccess<WorkspaceDashboardStats>
  return payload.data ?? EMPTY_WORKSPACE_STATS
}

// ---------------------------------------------------------------------
// GET /api/workspacedashboard/amount-by-feecollection
// Last 7 days of fee collection, used for the weekly trend bar chart.
// ---------------------------------------------------------------------

export type WeeklyCollectionPoint = {
  label: string
  amount: number
}

export async function getWeeklyCollection(): Promise<WeeklyCollectionPoint[]> {
  const payload = (await apiFetch(
    "/api/workspacedashboard/amount-by-feecollection"
  )) as ApiSuccess<WeeklyCollectionPoint[]>
  return payload.data ?? []
}

// ---------------------------------------------------------------------
// GET /api/workspacedashboard/amount-by-category
// Expense breakdown by category. The API returns `value` as a string
// (e.g. "300"), so it's normalized to a number here.
// ---------------------------------------------------------------------

export type ExpenseByCategoryPoint = {
  name: string
  value: number
}

type RawExpenseByCategoryPoint = {
  name: string
  value: string | number
}

export async function getExpenseByCategory(): Promise<ExpenseByCategoryPoint[]> {
  const payload = (await apiFetch(
    "/api/workspacedashboard/amount-by-category"
  )) as ApiSuccess<RawExpenseByCategoryPoint[]>

  return (payload.data ?? []).map((entry) => ({
    name: entry.name,
    value: Number(entry.value) || 0,
  }))
}

// ---------------------------------------------------------------------
// GET /api/workspacedashboard/amount-by-payment
// Collection split by payment method.
// ---------------------------------------------------------------------

export type PaymentMethodPoint = {
  name: string
  value: number
}

export async function getPaymentMethodSplit(): Promise<PaymentMethodPoint[]> {
  const payload = (await apiFetch(
    "/api/workspacedashboard/amount-by-payment"
  )) as ApiSuccess<PaymentMethodPoint[]>
  return payload.data ?? []
}