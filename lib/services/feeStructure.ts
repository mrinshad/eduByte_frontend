import { apiFetch } from "@/lib/api";

export interface FeeStructureItemInput {
  chargeTypeId: string;
  amount: number;
}
export interface FeeStructureView {
  id: string;
  name: string;
  description: string | null;
  academicYearName: string;
  className: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: {
    chargeTypeName: string;
    amount: string;
  }[];
}
export interface CreateFeeStructureInput {
  name: string;
  academicYearId: string;
  classId: string;
  isActive: boolean;
  description: string;
  items: FeeStructureItemInput[];
}

export interface FeeStructureSummary {
  id: string;
  name: string;
  className: string;
  academicYear: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function getFeeStructures() {
  const payload = (await apiFetch(
    "/api/feestructure"
  )) as ApiSuccess<FeeStructureSummary[]>;

  return payload.data ?? [];
}

export async function createFeeStructure(
  input: CreateFeeStructureInput
) {
  return apiFetch("/api/feestructure", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export async function viewFeeStructure(id: string) {
  const payload = await apiFetch(
    `/api/feestructure/view/${id}`
  );

  return payload as {
    success: boolean;
    message: string;
    data: FeeStructureView;
  };
}
export async function GetEditFeeStructure(id:string){
  const payload = await apiFetch(
    `/api/feestructure/edit/${id}`
  )
}
export async function EditFeeStructure(
  id: string,
  input: CreateFeeStructureInput
){
    return apiFetch(`/api/feestructure/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}