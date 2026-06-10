import { apiFetch } from "@/lib/api"
export interface CreateFeeStructureInput {
  name: string;
  academicYearId: string;
  classId: string;
  isActive: boolean;
  description: string;
  items: FeeStructureItemInput[];
}

export interface FeeStructureItemInput {
  chargeTypeId: string;
  amount: number;
}
export async function createFeeStructure(
  input: CreateFeeStructureInput
) {
  return apiFetch("/api/feestructure", {
    method: "POST",
    body: JSON.stringify(input),
  });
}