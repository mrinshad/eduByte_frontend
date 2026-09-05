import { apiFetch } from "@/lib/api";

export interface StudentInput {
  admissionNumber: string;
  studentName: string;
  gender: "Male" | "Female";
  dob: string;
  bloodGroup: string;
  adharNo?: string;
  religion?: string;
  community?: string;
  category?: string;
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  whatsappNumber: string;
  address: string;
  place?: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  studentName: string;
  gender: "Male" | "Female";
  dob: string | null;
  bloodGroup: string | null;
  adharNo?: string | null;
  religion?: string | null;
  community?: string | null;
  category?: string | null;
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  whatsappNumber: string;
  address: string;
  place?: string | null;
  status: "ACTIVE" | "WITHDRAWN";
  enrollmentId?: string;
  enrollmentStatus?: string | null;
  className?: string | null;
  divisionName?: string | null;
  admissionStatus?: "ADMITTED" | "NOT_ADMITTED";
  ccaAssignments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentListItem {
  id: string;
  admissionNumber: string;
  studentName: string;
  gender: "Male" | "Female";
  dob: string | null;
  bloodGroup?: string | null;
  adharNo?: string | null;
  religion?: string | null;
  community?: string | null;
  category?: string | null;
  whatsappNumber: string;
  address: string;
  place?: string | null;
  status: string;
  enrollmentId?: string;
  enrollmentStatus?: string | null;
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
  className?: string;
  admissionStatus?: string; // ADMITTED | NOT_ADMITTED
  status?: string; // ACTIVE | WITHDRAWN
  sortBy?: string;
  order?: "asc" | "desc";
  academicYearId?: string;
  academicYear?: string;
}

export interface StudentAdmissionAndName {
  id: string;
  admissionNumber: string;
  studentName: string;
}

// Create Student
export async function createStudent(input: StudentInput) {
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
  className = "",
  admissionStatus = "",
  status = "",
  sortBy = "admissionNumber",
  order = "desc",
  academicYearId = "",
  academicYear = "",
}: GetStudentsParams = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    sortBy,
    order,
  });

  if (className) {
    params.set("className", className);
  }
  if (admissionStatus) {
    params.set("admissionStatus", admissionStatus);
  }
  if (status) {
    params.set("status", status);
  }
  if (academicYearId) {
    params.set("academicYearId", academicYearId);
  }
  if (academicYear) {
    params.set("academicYear", academicYear);
  }

  const payload = (await apiFetch(
    `/api/students?${params.toString()}`
  )) as {
    success: boolean;
    message?: string;
    data?: {
      items?: Student[];
      pagination?: StudentPagination;
    };
  };

  const listItems = Array.isArray(payload.data?.items) ? payload.data.items : [];
  const pagination = payload.data?.pagination;

  return {
    success: payload.success,
    message: payload.message,
    data: listItems,
    pagination: pagination ?? {
      page,
      limit,
      total: 0,
      totalPages: 1,
    },
  } as StudentListResponse;
}

// Get Student By Id
export async function getStudentById(id: string) {
  const payload = (await apiFetch(`/api/students/${id}`)) as ApiSuccess<Student>;

  return payload.data ?? null;
}

// Update Student
export async function updateStudent(id: string, input: StudentInput) {
  return apiFetch(`/api/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Get Student Admission Number and Name By Id
export async function getStudentAdmissionAndName(params?: {
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 200),
  });

  const payload = (await apiFetch(
    `/api/students/admission-name?${query.toString()}`
  )) as ApiSuccess<StudentAdmissionAndName[]>;

  return payload.data ?? [];
}

export async function deleteStudent(id: string) {
  return apiFetch(`/api/students/${id}`, {
    method: "DELETE",
  });
}