import { apiFetch } from "@/lib/api";

export interface studentFeeCollection {
    enrollmentId: string,
    admissionNumber: string,
    student: string,
    class: string,
    vehicle: string,
    TotalDue: number
}
export interface StudentDetailsResponse {
  success: boolean;
  data: EnrollmentDetails;
}

export interface EnrollmentDetails {
  enrollmentId: string;
  academicYearName: string;
  classId: string;
  division: string;
  rollNumber: string;
  feeStructureName: string;
  vehicleName: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  student: Student;
  enrollmentCharges: EnrollmentCharge[];
}

export interface Student {
  id: string;
  studentName: string;
  admissionNumber: string;
  gender: "MALE" | "FEMALE" | string;
  dob: string;
  bloodGroup: string;
  status: "ACTIVE" | "INACTIVE";
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  whatsappNumber: string;
  address: string;
}

export interface EnrollmentCharge {
  id: string;
  enrollmentId: string;
  chargeTypeId: string;
  description: string;
  frequency: "MONTHLY" | "YEARLY" | "ONE_TIME" | "QUARTERLY";
  generationStartAcademicMonth: number;
  isActive: boolean;
  originalAmount: number | string;
  discountAmount: number | string;
  finalAmount: number | string;
  dueDay: number;
  createdAt: string;
  updatedAt: string;
  chargeType: ChargeType;
}

export interface ChargeType {
  id: string;
  name: string;
  frequency: "MONTHLY" | "YEARLY" | "ONE_TIME" | "QUARTERLY";
}

//get all feecollection for table
export async function getStudentDetails(enrollmentId: string) {
  const payload = (await apiFetch(
    `/api/feecollection/${enrollmentId}`
  )) as StudentDetailsResponse;

  return payload.data;
}
export async function getStudentFeeCollection() {

    const payload = (await apiFetch("/api/feecollection/stdlist")) as {
        success: boolean,
        message?: string,
        data?: studentFeeCollection[];
    };
    return payload.data ?? [];
}

// ---------------------------------------------------------------------------
// Outstanding Charges / Fines / Collect Payment
// ---------------------------------------------------------------------------

export interface StudentCharge {
  id: string;
  chargeTypeId: string;
  chargeType: string;
  frequency: "MONTHLY" | "YEARLY" | "ONE_TIME" | "QUARTERLY";
  description: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  balance: number;
  dueDay: number;
  dueDate: string;
  periodMonth: number | null;
  periodYear: number | null;
  status: "PAID" | "PARTIALLY_PAID" | "PENDING" | string;
  canCollect: boolean;
  createdAt: string;
}

export interface Fine {
  id: string;
  fineTypeId: string;
  fineType: string;
  reason: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: "PAID" | "PARTIALLY_PAID" | "PENDING" | string;
  canCollect: boolean;
  createdAt: string;
}

export async function getStudentCharges(enrollmentId: string) {
  const payload = (await apiFetch(
    `/api/feecollection/${enrollmentId}/charges`
  )) as { success: boolean; count: number; data: StudentCharge[] };
  return payload.data ?? [];
}

export async function getStudentFines(enrollmentId: string) {
  const payload = (await apiFetch(
    `/api/feecollection/${enrollmentId}/fines`
  )) as { success: boolean; count: number; data: Fine[] };
  return payload.data ?? [];
}

export interface CollectPaymentLine {
  accountId: string;
  amount: number;
}

export interface CollectAllocation {
  studentChargeId?: string;
  fineId?: string;
  amount: number;
}

export interface CollectFeePayload {
  enrollmentId: string;
  payments: CollectPaymentLine[];
  allocations: CollectAllocation[];
  zeroChargeIds?: string[];
}

export interface CollectFeeResponse {
  success: boolean;
  data: {
    id: string;
    transactionNumber: string;
    transactionDate: string;
    totalAmount: number;
    status: string;
    lines: unknown[];
    allocations: unknown[];
  };
}

export interface PaymentMethodAccount {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
}

export async function getPaymentMethodAccounts() {
  const payload = (await apiFetch(
    "/api/accounts?type=PAYMENT_METHOD&isActive=true"
  )) as { success: boolean; data?: PaymentMethodAccount[] };

  return payload.data ?? [];
}

export async function createPaymentMethodAccount(input: {
  name: string;
  description?: string | null;
  isActive?: boolean;
}) {
  const payload = (await apiFetch("/api/accounts", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      type: "PAYMENT_METHOD",
      description: input.description ?? null,
      isActive: input.isActive ?? true,
    }),
  })) as { success: boolean; data?: PaymentMethodAccount; message?: string };

  return payload.data ?? null;
}

export async function collectFee(payload: CollectFeePayload) {
  const response = (await apiFetch(`/api/feecollection/${payload.enrollmentId}/collect`, {
    method: "POST",
    body: JSON.stringify(payload),
  })) as CollectFeeResponse;
  return response.data;
}