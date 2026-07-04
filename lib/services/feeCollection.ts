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
  vehicleName: string;
  vehicleNumber: string;
  driverName: string;
  student: Student;
  enrollmentCharges: EnrollmentCharge[];
}

export interface Student {
  id: string;
  studentName: string;
  admissionNumber: string;
  gender: "MALE" | "FEMALE";
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
  frequency: "MONTHLY" | "YEARLY" | "ONE_TIME";
  generationStartAcademicMonth: number;
  isActive: boolean;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  dueDay: number;
  createdAt: string;
  updatedAt: string;
  chargeType: ChargeType;
}

export interface ChargeType {
  id: string;
  name: string;
  frequency: "MONTHLY" | "YEARLY" | "ONE_TIME";
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