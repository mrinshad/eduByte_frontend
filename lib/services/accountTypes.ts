import {apiFetch} from "@/lib/api"

export type accountName = {
    id: string,
    name: string
}
type ApiSuccess<T> = {
    success: boolean,
    message?: string,
    data?: T
}
export async function getAccountTypes() {
    const payload = (await apiFetch("/api/accounts")) as ApiSuccess<accountName[]>
    return payload.data ?? []
}
export async function getNonPayment() {
    const payload = (await apiFetch("/api/accounts/non-payment-accounts")) as ApiSuccess<accountName[]>
    return payload.data ?? []
}