import { apiFetch } from "@/lib/api";

export interface PromotionStudent {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  fatherName: string | null;
  divisionId: string | null;
  divisionName: string | null;
  outstandingDues: number;
  feeDue: number;
  fineDue: number;
  vehicleAssignment: {
    vehicleId: string;
    vehicleName: string;
    vehicleNumber: string;
  } | null;
}

export interface PromotionSummary {
  total: number;
  promoted: number;
  withdrawn: number;
  completed: number;
  remaining: number;
}

export interface PromotionPayloadStudent {
  enrollmentId: string;
  carryForwardDues: boolean;
  carryForwardVehicle: boolean;
  vehicleId: string | null;
}

export interface PromoteStudentsPayload {
  sourceAcademicYearId: string;
  targetAcademicYearId: string;
  targetClassId: string;
  targetDivisionId: string;
  students: PromotionPayloadStudent[];
}

export interface PromoteStudentsResult {
  promoted: number;
  rollNumbers: Array<{ studentName: string; rollNumber: string }>;
}

export async function getStudentsForPromotion(
  academicYearId: string,
  classId: string
) {
  const query = new URLSearchParams({
    academicYearId,
    classId,
  });

  const response = (await apiFetch(
    `/api/promotion/students?${query.toString()}`
  )) as {
    success: boolean;
    data: { summary: PromotionSummary; students: PromotionStudent[] };
    message?: string;
  };

  return (
    response.data ?? {
      summary: { total: 0, promoted: 0, withdrawn: 0, completed: 0, remaining: 0 },
      students: [],
    }
  );
}

export async function promoteStudents(payload: PromoteStudentsPayload) {
  const response = (await apiFetch("/api/promotion/promote", {
    method: "POST",
    body: JSON.stringify(payload),
  })) as {
    success: boolean;
    data: PromoteStudentsResult;
    message?: string;
  };
  return response;
}

export async function completeStudents(enrollmentIds: string[]) {
  const response = (await apiFetch("/api/promotion/complete", {
    method: "PATCH",
    body: JSON.stringify({ enrollmentIds }),
  })) as {
    success: boolean;
    data: { completed: number };
    message?: string;
  };
  return response;
}
