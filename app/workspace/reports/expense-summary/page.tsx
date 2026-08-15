"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
    ArrowLeft,
    ArrowRight,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Pencil,
    Receipt,
    RefreshCcw,
    Trash2,
    TrendingUp,
    Wallet
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
    getExpenseSummaryReport,
    deleteExpenseSummary,
    type ExpenseSummaryData,
    type ExpenseItem,
} from "@/lib/services/reports";

const BRAND = "#556043";
const PAGE_SIZE = 10;

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount ?? 0);
}
function formatPayments(payments: { accountId: string; amount: string | number }[] | undefined) {
    if (!payments || payments.length === 0) return "—";
    return payments
        .map((p) => `${p.accountId}: ${formatCurrency(Number(p.amount))}`)
        .join(", ");
}
function todayISO() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function tomorrowISO() {
    const date = new Date();
    const indiaToday = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    indiaToday.setDate(indiaToday.getDate() + 1);

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(indiaToday);
}

function formatDisplayDate(date: string) {
    if (!date) return "";
    const datePart = date.slice(0, 10);
    return new Date(`${datePart}T00:00:00`).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// Convert a plain "YYYY-MM-DD" string into a local Date (no timezone shift),
// used only to feed the shadcn Calendar component.
function parseISODate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`);
}

// Convert a Date selected in the Calendar back into "YYYY-MM-DD".
function toISODate(date: Date) {
    return format(date, "yyyy-MM-dd");
}

export default function ExpenseSummaryPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
    const [toCalendarOpen, setToCalendarOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [report, setReport] = useState<ExpenseSummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Delete dialog state
    const [deleteTarget, setDeleteTarget] = useState<ExpenseItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const isRangeInvalid = fromDate > toDate;

    const maxSelectableDate = useMemo(() => parseISODate(tomorrowISO()), []);

    useEffect(() => {
        if (!fromDate || !toDate || fromDate > toDate) return;

        let cancelled = false;

        async function load(from: string, to: string, pageNum: number) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getExpenseSummaryReport(from, to, pageNum, PAGE_SIZE);
                if (!cancelled) setReport(data);
            } catch (err) {
                if (!cancelled) {
                    setError("Could not load the expense summary. Please try again.");
                    setReport(null);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load(fromDate, toDate, page);

        return () => {
            cancelled = true;
        };
    }, [fromDate, toDate, page]);

    const items = report?.items ?? [];
    const totalExpenses = report?.totalExpenses ?? 0;
    const pagination = report?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };

    const rangeStart = items.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const rangeEnd = items.length === 0 ? 0 : rangeStart + items.length - 1;

    function handleFromDateSelect(date: Date | undefined) {
        if (!date) return;
        const newFrom = toISODate(date);
        setFromDate(newFrom);
        if (newFrom > toDate) setToDate(newFrom);
        setPage(1);
        setFromCalendarOpen(false);
    }

    function handleToDateSelect(date: Date | undefined) {
        if (!date) return;
        setToDate(toISODate(date));
        setPage(1);
        setToCalendarOpen(false);
    }

    function handleRefresh() {
        if (isRangeInvalid) return;

        setIsLoading(true);
        setError(null);
        getExpenseSummaryReport(fromDate, toDate, page, PAGE_SIZE)
            .then(setReport)
            .catch(() => setError("Could not load the expense summary. Please try again."))
            .finally(() => setIsLoading(false));
    }

    function handleEdit(expense: ExpenseItem) {
        router.push(`/workspace/expense-management/createExpense?id=${expense.id}`);
    }

    function openDeleteDialog(expense: ExpenseItem) {
        setDeleteTarget(expense);
        setDeleteDialogOpen(true);
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            setDeletingId(deleteTarget.id);
            const result = await deleteExpenseSummary(deleteTarget.id);
            if (result.success) {
                toast.success(result.message || "Expense deleted successfully");
                // Refresh current page
                handleRefresh();
            } else {
                toast.error(result.message || "Failed to delete expense");
            }
        } catch (err) {
            toast.error("Something went wrong while deleting.");
        } finally {
            setDeletingId(null);
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    }

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            className="bg-background text-foreground hover:opacity-90 shadow-sm"
                            size="icon"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4 text-foreground" />
                        </Button>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                                Expense Summary
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {fromDate === toDate
                                    ? `Expense transactions for ${formatDisplayDate(fromDate)}`
                                    : `Expense transactions for ${formatDisplayDate(fromDate)} — ${formatDisplayDate(toDate)}`}
                            </p>
                        </div>
                    </div>

                    {/* Date range picker — separate From / To Calendar popovers */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                            <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-10 w-full justify-start rounded-lg border-slate-300 px-3 text-left text-sm font-normal dark:border-slate-700 sm:w-40 text-white",
                                            isRangeInvalid && "border-amber-400 dark:border-amber-500/60"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-white" />
                                        <span className="truncate">{formatDisplayDate(fromDate)}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={parseISODate(fromDate)}
                                        onSelect={handleFromDateSelect}
                                        disabled={(date) => date > maxSelectableDate}
                                        defaultMonth={parseISODate(fromDate)}
                                    />
                                </PopoverContent>
                            </Popover>

                            <div className="hidden shrink-0 items-center justify-center text-slate-400 sm:flex">
                                <ArrowRight className="h-4 w-4" />
                            </div>

                            <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-10 w-full justify-start rounded-lg border-slate-300 px-3 text-left text-sm font-normal dark:border-slate-700 sm:w-40 text-white",
                                            isRangeInvalid && "border-amber-400 dark:border-amber-500/60"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-white" />
                                        <span className="truncate">{formatDisplayDate(toDate)}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={parseISODate(toDate)}
                                        onSelect={handleToDateSelect}
                                        disabled={(date) => date > maxSelectableDate || date < parseISODate(fromDate)}
                                        defaultMonth={parseISODate(toDate)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 shrink-0 self-end text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 sm:self-auto text-white"
                            onClick={handleRefresh}
                            disabled={isLoading || isRangeInvalid}
                        >
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Alert Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-200 dark:text-white">
                            Delete Expense?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-200 dark:text-slate-400">
                            This will permanently remove{" "}
                            <span className="font-medium text-slate-400 dark:text-slate-300">
                                {deleteTarget?.expenseNumber}
                            </span>{" "}
                            ({deleteTarget ? formatCurrency(deleteTarget.amount) : ""}). This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            disabled={!!deletingId}
                            className="h-10 rounded-lg border-slate-200 text-slate-700  dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirmDelete();
                            }}
                            disabled={!!deletingId}
                            className="h-10 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                        >
                            {deletingId ? (
                                <span className="flex items-center gap-1.5">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…
                                </span>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isRangeInvalid ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    The "from" date must be before the "to" date.
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-24 text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                    <p className="text-sm">Loading expense summary…</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* Total expenses — hero card, white background */}
                    <div className="rounded-2xl border border-slate-200 bg-[#556043] p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-6">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-200 ring-1 dark:ring-white">
                                        <TrendingUp className="h-4 w-4 dark:text-[#556043]" />
                                    </span>
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em]  text-white">
                                        Total Expenses
                                    </p>
                                </div>

                                <p className="text-3xl font-bold tracking-tight text-slate-100 dark:text-white sm:text-4xl">
                                    {formatCurrency(totalExpenses)}
                                </p>
                            </div>

                            <span className="w-fit rounded-full bg-white dark:bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-[#556043] ring-1 ring-[#556043]/15">
                                {pagination.total} {pagination.total === 1 ? "entry" : "entries"}
                            </span>
                        </div>
                    </div>

                    {/* Expense list — plain ERP-style table, newest first */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                        <p className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800/50 sm:px-5">
                            Expenses
                        </p>

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
                                <Receipt className="h-7 w-7 text-slate-300" />
                                <p className="text-sm">No expenses recorded for this range.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                                        <tr className="text-left text-slate-500 dark:text-slate-400">
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Expense #</th>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Date</th>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Category</th>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Sub Category</th>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Account</th>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Vehicle</th>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Staff</th>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Notes</th>
                                            <th className="px-4 py-2.5 text-right font-medium sm:px-5">Amount</th>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Payments</th>
                                            <th className="px-4 py-2.5 text-center font-medium sm:px-5">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {items.map((expense) => (
                                            <tr key={expense.id}>
                                                <td className="px-4 py-2.5 font-medium text-slate-950 dark:text-slate-100 sm:px-5">
                                                    {expense.expenseNumber}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 sm:px-5">
                                                    {formatDisplayDate(expense.expenseDate)}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 sm:px-5">
                                                    {expense.category ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 sm:px-5">
                                                    {expense.subCategory ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 sm:px-5">
                                                    {expense.account ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 sm:px-5">
                                                    {expense.vehicle ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 sm:px-5">
                                                    {expense.staff ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 max-w-[200px] truncate text-slate-600 dark:text-slate-300 sm:px-5">
                                                    {expense.notes ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-medium text-slate-950 dark:text-slate-100 sm:px-5">
                                                    {formatCurrency(expense.amount)}
                                                </td>
                                                <td className="px-4 py-2.5 sm:px-5">
    <div className="flex flex-col items-start gap-1">
        {expense.payments?.map((pm) => (
            <Badge
                key={pm.accountId}
                variant="secondary"
                className="inline-flex bg-slate-100 text-[10px] text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
                <Wallet className="mr-1 h-3 w-3" />
                <span className="capitalize text-[10px]">{pm.accountId}</span>
                <span className="ml-1 font-semibold text-[10px]">
                    {formatCurrency(Number(pm.amount))}
                </span>
            </Badge>
        ))}
        {(!expense.payments || expense.payments.length === 0) && (
            <span className="text-[10px] text-slate-400">—</span>
        )}
    </div>
</td>
                                                <td className="px-4 py-2.5 sm:px-5">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <PermissionGate permission="expensesummary.editExpenseButton">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-[#556043] hover:bg-[#556043]/10"
                                                            onClick={() => handleEdit(expense)}
                                                            title="Edit expense"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        </PermissionGate>
                                                        <PermissionGate permission="expensesummary.deleteExpenseButton">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            onClick={() => openDeleteDialog(expense)}
                                                            title="Delete expense"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        </PermissionGate>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination footer */}
                        {items.length > 0 && (
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800/50 sm:flex-row sm:px-5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing {rangeStart}–{rangeEnd} of {pagination.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={pagination.page <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                        disabled={pagination.page >= pagination.totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}