"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    IndianRupee,
    Loader2,
    Printer,
    Receipt,
    RefreshCcw,
    Search,
    Wallet,
    Landmark,
    X,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    getDailyReceiptsRegisterReport,
    type DailyReceiptsRegisterResponse,
} from "@/lib/services/incomeReports";
import { getClasses, type SchoolClass } from "@/lib/services/class";
import { getPaymentMethodAccounts, type PaymentMethodAccount } from "@/lib/services/expense";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function todayISO() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
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

function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function parseISODate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`);
}

function toISODate(date: Date) {
    return format(date, "yyyy-MM-dd");
}

export default function DailyReceiptsRegisterPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
    const [toCalendarOpen, setToCalendarOpen] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [classNameFilter, setClassNameFilter] = useState("all");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentMethodAccount[]>([]);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [report, setReport] = useState<DailyReceiptsRegisterResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isRangeInvalid = fromDate > toDate;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Load classes and payment accounts
    useEffect(() => {
        getClasses()
            .then(setClasses)
            .catch(() => {});
        getPaymentMethodAccounts()
            .then(setPaymentAccounts)
            .catch(() => {});
    }, []);

    // Load report
    useEffect(() => {
        if (!fromDate || !toDate || fromDate > toDate) return;
        let cancelled = false;

        async function load() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getDailyReceiptsRegisterReport({
                    fromDate,
                    toDate,
                    page,
                    limit,
                    search,
                    className: classNameFilter === "all" ? undefined : classNameFilter,
                    paymentMethod: paymentMethodFilter === "ALL" ? undefined : paymentMethodFilter,
                });
                if (!cancelled) setReport(data);
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load daily receipts register.");
                    setReport(null);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [fromDate, toDate, page, limit, search, classNameFilter, paymentMethodFilter]);

    const summary = report?.summary ?? {
        totalCollected: 0,
        cashCollected: 0,
        bankCollected: 0,
        receiptCount: 0,
    };
    const receipts = report?.receipts ?? [];
    const pagination = report?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };

    const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const end = pagination.total === 0 ? 0 : Math.min(pagination.page * pagination.limit, pagination.total);

    const hasActiveFilters = useMemo(
        () => classNameFilter !== "all" || paymentMethodFilter !== "ALL" || search.length > 0,
        [classNameFilter, paymentMethodFilter, search]
    );

    const clearAllFilters = () => {
        setSearchInput("");
        setSearch("");
        setClassNameFilter("all");
        setPaymentMethodFilter("ALL");
        setPage(1);
    };

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
                                Daily Receipts Register
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                View all daily fee receipts and collections across all payment accounts.
                            </p>
                        </div>
                    </div>

                    {/* Date Range Picker */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                            <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-10 w-full justify-start rounded-lg border-slate-300 bg-white px-3 text-left text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-40",
                                            isRangeInvalid && "border-amber-400 dark:border-amber-500/60"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                        <span className="truncate">{formatDisplayDate(fromDate)}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={parseISODate(fromDate)}
                                        onSelect={handleFromDateSelect}
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
                                            "h-10 w-full justify-start rounded-lg border-slate-300 bg-white px-3 text-left text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-40",
                                            isRangeInvalid && "border-amber-400 dark:border-amber-500/60"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                        <span className="truncate">{formatDisplayDate(toDate)}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={parseISODate(toDate)}
                                        onSelect={handleToDateSelect}
                                        disabled={(d) => d < parseISODate(fromDate)}
                                        defaultMonth={parseISODate(toDate)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 shrink-0 self-end border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white sm:self-auto"
                            onClick={() => setPage((p) => p)}
                            disabled={isLoading || isRangeInvalid}
                        >
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-[#556043] p-4 text-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-200">
                        <IndianRupee className="h-4 w-4" />
                        Total Receipts
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                        {formatCurrency(summary.totalCollected)}
                    </p>
                    <p className="mt-1 text-xs text-slate-200">
                        {summary.receiptCount} total collection(s)
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Receipt className="h-4 w-4 text-[#556043]" />
                        Total Receipts Count
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                        {summary.receiptCount.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Processed receipts
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Wallet className="h-4 w-4 text-[#556043]" />
                        Average Receipt
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                        {formatCurrency(summary.receiptCount > 0 ? summary.totalCollected / summary.receiptCount : 0)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Average collection value
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Landmark className="h-4 w-4 text-[#556043]" />
                        Payment Accounts
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                        {summary.paymentMethodBreakdown && summary.paymentMethodBreakdown.length > 0 ? summary.paymentMethodBreakdown.length : (paymentAccounts.length || 1)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Active payment methods
                    </p>
                </div>
            </div>

            {/* Dynamic Payment Method Breakdown Chips */}
            {summary.paymentMethodBreakdown && summary.paymentMethodBreakdown.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Collections by Account:
                    </span>
                    {summary.paymentMethodBreakdown.map((pm) => (
                        <Badge
                            key={pm.name}
                            variant="outline"
                            className="text-xs font-semibold bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                        >
                            {pm.name}: {formatCurrency(pm.amount)}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search student or admission no..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-10 w-full rounded-lg pl-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={classNameFilter}
                        onValueChange={(v) => {
                            setClassNameFilter(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[150px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                            <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((c) => (
                                <SelectItem key={c.id} value={c.name}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={paymentMethodFilter}
                        onValueChange={(v) => {
                            setPaymentMethodFilter(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[170px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                            <SelectValue placeholder="Payment Account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Payment Accounts</SelectItem>
                            {paymentAccounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.name}>
                                    {acc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400"
                            onClick={clearAllFilters}
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="w-full min-w-[850px] text-sm">
                        <TableHeader>
                            <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Receipt #</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Date</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Student Name</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Class</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Fee Breakdown</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Payment Mode</TableHead>
                                <TableHead className="px-4 py-3 text-right text-white font-semibold whitespace-nowrap">Amount</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-44 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                            <p className="text-sm">Loading daily receipts register...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-44 text-center text-red-500">
                                        <p className="text-sm font-medium">{error}</p>
                                    </TableCell>
                                </TableRow>
                            ) : receipts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-44 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Receipt className="h-8 w-8 text-slate-300" />
                                            <p className="text-sm">No receipts recorded for this range.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                receipts.map((r) => (
                                    <TableRow key={r.transactionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                        <TableCell className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                            {r.receiptNumber}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {formatDateTime(r.transactionDate)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 font-medium text-slate-950 dark:text-white whitespace-nowrap">
                                            {r.studentName}
                                            <span className="ml-1.5 text-xs text-slate-400">({r.admissionNumber})</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            {r.className}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                                                {r.collections.map((c, i) => (
                                                    <span
                                                        key={i}
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            c.type === "Fine"
                                                                ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                                                                : "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                        }`}
                                                    >
                                                        {c.name}: {formatCurrency(c.amount)}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                                {r.paymentMethods.map((pm, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs font-semibold bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                                                        <span>{pm.method}</span>: {formatCurrency(pm.amount)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right font-bold text-slate-950 dark:text-white whitespace-nowrap">
                                            {formatCurrency(r.totalAmount)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-[#556043] hover:text-[#4a533b] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:bg-slate-800"
                                                onClick={() => router.push(`/print/fee-collection/${r.transactionId}`)}
                                                title="Print Receipt"
                                            >
                                                <Printer className="h-4 w-4 mr-1" />
                                                Print
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {receipts.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800/50 sm:px-5 gap-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Showing <span className="font-semibold text-slate-900 dark:text-white">{start}</span> to{" "}
                            <span className="font-semibold text-slate-900 dark:text-white">{end}</span> of{" "}
                            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> entries
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>Rows per page:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#556043] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
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
                                    className="h-8 w-8 border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
