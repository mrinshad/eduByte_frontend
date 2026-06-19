import { apiFetch } from "@/lib/api";

export interface StudentCharge {
  admissionNumber: string;
  student: string;
  class: string;
  finalAmount?: number;
  paidAmount?: number;
  enrollmentId: string;
  status: string;
}

export interface StudentChargeResponse {
  success: boolean;
  message: string;
  data: StudentCharge[];
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function getStudentCharges() {
  const payload = (await apiFetch(
    "/api/stdcharge/admission-no"
  )) as ApiSuccess<StudentCharge[]>;

  return payload.data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Get all charges for a single student enrollment                    */
/*  GET /api/stdcharge/enrollment/:enrollmentId?status=PENDING         */
/*                                                                      */
/*  NOTE: matches the real response shape — student info comes back   */
/*  nested under `studentDetails`, and the enrollment fields are flat  */
/*  (enrollmentId, academicYearId, feeStructureId, status) rather than */
/*  the earlier `id` / classId / divisionId / rollNumber shape.        */
/* ------------------------------------------------------------------ */

export type ChargeStatus = "PENDING" | "PARTIAL" | "PAID";

export interface EnrollmentCharge {
  id: string;
  enrollmentId: string;
  chargeTypeId: string;
  description: string;
  originalAmount: string;
  discountAmount: string;
  finalAmount: string;
  paidAmount: string;
  dueDate: string;
  periodMonth: number;
  periodYear: number;
  status: ChargeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentStudentDetails {
  id: string;
  studentName: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  whatsappNumber: string;
  address: string;
  status: string;
  rollNumber: string;
  class: string;
  division: string;
}

export interface StudentEnrollmentCharges {
  enrollmentId: string;
  academicYearId: string;
  feeStructureId: string | null;
  status: string;
  studentDetails: EnrollmentStudentDetails;
  charges: EnrollmentCharge[];
}

export interface StudentEnrollmentChargesResponse {
  success: boolean;
  message: string;
  data: StudentEnrollmentCharges;
}

/**
 * Fetch student details + all charges for a single enrollment.
 * Pass `status` to filter server-side; omit it to get every charge so
 * PENDING / PARTIAL / PAID can all be shown together, sorted client-side.
 */
export async function getStudentChargesByEnrollmentId(
  enrollmentId: string,
  status?: ChargeStatus
) {
  const query = status ? `?status=${status}` : "";

  const payload = (await apiFetch(
    `/api/stdcharge/enrollment/${enrollmentId}${query}`
  )) as ApiSuccess<StudentEnrollmentCharges>;

  return payload.data ?? null;
}