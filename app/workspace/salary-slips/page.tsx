"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Plus,
    Search,
    Printer,
    Trash2,
    RefreshCw,
    FileSpreadsheet,
    Wallet,
    TrendingUp,
    TrendingDown,
    Building2,
    CheckCircle2,
    User,
    Calendar as CalendarIcon,
    Loader2,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import {
    getSalarySlips,
    deleteSalarySlip,
    type SalarySlip,
} from "@/lib/services/salarySlip";
import { getStaffNamesAndIds, type StaffName } from "@/lib/services/expense";

const SAGE = "#556043";

export default function SalarySlipsListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const autoPrintId = searchParams.get("printId");

    // ── Data State ──────────────────────────────────────────────────────────
    const [slips, setSlips] = useState<SalarySlip[]>([]);
    const [stats, setStats] = useState({
        totalDisbursed: 0,
        totalEarnings: 0,
        totalDeductions: 0,
        totalSlips: 0,
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });
    const [staffList, setStaffList] = useState<StaffName[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Filter State ────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [selectedStaffId, setSelectedStaffId] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState("");

    // Delete State
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Load Staff Lookup ───────────────────────────────────────────────────
    useEffect(() => {
        getStaffNamesAndIds()
            .then(setStaffList)
            .catch((err) => console.error("Failed to load staff list:", err));
    }, []);

    // ── Open Dedicated Print Page ───────────────────────────────────────────
    const handleOpenPrint = (slipId: string) => {
        router.push(`/print/salary-slips/${slipId}`);
    };

    // ── Fetch Slips ─────────────────────────────────────────────────────────
    const fetchSlips = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const data = await getSalarySlips({
                page,
                limit: pagination.limit,
                search: search.trim() || undefined,
                staffId: selectedStaffId !== "all" ? selectedStaffId : undefined,
                salaryMonth: selectedMonth || undefined,
            });
            setSlips(data.items);
            setStats(data.summary);
            setPagination(data.pagination);
        } catch (err: unknown) {
            console.error("Failed to fetch salary slips:", err);
            const msg = err instanceof Error ? err.message : "Failed to load salary slips";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, search, selectedStaffId, selectedMonth]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const data = await getSalarySlips({
                    page: 1,
                    limit: pagination.limit,
                    search: search.trim() || undefined,
                    staffId: selectedStaffId !== "all" ? selectedStaffId : undefined,
                    salaryMonth: selectedMonth || undefined,
                });
                if (isMounted) {
                    setSlips(data.items);
                    setStats(data.summary);
                    setPagination(data.pagination);
                }
            } catch (err: unknown) {
                console.error("Failed to fetch salary slips:", err);
                if (isMounted) {
                    const msg = err instanceof Error ? err.message : "Failed to load salary slips";
                    toast.error(msg);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        void load();
        return () => {
            isMounted = false;
        };
    }, [selectedStaffId, selectedMonth, pagination.limit, search]);

    // Handle auto-print if redirected from Create page
    useEffect(() => {
        if (autoPrintId) {
            handleOpenPrint(autoPrintId);
        }
    }, [autoPrintId]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSlips(1);
    };

    // ── Delete Slip ─────────────────────────────────────────────────────────
    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;
        setDeleting(true);
        try {
            await deleteSalarySlip(deleteTargetId);
            toast.success("Salary slip deleted successfully");
            setDeleteTargetId(null);
            fetchSlips(pagination.page);
        } catch (err: unknown) {
            console.error("Failed to delete salary slip:", err);
            const msg = err instanceof Error ? err.message : "Failed to delete salary slip";
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Salary Slips & Payroll
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Monthly staff remuneration register, allowances, deductions, and vouchers
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSlips(pagination.page)}
                        disabled={loading}
                        className="h-9 gap-1.5"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => router.push("/workspace/salary-slips/create")}
                        className="h-9 gap-1.5 font-medium text-white shadow"
                        style={{ backgroundColor: SAGE }}
                    >
                        <Plus className="h-4 w-4" />
                        Generate Salary Slip
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-xs font-medium uppercase tracking-wider">Total Disbursed</span>
                        <Wallet className="h-4 w-4 text-[#6D755F]" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(stats.totalDisbursed)}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Net payout across all active slips</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-xs font-medium uppercase tracking-wider">Gross Earnings</span>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(stats.totalEarnings)}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Basic + OT + Bonus + Others</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-xs font-medium uppercase tracking-wider">Total Deductions</span>
                        <TrendingDown className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-400 tabular-nums">
                        {formatCurrency(stats.totalDeductions)}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Advances, LOP, fines & withholdings</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-xs font-medium uppercase tracking-wider">Slips Generated</span>
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                        {stats.totalSlips}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Total pay vouchers issued</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                        id="salary-slips-search"
                        placeholder="Search employee name, code, slip #..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 border-slate-300 dark:border-slate-700 text-sm"
                        title="Search salary slips by employee name, employee code, or slip number"
                    />
                </form>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Month Filter */}
                    <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 h-10 shadow-2xs dark:border-slate-700 dark:bg-slate-900">
                        <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Month:</span>
                        <input
                            type="month"
                            id="salary-month-filter"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            placeholder="YYYY-MM"
                            title="Filter salary slips by month (e.g. 2026-09)"
                            className="bg-transparent text-xs outline-none text-slate-800 dark:text-slate-200 cursor-pointer w-28"
                        />
                        {selectedMonth && (
                            <button
                                type="button"
                                onClick={() => setSelectedMonth("")}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
                                title="Clear month filter (show all months)"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Staff Select */}
                    <div className="w-48">
                        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                            <SelectTrigger className="h-10 border-slate-300 dark:border-slate-700 text-xs">
                                <User className="h-3.5 w-3.5 mr-1 text-slate-400 shrink-0" />
                                <SelectValue placeholder="All Employees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {staffList.map((st) => (
                                    <SelectItem key={st.id} value={st.id}>
                                        {st.name} ({st.employeeCode})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(search || selectedStaffId !== "all" || selectedMonth) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearch("");
                                setSelectedStaffId("all");
                                setSelectedMonth("");
                            }}
                            className="h-10 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3.5">Slip #</th>
                                <th className="px-4 py-3.5">Employee</th>
                                <th className="px-4 py-3.5">Month</th>
                                <th className="px-4 py-3.5 text-right">Gross Earnings</th>
                                <th className="px-4 py-3.5 text-right">Deductions</th>
                                <th className="px-4 py-3.5 text-right">Net Payable</th>
                                <th className="px-4 py-3.5">Payment Method</th>
                                <th className="px-4 py-3.5">Disbursed Date</th>
                                <th className="px-4 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#6D755F]" />
                                            <span>Loading salary slips…</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : slips.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-500">
                                        <p className="font-medium text-slate-700 dark:text-slate-300">No salary slips found</p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Generate your first salary slip using the button above.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                slips.map((slip) => (
                                    <tr key={slip.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenPrint(slip.id)}
                                                className="font-semibold text-slate-900 dark:text-slate-100 hover:text-[#556043] hover:underline text-left cursor-pointer transition-colors"
                                                title="View & Print Voucher"
                                            >
                                                {slip.slipNumber}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {slip.staff?.name || "Unknown Staff"}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    Code: {slip.staff?.employeeCode || "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            {slip.salaryMonth}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-700 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                                            {formatCurrency(Number(slip.totalEarnings))}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-rose-700 dark:text-rose-400 tabular-nums whitespace-nowrap">
                                            - {formatCurrency(Number(slip.totalDeductions))}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                                            {formatCurrency(Number(slip.netSalary))}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {slip.paymentAccount?.name || "Cash / Direct"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                            {format(new Date(slip.paymentDate || slip.createdAt), "dd MMM yyyy")}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2.5 text-[#556043] hover:text-[#4a533b] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:bg-slate-800 font-medium"
                                                    onClick={() => handleOpenPrint(slip.id)}
                                                    title="View & Print Voucher"
                                                >
                                                    <Printer className="h-4 w-4 mr-1.5" />
                                                    Print
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Delete Slip"
                                                    onClick={() => setDeleteTargetId(slip.id)}
                                                    className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
                        <span>
                            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page <= 1}
                                onClick={() => fetchSlips(pagination.page - 1)}
                                className="h-8 px-2.5 text-xs"
                            >
                                Previous
                            </Button>
                            <span className="px-2">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchSlips(pagination.page + 1)}
                                className="h-8 px-2.5 text-xs"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Confirm Delete Dialog ────────────────────────────────────── */}
            <AlertDialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Salary Slip?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will soft-delete the salary slip and automatically reverse the linked expense and accounting transaction. This action can be tracked in audit logs.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {deleting ? "Deleting…" : "Delete Slip"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
