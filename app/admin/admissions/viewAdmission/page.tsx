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
  UserMinus,
  Trash2,
  AlertCircle,
  Loader2,
  Trophy,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { refreshLateFines } from "@/lib/services/lateFine";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { ManualFeeGenerationModal } from "@/components/fees/ManualFeeGenerationModal";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  getEnrollmentById,
  withdrawStudentAdmission,
  deleteStudentAdmission,
  type CompleteEnrollmentRecord,
} from "@/lib/services/admissions";
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-4 w-28" />
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

  // Dialog states
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManualFeeModal, setShowManualFeeModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getEnrollmentById(id);
        const hasRecurringCharges = data?.charges?.some(
          (c) => c.frequency === "MONTHLY" || c.frequency === "QUARTERLY"
        );
        if (data?.enrollmentId && data?.student?.status === "ACTIVE" && hasRecurringCharges) {
          await refreshLateFines(data.enrollmentId).catch((err) => {
            console.warn("Non-fatal: could not refresh late fines", err);
          });
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

  const handleWithdrawAdmission = async () => {
    if (!id) return;
    setIsWithdrawing(true);
    try {
      await withdrawStudentAdmission(id);
      toast.success("Student admission withdrawn successfully");
      const updatedData = await getEnrollmentById(id);
      setEnrollment(updatedData);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to withdraw student admission");
    } finally {
      setIsWithdrawing(false);
      setShowWithdrawDialog(false);
    }
  };

  const handleDeleteAdmission = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteStudentAdmission(id);
      toast.success("Admission deleted successfully");
      router.push("/admin/admissions");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete admission");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate permission="admissions.editAdmissionButton">
            <Button
              className="shrink-0 flex items-center gap-1.5 bg-background text-foreground hover:opacity-90 shadow-sm"
              size="sm"
              onClick={() => router.push(`/admin/admissions/createAdmission?id=${id}`)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </PermissionGate>

          {student.status === "ACTIVE" && (
            <PermissionGate permission="admissions.editAdmissionButton">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 flex items-center gap-1.5 border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 shadow-sm"
                onClick={() => setShowManualFeeModal(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Fees
              </Button>
            </PermissionGate>
          )}

          {student.status === "ACTIVE" && (
            <PermissionGate permission="admissions.editAdmissionButton">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 flex items-center gap-1.5 border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40 shadow-sm"
                onClick={() => setShowWithdrawDialog(true)}
              >
                <UserMinus className="h-3.5 w-3.5" />
                Withdraw
              </Button>
            </PermissionGate>
          )}

          <PermissionGate permission="admissions.deleteAdmissionButton">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 flex items-center gap-1.5 border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 shadow-sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="space-y-6">
        <InfoSection icon={User} title="Student Information">
          <InfoGrid>
            <InfoItem label="Full name" value={student.studentName} />
            <InfoItem label="Admission no." value={student.admissionNumber} />
            <InfoItem label="Gender" value={student.gender} />
            <InfoItem label="Date of birth" value={formatDob(student.dob)} />
            <InfoItem label="Blood group" value={student.bloodGroup} />
            <InfoItem label="Aadhaar no." value={student.adharNo || "—"} />
            <InfoItem label="Religion" value={student.religion || "—"} />
            <InfoItem label="Community" value={student.community || "—"} />
            <InfoItem label="Category" value={student.category || "—"} />
            <InfoItem
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className={
                    student.status === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : student.status === "WITHDRAWN"
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
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
            <InfoItem label="Place" value={student.place} />
          </InfoGrid>
        </InfoSection>

        <InfoSection icon={GraduationCap} title="Enrollment Details">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 dark:divide-slate-800/50 dark:border-slate-800/50 md:grid-cols-4 md:divide-y-0">
            {[
              { label: "Academic year", value: enrollment.academicYearName },
              { label: "Class", value: enrollment.classId },
              { label: "Division", value: enrollment.division },
              { label: "Roll Number", value: enrollment.rollNumber },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {label}
                </div>
                <div className="text-sm font-medium text-slate-950 dark:text-slate-100">
                  {value || "—"}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800/50">
            <div className="px-4 py-3">
              <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Bus className="h-3 w-3" />
                Vehicle
              </div>
              <div className="text-sm font-medium text-slate-950 dark:text-slate-100">
                {enrollment.vehicleName || (
                  <span className="text-slate-600 dark:text-slate-400">No Vehicle Assigned</span>
                )}
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Fee structure
              </div>
              <div className="text-sm font-medium text-slate-950 dark:text-slate-100">
                {enrollment.feeStructureName}
              </div>
            </div>
          </div>
        </InfoSection>

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

        {/* Co-Curricular Activities (CCA) Section */}
        <InfoSection icon={Trophy} title="Co-Curricular Activities (CCA)">
          {enrollment.ccaAssignments && enrollment.ccaAssignments.length > 0 ? (
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50 dark:hover:bg-slate-950/50">
                  <TableHead className="h-10 w-12 pl-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Sl. No.
                  </TableHead>
                  <TableHead className="h-10 pl-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Activity Name
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Duration
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Status
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Fee Amount
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Discount
                  </TableHead>
                  <TableHead className="h-10 pr-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Net Monthly
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {enrollment.ccaAssignments.map((cca, index) => (
                  <TableRow key={cca.id} className="border-slate-100 dark:border-slate-800/50">
                    <TableCell className="pl-4 text-sm text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </TableCell>

                    <TableCell className="pl-4 text-sm font-medium text-slate-950 dark:text-slate-100">
                      <div className="flex flex-col">
                        <span>{cca.activityName}</span>
                        {cca.activityCode && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {cca.activityCode}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col text-xs">
                        <span>From: {formatDateOnly(cca.startDate)}</span>
                        {cca.endDate && (
                          <span className="text-slate-500 dark:text-slate-400">
                            To: {formatDateOnly(cca.endDate)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          cca.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : cca.status === "DROPPED"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                            : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        {cca.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right text-sm text-slate-600 dark:text-slate-300">
                      ₹{cca.feeAmount.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right text-sm text-amber-600 dark:text-amber-400">
                      {cca.discountAmount > 0 ? `−₹${cca.discountAmount.toLocaleString()}` : "—"}
                    </TableCell>

                    <TableCell className="pr-4 text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                      ₹{cca.finalAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-5 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No co-curricular activities assigned to this student.
            </div>
          )}
        </InfoSection>
      </div>

      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              Withdraw "{student.studentName}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>
                This will mark the student's admission as <strong>WITHDRAWN</strong>.
              </p>
              <p>
                • Future monthly fee generation will <strong>automatically stop</strong>.
                <br />
                • Unpaid pending future dues will be cancelled.
                <br />
                • All historical payments and receipts will be <strong>safely preserved</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <AlertDialogCancel disabled={isWithdrawing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isWithdrawing}
              onClick={(e) => {
                e.preventDefault();
                void handleWithdrawAdmission();
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                "Confirm Withdrawal"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              Permanently Delete Admission for "{student.studentName}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm text-slate-300 dark:text-slate-400">
              <p>
                This action is intended only for <strong>accidental draft entries</strong> (e.g. typos or wrong class selection).
              </p>
              <p className="text-red-600 dark:text-red-400 font-medium">
                • This will permanently remove the admission and all unpaid draft charges.
                <br />
                • If any fee payments have already been collected, deletion will be blocked.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAdmission();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Admission"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {id && (
        <ManualFeeGenerationModal
          enrollmentId={id}
          isOpen={showManualFeeModal}
          onClose={() => setShowManualFeeModal(false)}
          onSuccess={async () => {
            const updatedData = await getEnrollmentById(id);
            setEnrollment(updatedData);
          }}
        />
      )}
    </section>
  );
}