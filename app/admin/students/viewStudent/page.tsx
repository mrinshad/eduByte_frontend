"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  MessageCircle,
  MapPin,
  Phone,
  User,
  Users,
  Pencil,
  Trash2,
  Loader2,
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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { refreshLateFines } from "@/lib/services/lateFine"
import { formatDateOnly } from "@/lib/utils"

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
      <CardHeader className="border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#556043]/10 text-[#556043]">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Profile section
            </div>
            <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
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
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-950 dark:text-slate-100">{value || "—"}</div>
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
            <Phone className="h-3.5 w-3.5" />
            <span>{mobile || "—"}</span>
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
    <section className="w-full px-6 py-4 space-y-6">
      {/* Header skeleton */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-7 w-48" />
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
            <CardHeader className="border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800/60 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-2xl" />
                <div>
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="mt-2 h-4 w-36" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
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
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

        if (response?.enrollmentId) {
          await refreshLateFines(response.enrollmentId);
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
      <section className="w-full px-6 py-4">
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

  const admissionStatus = student.admissionStatus ?? "NOT_ADMITTED"

  return (
    <section className="w-full px-6 py-4 space-y-6">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button className="bg-background text-foreground hover:opacity-90 shadow-sm" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {student.studentName}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{student.admissionNumber}</p>
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
            className="gap-2"
            onClick={() =>
              router.push(`/admin/students/createStudent?id=${student.id}`)
            }
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>

          <Button
            variant="destructive"
            className="gap-2"
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

              <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                {student.studentName}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Admission No: {student.admissionNumber}
              </p>

              <div className="mt-6 divide-y border-t pt-2 text-left">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <User className="h-4 w-4" />
                    <span>Gender</span>
                  </div>
                  <span className="text-sm font-medium text-slate-950 dark:text-slate-100">{student.gender || "—"}</span>
                </div>
                {student.dob ? (
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>Date of birth</span>
                    </div>
                    <span className="text-sm font-medium text-slate-950 dark:text-slate-100">{formatDateOnly(student.dob)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </div>
                  <span className="text-sm font-medium text-slate-950 dark:text-slate-100">{student.whatsappNumber || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Phone className="h-4 w-4" />
                    <span>Father mobile</span>
                  </div>
                  <span className="text-sm font-medium text-slate-950 dark:text-slate-100">{student.fatherMobile || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <InfoSection icon={User} title="Student Information">
            <CardContent className="p-5">
              <InfoGrid>
                <InfoItem label="Full name" value={student.studentName} />
                <InfoItem label="Admission no." value={student.admissionNumber} />
                <InfoItem label="Gender" value={student.gender || "—"} />
                {student.dob ? <InfoItem label="Date of birth" value={formatDateOnly(student.dob)} /> : null}
                <InfoItem label="Status" value={student.status} />
                <InfoItem label="Admission status" value={admissionStatus} />
                <InfoItem label="WhatsApp" value={student.whatsappNumber || "—"} />
                <InfoItem label="Father mobile" value={student.fatherMobile || "—"} />
                <InfoItem label="Mother mobile" value={student.motherMobile || "—"} />
                <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Address
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-950 dark:text-slate-100">{student.address || "—"}</p>
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
        </div>
      </div>
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{student.studentName}"?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete this student record. This can't be
              undone, and it will fail if the student has associated fee,
              admission, or academic records.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
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