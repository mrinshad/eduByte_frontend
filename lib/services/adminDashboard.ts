import { apiFetch } from "@/lib/api"

type ApiSuccess<T> = {
  success: boolean
  message?: string
  data?: T
}

// ---------------------------------------------------------------------
// GET /api/admindashboard/cards-data
//
// NOTE: the exact field names below are assumed to match the mock data
// shape we built the dashboard UI against (totalStudents, totalStaff,
// etc.), since the real response body wasn't shared beyond "same shape
// as the other endpoints." If the actual response uses different key
// names, adjust the type below — the rest of this file and the
// dashboard component don't need to change, only these field names.
// ---------------------------------------------------------------------

export type AdminDashboardCards = {
  totalStudents: number
  totalStudentsDelta: number | null
  totalStaff: number
  totalStaffDelta: number | null
  totalClasses: number
  totalVehicles: number
  activeAcademicYear: string
}

const EMPTY_ADMIN_CARDS: AdminDashboardCards = {
  totalStudents: 0,
  totalStudentsDelta: null,
  totalStaff: 0,
  totalStaffDelta: null,
  totalClasses: 0,
  totalVehicles: 0,
  activeAcademicYear: "—",
}

export async function getAdminDashboardCards(): Promise<AdminDashboardCards> {
  const payload = (await apiFetch(
    "/api/admindashboard/cards-data"
  )) as ApiSuccess<Record<string, any>>

  const d = payload.data ?? {}
  return {
    totalStudents: typeof d.totalStudents === "number" ? d.totalStudents : 0,
    totalStudentsDelta:
      typeof d.totalStudentsDelta === "number"
        ? d.totalStudentsDelta
        : typeof d.studentDelta === "number"
        ? d.studentDelta
        : null,
    totalStaff: typeof d.totalStaff === "number" ? d.totalStaff : 0,
    totalStaffDelta:
      typeof d.totalStaffDelta === "number"
        ? d.totalStaffDelta
        : typeof d.staffDelta === "number"
        ? d.staffDelta
        : null,
    totalClasses: typeof d.totalClasses === "number" ? d.totalClasses : 0,
    totalVehicles: typeof d.totalVehicles === "number" ? d.totalVehicles : 0,
    activeAcademicYear: d.activeAcademicYear ? String(d.activeAcademicYear) : "—",
  }
}

// ---------------------------------------------------------------------
// GET /api/admindashboard/division-counts
// Number of divisions per class, used for the bar chart.
// ---------------------------------------------------------------------

export type DivisionCountPoint = {
  class: string
  divisions: number
}

export async function getDivisionCounts(): Promise<DivisionCountPoint[]> {
  const payload = (await apiFetch(
    "/api/admindashboard/division-counts"
  )) as ApiSuccess<DivisionCountPoint[]>
  return payload.data ?? []
}

// ---------------------------------------------------------------------
// GET /api/admindashboard/status-counts
// Student status breakdown (Active / Withdrawn / Alumni), used for the
// donut chart.
// ---------------------------------------------------------------------

export type StudentStatusPoint = {
  name: string
  value: number
}

export async function getStudentStatusCounts(): Promise<StudentStatusPoint[]> {
  const payload = (await apiFetch(
    "/api/admindashboard/status-counts"
  )) as ApiSuccess<StudentStatusPoint[]>
  return payload.data ?? []
}