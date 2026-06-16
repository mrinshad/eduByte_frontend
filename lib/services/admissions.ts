import { apiFetch } from "@/lib/api"

type ApiSuccess<T> = {
  success: boolean
  message?: string
  data?: T
}
export interface BackendAdmission {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  divisionId: string;
  feeStructureId: string | null;
  rollNumber: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  admissionNumber?: string;
  fatherName?: string;
  fatherMobile?: string;
  class?: string;
  division?: string;
}

export interface ChargeOverride {
  chargeTypeId: string;
  finalAmount: number;
}

export interface CreateAdmissionPayload {
  id?:string;
  studentId: string;
  academicYearId?: string;
  classId: string;
  divisionId: string;
  feeStructureId: string | null;
  rollNumber: string | null;
  vehicleId: string | null;
  chargeOverrides: ChargeOverride[];
}

export interface CreateAdmissionResponse {
  success: boolean;
  message: string;
}

export interface CompleteEnrollmentRecord {
  enrollmentId: string;
  academicYearName: string;
  classId: string;
  division: string;
  rollNumber: string;
  feeStructureName: string;
  vehicleName: string;
  student: {
    id: string;
    studentName: string;
    admissionNumber: string;
    gender: string;
    dob: string;
    bloodGroup: string;
    status: "ACTIVE" | "INACTIVE";
    fatherName: string;
    fatherMobile: string;
    motherName: string;
    motherMobile: string;
    whatsappNumber: string;
    address: string;
  };
  charges: {
    id: string;
    chargeType: string;
    originalAmount: number;
    finalAmount: number;
    paidAmount: number;
    balanceAmount: number;
  }[];
}

export async function getEnrollmentById(id: string): Promise<CompleteEnrollmentRecord> {
  const payload = await apiFetch(`/api/stdenrollment/${id}`) as { success: boolean; data: CompleteEnrollmentRecord };
  return payload.data;
}

export async function getStudentAdmissions() {
  const payload = (await apiFetch("/api/stdenrollment")) as ApiSuccess<BackendAdmission[]>;
  return payload.data ?? [];
}

export async function createStudentAdmission(
  payload: CreateAdmissionPayload
): Promise<CreateAdmissionResponse> {
  const response = await apiFetch("/api/stdenrollment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response as CreateAdmissionResponse;
}
export async function updateStudentAdmission(
  enrollmentId: string,
  payload: CreateAdmissionPayload
): Promise<CreateAdmissionResponse> {
  const response = await apiFetch(`/api/stdenrollment/${enrollmentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response as CreateAdmissionResponse;
}
