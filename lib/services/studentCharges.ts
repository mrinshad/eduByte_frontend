import { apiFetch } from "@/lib/api";

export interface StudentCharge {
  admissionNumber: string;
  student: string;
  class: string;
  finalAmount?: number;
  paidAmount?: number;
  enrollmentId:string;
  status: "PENDING" | "PARTIAL" | "PAID";
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