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
 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
 
function ChargeStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
    PARTIAL: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400",
    OVERDUE: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
  };
  return (
    <Badge
      variant="outline"
      className={
        map[status] ??
        "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      }
    >
      {status}
    </Badge>
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
        console.log(data);
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
    return (
      <section className="w-full px-6 py-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </section>
    );
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
 
  const totalOriginal = charges.reduce((a, c) => a + c.originalAmount, 0);
  const totalDiscount = charges.reduce((a, c) => a + c.discountAmount, 0);
  const totalFinal = charges.reduce((a, c) => a + c.finalAmount, 0);
  const totalPaid = charges.reduce((a, c) => a + c.paidAmount, 0);
  const totalBalance = charges.reduce((a, c) => a + Math.max(c.finalAmount - c.paidAmount, 0), 0);
 
  return (
    <section className="w-full px-6 py-4">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
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
          className="shrink-0 gap-1.5 bg-background text-foreground hover:opacity-90 shadow-sm"
          size="sm"
          onClick={() => router.push(`/admin/admissions/createAdmission?id=${id}`)}
        >
          <Pencil className="h-3.5 w-3.5 text-foreground" />
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
          <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-4 py-4 dark:border-slate-800/50">
            <div className="ml-auto flex gap-8">
              {[
                { label: "Academic year", value: enrollment.academicYearName },
                { label: "Class", value: enrollment.classId },
                { label: "Division", value: enrollment.division },
                { label: "Roll Number", value: enrollment.rollNumber },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {label}
                  </div>
                  <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Bus className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="grid flex-1 grid-cols-2 gap-y-2">
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Assigned vehicle
                  </div>
                  <div className="text-sm font-medium text-slate-950 dark:text-slate-100">
                    {enrollment.vehicleName || "No Vehicle Assigned"}
                  </div>
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
 
        {/* ── Student charges ── */}
        <InfoSection icon={Receipt} title="Student Charges">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50 dark:hover:bg-slate-950/50">
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Description
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Original
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Discount
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Final
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Paid
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Balance
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Due Day
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
 
            <TableBody>
              {charges.map((charge) => {
                const isModified = charge.finalAmount !== charge.originalAmount;
                const computedBalance = Math.max(charge.finalAmount - charge.paidAmount, 0);
                return (
                  <TableRow key={charge.id} className="border-slate-100 dark:border-slate-800/50">
                    <TableCell className="text-sm font-medium text-slate-950 dark:text-slate-100">
                      {charge.chargeType}
                    </TableCell>
 
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                      ₹{charge.originalAmount.toLocaleString()}
                    </TableCell>
 
                    <TableCell className="text-right text-sm text-slate-500 dark:text-slate-400">
                      {charge.discountAmount > 0 ? (
                        `₹${charge.discountAmount.toLocaleString()}`
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </TableCell>
 
                    <TableCell className="text-right">
                      <span
                        className={
                          isModified
                            ? "rounded-md bg-[#8B5CF6]/10 px-2.5 py-1 text-sm font-semibold text-[#8B5CF6] dark:bg-[#8B5CF6]/20 dark:text-[#A78BFA]"
                            : "text-sm text-slate-950 dark:text-slate-100"
                        }
                      >
                        ₹{charge.finalAmount.toLocaleString()}
                      </span>
                    </TableCell>
 
                    <TableCell className="text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {charge.paidAmount > 0 ? (
                        `₹${charge.paidAmount.toLocaleString()}`
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </TableCell>
 
                    <TableCell className="text-right">
                      <span className="inline-flex items-center rounded-full bg-[#3B82F6]/10 px-2.5 py-1 text-xs font-semibold text-[#3B82F6] dark:bg-[#3B82F6]/20 dark:text-[#60A5FA]">
                        ₹{computedBalance.toLocaleString()}
                      </span>
                    </TableCell>
 
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                      {charge.dueDay ?? (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </TableCell>
 
                    <TableCell>
                      <ChargeStatusBadge status={charge.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
 
          {/* Summary footer */}
          <div className="grid grid-cols-5 border-t border-slate-200 bg-background/5 dark:border-slate-800/50 dark:bg-background/5">
            {[
              {
                label: "Total original",
                value: `₹${totalOriginal.toLocaleString()}`,
                cls: "text-slate-950 dark:text-slate-100",
              },
              {
                label: "Total discount",
                value: `₹${totalDiscount.toLocaleString()}`,
                cls: "text-slate-950 dark:text-slate-100",
              },
              {
                label: "Total charged",
                value: `₹${totalFinal.toLocaleString()}`,
                cls: "text-slate-950 dark:text-slate-100",
              },
              {
                label: "Total paid",
                value: `₹${totalPaid.toLocaleString()}`,
                cls: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Total outstanding",
                value: `₹${totalBalance.toLocaleString()}`,
                cls: "text-slate-950 dark:text-slate-100",
              },
            ].map(({ label, value, cls }) => (
              <div key={label} className="px-5 py-4 text-center">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {label}
                </div>
                <div className={`text-lg ${cls}`}>{value}</div>
              </div>
            ))}
          </div>
        </InfoSection>
 
      </div>
    </section>
  );
}