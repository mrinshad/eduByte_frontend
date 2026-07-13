"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    IndianRupee,
    Loader2,
    Receipt,
    RefreshCcw,
    Search,
    Tag,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getExpenseByCategoryReport,
    type ExpenseByCategoryData,
} from "@/lib/services/reports"; // <-- adjust to wherever you saved the API file

const BRAND = "#556043";

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
        date.toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
        })
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

// The API returns date fields as full ISO timestamps (e.g.
// "2026-07-12T00:00:00.000Z"). Take just the yyyy-mm-dd part before
// building a display date, otherwise appending "T00:00:00" again
// produces an invalid string.
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
    if (!fromDate || !toDate) return "Expense breakdown, at a glance";

    const fromPart = fromDate.slice(0, 10);
    const toPart = toDate.slice(0, 10);

    if (fromPart === toPart) return formatDisplayDate(fromPart);

    return `${formatDisplayDate(fromPart)} — ${formatDisplayDate(toPart)}`;
}

export default function ExpenseByCategoryReportPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [search, setSearch] = useState("");
    const [report, setReport] = useState<ExpenseByCategoryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isRangeInvalid = fromDate > toDate;

    // Re-fetches every time either end of the range changes, so switching
    // dates always replaces (never merges with) the previous numbers.
    useEffect(() => {
        if (!fromDate || !toDate) return;
        if (fromDate > toDate) return;

        let cancelled = false;

        async function load(from: string, to: string) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getExpenseByCategoryReport(from, to);
                if (!cancelled) setReport(data);
            } catch (err) {
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

    // Sorted so the largest category leads the table — makes the
    // breakdown scannable without the user having to hunt for it.
    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => b.amount - a.amount),
        [categories]
    );

    // Client-side filter by category name. The endpoint itself has no
    // search param, so we narrow the already-fetched range in the browser.
    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return sortedCategories;
        return sortedCategories.filter((c) => c.category.toLowerCase().includes(q));
    }, [sortedCategories, search]);

    // Sum of the filtered rows, shown as a "Total" footer that updates
    // live while searching (distinct from the range-wide totalExpense).
    const filteredTotal = useMemo(
        () => filteredCategories.reduce((sum, c) => sum + c.amount, 0),
        [filteredCategories]
    );

    function handleFromDateChange(value: string) {
        setFromDate(value);
        // Keep the range valid: pull "to" forward if it now precedes "from"
        if (value > toDate) setToDate(value);
    }

    function handleRefresh() {
        if (isRangeInvalid) return;

        setIsLoading(true);
        setError(null);
        getExpenseByCategoryReport(fromDate, toDate)
            .then(setReport)
            .catch(() => setError("Could not load the expense report. Please try again."))
            .finally(() => setIsLoading(false));
    }

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6">
            {/* Header */}
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
                                    : "Expense breakdown, at a glance"}
                            </p>
                        </div>
                    </div>

                    {/* Date range picker — stacks on mobile, inline from tablet up */}
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
                                    onChange={(e) => setToDate(e.target.value)}
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
                    The "from" date must be before the "to" date.
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-24 text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                    <p className="text-sm">Loading expense report...</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* Total expense — modern full-width hero */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-5 shadow-lg sm:p-7"
                        style={{
                            background: `linear-gradient(120deg, #3d4632 0%, ${BRAND} 55%, #6b7a55 100%)`,
                        }}
                    >
                        {/* Decorative glow accents — purely visual, clipped by overflow-hidden */}
                        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

                        <div className="relative">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                                    <IndianRupee className="h-4.5 w-4.5 text-white" />
                                </span>
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                                    Total Expense
                                </p>
                            </div>
                            <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                                {formatCurrency(total)}
                            </p>
                            <p className="mt-2 text-xs text-white/70">
                                Across {categories.length} categor{categories.length === 1 ? "y" : "ies"}
                            </p>
                        </div>
                    </div>

                    {/* Category search + table */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                        {/* Search bar */}
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                By Category
                            </p>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search category name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-10 rounded-lg pl-9 pr-8 border-slate-300 dark:border-slate-700"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={() => setSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[480px] overflow-auto">
                            <Table className="min-w-[560px]">
                                <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                        <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            #
                                        </TableHead>
                                        <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            Category
                                        </TableHead>
                                        <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            Share
                                        </TableHead>
                                        <TableHead className="px-4 h-11 text-right text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCategories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Receipt className="h-7 w-7 text-slate-300" />
                                                    <p className="text-sm">No expenses recorded for this range.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredCategories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Tag className="h-7 w-7 text-slate-300" />
                                                    <p className="text-sm">
                                                        No categories match &quot;{search}&quot;.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCategories.map((c, i) => {
                                            const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0;
                                            return (
                                                <TableRow
                                                    key={c.category}
                                                    className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                                >
                                                    <TableCell className="px-4 py-3 text-sm font-medium text-slate-500">
                                                        {i + 1}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm font-semibold capitalize text-slate-950 dark:text-slate-100">
                                                        {c.category}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                                <span
                                                                    className="block h-full rounded-full bg-[#556043]"
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </span>
                                                            <span className="text-xs text-slate-500">{pct}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                        {formatCurrency(c.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {filteredCategories.length > 0 && (
                            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800/50 dark:bg-slate-900/40">
                                <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                                    {search ? "Filtered Total" : "Total"}
                                </span>
                                <span className="text-sm font-bold text-[#556043]">
                                    {formatCurrency(filteredTotal)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}