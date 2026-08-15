"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Bus,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
    Loader2,
    RefreshCcw,
    Search,
    TrendingDown,
    TrendingUp,
    Users,
    User,
    Wallet,
    Receipt,
    AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    getVehicleLists,
    getFinancialByVehicleReport,
    type Vehicle,
    type FinancialByVehicleData,
} from "@/lib/services/reports";

const BRAND = "#556043";
const BRAND_LIGHT = "#6b7a55";
const LOSS = "#b0524a";
const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function tomorrowISO() {
    const d = new Date();
    const india = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    india.setDate(india.getDate() + 1);
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(india);
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

interface GroupedCategory {
    category: string;
    total: number;
    items: { subCategory: string; amount: number }[];
}

function groupExpenseBreakdown(
    breakdown: FinancialByVehicleData["expenseBreakdown"]
): GroupedCategory[] {
    const map = new Map<string, GroupedCategory>();
    for (const item of breakdown ?? []) {
        const existing = map.get(item.category);
        if (existing) {
            existing.total += item.amount;
            existing.items.push({ subCategory: item.subCategory, amount: item.amount });
        } else {
            map.set(item.category, {
                category: item.category,
                total: item.amount,
                items: [{ subCategory: item.subCategory, amount: item.amount }],
            });
        }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface VehicleFinancialRow {
    vehicle: Vehicle;
    financial: FinancialByVehicleData | null;
    isLoading: boolean;
    error: string | null;
}

type SortKey = "vehicle" | "income" | "expense" | "profit" | "students";
type SortDir = "asc" | "desc";

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function VehicleFinancialReportPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
    const [toCalendarOpen, setToCalendarOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [rows, setRows] = useState<VehicleFinancialRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [sortKey, setSortKey] = useState<SortKey>("vehicle");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const isRangeInvalid = fromDate > toDate;
    const maxSelectableDate = useMemo(() => parseISODate(tomorrowISO()), []);

    /* ---- debounce search ---- */
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    /* ---- load everything ---- */
    const loadAll = useCallback(async () => {
        if (isRangeInvalid) return;
        setIsLoading(true);
        setListError(null);

        try {
            const vehicles = await getVehicleLists();
            if (vehicles.length === 0) {
                setRows([]);
                setIsLoading(false);
                return;
            }

            // seed rows so UI can show skeletons immediately
            setRows(
                vehicles.map((v) => ({
                    vehicle: v,
                    financial: null,
                    isLoading: true,
                    error: null,
                }))
            );

            const results = await Promise.all(
                vehicles.map(async (v) => {
                    try {
                        const data = await getFinancialByVehicleReport(v.id, fromDate, toDate);
                        return { id: v.id, data, error: null as string | null };
                    } catch {
                        return { id: v.id, data: null, error: "Failed to load financials" };
                    }
                })
            );

            setRows((prev) =>
                prev.map((r) => {
                    const found = results.find((x) => x.id === r.vehicle.id);
                    return {
                        ...r,
                        financial: found?.data ?? null,
                        isLoading: false,
                        error: found?.error ?? null,
                    };
                })
            );
        } catch {
            setListError("Could not load vehicles. Please try again.");
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    }, [fromDate, toDate, isRangeInvalid]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    /* ---- filtering ---- */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (r) =>
                r.vehicle.vehicleName.toLowerCase().includes(q) ||
                r.vehicle.vehicleNumber.toLowerCase().includes(q) ||
                r.vehicle.driverName.toLowerCase().includes(q)
        );
    }, [rows, search]);

    /* ---- sorting ---- */
    const sorted = useMemo(() => {
        const dir = sortDir === "asc" ? 1 : -1;
        return [...filtered].sort((a, b) => {
            switch (sortKey) {
                case "vehicle":
                    return a.vehicle.vehicleName.localeCompare(b.vehicle.vehicleName) * dir;
                case "students":
                    return (a.vehicle.totalStudents - b.vehicle.totalStudents) * dir;
                case "income":
                    return ((a.financial?.income ?? 0) - (b.financial?.income ?? 0)) * dir;
                case "expense":
                    return ((a.financial?.expense ?? 0) - (b.financial?.expense ?? 0)) * dir;
                case "profit":
                    return ((a.financial?.profit ?? 0) - (b.financial?.profit ?? 0)) * dir;
                default:
                    return 0;
            }
        });
    }, [filtered, sortKey, sortDir]);

    /* ---- pagination ---- */
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const pageSafe = Math.min(page, totalPages);
    const paged = sorted.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

    /* ---- summary totals ---- */
    const totals = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                if (!r.financial) return acc;
                acc.income += r.financial.income;
                acc.expense += r.financial.expense;
                acc.profit += r.financial.profit;
                acc.transportPaid += r.financial.transportFeePaid;
                acc.transportPending += r.financial.transportFeePending;
                acc.students += r.vehicle.totalStudents;
                return acc;
            },
            {
                income: 0,
                expense: 0,
                profit: 0,
                transportPaid: 0,
                transportPending: 0,
                students: 0,
            }
        );
    }, [rows]);

    /* ---- handlers ---- */
    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
        setPage(1);
    }

    function toggleExpand(id: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

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

    /* ---- render helpers ---- */
    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <span className="ml-1 inline-block w-3" />;
        return sortDir === "asc" ? (
            <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
        ) : (
            <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
        );
    };

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6">
            {/* ==================== HEADER ==================== */}
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
                                Transport Financials
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Track vehicle-wise income, operational expenses, and net profit.
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
                            className="h-10 w-10 shrink-0 self-end text-white hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 sm:self-auto"
                            onClick={loadAll}
                            disabled={isLoading || isRangeInvalid}
                        >
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {isRangeInvalid ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    The &quot;from&quot; date must be before the &quot;to&quot; date.
                </div>
            ) : listError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {listError}
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* ==================== SEARCH ==================== */}
                    <div className="flex justify-end">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search vehicle, number or driver..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 dark:focus-visible:border-[#6b7a55] dark:focus-visible:ring-[#6b7a55]/30"
                            />
                        </div>
                    </div>
                    {/* ==================== SUMMARY CARDS ==================== */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
                        <SummaryCard
                            label="Total Income"
                            value={formatCurrency(totals.income)}
                            icon={<TrendingUp className="h-4 w-4" />}
                            accent={BRAND}
                        />
                        <SummaryCard
                            label="Total Expense"
                            value={formatCurrency(totals.expense)}
                            icon={<TrendingDown className="h-4 w-4" />}
                            accent={LOSS}
                        />
                        <SummaryCard
                            label="Net Profit / Loss"
                            value={formatCurrency(Math.abs(totals.profit))}
                            icon={
                                totals.profit >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                ) : (
                                    <TrendingDown className="h-4 w-4" />
                                )
                            }
                            accent={totals.profit >= 0 ? BRAND : LOSS}
                            prefix={totals.profit >= 0 ? "+" : "−"}
                        />
                        <SummaryCard
                            label="Transport Paid"
                            value={formatCurrency(totals.transportPaid)}
                            icon={<Wallet className="h-4 w-4" />}
                            accent="#3b6e91"
                        />
                        <SummaryCard
                            label="Total Students"
                            value={String(totals.students)}
                            icon={<Users className="h-4 w-4" />}
                            accent="#a8763e"
                        />
                    </div>

                    {/* ==================== TABLE ==================== */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/60">
                                        <th
                                            className="cursor-pointer px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 sm:px-5 select-none"
                                            onClick={() => toggleSort("vehicle")}
                                        >
                                            Vehicle <SortIcon col="vehicle" />
                                        </th>
                                        <th
                                            className="cursor-pointer px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-5 select-none"
                                            onClick={() => toggleSort("students")}
                                        >
                                            Students <SortIcon col="students" />
                                        </th>
                                        <th
                                            className="cursor-pointer px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-5 select-none"
                                            onClick={() => toggleSort("income")}
                                        >
                                            Income <SortIcon col="income" />
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-5">
                                            Transport
                                        </th>
                                        <th
                                            className="cursor-pointer px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-5 select-none"
                                            onClick={() => toggleSort("expense")}
                                        >
                                            Expense <SortIcon col="expense" />
                                        </th>
                                        <th
                                            className="cursor-pointer px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-5 select-none"
                                            onClick={() => toggleSort("profit")}
                                        >
                                            Profit / Loss <SortIcon col="profit" />
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 sm:px-5">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {isLoading && rows.length === 0 ? (
                                        <SkeletonRows count={6} />
                                    ) : sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={7}>
                                                <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
                                                    <Receipt className="h-7 w-7 text-slate-300" />
                                                    <p className="text-sm">
                                                        {search
                                                            ? `No vehicles match "${search}"`
                                                            : "No vehicles found."}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paged.map((row) => {
                                            const v = row.vehicle;
                                            const f = row.financial;
                                            const isExp = expanded.has(v.id);
                                            const profit = f?.profit ?? 0;
                                            const isProfit = profit >= 0;

                                            return (
                                                <Fragment key={v.id}>
                                                    <tr
                                                        className={cn(
                                                            "transition-colors",
                                                            isExp
                                                                ? "bg-[#556043]/[0.03] dark:bg-emerald-400/[0.03]"
                                                                : "hover:bg-slate-50/60 dark:hover:bg-white/[0.03]"
                                                        )}
                                                    >
                                                        {/* Vehicle */}
                                                        <td className="px-4 py-3.5 sm:px-5">
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                                                                    style={{ backgroundColor: BRAND }}
                                                                >
                                                                    <Bus className="h-4 w-4" />
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                                        {v.vehicleName}
                                                                    </p>
                                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                        {v.vehicleNumber} • {v.driverName}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Students */}
                                                        <td className="px-4 py-3.5 text-right sm:px-5">
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                            >
                                                                <Users className="h-3 w-3" />
                                                                {v.totalStudents}
                                                            </Badge>
                                                        </td>

                                                        {/* Income */}
                                                        <td className="px-4 py-3.5 text-right font-medium text-slate-900 dark:text-slate-100 sm:px-5">
                                                            {row.isLoading ? (
                                                                <span className="inline-block h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                                            ) : (
                                                                formatCurrency(f?.income ?? 0)
                                                            )}
                                                        </td>

                                                        {/* Transport */}
                                                        <td className="px-4 py-3.5 text-right sm:px-5">
                                                            {row.isLoading ? (
                                                                <span className="inline-block h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                                            ) : (
                                                                <div className="flex flex-col items-end gap-0.5">
                                                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                                        Paid {formatCurrency(f?.transportFeePaid ?? 0)}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        Pending {formatCurrency(f?.transportFeePending ?? 0)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Expense */}
                                                        <td className="px-4 py-3.5 text-right font-medium text-slate-900 dark:text-slate-100 sm:px-5">
                                                            {row.isLoading ? (
                                                                <span className="inline-block h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                                            ) : (
                                                                formatCurrency(f?.expense ?? 0)
                                                            )}
                                                        </td>

                                                        {/* Profit / Loss */}
                                                        <td className="px-4 py-3.5 text-right sm:px-5">
                                                            {row.isLoading ? (
                                                                <span className="inline-block h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                                            ) : (
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-sm font-bold"
                                                                    style={{ color: isProfit ? BRAND : LOSS }}
                                                                >
                                                                    {isProfit ? (
                                                                        <TrendingUp className="h-3.5 w-3.5" />
                                                                    ) : (
                                                                        <TrendingDown className="h-3.5 w-3.5" />
                                                                    )}
                                                                    {isProfit ? "+" : "−"}
                                                                    {formatCurrency(Math.abs(profit))}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Expand */}
                                                        <td className="px-4 py-3.5 text-center sm:px-5">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => toggleExpand(v.id)}
                                                                disabled={row.isLoading || !f}
                                                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                                            >
                                                                {isExp ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded detail row */}
                                                    {isExp && f && (
                                                        <tr className="bg-[#556043]/[0.02] dark:bg-emerald-400/[0.02]">
                                                            <td colSpan={7} className="px-4 py-4 sm:px-5">
                                                                <ExpandedRow
                                                                    financial={f}
                                                                    vehicle={v}
                                                                />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!isLoading && sorted.length > 0 && (
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800/50 sm:flex-row sm:px-5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing {(pageSafe - 1) * PAGE_SIZE + 1}–
                                    {Math.min(pageSafe * PAGE_SIZE, sorted.length)} of {sorted.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={pageSafe <= 1}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                        Page {pageSafe} of {totalPages}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={pageSafe >= totalPages}
                                    >
                                        <ArrowRight className="h-4 w-4" />
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

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

import { Fragment } from "react";

function SummaryCard({
    label,
    value,
    icon,
    accent,
    prefix,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
    prefix?: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-4">
            <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-xl"
                style={{ backgroundColor: accent }}
            />
            <div className="relative flex items-center gap-2">
                <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: accent }}
                >
                    {icon}
                </span>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            </div>
            <p className="relative mt-2 text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-xl">
                {prefix && <span className="text-sm">{prefix}</span>}
                {value}
            </p>
        </div>
    );
}

function SkeletonRows({ count }: { count: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="space-y-1.5">
                                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="ml-auto h-5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="ml-auto h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="ml-auto h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="ml-auto h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="ml-auto h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-center sm:px-5">
                        <div className="mx-auto h-8 w-8 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                </tr>
            ))}
        </>
    );
}

function ExpandedRow({
    financial,
    vehicle,
}: {
    financial: FinancialByVehicleData;
    vehicle: Vehicle;
}) {
    const grouped = useMemo(
        () => groupExpenseBreakdown(financial.expenseBreakdown),
        [financial.expenseBreakdown]
    );

    const isProfit = (financial.profit ?? 0) >= 0;
    const incomeExpenseTotal = (financial.income ?? 0) + (financial.expense ?? 0);
    const incomePct =
        incomeExpenseTotal > 0
            ? Math.round(((financial.income ?? 0) / incomeExpenseTotal) * 100)
            : 0;
    const expensePct =
        incomeExpenseTotal > 0
            ? Math.round(((financial.expense ?? 0) / incomeExpenseTotal) * 100)
            : 0;

    return (
        <div className="space-y-4">
            {/* Mini hero + bars */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div
                    className="relative overflow-hidden rounded-xl p-3 text-white shadow-sm"
                    style={{
                        background: isProfit
                            ? `linear-gradient(135deg, #3d4632, ${BRAND})`
                            : `linear-gradient(135deg, #5c2f2b, ${LOSS})`,
                    }}
                >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                        Net {isProfit ? "Profit" : "Loss"}
                    </p>
                    <p className="mt-1 text-xl font-bold">
                        {isProfit ? "+" : "−"}
                        {formatCurrency(Math.abs(financial.profit))}
                    </p>
                    <p className="mt-1 text-[10px] text-white/60">
                        {vehicle.vehicleNumber} • {vehicle.totalStudents} student
                        {vehicle.totalStudents === 1 ? "" : "s"}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <TrendingUp className="h-3.5 w-3.5" style={{ color: BRAND }} />
                            Income
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(financial.income)}
                        </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full rounded-full"
                            style={{ width: `${incomePct}%`, backgroundColor: BRAND }}
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{incomePct}% of total</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <TrendingDown className="h-3.5 w-3.5" style={{ color: LOSS }} />
                            Expense
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(financial.expense)}
                        </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full rounded-full"
                            style={{ width: `${expensePct}%`, backgroundColor: LOSS }}
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{expensePct}% of total</p>
                </div>
            </div>

            {/* Transport fee detail */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/50 dark:bg-slate-900/30">
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Generated
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(financial.transportFeeGenerated)}
                    </p>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Paid
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(financial.transportFeePaid)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Pending
                    </p>
                    <p className="mt-1 text-sm font-bold text-amber-700 dark:text-amber-300">
                        {formatCurrency(financial.transportFeePending)}
                    </p>
                </div>
            </div>

            {/* Expense breakdown accordion */}
            {grouped.length > 0 && (
                <Accordion type="multiple" className="rounded-xl border border-slate-100 dark:border-slate-800/50">
                    {grouped.map((group, i) => {
                        const accent = [BRAND, "#3b6e91", "#a8763e", "#7a4a8f", LOSS][i % 5];
                        return (
                            <AccordionItem
                                key={group.category}
                                value={group.category}
                                className="border-slate-100 last:border-b-0 dark:border-slate-800/50"
                            >
                                <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
                                    <span className="flex flex-1 items-center justify-between gap-2 pr-2">
                                        <span className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="h-2 w-2 shrink-0 rounded-full"
                                                style={{ backgroundColor: accent }}
                                            />
                                            <span className="truncate text-sm font-medium capitalize text-slate-900 dark:text-slate-200">
                                                {group.category}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                            {formatCurrency(group.total)}
                                        </span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-2">
                                    <div className="space-y-1 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/40">
                                        {group.items.map((item, idx) => (
                                            <div
                                                key={`${item.subCategory}-${idx}`}
                                                className="flex items-center justify-between gap-2 text-sm"
                                            >
                                                <span className="truncate capitalize text-slate-600 dark:text-slate-400">
                                                    {item.subCategory}
                                                </span>
                                                <span className="shrink-0 font-medium text-slate-800 dark:text-slate-200">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}

            {grouped.length === 0 && financial.expense > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700">
                    <AlertCircle className="h-4 w-4" />
                    Expense breakdown details not available.
                </div>
            )}
        </div>
    );
}