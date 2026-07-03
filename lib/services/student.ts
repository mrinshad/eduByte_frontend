import { apiFetch } from "@/lib/api";

export interface StudentInput {
  admissionNumber: string;
  studentName: string;
  gender: "Male" | "Female";
  dob: string;
  bloodGroup: string;
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  whatsappNumber: string;
  address: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  studentName: string;
  gender: "Male" | "Female";
  dob: string;
  bloodGroup: string;
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  whatsappNumber: string;
  address: string;
  status: "ACTIVE" | "ALUMNI";
  className?: string | null;
  divisionName?: string | null;
  admissionStatus?: "ADMITTED" | "NOT_ADMITTED";
  createdAt: string;
  updatedAt: string;
}

export interface StudentListItem {
  id:string,  
  admissionNumber: string;
  studentName: string;
  gender: "Male" | "Female";
  dob: string;
  whatsappNumber: string;
  address: string;
  status: string;
  className?: string | null;
  divisionName?: string | null;
  admissionStatus?: "ADMITTED" | "NOT_ADMITTED";
}

export interface StudentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudentListResponse {
  success: boolean;
  message?: string;
  data: StudentListItem[];
  pagination: StudentPagination;
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export interface GetStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface StudentAdmissionAndName {
  id: string;
  admissionNumber: string;
  studentName: string;
}

// Create Student
export async function createStudent(
  input: StudentInput
) {
  return apiFetch("/api/students", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Get All Students
export async function getStudents({
  page = 1,
  limit = 10,
  search = "",
  sortBy = "admissionNumber",
  order = "desc",
}: GetStudentsParams = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    sortBy,
    order,
  });

  const payload = (await apiFetch(
    `/api/students?${params.toString()}`
  )) as ApiSuccess<{
    items: StudentListItem[];
    pagination: StudentPagination;
  }>;

  return {
    success: true,
    data: payload.data?.items ?? [],
    pagination: payload.data?.pagination ?? {
      page,
      limit,
      total: 0,
      totalPages: 1,
    },
  } as StudentListResponse;
}

// Get Student By Id
export async function getStudentById(
  id: string
) {
  const payload = (await apiFetch(
    `/api/students/${id}`
  )) as ApiSuccess<Student>;

  return payload.data ?? null;
}

// Update Student
export async function updateStudent(
  id: string,
  input: StudentInput
) {
  return apiFetch(`/api/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Get Student Admission Number and Name By Id
export async function getStudentAdmissionAndName(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 200),
  });

  const payload = (await apiFetch(
    `/api/students/admission-name?${query.toString()}`
  )) as ApiSuccess<StudentAdmissionAndName[]>;

  return payload.data ?? [];
}