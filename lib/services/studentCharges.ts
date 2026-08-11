import { apiFetch } from "@/lib/api";
import { authFetch } from "@/lib/auth";

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

type ApiError = {
  success: false;
  message?: string;
  errors?: unknown;
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

export type CatchUpChargeItem = {
  studentName: string;
  admissionNumber: string;
  chargeType: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  periodName: string;
};

export type FeeGenerationPreviewSummary = {
  activeStudents: number;
  enrollmentChargesEvaluated: number;
  chargesToGenerate: number;
  alreadyGenerated: number;
  studentsWithNoCharges: number;
  catchUpChargesCount?: number;
};

export type FeeGenerationMonthStatus = {
  lastGeneratedMonthNumber: number;
  lastGeneratedPeriod: string;
  currentTargetMonthNumber: number;
  currentTargetPeriod: string;
  upcomingMonthNumber: number | null;
  upcomingPeriod: string;
  totalAcademicMonths: number;
};

export type FeeGenerationPreviewData = {
  academicYearId: string;
  academicYearName: string;
  targetAcademicMonth: number;
  targetCalendarMonth: number;
  targetCalendarYear: number;
  targetPeriod?: string;
  monthStatus?: FeeGenerationMonthStatus;
  instructions?: string;
  summary: FeeGenerationPreviewSummary;
  chargesBreakdown: Record<string, number>;
  frequencyBreakdown: Record<string, number>;
  financialSummary: {
    byChargeType: Record<string, number>;
    total: number;
  };
  catchUpCharges?: CatchUpChargeItem[];
  skipped?: {
    alreadyGenerated: number;
  };
  validation: Record<string, boolean>;
  warnings?: string[];
  sampleCharges: Array<{
    enrollmentId: string;
    chargeType: string;
    amount: number;
    dueDate: string;
  }>;
  sampleShowing: number;
  sampleTotal: number;
  confirmation: {
    willCreateCharges: number;
    willUpdateAcademicYear: boolean;
    willAdvanceTo: number;
  };
};

export type FeeGenerationResult = {
  academicYearId: string;
  academicYearName: string;
  targetAcademicMonth: number;
  targetCalendarMonth: number;
  targetCalendarYear: number;
  studentsProcessed: number;
  enrollmentChargesEvaluated: number;
  chargesDue: number;
  chargesGenerated: number;
  chargesSkipped: number;
  lastGeneratedAcademicMonth: number;
};

async function postStudentChargeAction<T>(endpoint: string, body: unknown) {
  const response = await authFetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiError
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `API Error: ${response.status}`);
  }

  return payload as ApiSuccess<T>;
}

export async function previewFeeGeneration(academicYearId: string) {
  const payload = await postStudentChargeAction<FeeGenerationPreviewData>(
    "/api/stdcharge/preview",
    { academicYearId }
  );

  return payload.data ?? null;
}

export async function generateFeeCharges(academicYearId: string) {
  const payload = await postStudentChargeAction<FeeGenerationResult>(
    "/api/stdcharge/generate",
    { academicYearId }
  );

  return payload.data ?? null;
}