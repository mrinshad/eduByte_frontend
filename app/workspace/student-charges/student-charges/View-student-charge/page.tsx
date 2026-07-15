"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Receipt,
  User,
  Pencil,
  AlertCircle,
  CreditCard,
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

import {
  getStudentChargesByEnrollmentId,
  type StudentEnrollmentCharges,
  type EnrollmentCharge,
} from "@/lib/services/studentCharges"; // adjust to wherever this service actually lives
import { getEnrollmentById, type CompleteEnrollmentRecord } from "@/lib/services/admissions";
import { refreshLateFines } from "@/lib/services/lateFine";

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
      <div className="text-sm font-medium text-slate-950 dark:text-slate-100">{value || "—"}</div>
    </div>
  );
}

// Charge status -> badge classes + sort priority. Pending and partial are
// shown before paid, and each status gets its own colour.
const CHARGE_STATUS_STYLES: Record<string, string> = {
  PENDING:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
  PARTIAL:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  PAID:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const CHARGE_ROW_ACCENT: Record<string, string> = {
  PENDING: "border-l-4 border-l-red-400",
  PARTIAL: "border-l-4 border-l-amber-400",
  PAID: "border-l-4 border-l-emerald-400",
};



// Charges in these statuses still have money owed, so they get a Pay button.
const PAYABLE_STATUSES = new Set(["PENDING", "PARTIAL"]);

function formatDateOnly(value: string) {
  if (!value) return "—";
  return value.slice(0, 10); // "2026-12-07T12:00:00.000Z" -> "2026-12-07"
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ViewAdmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const [enrollment, setEnrollment] = useState<StudentEnrollmentCharges | null>(null);
  const [enrollmentDetails, setEnrollmentDetails] = useState<CompleteEnrollmentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [studentChargeData, enrollmentData] = await Promise.all([
          getStudentChargesByEnrollmentId(id),
          getEnrollmentById(id),
        ]);
        if (studentChargeData?.enrollmentId) {
          await refreshLateFines(studentChargeData.enrollmentId);
        }

        setEnrollment(studentChargeData);
        setEnrollmentDetails(enrollmentData);
      } catch (err) {
        console.error("Failed to load enrollment view detail records:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Pay button handler. Wire this up to your actual payment flow —
  // e.g. open a payment modal, or navigate to a dedicated payment page
  // and pass along the charge + enrollment so it can record the payment.
  function handlePayCharge(charge: EnrollmentCharge) {
    router.push(
      `/workspace/fee-management/collection/viewCollection?id=${charge.enrollmentId}`
    );
  }

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

  const { studentDetails, charges } = enrollment;

  const sortedCharges = charges;

  const enrollmentChargesTemplate = enrollmentDetails?.charges ?? [];


  const totalFinal = charges.reduce((sum, c) => sum + parseFloat(c.finalAmount || "0"), 0);
  const totalPaid = charges.reduce((sum, c) => sum + parseFloat(c.paidAmount || "0"), 0);
  const totalBalance = totalFinal - totalPaid;

  const configuredAcademicYearTotal = enrollmentChargesTemplate.reduce(
    (sum, c) => sum + (c.finalAmount || 0),
    0
  );

  const academicYearPayable = totalFinal;
  const academicYearPaid = totalPaid;
  const academicYearBalance = totalBalance;

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
              {studentDetails.studentName}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Roll No: {studentDetails.rollNumber}
            </p>
          </div>
        </div>

      </div>

      <div className="space-y-6">
        {/* ── Student information (card) ── */}
        <InfoSection icon={User} title="Student Information">
          <InfoGrid>
            <InfoItem label="Full name" value={studentDetails.studentName} />
            <InfoItem label="Roll number" value={studentDetails.rollNumber} />
            <InfoItem label="Class" value={studentDetails.class} />
            <InfoItem label="Division" value={studentDetails.division} />
            <InfoItem label="Gender" value={studentDetails.gender} />
            <InfoItem label="Date of birth" value={formatDateOnly(studentDetails.dob)} />
            <InfoItem label="Blood group" value={studentDetails.bloodGroup} />
            <InfoItem
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className={
                    studentDetails.status === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  }
                >
                  {studentDetails.status}
                </Badge>
              }
            />
            <InfoItem label="Father name" value={studentDetails.fatherName} />
            <InfoItem label="Father mobile" value={studentDetails.fatherMobile} />
            <InfoItem label="Mother name" value={studentDetails.motherName} />
            <InfoItem label="Mother mobile" value={studentDetails.motherMobile} />
            <InfoItem label="WhatsApp" value={studentDetails.whatsappNumber} />
            <InfoItem label="Address" value={studentDetails.address} />
          </InfoGrid>
        </InfoSection>

        {/* ── Student charges (table) ── */}
        <InfoSection icon={Receipt} title="Student Charges">
          <div className="grid grid-cols-2 border-b border-slate-200 bg-background/5 dark:border-slate-800/50 dark:bg-background/5 md:grid-cols-4">
            {[
              {
                label: "Configured fee structure",
                value: formatCurrency(configuredAcademicYearTotal),
                cls: "text-slate-950 dark:text-slate-100",
              },
              {
                label: "Academic year payable",
                value: formatCurrency(academicYearPayable),
                cls: "text-slate-950 dark:text-slate-100",
              },
              {
                label: "Academic year paid",
                value: formatCurrency(academicYearPaid),
                cls: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Academic year balance",
                value: formatCurrency(academicYearBalance),
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

          <div className="border-b border-slate-200 dark:border-slate-800/50">
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Enrollment Fee Structure (from Enrollment Charges)
            </div>
            {enrollmentChargesTemplate.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-slate-500 dark:text-slate-400">
                No enrollment charge structure found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50 dark:hover:bg-slate-950/50">
                    <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Charge Type
                    </TableHead>
                    <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Frequency
                    </TableHead>
                    <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Final Amount
                    </TableHead>
                    <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Due Day
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentChargesTemplate.map((charge) => (
                    <TableRow key={charge.id} className="border-slate-100 dark:border-slate-800/50">
                      <TableCell className="text-sm font-medium text-slate-950 dark:text-slate-100">
                        {charge.chargeType}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                        {charge.frequency}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-950 dark:text-slate-100">
                        {formatCurrency(charge.finalAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                        {charge.dueDay ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50 dark:hover:bg-slate-950/50">
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Description
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Final amount
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Paid
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Balance
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Due date
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Status
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedCharges.map((charge) => {
                const final = parseFloat(charge.finalAmount || "0");
                const paid = parseFloat(charge.paidAmount || "0");
                const balance = final - paid;
                const canPay = PAYABLE_STATUSES.has(charge.status);

                return (
                  <TableRow
                    key={charge.id}
                    className={`border-slate-100 dark:border-slate-800/50 ${CHARGE_ROW_ACCENT[charge.status] ?? ""
                      }`}
                  >
                    <TableCell className="text-sm font-medium text-slate-950 dark:text-slate-100">
                      {charge.description}
                    </TableCell>

                    <TableCell className="text-right text-sm text-slate-950 dark:text-slate-100">
                      {formatCurrency(final)}
                    </TableCell>

                    <TableCell className="text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {
                        formatCurrency(paid)
                      }
                    </TableCell>

                    <TableCell className="text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {formatCurrency(balance)}
                    </TableCell>

                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                      {formatDateOnly(charge.dueDate)}
                    </TableCell>

                    <TableCell>
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

                    <TableCell className="text-right">
                      {canPay ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 px-3 bg-background text-foreground hover:opacity-90 shadow-sm"
                          onClick={() => handlePayCharge(charge)}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Pay
                        </Button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Summary footer */}
          <div className="grid grid-cols-3 border-t border-slate-200 bg-background/5 dark:border-slate-800/50 dark:bg-background/5">
            {[
              { label: "Total amount", value: formatCurrency(totalFinal), cls: "text-slate-950 dark:text-slate-100" },
              { label: "Total paid", value: formatCurrency(totalPaid), cls: "text-emerald-600 dark:text-emerald-400" },
              { label: "Total balance", value: formatCurrency(totalBalance), cls: "text-slate-950 dark:text-slate-100" },
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