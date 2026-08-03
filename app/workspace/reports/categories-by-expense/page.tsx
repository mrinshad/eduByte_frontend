"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    ChevronDown,
    ChevronUp,
    IndianRupee,
    Layers3,
    Loader2,
    Receipt,
    RefreshCcw,
    Search,
    Tags,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    getExpenseByCategoryReport,
    type CategoryExpense,
    type ExpenseByCategoryData,
} from "@/lib/services/reports";

const BRAND = "#556043";
const PAGE_SIZE = 10;

const ACCENT_PALETTE = [
    "#556043",
    "#3b6e91",
    "#a8763e",
    "#7a4a8f",
    "#b0524a",
];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
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

function formatDisplayDateRange(fromDate: string, toDate: string) {
    if (!fromDate || !toDate) return "Expense breakdown";
    const fromPart = fromDate.slice(0, 10);
    const toPart = toDate.slice(0, 10);
    if (fromPart === toPart) return formatDisplayDate(fromPart);
    return `${formatDisplayDate(fromPart)} — ${formatDisplayDate(toPart)}`;
}

export default function ExpenseByCategoryReportPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState(todayISO());
    const [toDate, setToDate] = useState(todayISO());
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [report, setReport] = useState<ExpenseByCategoryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const isRangeInvalid = fromDate > toDate;

    /* ---- debounce search ---- */
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    /* ---- load report ---- */
    useEffect(() => {
        if (!fromDate || !toDate || fromDate > toDate) return;
        let cancelled = false;
        async function load(from: string, to: string) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getExpenseByCategoryReport(from, to);
                if (!cancelled) {
                    setReport(data);
                    setExpandedIds(new Set());
                }
            } catch {
                if (!cancelled) {
                    setError("Could not load the expense report. Please try again.");
                    setReport(null);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load(fromDate, toDate);
        return () => {
            cancelled = true;
        };
    }, [fromDate, toDate]);

    const categories = report?.categories ?? [];
    const total = report?.totalExpense ?? 0;

    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => b.amount - a.amount),
        [categories]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return sortedCategories;
        return sortedCategories.filter((c) => c.category.toLowerCase().includes(q));
    }, [sortedCategories, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageSafe = Math.min(page, totalPages);
    const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

    const topCategory = sortedCategories[0];
    const avgExpense = categories.length > 0 ? total / categories.length : 0;

    function handleFromDateChange(value: string) {
        setFromDate(value);
        if (value > toDate) setToDate(value);
        setPage(1);
    }

    function handleRefresh() {
        if (isRangeInvalid) return;
        setIsLoading(true);
        setError(null);
        getExpenseByCategoryReport(fromDate, toDate)
            .then((data) => {
                setReport(data);
                setExpandedIds(new Set());
            })
            .catch(() => setError("Could not load the expense report. Please try again."))
            .finally(() => setIsLoading(false));
    }

    function toggleExpand(cat: string) {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    }

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6">
            {/* ==================== HEADER ==================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 shrink-0"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                                Expense By Category Report
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {report
                                    ? formatDisplayDateRange(report.fromDate, report.toDate)
                                    : "Expense breakdown"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                            <div className="relative w-full sm:w-40">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="date"
                                    aria-label="From date"
                                    value={fromDate}
                                    max={tomorrowISO()}
                                    onChange={(e) => handleFromDateChange(e.target.value)}
                                    className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
                                />
                            </div>
                            <div className="hidden shrink-0 items-center justify-center text-slate-400 sm:flex">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                            <div className="relative w-full sm:w-40">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="date"
                                    aria-label="To date"
                                    value={toDate}
                                    min={fromDate}
                                    max={tomorrowISO()}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
                                />
                            </div>
                        </div>

                        <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 shrink-0 self-end text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 sm:self-auto"
                            onClick={handleRefresh}
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
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* ==================== SEARCH ==================== */}
                    <div className="flex justify-end">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search category..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 dark:focus-visible:border-[#6b7a55] dark:focus-visible:ring-[#6b7a55]/30"
                            />
                        </div>
                    </div>
                    {/* ==================== SUMMARY CARDS ==================== */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        <SummaryCard
                            label="Total Expense"
                            value={formatCurrency(total)}
                            icon={<IndianRupee className="h-4 w-4" />}
                            accent={BRAND}
                        />
                        <SummaryCard
                            label="Categories"
                            value={String(categories.length)}
                            icon={<Tags className="h-4 w-4" />}
                            accent="#3b6e91"
                        />
                        <SummaryCard
                            label="Top Category"
                            value={topCategory ? formatCurrency(topCategory.amount) : "—"}
                            subValue={topCategory?.category}
                            icon={<TrendingUp className="h-4 w-4" />}
                            accent="#a8763e"
                        />
                        <SummaryCard
                            label="Average"
                            value={formatCurrency(avgExpense)}
                            icon={<Receipt className="h-4 w-4" />}
                            accent="#7a4a8f"
                        />
                    </div>

                    

                    {/* ==================== TABLE ==================== */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/60">
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 sm:px-5 w-12">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 sm:px-5">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-5">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-5">
                                            % of Total
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 sm:px-5 w-24">
                                            Subs
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 sm:px-5 w-16">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {isLoading && categories.length === 0 ? (
                                        <SkeletonRows count={6} />
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
                                                    <Receipt className="h-7 w-7 text-slate-300" />
                                                    <p className="text-sm">
                                                        {search
                                                            ? `No categories match "${search}"`
                                                            : "No expenses recorded for this range."}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paged.map((cat, idx) => {
                                            const isExpanded = expandedIds.has(cat.category);
                                            const accent = ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
                                            const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
                                            const subCount = cat.subCategories?.length ?? 0;

                                            return (
                                                <Fragment key={cat.category}>
                                                    <tr
                                                        className={cn(
                                                            "transition-colors",
                                                            isExpanded
                                                                ? "bg-[#556043]/[0.03] dark:bg-emerald-400/[0.03]"
                                                                : "hover:bg-slate-50/60 dark:hover:bg-white/[0.03]"
                                                        )}
                                                    >
                                                        <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400 sm:px-5">
                                                            {(pageSafe - 1) * PAGE_SIZE + idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3.5 sm:px-5">
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                                                                    style={{ backgroundColor: accent }}
                                                                >
                                                                    <Tags className="h-4 w-4" />
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                                        {cat.category}
                                                                    </p>
                                                                    <div className="mt-1.5 flex items-center gap-2">
                                                                        <span className="block h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:w-32">
                                                                            <span
                                                                                className="block h-full rounded-full"
                                                                                style={{
                                                                                    width: `${pct}%`,
                                                                                    backgroundColor: accent,
                                                                                }}
                                                                            />
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-400">
                                                                            {pct}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-semibold text-slate-950 dark:text-slate-100 sm:px-5">
                                                            {formatCurrency(cat.amount)}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right sm:px-5">
                                                            <Badge
                                                                variant="outline"
                                                                className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                            >
                                                                {pct}%
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center sm:px-5">
                                                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                                <Layers3 className="h-3 w-3" />
                                                                {subCount}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center sm:px-5">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => toggleExpand(cat.category)}
                                                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded sub-categories */}
                                                    {isExpanded && (
                                                        <tr className="bg-[#556043]/[0.02] dark:bg-emerald-400/[0.02]">
                                                            <td colSpan={6} className="px-4 py-4 sm:px-5">
                                                                <ExpandedSubCategories
                                                                    category={cat}
                                                                    accent={accent}
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
                        {!isLoading && filtered.length > 0 && (
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800/50 sm:flex-row sm:px-5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing {(pageSafe - 1) * PAGE_SIZE + 1}–
                                    {Math.min(pageSafe * PAGE_SIZE, filtered.length)} of{" "}
                                    {filtered.length}
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

function SummaryCard({
    label,
    value,
    subValue,
    icon,
    accent,
}: {
    label: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
    accent: string;
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
                {value}
            </p>
            {subValue && (
                <p className="mt-0.5 truncate text-[11px] font-medium capitalize text-slate-500 dark:text-slate-400">
                    {subValue}
                </p>
            )}
        </div>
    );
}

function SkeletonRows({ count }: { count: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5 sm:px-5">
                        <div className="h-4 w-6 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="space-y-1.5">
                                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="h-2 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="ml-auto h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="ml-auto h-5 w-10 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-center sm:px-5">
                        <div className="mx-auto h-4 w-8 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-center sm:px-5">
                        <div className="mx-auto h-8 w-8 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                </tr>
            ))}
        </>
    );
}

function ExpandedSubCategories({
    category,
    accent,
}: {
    category: CategoryExpense;
    accent: string;
}) {
    const total = category.amount;
    const subs = useMemo(
        () => [...(category.subCategories ?? [])].sort((a, b) => b.amount - a.amount),
        [category.subCategories]
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: accent }}
                    >
                        <Tags className="h-3 w-3" />
                    </span>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {category.category}
                    </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {subs.length} sub-categor{subs.length === 1 ? "y" : "ies"} •{" "}
                    {formatCurrency(total)}
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-700 dark:hover:scrollbar-thumb-slate-600">
                        <table className="w-full min-w-[400px] text-xs">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#556043]">
                                    <th className="px-3 py-2.5 text-left font-semibold text-white w-10">
                                        #
                                    </th>
                                    <th className="px-3 py-2.5 text-left font-semibold text-white">
                                        Sub Category
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-white">
                                        Amount
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-semibold text-white">
                                        %
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {subs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-6 text-center text-slate-500">
                                            <Layers3 className="mx-auto h-5 w-5 text-slate-300" />
                                            <p className="mt-1 text-xs">No sub-categories found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    subs.map((sc, i) => {
                                        const pct = total > 0 ? Math.round((sc.amount / total) * 100) : 0;
                                        return (
                                            <tr
                                                key={`${sc.name}-${i}`}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                            >
                                                <td className="px-3 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                                                    {i + 1}
                                                </td>
                                                <td className="px-3 py-2.5 font-medium capitalize text-slate-950 dark:text-slate-100">
                                                    {sc.name}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                                                    {formatCurrency(sc.amount)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                    >
                                                        {pct}%
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}