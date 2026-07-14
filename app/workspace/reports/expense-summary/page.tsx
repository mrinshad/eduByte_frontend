"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Layers,
    Loader2,
    PieChart,
    Receipt,
    RefreshCcw,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    getExpenseSummaryReport,
    type ExpenseSummaryData,
} from "@/lib/services/reports"; // <-- adjust to wherever you saved the API file

const BRAND = "#556043";

// Categories are dynamic (school-defined), so we rotate a small accent
// palette rather than maintaining a lookup map per category.
const CATEGORY_ACCENTS = [
    "#556043", // brand green
    "#3b6e91", // steel blue
    "#a8763e", // amber/bronze
    "#7a4a8f", // violet
    "#b0524a", // rust
];

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

export default function ExpenseSummaryPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [report, setReport] = useState<ExpenseSummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isRangeInvalid = fromDate > toDate;

    useEffect(() => {
        if (!fromDate || !toDate || fromDate > toDate) return;

        let cancelled = false;

        async function load(from: string, to: string) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getExpenseSummaryReport(from, to);
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

        load(fromDate, toDate);

        return () => {
            cancelled = true;
        };
    }, [fromDate, toDate]);

    const categorySummary = report?.categorySummary ?? [];
    const totalExpenses = report?.totalExpenses ?? 0;

    // Largest category leads the list — matches the "biggest contributor
    // first" pattern used on the Daily Collection Report page.
    const sortedCategories = useMemo(
        () => [...categorySummary].sort((a, b) => b.totalAmount - a.totalAmount),
        [categorySummary]
    );

    const topCategory = sortedCategories[0] ?? null;

    function handleFromDateChange(value: string) {
        setFromDate(value);
        if (value > toDate) setToDate(value);
    }

    function handleRefresh() {
        if (isRangeInvalid) return;

        setIsLoading(true);
        setError(null);
        getExpenseSummaryReport(fromDate, toDate)
            .then(setReport)
            .catch(() => setError("Could not load the expense summary. Please try again."))
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
                                Expense Summary
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {fromDate === toDate
                                    ? formatDisplayDate(fromDate)
                                    : `${formatDisplayDate(fromDate)} — ${formatDisplayDate(toDate)}`}
                            </p>
                        </div>
                    </div>

                    {/* Date range picker */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-1 flex-col gap-2 xs:flex-row sm:flex-row">
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
                    <p className="text-sm">Loading expense summary...</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* Total expenses — hero */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-4 shadow-lg"
                        style={{
                            background: `linear-gradient(120deg, #3d4632 0%, ${BRAND} 55%, #6b7a55 100%)`,
                        }}
                    >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

                        <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </span>
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                                        Total Expenses
                                    </p>
                                </div>

                                <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    {formatCurrency(totalExpenses)}
                                </p>
                            </div>

                            {topCategory && (
                                <span className="w-fit rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm">
                                    Top: <span className="capitalize">{topCategory.categoryName}</span>
                                    <span className="ml-1.5 font-semibold">
                                        {topCategory.percentageOfTotal.toFixed(1)}%
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stat strip */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Categories
                                </span>
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                                    <Layers className="h-4.5 w-4.5 text-sky-700 dark:text-sky-300" />
                                </span>
                            </div>
                            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                                {sortedCategories.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Total Entries
                                </span>
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                                    <Receipt className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
                                </span>
                            </div>
                            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                                {sortedCategories.reduce((sum, c) => sum + c.expenseCount, 0)}
                            </p>
                        </div>
                    </div>

                    {/* Category breakdown — card list */}
                    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                        <p className="mb-4 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            By Category
                        </p>

                        {sortedCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
                                <PieChart className="h-7 w-7 text-slate-300" />
                                <p className="text-sm">No expenses recorded for this range.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sortedCategories.map((category, i) => {
                                    const accent = CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length];

                                    return (
                                        <div
                                            key={category.categoryId}
                                            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800/50"
                                        >
                                            <span
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                                style={{ backgroundColor: accent }}
                                            >
                                                {category.categoryName.slice(0, 2).toUpperCase()}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center justify-between gap-2">
                                                    <span className="truncate text-sm font-semibold capitalize text-slate-950 dark:text-slate-100">
                                                        {category.categoryName}
                                                    </span>
                                                    <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                        {formatCurrency(category.totalAmount)}
                                                    </span>
                                                </span>
                                                <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <span
                                                        className="block h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(100, category.percentageOfTotal)}%`,
                                                            backgroundColor: accent,
                                                        }}
                                                    />
                                                </span>
                                                <span className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                    <span>
                                                        {category.expenseCount}{" "}
                                                        {category.expenseCount === 1 ? "expense" : "expenses"}
                                                    </span>
                                                    <span>{category.percentageOfTotal.toFixed(1)}%</span>
                                                </span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {sortedCategories.length > 0 && (
                            <div className="mt-3 flex shrink-0 items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/50">
                                <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                                    Total
                                </span>
                                <span className="text-sm font-bold text-[#556043]">
                                    {formatCurrency(totalExpenses)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}