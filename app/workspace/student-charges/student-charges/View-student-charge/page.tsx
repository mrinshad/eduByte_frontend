"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Receipt,
  User,
  Pencil,
  AlertCircle,
  CreditCard,
  History,
  Calendar,
} from "lucide-react";

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
  PARTIALLY_PAID:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  OVERDUE:
    "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300 font-semibold",
  PAID:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const CHARGE_ROW_ACCENT: Record<string, string> = {
  PENDING: "border-l-4 border-l-red-400",
  PARTIAL: "border-l-4 border-l-amber-400",
  PARTIALLY_PAID: "border-l-4 border-l-amber-400",
  OVERDUE: "border-l-4 border-l-rose-600",
  PAID: "border-l-4 border-l-emerald-400",
};

// Charges in these statuses still have money owed, so they get a Pay button.
const PAYABLE_STATUSES = new Set(["PENDING", "PARTIAL", "PARTIALLY_PAID", "OVERDUE"]);

function formatDateOnly(value?: string | Date | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ViewAdmissionSkeleton() {
  return (
    <section className="w-full px-6 py-4">
      {/* Header skeleton */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Student information skeleton ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="flex items-center gap-2.5 bg-background px-4 py-3 dark:bg-background">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="mb-2 h-2.5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Student charges skeleton ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="flex items-center gap-2.5 bg-background px-4 py-3 dark:bg-background">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-background/5 dark:border-slate-800/50 dark:bg-background/5 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center px-5 py-4">
                <Skeleton className="mb-2 h-2.5 w-28" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>

          {/* Enrollment fee structure table skeleton */}
          <div className="border-b border-slate-200 dark:border-slate-800/50">
            <div className="px-4 py-3">
              <Skeleton className="h-3 w-64" />
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50 dark:hover:bg-slate-950/50">
                  <TableHead className="h-10">
                    <Skeleton className="h-3 w-20" />
                  </TableHead>
                  <TableHead className="h-10">
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                  <TableHead className="h-10 text-right">
                    <Skeleton className="ml-auto h-3 w-20" />
                  </TableHead>
                  <TableHead className="h-10">
                    <Skeleton className="h-3 w-14" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100 dark:border-slate-800/50">
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Charges table skeleton */}
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50 dark:hover:bg-slate-950/50">
                <TableHead className="h-10">
                  <Skeleton className="h-3 w-24" />
                </TableHead>
                <TableHead className="h-10 text-right">
                  <Skeleton className="ml-auto h-3 w-20" />
                </TableHead>
                <TableHead className="h-10 text-right">
                  <Skeleton className="ml-auto h-3 w-14" />
                </TableHead>
                <TableHead className="h-10 text-right">
                  <Skeleton className="ml-auto h-3 w-16" />
                </TableHead>
                <TableHead className="h-10">
                  <Skeleton className="h-3 w-20" />
                </TableHead>
                <TableHead className="h-10">
                  <Skeleton className="h-3 w-16" />
                </TableHead>
                <TableHead className="h-10 text-right">
                  <Skeleton className="ml-auto h-3 w-12" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-slate-100 dark:border-slate-800/50">
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-16 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Summary footer skeleton */}
          <div className="grid grid-cols-3 border-t border-slate-200 bg-background/5 dark:border-slate-800/50 dark:bg-background/5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center px-5 py-4">
                <Skeleton className="mb-2 h-2.5 w-24" />
                <Skeleton className="h-5 w-20" />
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

  // Group charges and fines by Month (Must be called at top level before conditional returns)
  const rawCharges = enrollment?.charges ?? [];
  const rawFines = enrollment?.fines ?? [];

  const chargesAndFinesByMonth = useMemo(() => {
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

    // 1. Fee charges
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

    // 2. Fines mapped to exact fee month
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

    // 3. Compute group totals
    for (const group of map.values()) {
      group.totalPayable = group.totalFee + group.totalFine;
      group.totalBalance = group.totalPayable - group.totalPaid;
    }

    return Array.from(map.values());
  }, [rawCharges, rawFines]);

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

  const { studentDetails, charges, fines, transactions } = enrollment;

  const enrollmentChargesTemplate = enrollmentDetails?.charges ?? [];

  const totalFeesFinal = charges.reduce((sum, c) => sum + parseFloat(c.finalAmount || "0"), 0);
  const totalFeesPaid = charges.reduce((sum, c) => sum + parseFloat(c.paidAmount || "0"), 0);

  const totalFineAmount = (fines ?? []).reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalFinePaid = (fines ?? []).reduce((sum, f) => sum + (f.paidAmount || 0), 0);

  const configuredAcademicYearTotal = enrollmentChargesTemplate.reduce(
    (sum, c) => sum + (c.finalAmount || 0),
    0
  );

  const academicYearPayable = totalFeesFinal + totalFineAmount;
  const academicYearPaid = totalFeesPaid + totalFinePaid;
  const academicYearBalance = academicYearPayable - academicYearPaid;

  return (
    <section className="w-full px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── 1. Top Header Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              className="bg-background text-foreground hover:opacity-90 shadow-sm"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {studentDetails.studentName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Roll No: <strong className="font-semibold text-slate-800 dark:text-slate-200">{studentDetails.rollNumber}</strong></span>
                <span>•</span>
                <span>Class: <strong className="font-semibold text-slate-800 dark:text-slate-200">{studentDetails.class} ({studentDetails.division})</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={
                studentDetails.status === "ACTIVE"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold px-2.5 py-1 text-xs"
                  : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 font-semibold px-2.5 py-1 text-xs"
              }
            >
              {studentDetails.status}
            </Badge>
            <Button
              className="bg-[#556043] text-white hover:bg-[#4a533b] font-semibold text-xs h-9 shadow-sm"
              onClick={() => router.push(`/workspace/fee-management/viewCollection?id=${enrollment.enrollmentId}`)}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Collect Fee
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Top Summary Financial Cards (4 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Configured Fee Structure</span>
          <p className="text-xl font-bold text-slate-950 dark:text-white pt-0.5">{formatCurrency(configuredAcademicYearTotal)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Academic Payable</span>
            <span className="text-[10px] text-slate-400">Fees + Fines</span>
          </div>
          <p className="text-xl font-bold text-slate-950 dark:text-white pt-0.5">{formatCurrency(academicYearPayable)}</p>
          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Fees: <strong className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(totalFeesFinal)}</strong></span>
            <span>•</span>
            <span>Fine: <strong className="font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(totalFineAmount)}</strong></span>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/10 space-y-1">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Total Paid</span>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 pt-0.5">{formatCurrency(academicYearPaid)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding Balance</span>
          <p className={`text-xl font-bold pt-0.5 ${academicYearBalance > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-950 dark:text-white"}`}>
            {formatCurrency(academicYearBalance)}
          </p>
        </div>
      </div>

      {/* ── 3. Grouped Content Sections ── */}
      <div className="space-y-6">
        {/* Group 1: Student Details */}
        <InfoSection icon={User} title="Student Information">
          <InfoGrid>
            <InfoItem label="Full Name" value={studentDetails.studentName} />
            <InfoItem label="Roll Number" value={studentDetails.rollNumber} />
            <InfoItem label="Class" value={studentDetails.class} />
            <InfoItem label="Division" value={studentDetails.division} />
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
          </InfoGrid>
        </InfoSection>

        {/* Group 2: Fee Payment & Transaction History */}
        <InfoSection icon={History} title="Payment & Transaction History">
          {(!transactions || transactions.length === 0) ? (
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
                {transactions.map((tx) => (
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

        {/* Group 3: Enrollment Fee Structure */}
        {enrollmentChargesTemplate.length > 0 && (
          <InfoSection icon={GraduationCap} title="Enrollment Fee Structure">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950/50">
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
          </InfoSection>
        )}

        {/* Group 4: Monthly Fee & Fine Statement (Grouped by Month) */}
        <InfoSection icon={Receipt} title="Itemized Monthly Charges & Fines">
          <div className="p-4 space-y-4">
            {chargesAndFinesByMonth.map((group) => (
              <div
                key={group.monthLabel}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
              >
                {/* Month Group Header & Financial Breakdown Bar */}
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

                {/* Month Group Items Table */}
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
      </div>
    </section>
  );
}