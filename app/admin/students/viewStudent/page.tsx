"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CalendarIcon,
  MessageCircle,
  MapPin,
  Phone,
  User,
  Users,
  Pencil,
  Trash2,
  Loader2,
  History,
  Receipt,
  CreditCard,
  IndianRupee,
  AlertCircle,
  Trophy,
  LogOut,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { toast } from "sonner"
import { AadhaarInfoItem } from "@/components/common/AadhaarInfoItem"
import { getStudentById, deleteStudent, type Student } from "@/lib/services/student"
import {
  getStudentChargesByEnrollmentId,
  type StudentEnrollmentCharges,
} from "@/lib/services/studentCharges"
import {
  getCCAAssignments,
  getStudentCcaCharges,
  type CCAAssignmentItem,
  type StudentCcaCharge,
} from "@/lib/services/cca"
import { individualRelieveStudent } from "@/lib/services/studentRelieving"
import {
  getFeeScheduleBreakdown,
  calculateStudentCompleteSchedule,
} from "@/lib/feeScheduleHelper"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { refreshLateFines } from "@/lib/services/lateFine"
import { formatDateOnly, formatCurrency, cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

const CHARGE_STATUS_STYLES: Record<string, string> = {
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  PENDING: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  OVERDUE: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
};

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
      <CardHeader className="border-b border-slate-100 bg-white px-4 py-3 sm:px-5 dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#556043]/10 text-[#556043]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Profile section
            </div>
            <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
          </div>
        </div>
      </CardHeader>
      {children}
    </Card>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-medium text-slate-950 dark:text-slate-100">{value || "—"}</div>
    </div>
  )
}

function ContactCard({
  title,
  name,
  mobile,
}: {
  title: string
  name: string
  mobile: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/50">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#556043]/10 text-[#556043]">
          <Users className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{name || "—"}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{mobile || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function statusTone(status: Student["status"]) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
    case "WITHDRAWN":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
    default:
      return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
  }
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

function ViewStudentSkeleton() {
  return (
    <section className="w-full px-4 py-4 sm:px-6 space-y-6">
      {/* Header skeleton */}
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          <div>
            <Skeleton className="h-7 w-40 sm:w-48" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar profile card skeleton */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
            <CardContent className="p-6 text-center">
              <Skeleton className="mx-auto h-20 w-20 rounded-full" />
              <Skeleton className="mx-auto mt-4 h-5 w-36" />
              <Skeleton className="mx-auto mt-2 h-4 w-40" />

              <div className="mt-6 divide-y border-t pt-2 text-left">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-sm" />
                      <Skeleton className="h-3.5 w-20" />
                    </div>
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info section skeleton */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
            <CardHeader className="border-b border-slate-100 bg-white px-4 py-3 sm:px-5 dark:border-slate-800/60 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-2xl" />
                <div>
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="mt-2 h-4 w-36" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40"
                  >
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-4 w-28" />
                  </div>
                ))}

                <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                  <div className="flex items-start gap-3">
                    <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
                    <div className="w-full">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="mt-2 h-4 w-full max-w-md" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent contacts skeleton */}
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                <div className="mb-4 flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/50"
                    >
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                        <div className="min-w-0 flex-1">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="mt-2 h-4 w-32" />
                          <Skeleton className="mt-2 h-3.5 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get("id")

  const [student, setStudent] = useState<Student | null>(null)
  const [feeData, setFeeData] = useState<StudentEnrollmentCharges | null>(null)
  const [ccaAssignments, setCcaAssignments] = useState<CCAAssignmentItem[]>([])
  const [ccaCharges, setCcaCharges] = useState<StudentCcaCharge[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isRelieving, setIsRelieving] = useState(false)
  const [showRelieveDialog, setShowRelieveDialog] = useState(false)
  const [relievedDate, setRelievedDate] = useState<string>(() => new Date().toISOString().split("T")[0])

  useEffect(() => {
    async function loadStudent() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await getStudentById(studentId);

        setStudent(response);

        // Map student's own CCA assignments from response if present
        let studentCcaList: CCAAssignmentItem[] = [];
        if (response?.ccaAssignments && Array.isArray(response.ccaAssignments)) {
          studentCcaList = response.ccaAssignments.map((a: any) => ({
            id: a.id,
            startDate: a.startDate,
            endDate: a.endDate,
            status: a.status,
            discountAmount: Number(a.discountAmount) || 0,
            studentId: response.id,
            studentName: response.studentName,
            admissionNumber: response.admissionNumber,
            activityName: a.ccaActivity?.name || "CCA Activity",
            activityCode: a.ccaActivity?.code,
            feeAmount: Number(a.ccaActivity?.feeAmount) || 0
          }));
        }

        const fetchPromises: Promise<any>[] = [
          getStudentCcaCharges(studentId, "student").catch(() => []),
        ];

        if (studentCcaList.length === 0 && response?.id) {
          fetchPromises.push(
            getCCAAssignments({ studentId: response.id }).catch(() => ({ ccaAssignments: [] }))
          );
        } else {
          fetchPromises.push(Promise.resolve({ ccaAssignments: studentCcaList }));
        }

        if (response?.enrollmentId) {
          if (response.status === "ACTIVE") {
            await refreshLateFines(response.enrollmentId).catch((err) => {
              console.warn("Non-fatal: could not refresh late fines", err);
            });
          }
          fetchPromises.push(
            getStudentChargesByEnrollmentId(response.enrollmentId).catch(() => null)
          );
        }

        const results = await Promise.all(fetchPromises);
        setCcaCharges(results[0] || []);
        if (results[1]?.ccaAssignments) {
          setCcaAssignments(results[1].ccaAssignments);
        } else {
          setCcaAssignments(studentCcaList);
        }
        if (results[2]) {
          setFeeData(results[2]);
        }
      } catch (error) {
        console.error("Failed to load student details:", error)
        setStudent(null)
      } finally {
        setLoading(false)
      }
    }

    loadStudent()
  }, [studentId])

  if (loading) {
    return <ViewStudentSkeleton />
  }

  if (!student) {
    return (
      <section className="w-full px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-red-500">
          <ArrowLeft className="h-4 w-4" />
          Student record not found.
        </div>
      </section>
    )
  }

  const handleDeleteStudent = async () => {
    if (!student) return

    setIsDeleting(true)

    try {
      await deleteStudent(student.id)

      toast.success("Student deleted successfully")

      router.push("/admin/students")
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete student"
      )
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleRelieveStudent = async () => {
    if (!student) return
    try {
      setIsRelieving(true)
      const targetId = student.enrollmentId || student.id
      await individualRelieveStudent(targetId, { relievedDate })
      toast.success("Student relieved successfully as COMPLETED.")
      setShowRelieveDialog(false)
      const response = await getStudentById(student.id)
      setStudent(response)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.message || error?.message || "Failed to relieve student")
    } finally {
      setIsRelieving(false)
    }
  }

  const admissionStatus = student.admissionStatus ?? "NOT_ADMITTED"

  return (
    <section className="w-full px-4 py-4 sm:px-6 space-y-6">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            className="shrink-0 bg-background text-foreground hover:opacity-90 shadow-sm"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl dark:text-white">
              {student.studentName}
            </h1>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{student.admissionNumber}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={statusTone(student.status)}>
            {student.status}
          </Badge>

          <Badge
            variant="outline"
            className={
              admissionStatus === "ADMITTED"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
            }
          >
            {admissionStatus}
          </Badge>

          <Button
            variant="outline"
            className="shrink-0 flex items-center gap-1.5 bg-background text-foreground hover:opacity-90 shadow-sm"
            onClick={() =>
              router.push(`/admin/students/createStudent?id=${student.id}`)
            }
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>

          {student.status === "ACTIVE" && (
            <Button
              variant="outline"
              className="shrink-0 flex items-center gap-1.5 border-amber-300 text-amber-800  dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
              onClick={() => setShowRelieveDialog(true)}
            >
              <LogOut className="h-4 w-4 text-amber-600" />
              Relieve
            </Button>
          )}

          <Button
            variant="destructive"
            className="flex-1 gap-2 sm:flex-none"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
            <CardContent className="p-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#556043]/10 text-3xl font-bold text-[#556043]">
                {student.studentName.charAt(0)}
              </div>

              <h2 className="mt-4 truncate text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                {student.studentName}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Admission No: {student.admissionNumber}
              </p>

              <div className="mt-6 divide-y border-t pt-2 text-left">
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <User className="h-4 w-4" />
                    <span>Gender</span>
                  </div>
                  <span className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">{student.gender || "—"}</span>
                </div>
                {student.dob ? (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>Date of birth</span>
                    </div>
                    <span className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">{formatDateOnly(student.dob)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </div>
                  <span className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">{student.whatsappNumber || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Phone className="h-4 w-4" />
                    <span>Father mobile</span>
                  </div>
                  <span className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">{student.fatherMobile || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <InfoSection icon={User} title="Student Information">
            <CardContent className="p-4 sm:p-5">
              <InfoGrid>
                <InfoItem label="Full name" value={student.studentName} />
                <InfoItem label="Admission no." value={student.admissionNumber} />
                <InfoItem label="Gender" value={student.gender || "—"} />
                {student.dob ? <InfoItem label="Date of birth" value={formatDateOnly(student.dob)} /> : null}
                <InfoItem label="Status" value={student.status} />
                <InfoItem label="Admission status" value={admissionStatus} />
                <AadhaarInfoItem value={student.adharNo} />
                <InfoItem label="Religion" value={student.religion || "—"} />
                <InfoItem label="Community" value={student.community || "—"} />
                <InfoItem label="Category" value={student.category || "—"} />
                <InfoItem label="WhatsApp" value={student.whatsappNumber || "—"} />
                <InfoItem label="Father mobile" value={student.fatherMobile || "—"} />
                <InfoItem label="Mother mobile" value={student.motherMobile || "—"} />
                <InfoItem label="Place / Locality" value={student.place || "—"} />
                <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Address
                      </div>
                      <p className="mt-1 break-words text-sm leading-6 text-slate-950 dark:text-slate-100">{student.address || "—"}</p>
                    </div>
                  </div>
                </div>
              </InfoGrid>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                  <Users className="h-4 w-4 text-[#556043]" />
                  Parent contacts
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ContactCard title="Father" name={student.fatherName || "—"} mobile={student.fatherMobile || "—"} />
                  <ContactCard title="Mother" name={student.motherName || "—"} mobile={student.motherMobile || "—"} />
                </div>
              </div>
            </CardContent>
          </InfoSection>

          {/* ── Fee Details & Transaction History ── */}
          {feeData ? (
            <>
              {/* 4 Financial Summary Cards */}
              {(() => {
                const totalFeesFinal = feeData.charges.reduce((sum, c) => sum + Math.max(parseFloat(c.finalAmount || "0"), parseFloat(c.paidAmount || "0")), 0);
                const totalFeesPaid = feeData.charges.reduce((sum, c) => sum + parseFloat(c.paidAmount || "0"), 0);

                const totalFineAmount = (feeData.fines ?? []).reduce((sum, f) => sum + Math.max(f.amount || 0, f.paidAmount || 0), 0);
                const totalFinePaid = (feeData.fines ?? []).reduce((sum, f) => sum + (f.paidAmount || 0), 0);

                const academicYearPayable = totalFeesFinal + totalFineAmount;
                const academicYearPaid = totalFeesPaid + totalFinePaid;
                const academicYearBalance = Math.max(0, academicYearPayable - academicYearPaid);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 space-y-1">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Base Fee Charges</span>
                      <p className="text-lg font-bold text-slate-950 dark:text-white pt-0.5">
                        {formatCurrency(totalFeesFinal)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Academic Payable</span>
                        <span className="text-[10px] text-slate-400">Fees + Fines</span>
                      </div>
                      <p className="text-lg font-bold text-slate-950 dark:text-white pt-0.5">
                        {formatCurrency(academicYearPayable)}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Fees: <strong className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(totalFeesFinal)}</strong></span>
                        <span>•</span>
                        <span>Fine: <strong className="font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(totalFineAmount)}</strong></span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/10 space-y-1">
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Total Paid</span>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 pt-0.5">
                        {formatCurrency(academicYearPaid)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 space-y-1">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding Balance</span>
                      <p className={`text-lg font-bold pt-0.5 ${academicYearBalance > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-950 dark:text-white"}`}>
                        {formatCurrency(academicYearBalance)}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Enrolled Fee Structure & Schedule Baseline */}
              {feeData.enrollmentCharges && feeData.enrollmentCharges.length > 0 && (
                <InfoSection icon={Receipt} title="Enrolled Fee Structure & Schedule">
                  <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Fee Plan: <strong className="text-slate-900 dark:text-slate-200">{feeData.feeStructureName || "Standard Fee Plan"}</strong>
                    </span>
                    <Badge variant="outline" className="text-[11px] font-medium bg-white dark:bg-slate-800">
                      {feeData.enrollmentCharges.length} Assigned Fee Head{feeData.enrollmentCharges.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50">
                        <TableHead className="h-9 w-12 pl-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Sl.</TableHead>
                        <TableHead className="h-9 pl-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Fee Head</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-slate-500 dark:text-slate-400">Frequency</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-slate-500 dark:text-slate-400">Category</TableHead>
                        <TableHead className="h-9 pr-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Scheduled Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeData.enrollmentCharges.map((charge, idx) => {
                        const breakdown = getFeeScheduleBreakdown(
                          charge.chargeTypeName,
                          charge.frequency,
                          Number(charge.amount),
                          charge.category || undefined
                        );

                        return (
                          <TableRow key={charge.id} className="border-slate-100 dark:border-slate-800/50">
                            <TableCell className="pl-4 text-xs text-slate-500 dark:text-slate-400 align-top pt-3">{idx + 1}</TableCell>
                            <TableCell className="pl-4 text-xs font-medium text-slate-950 dark:text-slate-100">
                              <div className="space-y-1">
                                <div>{charge.chargeTypeName}</div>
                                {breakdown.scheduleType === "9_MONTH_TUITION" && (
                                  <div className="text-[10px] text-[#556043] dark:text-[#8b9478] font-normal leading-relaxed">
                                    {breakdown.summaryText}
                                  </div>
                                )}
                                {breakdown.scheduleType === "3_TERM_TUITION" && (
                                  <div className="text-[10px] text-[#556043] dark:text-[#8b9478] font-normal leading-relaxed">
                                    {breakdown.summaryText}
                                  </div>
                                )}
                                {breakdown.scheduleType === "10_MONTH_TRANSPORT" && (
                                  <div className="text-[10px] text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                                    {breakdown.summaryText}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 dark:text-slate-400 align-top pt-3">
                              <Badge variant="outline" className="text-[10px]">{charge.frequency}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 dark:text-slate-400 align-top pt-3">{charge.category || "—"}</TableCell>
                            <TableCell className="pr-4 text-right text-xs font-semibold text-slate-950 dark:text-slate-100 align-top pt-3" style={{ fontFeatureSettings: '"tnum"' }}>
                              {formatCurrency(charge.amount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Dedicated Fee Installment Breakdown Panel */}
                  {(() => {
                    const schedulePlan = calculateStudentCompleteSchedule(feeData.enrollmentCharges, feeData.charges);
                    if (!schedulePlan.hasTuition && !schedulePlan.hasTransport) return null;

                    return (
                      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 sm:p-5 space-y-4">
                        {/* Header bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              Academic Year Fee Schedule
                            </div>
                            <div className="mt-0.5 text-sm font-semibold text-slate-950 dark:text-slate-100">
                              {schedulePlan.scheduleType === "9_MONTH_TUITION" && "9-Month Tuition & 10-Month Transport Installment Breakdown"}
                              {schedulePlan.scheduleType === "3_TERM_TUITION" && "3-Term Direct Quarterly & 10-Month Transport Breakdown"}
                              {schedulePlan.scheduleType === "STANDARD" && "Academic Year Billing Schedule Breakdown"}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {schedulePlan.scheduleType === "9_MONTH_TUITION" && (
                              <Badge variant="outline" className="border-[#556043]/30 bg-[#556043]/10 text-[#556043] dark:text-[#8b9478] text-[11px] font-medium">
                                9 Monthly Installments
                              </Badge>
                            )}
                            {schedulePlan.scheduleType === "3_TERM_TUITION" && (
                              <Badge variant="outline" className="border-[#556043]/30 bg-[#556043]/10 text-[#556043] dark:text-[#8b9478] text-[11px] font-medium">
                                3 Academic Terms (÷ 3)
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] font-medium">
                              Annual Commitment: <strong className="ml-1 text-slate-950 dark:text-white" style={{ fontFeatureSettings: '"tnum"' }}>{formatCurrency(schedulePlan.totalAnnualCommitment)}</strong>
                            </Badge>
                          </div>
                        </div>

                        {/* Formula explanation callout */}
                        <div className="rounded-2xl border border-[#556043]/20 bg-[#556043]/5 p-3.5 text-xs text-[#556043] dark:border-[#556043]/30 dark:bg-[#556043]/10 dark:text-[#8b9478] space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Receipt className="h-3.5 w-3.5 text-[#556043]" />
                            <span>Billing Schedule Calculation Formula:</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                            {schedulePlan.formulaSummary}
                          </p>
                          {schedulePlan.transportSummary && (
                            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 pt-1 border-t border-[#556043]/15 dark:border-[#556043]/25">
                              <strong>Transport Commute:</strong> {schedulePlan.transportSummary}
                            </p>
                          )}
                        </div>

                        {/* 3-Term Overview Cards if Quarterly */}
                        {schedulePlan.scheduleType === "3_TERM_TUITION" && schedulePlan.termInstallments && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                            {schedulePlan.termInstallments.map((term) => (
                              <div
                                key={term.termNumber}
                                className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/50 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    {term.termLabel}
                                  </span>
                                  {term.termNumber === 1 ? (
                                    <Badge variant="outline" className="border-[#556043]/30 bg-[#556043]/10 text-[#556043] dark:text-[#8b9478] text-[10px]">
                                      Least Amount
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px]">
                                      Term {term.termNumber}
                                    </Badge>
                                  )}
                                </div>

                                <div className="text-lg font-bold text-slate-950 dark:text-white" style={{ fontFeatureSettings: '"tnum"' }}>
                                  {formatCurrency(term.tuitionAmount)}
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                  <div>{term.monthsCovered}</div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{term.note}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Month-by-Month Installment Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800/60 dark:bg-slate-950/50">
                          <Table className="table-fixed w-full min-w-[620px]">
                            <TableHeader>
                              <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50">
                                <TableHead className="h-9 w-12 pl-4 text-xs font-semibold text-slate-500 dark:text-slate-400">#</TableHead>
                                <TableHead className="h-9 w-48 pl-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Academic Period</TableHead>
                                {schedulePlan.hasTuition && (
                                  <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Tuition Fee</TableHead>
                                )}
                                {schedulePlan.hasTransport && (
                                  <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Transport Fee</TableHead>
                                )}
                                {schedulePlan.totalAnnualOther > 0 && (
                                  <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Other Heads</TableHead>
                                )}
                                <TableHead className="h-9 pr-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Total Scheduled</TableHead>
                                <TableHead className="h-9 pr-4 pl-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Schedule Status / Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {schedulePlan.monthlyPeriods.map((period) => {
                                return (
                                  <TableRow
                                    key={period.academicMonthNumber}
                                    className={cn(
                                      "border-slate-100 dark:border-slate-800/50",
                                      period.isRemainder && "bg-amber-50/40 dark:bg-amber-950/10",
                                      period.isTuitionFree && "bg-slate-50/60 dark:bg-slate-900/40"
                                    )}
                                  >
                                    <TableCell className="pl-4 text-xs text-slate-400 dark:text-slate-500 py-2.5">
                                      {period.academicMonthNumber}
                                    </TableCell>
                                    <TableCell className="pl-3 text-xs font-medium text-slate-950 dark:text-slate-100 py-2.5">
                                      {period.periodLabel}
                                    </TableCell>
                                    {schedulePlan.hasTuition && (
                                      <TableCell
                                        className={cn(
                                          "text-right text-xs py-2.5 font-medium",
                                          period.tuitionAmount > 0 ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
                                        )}
                                        style={{ fontFeatureSettings: '"tnum"' }}
                                      >
                                        {formatCurrency(period.tuitionAmount)}
                                      </TableCell>
                                    )}
                                    {schedulePlan.hasTransport && (
                                      <TableCell
                                        className="text-right text-xs text-slate-700 dark:text-slate-300 py-2.5 font-medium"
                                        style={{ fontFeatureSettings: '"tnum"' }}
                                      >
                                        {formatCurrency(period.transportAmount)}
                                      </TableCell>
                                    )}
                                    {schedulePlan.totalAnnualOther > 0 && (
                                      <TableCell
                                        className="text-right text-xs text-slate-700 dark:text-slate-300 py-2.5 font-medium"
                                        style={{ fontFeatureSettings: '"tnum"' }}
                                      >
                                        {period.otherAmount > 0 ? formatCurrency(period.otherAmount) : "—"}
                                      </TableCell>
                                    )}
                                    <TableCell
                                      className="pr-3 text-right text-xs font-bold text-[#556043] dark:text-[#8b9478] py-2.5"
                                      style={{ fontFeatureSettings: '"tnum"' }}
                                    >
                                      {formatCurrency(period.totalScheduled)}
                                    </TableCell>
                                    <TableCell className="pr-4 pl-4 py-2.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {period.generatedStatus === "PAID" && (
                                          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 text-[10px] font-semibold">
                                            ✓ Paid ({formatCurrency(period.actualPaidAmount || period.totalScheduled)})
                                          </Badge>
                                        )}
                                        {period.generatedStatus === "PARTIAL" && (
                                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 text-[10px] font-semibold">
                                            Partial (Paid {formatCurrency(period.actualPaidAmount || 0)})
                                          </Badge>
                                        )}
                                        {period.generatedStatus === "OVERDUE" && (
                                          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300 text-[10px] font-semibold">
                                            Overdue ({formatCurrency(period.actualBilledAmount || period.totalScheduled)})
                                          </Badge>
                                        )}
                                        {period.generatedStatus === "PENDING" && (
                                          <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[10px] font-semibold">
                                            Pending ({formatCurrency(period.actualBilledAmount || period.totalScheduled)})
                                          </Badge>
                                        )}
                                        {period.isRemainder ? (
                                          <Badge variant="outline" className="border-amber-300/80 bg-amber-50/60 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 text-[10px]">
                                            Final 9th Installment
                                          </Badge>
                                        ) : period.isTuitionFree ? (
                                          <Badge variant="outline" className="border-emerald-300/80 bg-emerald-50/60 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 text-[10px]">
                                            {schedulePlan.scheduleType === "3_TERM_TUITION" ? "Covered in Term 3 (No 4th Quarter)" : "Tuition Complete (₹0)"}
                                          </Badge>
                                        ) : (
                                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {period.notes}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                            <tfoot>
                              <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold dark:border-slate-800 dark:bg-slate-950/80">
                                <td colSpan={2} className="pl-4 py-2.5 text-xs text-slate-900 dark:text-slate-100">
                                  Total Academic Year Commitment
                                </td>
                                {schedulePlan.hasTuition && (
                                  <td className="text-right text-xs text-slate-900 dark:text-slate-100 py-2.5" style={{ fontFeatureSettings: '"tnum"' }}>
                                    {formatCurrency(schedulePlan.totalAnnualTuition)}
                                  </td>
                                )}
                                {schedulePlan.hasTransport && (
                                  <td className="text-right text-xs text-slate-900 dark:text-slate-100 py-2.5" style={{ fontFeatureSettings: '"tnum"' }}>
                                    {formatCurrency(schedulePlan.totalAnnualTransport)}
                                  </td>
                                )}
                                {schedulePlan.totalAnnualOther > 0 && (
                                  <td className="text-right text-xs text-slate-900 dark:text-slate-100 py-2.5" style={{ fontFeatureSettings: '"tnum"' }}>
                                    {formatCurrency(schedulePlan.totalAnnualOther)}
                                  </td>
                                )}
                                <td className="pr-3 text-right text-xs font-bold text-[#556043] dark:text-[#8b9478] py-2.5" style={{ fontFeatureSettings: '"tnum"' }}>
                                  {formatCurrency(schedulePlan.totalAnnualCommitment)}
                                </td>
                                <td className="pr-4 pl-4 text-[10px] text-slate-500 dark:text-slate-400 py-2.5 font-normal">
                                  10-Month Balanced Academic Plan
                                </td>
                              </tr>
                            </tfoot>
                          </Table>
                        </div>
                      </div>
                    );
                  })()}
                </InfoSection>
              )}

              {/* Payment & Transaction History */}
              <InfoSection icon={History} title="Payment & Transaction History">
                {(!feeData.transactions || feeData.transactions.length === 0) ? (
                  <div className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No payment transactions recorded for this student yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50">
                        <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Receipt / Ref No
                        </TableHead>
                        <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Date
                        </TableHead>
                        <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Fee & Fine Items Covered
                        </TableHead>
                        <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Amount Paid
                        </TableHead>
                        <TableHead className="h-10 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeData.transactions.map((tx) => (
                        <TableRow key={tx.id} className="border-slate-100 dark:border-slate-800/50">
                          <TableCell className="text-sm font-semibold font-mono text-slate-950 dark:text-slate-100">
                            {tx.receiptNumber || tx.transactionNumber}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                            {formatDateOnly(tx.transactionDate)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex flex-wrap gap-1">
                              {tx.itemsCovered && tx.itemsCovered.length > 0 ? (
                                tx.itemsCovered.map((item, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                    {item}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">{tx.description || "Fee Payment"}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(tx.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={
                                tx.isCancelled
                                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                              }
                            >
                              {tx.isCancelled ? "Cancelled" : "Completed"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </InfoSection>

              {/* Itemized Fee & Fine Charges (Grouped by Month) */}
              {(() => {
                const rawCharges = feeData.charges ?? [];
                const rawFines = feeData.fines ?? [];

                const map = new Map<
                  string,
                  {
                    monthLabel: string;
                    sortKey: number;
                    items: Array<{
                      type: "FEE" | "FINE";
                      id: string;
                      description: string;
                      amount: number;
                      paid: number;
                      balance: number;
                      dueDate: string | null;
                      status: string;
                    }>;
                    totalFee: number;
                    totalFine: number;
                    totalPayable: number;
                    totalPaid: number;
                    totalBalance: number;
                  }
                >();

                const monthNames = [
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ];

                const getMonthSortKey = (
                  label: string,
                  periodYear?: number | null,
                  periodMonth?: number | null,
                  dueDate?: string | null
                ): number => {
                  if (periodYear && periodMonth && periodMonth >= 1 && periodMonth <= 12) {
                    return periodYear * 100 + periodMonth;
                  }
                  const match = label.match(/([A-Za-z]+)\s+(\d{4})/);
                  if (match) {
                    const monthIndex = monthNames.findIndex(
                      (m) => m.toLowerCase() === match[1].toLowerCase()
                    );
                    if (monthIndex !== -1) {
                      const year = parseInt(match[2], 10);
                      return year * 100 + (monthIndex + 1);
                    }
                  }
                  if (dueDate) {
                    const d = new Date(dueDate);
                    if (!isNaN(d.getTime())) {
                      return d.getFullYear() * 100 + (d.getMonth() + 1);
                    }
                  }
                  return 0;
                };

                // Build map from studentCharge.id -> monthLabel
                const chargeIdToMonthLabel = new Map<string, string>();

                for (const c of rawCharges) {
                  let monthLabel = "General Charges";
                  const match = c.description?.match(/([A-Za-z]+ \d{4})/);
                  if (match) {
                    monthLabel = match[1];
                  } else if (c.periodYear && c.periodMonth !== undefined && c.periodMonth !== null && c.periodMonth >= 1 && c.periodMonth <= 12) {
                    monthLabel = `${monthNames[c.periodMonth - 1]} ${c.periodYear}`;
                  } else if (c.dueDate) {
                    const d = new Date(c.dueDate);
                    if (!isNaN(d.getTime())) {
                      monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                    }
                  }

                  if (c.id) {
                    chargeIdToMonthLabel.set(c.id, monthLabel);
                  }

                  const sortKey = getMonthSortKey(monthLabel, c.periodYear, c.periodMonth, c.dueDate);

                  if (!map.has(monthLabel)) {
                    map.set(monthLabel, {
                      monthLabel,
                      sortKey,
                      items: [],
                      totalFee: 0,
                      totalFine: 0,
                      totalPayable: 0,
                      totalPaid: 0,
                      totalBalance: 0,
                    });
                  }

                  const group = map.get(monthLabel)!;
                  if (group.sortKey === 0 && sortKey !== 0) {
                    group.sortKey = sortKey;
                  }

                  const final = parseFloat(c.finalAmount || "0");
                  const paid = parseFloat(c.paidAmount || "0");
                  const effectivePayable = Math.max(final, paid);
                  const balance = Math.max(0, final - paid);
                  group.items.push({
                    type: "FEE",
                    id: c.id,
                    description: c.description,
                    amount: final,
                    paid,
                    balance,
                    dueDate: c.dueDate,
                    status: c.status,
                  });
                  group.totalFee += effectivePayable;
                  group.totalPaid += paid;
                }

                for (const f of rawFines) {
                  let monthLabel = "";

                  if (f.studentChargeId && chargeIdToMonthLabel.has(f.studentChargeId)) {
                    monthLabel = chargeIdToMonthLabel.get(f.studentChargeId)!;
                  } else if (f.periodYear && f.periodMonth !== undefined && f.periodMonth !== null && f.periodMonth >= 1 && f.periodMonth <= 12) {
                    monthLabel = `${monthNames[f.periodMonth - 1]} ${f.periodYear}`;
                  } else {
                    const textToSearch = `${f.chargeDescription || ""} ${f.reason || ""}`;
                    const match = textToSearch.match(/([A-Za-z]+ \d{4})/);
                    if (match) {
                      monthLabel = match[1];
                    } else if (f.createdAt) {
                      const d = new Date(f.createdAt);
                      if (!isNaN(d.getTime())) {
                        monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                      }
                    }
                  }

                  if (!monthLabel || !map.has(monthLabel)) {
                    const firstGroupKey = map.keys().next().value;
                    monthLabel = firstGroupKey || monthLabel || "General Charges";
                  }

                  const sortKey = getMonthSortKey(monthLabel, f.periodYear, f.periodMonth, f.createdAt);

                  if (!map.has(monthLabel)) {
                    map.set(monthLabel, {
                      monthLabel,
                      sortKey,
                      items: [],
                      totalFee: 0,
                      totalFine: 0,
                      totalPayable: 0,
                      totalPaid: 0,
                      totalBalance: 0,
                    });
                  }

                  const group = map.get(monthLabel)!;
                  if (group.sortKey === 0 && sortKey !== 0) {
                    group.sortKey = sortKey;
                  }

                  const amount = f.amount || 0;
                  const paid = f.paidAmount || 0;
                  const effectivePayable = Math.max(amount, paid);
                  const balance = Math.max(0, amount - paid);
                  group.items.push({
                    type: "FINE",
                    id: f.id,
                    description: `Fine: ${f.fineType} (${f.chargeDescription || f.reason || "Late Fee"})`,
                    amount,
                    paid,
                    balance,
                    dueDate: f.createdAt,
                    status: f.isReversed ? "REVERSED" : f.status,
                  });
                  group.totalFine += effectivePayable;
                  group.totalPaid += paid;
                }

                for (const group of map.values()) {
                  group.totalPayable = group.totalFee + group.totalFine;
                  group.totalBalance = Math.max(0, group.totalPayable - group.totalPaid);
                  group.items.sort((a, b) => {
                    if (a.type !== b.type) {
                      return a.type === "FEE" ? -1 : 1;
                    }
                    return a.description.localeCompare(b.description);
                  });
                }

                const groups = Array.from(map.values()).sort((a, b) => {
                  if (a.sortKey !== b.sortKey) {
                    if (a.sortKey === 0) return -1;
                    if (b.sortKey === 0) return 1;
                    return a.sortKey - b.sortKey;
                  }
                  return a.monthLabel.localeCompare(b.monthLabel);
                });

                return (
                  <InfoSection icon={Receipt} title="Itemized Monthly Charges & Fines">
                    <div className="p-4 space-y-4">
                      {groups.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                          <Receipt className="h-7 w-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            No Monthly Invoices Generated Yet
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                            Monthly charges for this academic year will appear here once the fee generation run is executed for each billing month. Scheduled baseline fee heads are shown in the table above.
                          </p>
                        </div>
                      ) : (
                        groups.map((group) => (
                        <div
                          key={group.monthLabel}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 gap-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#556043] dark:text-slate-300" />
                              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                                {group.monthLabel}
                              </h3>
                              <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-800">
                                {group.items.length} Item{group.items.length !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className="text-slate-600 dark:text-slate-400">
                                Fees: <strong className="text-slate-900 dark:text-slate-200">{formatCurrency(group.totalFee)}</strong>
                              </span>
                              {group.totalFine > 0 && (
                                <>
                                  <span>+</span>
                                  <span className="text-amber-700 dark:text-amber-400">
                                    Fine: <strong className="font-semibold">{formatCurrency(group.totalFine)}</strong>
                                  </span>
                                </>
                              )}
                              <span>=</span>
                              <span className="text-slate-900 dark:text-white font-bold">
                                Payable: {formatCurrency(group.totalPayable)}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-700 dark:text-emerald-400">
                                Paid: <strong className="font-semibold">{formatCurrency(group.totalPaid)}</strong>
                              </span>
                              <span>•</span>
                              <span className={group.totalBalance > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-400"}>
                                Balance: {formatCurrency(group.totalBalance)}
                              </span>
                            </div>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-100 bg-white hover:bg-white dark:border-slate-800/50 dark:bg-slate-950">
                                <TableHead className="h-9 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  Item Description
                                </TableHead>
                                <TableHead className="h-9 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  Type
                                </TableHead>
                                <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  Amount
                                </TableHead>
                                <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  Paid
                                </TableHead>
                                <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  Balance
                                </TableHead>
                                <TableHead className="h-9 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  Due Date
                                </TableHead>
                                <TableHead className="h-9 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  Status
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item) => (
                                <TableRow key={item.id} className="border-slate-100 dark:border-slate-800/50">
                                  <TableCell className="text-sm font-medium text-slate-950 dark:text-slate-100">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span>{item.description}</span>
                                      {item.paid > item.amount && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                                        >
                                          Multi-fee Collected: {formatCurrency(item.paid)}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant="outline"
                                      className={
                                        item.type === "FINE"
                                          ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 text-[10px]"
                                          : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px]"
                                      }
                                    >
                                      {item.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-slate-950 dark:text-slate-100">
                                    {formatCurrency(item.amount)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(item.paid)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                                    {formatCurrency(item.balance)}
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                                    {formatDateOnly(item.dueDate ?? undefined)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant="outline"
                                      className={
                                        CHARGE_STATUS_STYLES[item.status] ??
                                        "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                      }
                                    >
                                      {item.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )))}
                    </div>
                  </InfoSection>
                );
              })()}
            </>
          ) : null}

          {/* ── Co-Curricular Activities (CCA) Section ── */}
          <InfoSection icon={Trophy} title="Co-Curricular Activities (CCA)">
            {ccaAssignments.length > 0 ? (
              <div className="p-4 sm:p-5 space-y-5">
                {/* Active Subscriptions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ccaAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-950 dark:text-slate-100">
                          {assignment.activityName}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            assignment.status === "ACTIVE"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px]"
                              : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px]"
                          }
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p>Joined: {formatDateOnly(assignment.startDate)}</p>
                        {assignment.endDate && <p>Ended: {formatDateOnly(assignment.endDate)}</p>}
                        {assignment.discountAmount && assignment.discountAmount > 0 ? (
                          <p className="text-amber-600 dark:text-amber-400">
                            Monthly Discount: −{formatCurrency(assignment.discountAmount)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CCA Charges / Dues Table */}
                {ccaCharges.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      CCA Charges & Billing History
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-100 bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50">
                            <TableHead className="h-9 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Activity & Period
                            </TableHead>
                            <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Base Fee
                            </TableHead>
                            <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Discount
                            </TableHead>
                            <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Net Fee
                            </TableHead>
                            <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Paid
                            </TableHead>
                            <TableHead className="h-9 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Balance
                            </TableHead>
                            <TableHead className="h-9 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ccaCharges.map((charge) => (
                            <TableRow key={charge.id} className="border-slate-100 dark:border-slate-800/50">
                              <TableCell className="text-sm font-medium text-slate-950 dark:text-slate-100">
                                {charge.description || `${charge.activityName} - ${charge.periodLabel}`}
                              </TableCell>
                              <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">
                                {formatCurrency(charge.originalAmount)}
                              </TableCell>
                              <TableCell className="text-right text-sm text-amber-600 dark:text-amber-400">
                                {charge.discountAmount > 0 ? `−${formatCurrency(charge.discountAmount)}` : "—"}
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                                {formatCurrency(charge.finalAmount)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(charge.paidAmount)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                                {formatCurrency(charge.balance)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={
                                    CHARGE_STATUS_STYLES[charge.status] ??
                                    "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                  }
                                >
                                  {charge.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No CCA charges have been generated for this student yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="px-5 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No co-curricular activities assigned to this student.
              </div>
            )}
          </InfoSection>
        </div>
      </div>
      {/* Relieve Student Confirmation Dialog */}
      <AlertDialog open={showRelieveDialog} onOpenChange={setShowRelieveDialog}>
        <AlertDialogContent className="w-[92vw] sm:max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-slate-200 dark:text-white flex items-center gap-2">
              <LogOut className="h-5 w-5 text-slate-100 dark:text-slate-400 shrink-0" />
              Relieve Student
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-slate-400 dark:text-slate-400">
                <p>
                  Are you sure you want to relieve <strong className="text-slate-200 dark:text-slate-100">{student.studentName}</strong> ({student.admissionNumber})?
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Relieving Date <span className="text-red-500">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full h-10 justify-start text-left font-normal text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 px-3",
                          !relievedDate && "text-slate-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {relievedDate ? format(new Date(`${relievedDate}T00:00:00`), "dd MMM yyyy") : "Pick relieving date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={relievedDate ? new Date(`${relievedDate}T00:00:00`) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setRelievedDate(format(date, "yyyy-MM-dd"));
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60 p-3.5 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Enrollment Status:</span>
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-400 text-[11px] font-semibold"
                    >
                      COMPLETED
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Student Master Status:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">WITHDRAWN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Recurring Billing:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Deactivated</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Transport Capacity:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Released</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel disabled={isRelieving} className="w-full sm:w-auto rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRelieving}
              onClick={(e) => {
                e.preventDefault()
                void handleRelieveStudent()
              }}
              className="w-full sm:w-auto bg-[#4a533b]
               text-slate-600 hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl font-medium"
            >
              {isRelieving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Relieving...
                </>
              ) : (
                "Confirm & Relieve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              Delete "{student.studentName}"?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete this student record. This can't be
              undone, and it will fail if the student has associated fee,
              admission, or academic records.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteStudent()
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}