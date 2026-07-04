"use client"
import { useEffect, useState } from "react";
import { ArrowLeft, User, Loader2, Bus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { getStudentDetails, type EnrollmentDetails } from "@/lib/services/feeCollection"

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function InfoSection({
  icon: Icon,
  title,
  children
}: {
  icon: React.ElementType,
  title: string,
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
      <div className="flex items-center gap-2.5 bg-background px-4 py-3 dark:bg-background">
        <Icon className="h-4 w-4 text-foreground" />
        <span className="text-sm font-semibold tracking-tight text-foreground">{title}</span>
      </div>
      {children}
    </div>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3">
      {children}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="text-sm font-medium text-slate-950 dark:text-slate-100">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const enrollmentId = searchParams.get("id") ?? ""

  const [enrollmentDetails, setEnrollmentDetails] = useState<EnrollmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudentDetails() {
      try {
        setLoading(true)
        setError(null)
        const details = await getStudentDetails(enrollmentId)
        setEnrollmentDetails(details)
      } catch (err) {
        console.error("Student Details API Error:", err)
        setError(err instanceof Error ? err.message : "Something went wrong.")
      } finally {
        setLoading(false)
      }
    }

    if (enrollmentId) {
      fetchStudentDetails()
    } else {
      setLoading(false)
      setError("No student selected.")
    }
  }, [enrollmentId])

  const student = enrollmentDetails?.student

  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button
          className="bg-background text-foreground hover:opacity-90 shadow-sm"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {loading ? "Loading..." : student?.studentName || "-"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {loading ? "" : student?.admissionNumber || "-"}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
          <p className="text-sm">Loading student details...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-red-500">
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : enrollmentDetails && student ? (
        <div className="space-y-6">

          {/* Student Information */}
          <InfoSection icon={User} title="Student Information">
            <InfoGrid>
              <InfoItem label="Name" value={student.studentName || "-"} />
              <InfoItem label="Admission No" value={student.admissionNumber || "-"} />
              <InfoItem label="Gender" value={student.gender || "-"} />
              <InfoItem label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString() : "-"} />
              <InfoItem label="Blood Group" value={student.bloodGroup || "-"} />
              <InfoItem label="Status" value={student.status || "-"} />
              <InfoItem label="Father's Name" value={student.fatherName || "-"} />
              <InfoItem label="Father's Mobile" value={student.fatherMobile || "-"} />
              <InfoItem label="Mother's Name" value={student.motherName || "-"} />
              <InfoItem label="Mother's Mobile" value={student.motherMobile || "-"} />
              <InfoItem label="WhatsApp Number" value={student.whatsappNumber || "-"} />
              <InfoItem label="Address" value={student.address || "-"} />
            </InfoGrid>
          </InfoSection>

          {/* Enrollment Information */}
          <InfoSection icon={Bus} title="Enrollment Information">
            <InfoGrid>
              <InfoItem label="Academic Year" value={enrollmentDetails.academicYearName || "-"} />
              <InfoItem label="Division" value={enrollmentDetails.division || "-"} />
              <InfoItem label="Roll Number" value={enrollmentDetails.rollNumber || "-"} />
              <InfoItem label="Fee Structure" value={enrollmentDetails.feeStructureName || "-"} />
              <InfoItem label="Vehicle" value={enrollmentDetails.vehicleName || "-"} />
              <InfoItem label="Vehicle Number" value={enrollmentDetails.vehicleNumber || "-"} />
              <InfoItem label="Driver Name" value={enrollmentDetails.driverName || "-"} />
            </InfoGrid>
          </InfoSection>

          {/* Fee Charges */}
          <InfoSection icon={Wallet} title="Fee Charges">
            {enrollmentDetails.enrollmentCharges.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                No charges found for this enrollment.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {enrollmentDetails.enrollmentCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
                        {charge.chargeType?.name || charge.description || "-"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {charge.frequency} · Due day {charge.dueDay}
                        {!charge.isActive && " · Inactive"}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {charge.finalAmount}
                      {charge.discountAmount > 0 && (
                        <span className="ml-2 text-xs font-normal text-slate-400 line-through">
                          {charge.originalAmount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InfoSection>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
          <p className="text-sm">No student data found.</p>
        </div>
      )}
    </section>
  )
}