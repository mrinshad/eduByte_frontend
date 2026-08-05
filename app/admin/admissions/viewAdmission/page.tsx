"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Bus,
  Receipt,
  User,
  Pencil,
  AlertCircle,
} from "lucide-react";

import { refreshLateFines } from "@/lib/services/lateFine"

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getEnrollmentById, type CompleteEnrollmentRecord } from "@/lib/services/admissions";
import { formatDateOnly } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
      <div className="flex items-center gap-2.5 bg-background px-4 py-3 dark:bg-background">
        <Icon className="h-4 w-4 text-foreground" />
        <span className="text-sm font-semibold tracking-tight text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3">
      {children}
    </div>
  );
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

function formatDob(dob: string) {
  return formatDateOnly(dob);
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

function ViewAdmissionSkeleton() {
  return (
    <section className="w-full px-6 py-4">
      {/* Header skeleton */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      <div className="space-y-6">
        {/* Student information skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="flex items-center gap-2.5 bg-background px-4 py-3 dark:bg-background">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>

        {/* Enrollment details skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="flex items-center gap-2.5 bg-background px-4 py-3 dark:bg-background">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-40" />
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 dark:divide-slate-800/50 dark:border-slate-800/50 md:grid-cols-4 md:divide-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3 md:divide-x md:divide-y-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student fee table skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="flex items-center gap-2.5 bg-background px-4 py-3 dark:bg-background">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="px-4 py-3">
            <div className="mb-3 grid grid-cols-5 gap-4 border-b border-slate-100 pb-2 dark:border-slate-800/50">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20 justify-self-end" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-5 items-center gap-4 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800/50"
              >
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16 justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ViewAdmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [enrollment, setEnrollment] = useState<CompleteEnrollmentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getEnrollmentById(id);
        if (data?.enrollmentId) {
          const refreshResponse = await refreshLateFines(data.enrollmentId);
        }
        setEnrollment(data);
      } catch (err) {
        console.error("Failed to load enrollment view detail records:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <ViewAdmissionSkeleton />;
  }

  if (!enrollment) {
    return (
      <section className="w-full px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          Enrollment record not found.
        </div>
      </section>
    );
  }

  const { student, charges } = enrollment;

  return (
    <section className="w-full px-6 py-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
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
              {student.studentName}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {student.admissionNumber}
            </p>
          </div>
        </div>

        <Button
          className="shrink-0 flex items-center gap-1.5 bg-background text-foreground hover:opacity-90 shadow-sm"
          size="sm"
          onClick={() => router.push(`/admin/admissions/createAdmission?id=${id}`)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      <div className="space-y-6">

        {/* ── Student information ── */}
        <InfoSection icon={User} title="Student Information">
          <InfoGrid>
            <InfoItem label="Full name" value={student.studentName} />
            <InfoItem label="Admission no." value={student.admissionNumber} />
            <InfoItem label="Gender" value={student.gender} />
            <InfoItem label="Date of birth" value={formatDob(student.dob)} />
            <InfoItem label="Blood group" value={student.bloodGroup} />
            <InfoItem
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className={
                    student.status === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  }
                >
                  {student.status}
                </Badge>
              }
            />
            <InfoItem label="Father name" value={student.fatherName} />
            <InfoItem label="Father mobile" value={student.fatherMobile} />
            <InfoItem label="Mother name" value={student.motherName} />
            <InfoItem label="Mother mobile" value={student.motherMobile} />
            <InfoItem label="WhatsApp" value={student.whatsappNumber} />
            <InfoItem label="Address" value={student.address} />
          </InfoGrid>
        </InfoSection>

        {/* ── Enrollment details ── */}
        <InfoSection icon={GraduationCap} title="Enrollment Details">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 dark:divide-slate-800/50 dark:border-slate-800/50 md:grid-cols-4 md:divide-y-0">
            {[
              { label: "Academic year", value: enrollment.academicYearName },
              { label: "Class", value: enrollment.classId },
              { label: "Division", value: enrollment.division },
              { label: "Roll Number", value: enrollment.rollNumber },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-4">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {label}
                </div>
                <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Bus className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assigned vehicle
                </div>
                <div className="text-sm font-medium text-slate-950 dark:text-slate-100">
                  {enrollment.vehicleName || "No Vehicle Assigned"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Bus className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vehicle number
                </div>
                <div className="text-sm font-medium text-slate-950 dark:text-slate-100">
                  {enrollment.vehicleNumber || "—"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Receipt className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fee structure
                </div>
                <div className="text-sm font-medium text-slate-950 dark:text-slate-100">
                  {enrollment.feeStructureName}
                </div>
              </div>
            </div>
          </div>
        </InfoSection>

        {/* ── Student charges (simplified: Sl No, name, frequency, category, final amount) ── */}
        <InfoSection icon={Receipt} title="Student Fee">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50 dark:hover:bg-slate-950/50">
                <TableHead className="h-10 w-12 pl-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Sl. No.
                </TableHead>
                <TableHead className="h-10 pl-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Name
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Frequency
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Category
                </TableHead>
                <TableHead className="h-10 pr-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Final Amount
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {charges.map((charge, index) => (
                <TableRow key={charge.id} className="border-slate-100 dark:border-slate-800/50">
                  <TableCell className="pl-4 text-sm text-slate-500 dark:text-slate-400">
                    {index + 1}
                  </TableCell>

                  <TableCell className="pl-4 text-sm font-medium text-slate-950 dark:text-slate-100">
                    {charge.chargeType}
                  </TableCell>

                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                    {charge.frequency}
                  </TableCell>

                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                    {charge.category || (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </TableCell>

                  <TableCell className="pr-4 text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                    ₹{charge.finalAmount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </InfoSection>

      </div>
    </section>
  );
}