"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    IndianRupee,
    Receipt,
    RefreshCcw,
    Activity,
    Search,
    TrendingDown,
    TrendingUp,
    Wallet,
    Loader2,
    Check,
    ChevronsUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
    getActivityProfitReport,
    type ActivityProfitReportResponse,
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

function CcaActivityProfitContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialActivityId = searchParams.get("activityId") || "";

    const [activeTab, setActiveTab] = useState<"income" | "expense">("income");

    const [activities, setActivities] = useState<CCAActivity[]>([]);
    const [selectedActivityId, setSelectedActivityId] = useState<string>(initialActivityId);
    const [activityComboboxOpen, setActivityComboboxOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);

    const [profitReport, setProfitReport] = useState<ActivityProfitReportResponse | null>(null);
    const [incomeReport, setIncomeReport] = useState<CcaIncomeReportResponse | null>(null);
    const [expenseReport, setExpenseReport] = useState<CcaExpenseReportResponse | null>(null);

    const [isProfitLoading, setIsProfitLoading] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load CCA activities on mount
    useEffect(() => {
        getCCAActivities()
            .then((data) => {
                const list = data || [];
                setActivities(list);
                if (!selectedActivityId && list.length > 0) {
                    setSelectedActivityId(list[0].id);
                }
            })
            .catch(() => {});
    }, []);

    // Load overall profit report for the selected activity
    useEffect(() => {
        if (!selectedActivityId) return;

        setIsProfitLoading(true);
        getActivityProfitReport(selectedActivityId)
            .then((data) => {
                setProfitReport(data);
            })
            .catch((err) => {
                console.error("Failed to load activity profit report:", err);
            })
            .finally(() => {
                setIsProfitLoading(false);
            });
    }, [selectedActivityId]);

    // Load paginated breakdown table data (Income or Expense)
    useEffect(() => {
        if (!selectedActivityId) return;

        let isMounted = true;
        setIsTableLoading(true);
        setError(null);

        if (activeTab === "income") {
            getCcaIncomeReport({
                ccaActivityId: selectedActivityId,
                search: searchQuery || undefined,
                page,
                limit,
            })
                .then((data) => {
                    if (!isMounted) return;
                    setIncomeReport(data);
                })
                .catch((err) => {
                    if (!isMounted) return;
                    setError(err?.message || "Failed to load activity income records.");
                })
                .finally(() => {
                    if (isMounted) setIsTableLoading(false);
                });
        } else {
            getCcaExpenseSummary({
                ccaActivityId: selectedActivityId,
                search: searchQuery || undefined,
                page,
                limit,
            })
                .then((data) => {
                    if (!isMounted) return;
                    setExpenseReport(data);
                })
                .catch((err) => {
                    if (!isMounted) return;
                    setError(err?.message || "Failed to load activity expense records.");
                })
                .finally(() => {
                    if (isMounted) setIsTableLoading(false);
                });
        }

        return () => {
            isMounted = false;
        };
    }, [selectedActivityId, activeTab, searchQuery, page, limit]);

    const handleTabChange = (tab: "income" | "expense") => {
        setActiveTab(tab);
        setPage(1);
    };

    const handleActivityChange = (actId: string) => {
        setSelectedActivityId(actId);
        setPage(1);
        setActivityComboboxOpen(false);
    };

    const selectedActivity = useMemo(() => {
        return activities.find((a) => a.id === selectedActivityId);
    }, [activities, selectedActivityId]);

    const incomeItems = incomeReport?.collectedDues ?? [];
    const expenseItems = expenseReport?.items ?? [];

    const totalIncome = profitReport?.financials.totalIncome ?? 0;
    const totalExpense = profitReport?.financials.totalExpense ?? 0;
    const netProfit = profitReport?.financials.netProfit ?? 0;
    const isProfitable = netProfit >= 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-9 w-9 shrink-0 text-slate-700 dark:text-slate-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                                {profitReport?.activityName || selectedActivity?.name || "CCA Activity"} Profit & Loss
                            </h1>
                            {profitReport?.activityCode && (
                                <Badge variant="outline" className="font-mono text-xs">
                                    {profitReport.activityCode}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Individual activity financial performance with separate income and expense breakdowns.
                        </p>
                    </div>
                </div>

                {/* Activity Selector */}
                <div className="flex items-center gap-2.5">
                    {/* Activity Combobox */}
                    <Popover open={activityComboboxOpen} onOpenChange={setActivityComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="h-9 min-w-[200px] max-w-[280px] justify-between text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                            >
                                <span className="truncate">
                                    {selectedActivity ? selectedActivity.name : "Select CCA Activity..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 rounded-xl" align="end">
                            <Command>
                                <CommandInput placeholder="Search activity..." className="text-xs" />
                                <CommandList>
                                    <CommandEmpty>No activities found.</CommandEmpty>
                                    <CommandGroup>
                                        {activities.map((act) => (
                                            <CommandItem
                                                key={act.id}
                                                value={act.name}
                                                onSelect={() => handleActivityChange(act.id)}
                                                className="cursor-pointer text-xs py-2"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-3.5 w-3.5 text-[#556043]",
                                                        selectedActivityId === act.id
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {act.name}
                                                    </span>
                                                    {act.code && (
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            Code: {act.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Top Summary Cards (Dynamic from /api/reports/cca/:activityId/profit) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* 1. Total Income */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Income
                        </span>
                        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        {isProfitLoading ? (
                            <div className="h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        ) : (
                            <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                                {formatCurrency(totalIncome)}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Total fees collected for {profitReport?.activityName || "this activity"}
                        </p>
                    </div>
                </div>

                {/* 2. Total Expense */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Expense
                        </span>
                        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        {isProfitLoading ? (
                            <div className="h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        ) : (
                            <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                                {formatCurrency(totalExpense)}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Direct operational expenses logged
                        </p>
                    </div>
                </div>

                {/* 3. Net Profit / Margin */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Net Margin
                        </span>
                        <div
                            className={cn(
                                "rounded-xl p-2",
                                isProfitable
                                    ? "bg-[#556043]/10 text-[#556043] dark:bg-[#556043]/20 dark:text-[#9ea98a]"
                                    : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                            )}
                        >
                            <IndianRupee className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        {isProfitLoading ? (
                            <div className="h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        ) : (
                            <p
                                className={cn(
                                    "text-2xl font-bold tracking-tight",
                                    isProfitable
                                        ? "text-[#556043] dark:text-[#9ea98a]"
                                        : "text-red-600 dark:text-red-400"
                                )}
                            >
                                {formatCurrency(netProfit)}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {isProfitable ? "Surplus (Income − Expense)" : "Deficit (Income − Expense)"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation Pill Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-3">
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
                        <Wallet className="h-3.5 w-3.5" /> Income Breakdown
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
                        <Receipt className="h-3.5 w-3.5" /> Expense Breakdown
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder={
                            activeTab === "income"
                                ? "Search student, adm #..."
                                : "Search voucher, notes..."
                        }
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="pl-8 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    />
                </div>
            </div>

            {/* Breakdown Data Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
                {activeTab === "income" ? (
                    /* Income Table */
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
                            {isTableLoading ? (
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
                            ) : incomeItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                <Wallet className="h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                No collections found
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Try adjusting your date range or search query.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                incomeItems.map((item, index) => (
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
                                            <Badge className="border-none text-[11px] font-medium bg-[#556043]/15 text-[#556043] dark:bg-[#556043]/25 dark:text-[#9ea98a]">
                                                {item.activityName}
                                            </Badge>
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
                    /* Expense Table */
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
                            {isTableLoading ? (
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
                                                Try adjusting your date range or search query.
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
                                            <Badge className="border-none text-[11px] font-medium bg-[#556043]/15 text-[#556043] dark:bg-[#556043]/25 dark:text-[#9ea98a]">
                                                {item.ccaActivityName || selectedActivity?.name || "N/A"}
                                            </Badge>
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
                                            {item.account || "-"}
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

                {/* Uniform Pagination Footer */}
                <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800/60 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {activeTab === "income" ? (
                                incomeItems.length > 0 ? (
                                    <>
                                        Showing {(page - 1) * limit + 1} to{" "}
                                        {(page - 1) * limit + incomeItems.length}
                                    </>
                                ) : (
                                    "No entries"
                                )
                            ) : (
                                expenseItems.length > 0 ? (
                                    <>
                                        Showing {(page - 1) * limit + 1} to{" "}
                                        {(page - 1) * limit + expenseItems.length}
                                    </>
                                ) : (
                                    "No entries"
                                )
                            )}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Rows per page:</span>
                            <Select
                                value={String(limit)}
                                onValueChange={(val) => {
                                    setLimit(Number(val));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-16 text-xs rounded-lg border-slate-300 dark:border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || isTableLoading}
                                className="h-8 px-2 text-xs"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                            </Button>
                            <span className="text-xs text-slate-600 dark:text-slate-400 px-2">
                                Page {page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={
                                    (activeTab === "income"
                                        ? incomeItems.length < limit
                                        : expenseItems.length < limit) || isTableLoading
                                }
                                className="h-8 px-2 text-xs"
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CcaActivityProfitPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                </div>
            }
        >
            <CcaActivityProfitContent />
        </Suspense>
    );
}
