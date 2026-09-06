import { apiFetch } from "@/lib/api";

export interface RelievingRosterItem {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  gender: string;
  rollNumber: string;
  className: string;
  divisionName: string;
  enrollmentStatus: "ACTIVE" | "COMPLETED" | "PROMOTED" | "WITHDRAWN" | string;
  studentStatus: "ACTIVE" | "WITHDRAWN" | string;
  relievedDate?: string | null;
  isRelievable: boolean;
  outstandingDues: number;
  assignedVehicle: string | null;
}

export interface RelievingRosterResponse {
  roster: RelievingRosterItem[];
  summary: {
    total: number;
    active: number;
    completed: number;
    withDues: number;
  };
}

export interface GetRosterParams {
  academicYearId?: string;
  classId?: string;
  divisionId?: string;
  search?: string;
}

export interface MassRelieveParams {
  enrollmentIds: string[];
  relievedDate?: string;
}

export interface IndividualRelieveParams {
  relievedDate?: string;
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function getRosterForRelieving(
  params: GetRosterParams
): Promise<RelievingRosterResponse> {
  const query = new URLSearchParams();
  if (params.academicYearId && params.academicYearId !== "all") {
    query.append("academicYearId", params.academicYearId);
  }
  if (params.classId && params.classId !== "all") {
    query.append("classId", params.classId);
  }
  if (params.divisionId && params.divisionId !== "all") {
    query.append("divisionId", params.divisionId);
  }
  if (params.search && params.search.trim()) {
    query.append("search", params.search.trim());
  }

  const payload = (await apiFetch(
    `/api/relieving/roster?${query.toString()}`
  )) as ApiSuccess<RelievingRosterResponse>;
  return payload.data ?? { roster: [], summary: { total: 0, active: 0, completed: 0, withDues: 0 } };
}

export async function massRelieveStudents(
  params: MassRelieveParams
): Promise<{ relievedCount: number }> {
  const payload = (await apiFetch("/api/relieving/mass", {
    method: "POST",
    body: JSON.stringify(params),
  })) as ApiSuccess<{ relievedCount: number }>;
  return payload.data ?? { relievedCount: 0 };
}

export async function individualRelieveStudent(
  id: string,
  params: IndividualRelieveParams = {}
): Promise<void> {
  await apiFetch(`/api/relieving/individual/${id}`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
