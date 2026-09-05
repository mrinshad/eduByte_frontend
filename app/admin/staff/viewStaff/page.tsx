"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  User,
  Pencil,
  Trash2,
  Loader2,
  Receipt,
  IndianRupee,
  Wallet,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  Plus,
  Building2,
  AlertCircle,
} from "lucide-react";

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
import { toast } from "sonner";
import { getStaffById, deleteStaff, type Staff } from "@/lib/services/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { formatCurrency, cn } from "@/lib/utils";

const SAGE = "#556043";

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
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
      <CardHeader className="border-b border-slate-100 bg-white px-4 py-3 sm:px-5 dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#556043]/10 text-[#556043]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Staff Profile
            </div>
            <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
          </div>
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}

function ViewStaffSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

export default function ViewStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get("id");

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function load() {
      if (!staffId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getStaffById(staffId);
        setStaff(data);
      } catch (err) {
        console.error("Failed to load staff details:", err);
        toast.error("Failed to load staff details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [staffId]);

  const handleDelete = async () => {
    if (!staffId) return;
    try {
      setIsDeleting(true);
      await deleteStaff(staffId);
      toast.success("Staff deleted successfully");
      router.push("/admin/staff");
    } catch (err: unknown) {
      console.error("Failed to delete staff:", err);
      const msg = err instanceof Error ? err.message : "Failed to delete staff";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return <ViewStaffSkeleton />;
  }

  if (!staff) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <AlertCircle className="h-7 w-7 text-slate-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Staff Member Not Found</h2>
          <p className="mt-1 text-sm text-slate-500">The requested staff record does not exist or has been deleted.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/staff")}
          className="mt-2 h-10 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Staff Directory
        </Button>
      </div>
    );
  }

  const initials = staff.name
    ? staff.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  const salarySlips = staff.salarySlips || [];
  const totalDisbursed = staff.totalDisbursed || 0;
  const configuredBaseSalary = Number(staff.basicSalary || 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ── Top Header Actions ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/staff")}
            className="h-10 w-10 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Back to Staff Directory"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Staff Profile & Pay Details
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Personal credentials, remuneration structure, and disbursed payroll records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGate permission="staff.editStaffButton">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/staff/createStaff?id=${staff.id}`)}
              className="h-9 gap-1.5 rounded-xl border-slate-300 dark:border-slate-700"
            >
              <Pencil className="h-4 w-4" /> Edit Staff
            </Button>
          </PermissionGate>
          <PermissionGate permission="staff.deleteStaffButton">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-9 gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 rounded-xl"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </PermissionGate>
          <Button
            onClick={() => router.push(`/workspace/salary-slips/create?staffId=${staff.id}`)}
            className="h-9 gap-1.5 rounded-xl font-medium text-white shadow"
            style={{ backgroundColor: SAGE }}
          >
            <Plus className="h-4 w-4" /> Generate Slip
          </Button>
        </div>
      </div>

      {/* ── Profile Identity Card ── */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md"
              style={{ backgroundColor: SAGE }}
            >
              {initials}
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100 truncate">
                  {staff.name}
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                    staff.status === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {staff.status}
                </Badge>
                {staff.user?.roleName && (
                  <Badge variant="secondary" className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="h-3 w-3 mr-1 text-[#556043]" />
                    {staff.user.roleName}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Employee Code: <span className="font-semibold text-slate-900 dark:text-slate-200">{staff.employeeCode}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Key Metrics Overview ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Configured Base Pay</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#556043]/10 text-[#556043]">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {configuredBaseSalary > 0 ? formatCurrency(configuredBaseSalary) : "Not Set"}
          </div>
          <p className="mt-1 text-xs text-slate-400">Monthly basic salary set in employee profile</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Disbursed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalDisbursed)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Net payout across {salarySlips.length} salary slip(s)</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Vouchers Issued</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {salarySlips.length}
          </div>
          <p className="mt-1 text-xs text-slate-400">Historical pay vouchers generated</p>
        </div>
      </div>

      {/* ── Profile Information Grid ── */}
      <InfoSection icon={User} title="Personal & Employment Details">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Employee Code</span>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{staff.employeeCode}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Full Name</span>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{staff.name}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Employment Status</span>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold",
                    staff.status === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  )}
                >
                  {staff.status}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Phone Number</span>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{staff.phone || "—"}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Email Address</span>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{staff.email || "—"}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Joining Date</span>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {staff.joiningDate ? format(new Date(staff.joiningDate), "dd MMM yyyy") : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/40 sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Default Base Salary</span>
                <p className="mt-0.5 text-base font-bold text-slate-950 dark:text-slate-100">
                  {configuredBaseSalary > 0 ? formatCurrency(configuredBaseSalary) : "₹ 0.00 (Not configured)"}
                </p>
                <p className="text-xs text-slate-400">
                  This rate is automatically suggested every month when generating salary slips for this employee.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/staff/createStaff?id=${staff.id}`)}
                className="h-8 rounded-lg border-slate-300 text-xs shrink-0"
              >
                Change Base Salary
              </Button>
            </div>
          </div>
        </CardContent>
      </InfoSection>

      {/* ── Payroll & Compensation Section (Mirroring Fee Collection on View Student) ── */}
      <InfoSection icon={Receipt} title="Salary Slips & Disbursed Vouchers">
        <CardContent className="p-0">
          {salarySlips.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <FileSpreadsheet className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">No Salary Slips Issued</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                No remuneration vouchers have been generated for {staff.name} yet.
              </p>
              <Button
                onClick={() => router.push(`/workspace/salary-slips/create?staffId=${staff.id}`)}
                className="mt-4 h-9 rounded-xl text-xs font-medium text-white shadow"
                style={{ backgroundColor: SAGE }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Generate First Salary Slip
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-sm">
                <TableHeader className="bg-slate-50/80 dark:bg-slate-900/50">
                  <TableRow className="border-b border-slate-100 dark:border-slate-800/60">
                    <TableHead className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Slip #</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Month</TableHead>
                    <TableHead className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Gross Earnings</TableHead>
                    <TableHead className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Deductions</TableHead>
                    <TableHead className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Net Paid</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Payment Mode</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Disbursed Date</TableHead>
                    <TableHead className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {salarySlips.map((slip) => (
                    <TableRow
                      key={slip.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <TableCell className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900 dark:text-slate-100">
                        <button
                          type="button"
                          onClick={() => router.push(`/print/salary-slips/${slip.id}`)}
                          className="hover:text-[#556043] hover:underline cursor-pointer transition-colors"
                          title="View & Print Voucher"
                        >
                          {slip.slipNumber}
                        </button>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        {slip.salaryMonth}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right whitespace-nowrap font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(slip.totalEarnings)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right whitespace-nowrap font-medium text-rose-700 dark:text-rose-400 tabular-nums">
                        - {formatCurrency(slip.totalDeductions)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right whitespace-nowrap font-bold text-slate-950 dark:text-white tabular-nums">
                        {formatCurrency(slip.netSalary)}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        {slip.paymentMethod}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {format(new Date(slip.paymentDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-[#556043] hover:text-[#4a533b] hover:bg-[#556043]/10 font-medium"
                          onClick={() => router.push(`/print/salary-slips/${slip.id}`)}
                          title="View & Print Voucher"
                        >
                          <Printer className="h-4 w-4 mr-1.5" />
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </InfoSection>

      {/* ── Confirm Delete Dialog ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{staff.name}</strong> ({staff.employeeCode})? This action cannot be undone if records depend on this staff member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Deleting…" : "Delete Staff"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
