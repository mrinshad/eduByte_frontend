import { apiFetch } from "@/lib/api";

export interface FeeStructureItemInput {
  chargeTypeId: string;
  amount: number;
}
export interface FeeStructureView {
  id: string;
  name: string;
  description: string | null;
  academicYearId: string;
  academicYearName: string;
  className: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: {
    chargeTypeId: string;
    chargeTypeName: string;
    frequency: string;
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
  classId: string;
  className: string;
  academicYearId: string;
  academicYearName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface FeeStructureListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function getFeeStructures(params?: {
  page?: number;
  limit?: number;
  search?: string;
  className?: string;
  academicYear?: string;
  status?: "all" | "active" | "inactive";
}) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 10),
    search: params?.search ?? "",
    className: params?.className ?? "",
    academicYear: params?.academicYear ?? "",
    status: params?.status ?? "all",
  });

  const payload = (await apiFetch(
    `/api/feestructure?${query.toString()}`
  )) as ApiSuccess<{
    items: FeeStructureSummary[];
    pagination: FeeStructureListPagination;
  }>;

  return {
    items: payload.data?.items ?? [],
    pagination: payload.data?.pagination ?? {
      page: 1,
      limit: params?.limit ?? 10,
      total: 0,
      totalPages: 1,
    },
  };
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
export async function GetEditFeeStructure(id: string) {
  const payload = await apiFetch(
    `/api/feestructure/edit/${id}`
  );

  return payload as {
    success: boolean;
    message: string;
    data: FeeStructureView;
  };
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

export async function deleteFeeStructure(id: string) {
  return apiFetch(`/api/feestructure/${id}`, {
    method: "DELETE",
  }) as Promise<{
    success: boolean;
    message: string;
  }>;
}