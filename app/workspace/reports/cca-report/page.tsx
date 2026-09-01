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
    Receipt,
    RefreshCcw,
    Activity,
    Search,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    getCcaIncomeReport,
    type CcaIncomeReportResponse,
    getCcaExpenseSummary,
    type CcaExpenseReportResponse,
    getCcaFinancialSummary,
    type CcaFinancialSummaryResponse,
} from "@/lib/services/incomeReports";
import { getCCAActivities, type CCAActivity } from "@/lib/services/cca";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount ?? 0);
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

export default function CcaIncomeReportPage() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"income" | "expense">("income");

    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
    const [toCalendarOpen, setToCalendarOpen] = useState(false);

    const [activityFilter, setActivityFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [activities, setActivities] = useState<CCAActivity[]>([]);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);

    const [report, setReport] = useState<CcaIncomeReportResponse | null>(null);
    const [expenseReport, setExpenseReport] = useState<CcaExpenseReportResponse | null>(null);
    const [financialSummary, setFinancialSummary] = useState<CcaFinancialSummaryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinancialLoading, setIsFinancialLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isRangeInvalid = fromDate > toDate;

    const loadFinancialSummary = async () => {
        try {
            setIsFinancialLoading(true);
            const data = await getCcaFinancialSummary();
            if (data) setFinancialSummary(data);
        } catch (err) {
            console.error("Failed to load CCA financial summary:", err);
        } finally {
            setIsFinancialLoading(false);
        }
    };

    // Load CCA activities and financial summary on mount
    useEffect(() => {
        getCCAActivities()
            .then((data) => setActivities(data || []))
            .catch(() => {});
        loadFinancialSummary();
    }, []);

    // Load report table data with pagination
    useEffect(() => {
        if (!fromDate || !toDate || fromDate > toDate) return;
        let cancelled = false;

        async function load() {
            try {
                setIsLoading(true);
                setError(null);
                
                if (activeTab === "income") {
                    const data = await getCcaIncomeReport({
                        startDate: fromDate,
                        endDate: toDate,
                        ccaActivityId: activityFilter === "all" ? undefined : activityFilter,
                        search: searchQuery,
                        page,
                        limit,
                    });
                    if (!cancelled) setReport(data);
                } else {
                    const data = await getCcaExpenseSummary({
                        startDate: fromDate,
                        endDate: toDate,
                        ccaActivityId: activityFilter === "all" ? undefined : activityFilter,
                        search: searchQuery,
                        page,
                        limit,
                    });
                    if (!cancelled) setExpenseReport(data);
                }
                
            } catch (err) {
                if (!cancelled) {
                    setError(`Failed to load CCA ${activeTab} report.`);
                    if (activeTab === "income") setReport(null);
                    else setExpenseReport(null);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        const timeoutId = setTimeout(() => {
            load();
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [fromDate, toDate, activityFilter, activeTab, searchQuery, page, limit]);

    const items = report?.collectedDues ?? [];
    const expenseItems = expenseReport?.items ?? [];
    const currentCount = activeTab === "income" ? items.length : expenseItems.length;

    const handleTabChange = (tab: "income" | "expense") => {
        setActiveTab(tab);
        setPage(1);
    };

    const handleActivityChange = (act: string) => {
        setActivityFilter(act);
        setPage(1);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setPage(1);
    };

    function handleFromDateSelect(date: Date | undefined) {
        if (!date) return;
        const newFrom = toISODate(date);
        setFromDate(newFrom);
        setPage(1);
        if (newFrom > toDate) setToDate(newFrom);
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
            {/* Header with Filters */}
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
                                CCA Report
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                View income and expenses from Co-Curricular Activities.
                            </p>
                        </div>
                    </div>

                    {/* Filters & Controls */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select value={activityFilter} onValueChange={handleActivityChange}>
                            <SelectTrigger className="h-10 w-full sm:w-[200px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                                <SelectValue placeholder="All Activities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Activities</SelectItem>
                                {activities.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="relative w-full sm:w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 h-10 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                            <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-10 w-full justify-start rounded-lg border-slate-300 bg-white px-3 text-left text-sm font-medium text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-40 [color-scheme:light] dark:[color-scheme:dark]",
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
                                            "h-10 w-full justify-start rounded-lg border-slate-300 bg-white px-3 text-left text-sm font-medium text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-40 [color-scheme:light] dark:[color-scheme:dark]",
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
                            onClick={() => {
                                setIsLoading(true);
                                loadFinancialSummary();
                                setPage(1);
                            }}
                            disabled={isLoading || isFinancialLoading || isRangeInvalid}
                            title="Refresh Report"
                        >
                            <RefreshCcw className={`h-4 w-4 ${isLoading || isFinancialLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* 1. Total Income Card */}
                <div className="rounded-2xl border border-slate-200 bg-[#556043] p-4 text-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-200">
                        <IndianRupee className="h-4 w-4" />
                        Total Income
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                        {isFinancialLoading && !financialSummary ? (
                            <span className="inline-block h-7 w-28 animate-pulse rounded bg-white/20" />
                        ) : (
                            formatCurrency(financialSummary?.totalIncome ?? 0)
                        )}
                    </p>
                    <p className="mt-1 text-xs text-slate-200">
                        Overall CCA Collections
                    </p>
                </div>

                {/* 2. Total Expense Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <TrendingDown className="h-4 w-4 text-[#556043]" />
                        Total Expense
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                        {isFinancialLoading && !financialSummary ? (
                            <span className="inline-block h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        ) : (
                            formatCurrency(financialSummary?.totalExpense ?? 0)
                        )}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Overall CCA Expenses
                    </p>
                </div>

                {/* 3. Net Profit Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <TrendingUp className="h-4 w-4 text-[#556043]" />
                        Net Profit
                    </div>
                    <p className={cn(
                        "mt-2 text-2xl font-bold tracking-tight",
                        (financialSummary?.netProfit ?? 0) >= 0 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-rose-600 dark:text-rose-400"
                    )}>
                        {isFinancialLoading && !financialSummary ? (
                            <span className="inline-block h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        ) : (
                            formatCurrency(financialSummary?.netProfit ?? 0)
                        )}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Income − Expense
                    </p>
                </div>
            </div>

            {/* Tabs Navigation Switch under the Cards */}
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/60 w-fit">
                <button
                    type="button"
                    onClick={() => handleTabChange("income")}
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                        activeTab === "income"
                            ? "bg-white text-[#556043] shadow-sm dark:bg-slate-900 dark:text-white"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                >
                    <IndianRupee className="h-4 w-4" /> 1. Income Report
                </button>
                <button
                    type="button"
                    onClick={() => handleTabChange("expense")}
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                        activeTab === "expense"
                            ? "bg-white text-[#556043] shadow-sm dark:bg-slate-900 dark:text-white"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                >
                    <TrendingDown className="h-4 w-4" /> 2. Expense Report
                </button>
            </div>

            {/* Main Content Area / Tables */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === "income" ? (
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        #
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Date Paid
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Student
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Activity
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Period
                                    </TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Amount Collected
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: limit }).map((_, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <TableCell className="py-4">
                                                <div className="mx-auto h-4 w-6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                    <RefreshCcw className="h-5 w-5" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {error}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                    <Receipt className="h-5 w-5" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    No collections found
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    Try adjusting your date range or activity filter.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow
                                            key={index}
                                            className="transition-colors hover:bg-slate-50/80 dark:border-slate-800/60 dark:hover:bg-slate-800/50"
                                        >
                                            <TableCell className="text-center text-sm font-medium text-slate-500">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {formatDateTime(item.datePaid)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {item.studentName}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20">
                                                    {item.activityName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                {item.period}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {formatCurrency(item.amountCollected)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        #
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Date
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Expense No
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Activity
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Category / Sub
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Payment Mode
                                    </TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Amount
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: limit }).map((_, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <TableCell className="py-4">
                                                <div className="mx-auto h-4 w-6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                    <RefreshCcw className="h-5 w-5" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {error}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : expenseItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                    <Receipt className="h-5 w-5" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    No expenses found
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    Try adjusting your date range, filters or search.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    expenseItems.map((item, index) => (
                                        <TableRow
                                            key={index}
                                            className="transition-colors hover:bg-slate-50/80 dark:border-slate-800/60 dark:hover:bg-slate-800/50"
                                        >
                                            <TableCell className="text-center text-sm font-medium text-slate-500">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {formatDateTime(item.expenseDate)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {item.expenseNumber}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20">
                                                    {item.ccaActivityName || "N/A"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        {item.category}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {item.subCategory}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                {item.payments?.[0]?.accountId || item.account || "-"}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Uniform Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 px-4 sm:px-6 py-3.5 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
                    <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
                        {currentCount === 0 ? (
                            "No entries to show"
                        ) : (
                            <>
                                Showing{" "}
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {(page - 1) * limit + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {(page - 1) * limit + currentCount}
                                </span>
                            </>
                        )}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 order-1 sm:order-2 w-full sm:w-auto justify-end">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>Rows per page:</span>
                            <Select
                                value={String(limit)}
                                onValueChange={(val) => {
                                    setLimit(Number(val));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px] rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 25, 50].map((opt) => (
                                        <SelectItem key={opt} value={String(opt)} className="text-xs">
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-medium border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                                disabled={page <= 1 || isLoading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                Prev
                            </Button>

                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 px-2">
                                Page {page}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-medium border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                                disabled={currentCount < limit || isLoading}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
