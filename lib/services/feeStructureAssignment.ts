import { apiFetch } from "@/lib/api";

export interface UnassignedFeeStudent {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  fatherName: string | null;
  classId: string;
  className: string;
  divisionId: string;
  divisionName: string;
  feeStructureId: string | null;
  feeStructureName: string | null;
  isAssigned: boolean;
}

export interface FeeAssignmentSummary {
  total: number;
  assigned: number;
  unassigned: number;
}

export interface BulkAssignPayload {
  enrollmentIds: string[];
  feeStructureId: string;
}

export interface BulkAssignResult {
  count: number;
  feeStructureName: string;
}

export async function getEnrollmentsWithoutFeeStructure(
  academicYearId: string,
  classId: string,
  divisionId?: string,
  status?: "UNASSIGNED" | "ALL"
) {
  const query = new URLSearchParams({
    academicYearId,
    classId,
    ...(divisionId && divisionId !== "all" && { divisionId }),
    ...(status && { status }),
  });

  const response = (await apiFetch(
    `/api/stdenrollment/without-fee-structure?${query.toString()}`
  )) as {
    success: boolean;
    data: {
      summary: FeeAssignmentSummary;
      students: UnassignedFeeStudent[];
    };
    message?: string;
  };

  return (
    response.data ?? {
      summary: { total: 0, assigned: 0, unassigned: 0 },
      students: [],
    }
  );
}

export async function bulkAssignFeeStructure(payload: BulkAssignPayload) {
  const response = (await apiFetch(
    "/api/stdenrollment/bulk-assign-fee-structure",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )) as {
    success: boolean;
    data: BulkAssignResult;
    message?: string;
  };

  return response;
}
