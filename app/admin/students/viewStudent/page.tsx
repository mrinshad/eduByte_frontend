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
              className="shrink-0 flex items-center gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
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
                <InfoItem label="Aadhaar no." value={student.adharNo || "—"} />
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
                const totalFeesFinal = feeData.charges.reduce((sum, c) => sum + parseFloat(c.finalAmount || "0"), 0);
                const totalFeesPaid = feeData.charges.reduce((sum, c) => sum + parseFloat(c.paidAmount || "0"), 0);

                const totalFineAmount = (feeData.fines ?? []).reduce((sum, f) => sum + (f.amount || 0), 0);
                const totalFinePaid = (feeData.fines ?? []).reduce((sum, f) => sum + (f.paidAmount || 0), 0);

                const academicYearPayable = totalFeesFinal + totalFineAmount;
                const academicYearPaid = totalFeesPaid + totalFinePaid;
                const academicYearBalance = academicYearPayable - academicYearPaid;

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

                // Build map from studentCharge.id -> monthLabel
                const chargeIdToMonthLabel = new Map<string, string>();

                for (const c of rawCharges) {
                  let monthLabel = "General Charges";
                  const match = c.description?.match(/([A-Za-z]+ \d{4})/);
                  if (match) {
                    monthLabel = match[1];
                  } else if (c.periodYear && c.periodMonth !== undefined && c.periodMonth !== null) {
                    monthLabel = `${monthNames[c.periodMonth] ?? "Month"} ${c.periodYear}`;
                  }

                  if (c.id) {
                    chargeIdToMonthLabel.set(c.id, monthLabel);
                  }

                  if (!map.has(monthLabel)) {
                    map.set(monthLabel, {
                      monthLabel,
                      items: [],
                      totalFee: 0,
                      totalFine: 0,
                      totalPayable: 0,
                      totalPaid: 0,
                      totalBalance: 0,
                    });
                  }

                  const group = map.get(monthLabel)!;
                  const final = parseFloat(c.finalAmount || "0");
                  const paid = parseFloat(c.paidAmount || "0");
                  group.items.push({
                    type: "FEE",
                    id: c.id,
                    description: c.description,
                    amount: final,
                    paid,
                    balance: final - paid,
                    dueDate: c.dueDate,
                    status: c.status,
                  });
                  group.totalFee += final;
                  group.totalPaid += paid;
                }

                for (const f of rawFines) {
                  let monthLabel = "";

                  if (f.studentChargeId && chargeIdToMonthLabel.has(f.studentChargeId)) {
                    monthLabel = chargeIdToMonthLabel.get(f.studentChargeId)!;
                  } else if (f.periodYear && f.periodMonth !== undefined && f.periodMonth !== null) {
                    monthLabel = `${monthNames[f.periodMonth] ?? "Month"} ${f.periodYear}`;
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

                  if (!map.has(monthLabel)) {
                    map.set(monthLabel, {
                      monthLabel,
                      items: [],
                      totalFee: 0,
                      totalFine: 0,
                      totalPayable: 0,
                      totalPaid: 0,
                      totalBalance: 0,
                    });
                  }

                  const group = map.get(monthLabel)!;
                  const amount = f.amount || 0;
                  const paid = f.paidAmount || 0;
                  group.items.push({
                    type: "FINE",
                    id: f.id,
                    description: `Fine: ${f.fineType} (${f.chargeDescription || f.reason || "Late Fee"})`,
                    amount,
                    paid,
                    balance: amount - paid,
                    dueDate: f.createdAt,
                    status: f.isReversed ? "REVERSED" : f.status,
                  });
                  group.totalFine += amount;
                  group.totalPaid += paid;
                }

                for (const group of map.values()) {
                  group.totalPayable = group.totalFee + group.totalFine;
                  group.totalBalance = group.totalPayable - group.totalPaid;
                }

                const groups = Array.from(map.values());

                return (
                  <InfoSection icon={Receipt} title="Itemized Monthly Charges & Fines">
                    <div className="p-4 space-y-4">
                      {groups.map((group) => (
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
                                    {item.description}
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
                      ))}
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
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <LogOut className="h-5 w-5 text-[#556043]" />
              Relieve Student
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="text-slate-700 dark:text-slate-300">
                  Are you sure you want to relieve <strong className="text-slate-900 dark:text-slate-100">{student.studentName}</strong> ({student.admissionNumber})?
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Relieving Date:
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
                <div className="rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800/60 space-y-1">
                  <p>• Enrollment status will transition to <strong>COMPLETED</strong>.</p>
                  <p>• Student master status will transition to <strong>WITHDRAWN</strong>.</p>
                  <p>• Future recurring billing and transport assignments will be deactivated.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRelieving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRelieving}
              onClick={(e) => {
                e.preventDefault()
                void handleRelieveStudent()
              }}
              className="bg-[#556043] text-white hover:bg-[#464f37]"
            >
              {isRelieving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Relieving...
                </>
              ) : (
                "Confirm Relieve"
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