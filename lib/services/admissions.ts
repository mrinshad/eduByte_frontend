import { apiFetch } from "@/lib/api"
 
type ApiSuccess<T> = {
  success: boolean
  message?: string
  data?: T
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  feeStructureName?: string;
  vehicleName?: string | null;
  vehicleNumber?: string | null;
}
 
export interface ChargeOverride {
  chargeTypeId: string;
  frequency?: string;
  currentAmount?: number;
  originalAmount?: number;
  finalAmount: number;
  discountAmount: number;
  description: string | null;
  dueDay: number | null;
}
 
export interface EnrollmentCharge {
  id?: string;
  chargeTypeId: string;
  originalAmount: string;
  finalAmount: string;
  discountAmount: string;
  description: string | null;
  dueDay: number | null;
}
 
export interface CreateAdmissionPayload {
  id?: string;
  studentId: string;
  academicYearId?: string;
  classId: string;
  divisionId: string;
  feeStructureId: string | null;
  rollNumber: string | null;
  vehicleId: string | null;
  chargeOverrides: ChargeOverride[];
}
 
export interface UpdateAdmissionPayload {
  classId: string;
  divisionId: string;
  feeStructureId: string | null;
  rollNumber: string | null;
  vehicleId: string | null;
  enrollmentCharges: EnrollmentCharge[];
}
 
export interface CreateAdmissionResponse {
  success: boolean;
  message: string;
}

export interface AdmissionsListResponse {
  items: BackendAdmission[];
  pagination: PaginationMeta;
}
 
interface RawEnrollmentCharge {
  id: string;
  enrollmentId: string;
  chargeTypeId: string;
  frequency: string;
  chargeType?: { name: string; category?: string | null };
  description: string | null;
  originalAmount: string;
  discountAmount: string;
  finalAmount: string;
  dueDay: number | null;
  createdAt: string;
  updatedAt: string;
}
 
interface RawEnrollmentRecord {
  enrollmentId: string;
  academicYearName: string;
  classId: string;
  division: string;
  rollNumber: string;
  feeStructureName: string;
  vehicleName: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  student: CompleteEnrollmentRecord["student"];
  enrollmentCharges: RawEnrollmentCharge[];
}
 
export interface CompleteEnrollmentRecord {
  enrollmentId: string;
  academicYearName: string;
  classId: string;
  division: string;
  rollNumber: string;
  feeStructureName: string;
  vehicleName: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
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
    chargeTypeId: string;
    frequency: string;
    chargeType: string;
    category: string | null;
    description: string | null;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    dueDay: number | null;
    status: string;
    periodMonth: number | null;
    periodYear: number | null;
  }[];
}
 
export async function getEnrollmentById(id: string): Promise<CompleteEnrollmentRecord> {
  const payload = (await apiFetch(`/api/stdenrollment/${id}`)) as {
    success: boolean;
    data: RawEnrollmentRecord;
  };
 
  const raw = payload.data;
 
  const charges = (raw.enrollmentCharges ?? []).map((c) => {
    const originalAmountRaw = Number(c.originalAmount) || 0;
    const discountAmount = Number(c.discountAmount) || 0;
    const finalAmount = Number(c.finalAmount) || 0;
    const originalAmount =
      originalAmountRaw > 0
        ? originalAmountRaw
        : Math.max(finalAmount + discountAmount, 0);
 
    return {
      id: c.id,
      chargeTypeId: c.chargeTypeId,
      chargeType: c.chargeType?.name || "Charge",
      category: c.chargeType?.category ?? null,
      description: c.description,
      frequency: c.frequency,
      originalAmount,
      discountAmount,
      finalAmount,
      paidAmount: 0,
      balanceAmount: finalAmount,
      dueDay: c.dueDay ?? null,
      status: "PENDING",
      periodMonth: null,
      periodYear: null,
    };
  });
 
  return {
    enrollmentId: raw.enrollmentId,
    academicYearName: raw.academicYearName,
    classId: raw.classId,
    division: raw.division,
    rollNumber: raw.rollNumber,
    feeStructureName: raw.feeStructureName,
    vehicleName: raw.vehicleName,
    vehicleNumber: raw.vehicleNumber,
    driverName: raw.driverName,
    student: raw.student,
    charges,
  };
}
 
export async function getStudentAdmissions(params: {
  page?: number;
  limit?: number;
  search?: string;
  className?: string;
  feeStructure?: string;
} = {}): Promise<AdmissionsListResponse> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.className) query.set("className", params.className);
  if (params.feeStructure) query.set("feeStructure", params.feeStructure);

  const payload = (await apiFetch(
    `/api/stdenrollment${query.toString() ? `?${query.toString()}` : ""}`
  )) as ApiSuccess<{
    items?: BackendAdmission[];
    pagination?: PaginationMeta;
  }>;

  const data = payload.data;

  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        total: data.length,
        totalPages: 1,
      },
    };
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: 0,
      totalPages: 1,
    },
  };
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
  payload: UpdateAdmissionPayload
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