import { apiFetch } from "@/lib/api"

export type ChargeCategory =
  | "TUITION"
  | "TRANSPORT"
  | "ADMISSION"
  | "BOOK"
  | "MADRASA"
  | "EXAM"
  | "OTHER"

export type chargeType = {
    name: string,
    category: ChargeCategory | "",
    frequency: string,
    incomeAccountId: string
}
export interface ChargeTypes {
  id: string
  name: string
  category: ChargeCategory | null
  frequency: string
  incomeAccount: {
    id: string
    name: string
  } | null
  createdAt: string
}
export function createChargeType(input: chargeType) {
return apiFetch("/api/chargetype", {
        method: "POST",
        body: JSON.stringify(input)
    })
}
export async function getChargeTypes() {
const payload = (await apiFetch("/api/chargetype")) as {
        success: boolean,
        message?: string,
        data?: ChargeTypes[]
    }
return payload.data ?? []
}
export async function updateChargeType(
  id: string,
  input: chargeType
) {
return apiFetch(`/api/chargetype/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}