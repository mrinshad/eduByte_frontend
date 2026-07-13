"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    IndianRupee,
    Layers3,
    Loader2,
    RefreshCcw,
    Search,
    Tags,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    getExpenseByCategoryReport,
    type CategoryExpense,
    type ExpenseByCategoryData,
} from "@/lib/services/reports"; // <-- adjust to wherever you saved the API file

const BRAND = "#556043"; // Kidscove olive-green — same shade used across the Daily Collection Report

// Same amber accent language as the Expense Management page, so this
// report feels like the same product rather than a bolted-on screen.
const titleTextClass = "text-slate-950 dark:text-slate-100";
const supportingTextClass = "text-muted-foreground";

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

    // Category name of the row currently selected on the left. The sub
    // category card on the right is scoped to this — same relationship the
    // Category/Sub Category cards have on the Expense Management page.
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
                if (!cancelled) {
                    setReport(data);
                    // A fresh range may not contain the previously selected
                    // category — clear the selection so the right card
                    // doesn't show stale sub categories.
                    setSelectedCategory(null);
                }
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

    // Sorted so the largest category leads the list — makes the
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

    const activeCategoryData: CategoryExpense | null = useMemo(
        () => categories.find((c) => c.category === selectedCategory) ?? null,
        [categories, selectedCategory]
    );

    // Sub categories inside the right card, largest first, so the same
    // "biggest contributor leads" convention holds one level down too.
    const activeSubCategories = useMemo(() => {
        if (!activeCategoryData) return [];
        return [...activeCategoryData.subCategories].sort((a, b) => b.amount - a.amount);
    }, [activeCategoryData]);

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
                    {/* Total expense — compact full-width hero */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-4 shadow-lg"
                        style={{
                            background: `linear-gradient(120deg, #3d4632 0%, ${BRAND} 55%, #6b7a55 100%)`,
                        }}
                    >
                        {/* Decorative glow accents — purely visual, clipped by overflow-hidden */}
                        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

                        <div className="relative">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                                    <IndianRupee className="h-4 w-4 text-white" />
                                </span>
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                                    Total Expense
                                </p>
                            </div>
                            <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                {formatCurrency(total)}
                            </p>
                            <p className="mt-1.5 text-xs text-white/70">
                                Across {categories.length} categor{categories.length === 1 ? "y" : "ies"}
                            </p>
                        </div>
                    </div>

                    {/* Category (left) + Sub Category (right) — matched height on
                        large screens, each card scrolls internally. */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:h-[520px]">
                        {/* ----------------------------------------------------- */}
                        {/* Category — full list on load, click to scope the      */}
                        {/* sub category card on the right.                        */}
                        {/* ----------------------------------------------------- */}
                        <Card className="flex flex-col bg-white dark:bg-background lg:h-full">
                            <CardHeader className="flex flex-col gap-3 border-b border-black/5 dark:border-white/10">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-[#556043]/10">
                                        <Tags className="h-4.5 w-4.5 text-[#556043] dark:text-emerald-300" />
                                    </span>
                                    <div>
                                        <CardTitle className={`text-2xl font-semibold ${titleTextClass}`}>
                                            Category
                                        </CardTitle>
                                        <CardDescription className={supportingTextClass}>
                                            Select a category to see its sub categories.
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search category name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-10 rounded-lg pl-9 pr-8"
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
                            </CardHeader>

                            <CardContent
                                className="
                                space-y-2 pt-4 overflow-y-auto
                                max-h-[420px] lg:max-h-none lg:flex-1
                                scrollbar-thin
                                scrollbar-thumb-slate-300
                                scrollbar-track-transparent
                                hover:scrollbar-thumb-slate-400
                                dark:scrollbar-thumb-slate-700
                                dark:hover:scrollbar-thumb-slate-600
                            "
                            >
                                {sortedCategories.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-[#556043]/25 bg-[#556043]/5 px-5 py-6 text-center dark:border-emerald-400/25 dark:bg-emerald-400/10">
                                        <p className={`text-sm font-medium ${titleTextClass}`}>
                                            No expenses recorded
                                        </p>
                                        <p className={`mt-1 text-sm ${supportingTextClass}`}>
                                            No categories have expense in this date range.
                                        </p>
                                    </div>
                                ) : filteredCategories.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                                        <p className={`text-sm font-medium ${titleTextClass}`}>
                                            No categories match &quot;{search}&quot;
                                        </p>
                                    </div>
                                ) : (
                                    filteredCategories.map((category) => {
                                        const isActive = category.category === selectedCategory;
                                        const pct = total > 0 ? Math.round((category.amount / total) * 100) : 0;
                                        const subCount = category.subCategories?.length ?? 0;

                                        return (
                                            <div
                                                key={category.category}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setSelectedCategory(category.category)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        event.preventDefault();
                                                        setSelectedCategory(category.category);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#556043]/30 cursor-pointer",
                                                    isActive
                                                        ? "border-[#556043]/40 bg-[#556043]/[0.06] shadow-sm dark:border-emerald-400/30 dark:bg-emerald-400/10"
                                                        : "border-black/5 bg-white/80 hover:border-black/10 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                                                )}
                                            >
                                                <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                                    <Tags
                                                        className={cn(
                                                            "h-4 w-4 shrink-0",
                                                            isActive ? "text-[#556043] dark:text-emerald-300" : "text-slate-400"
                                                        )}
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-medium truncate block capitalize text-slate-950 dark:text-slate-100">
                                                            {category.category}
                                                        </span>
                                                        <span className="mt-1.5 flex items-center gap-2">
                                                            <span className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                                <span
                                                                    className="block h-full rounded-full"
                                                                    style={{ width: `${pct}%`, backgroundColor: BRAND }}
                                                                />
                                                            </span>
                                                            <span className="text-xs text-slate-500">{pct}%</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                                    <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                        {formatCurrency(category.amount)}
                                                    </span>
                                                    <span className="rounded-full border border-black/5 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                                                        {subCount} sub
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* ----------------------------------------------------- */}
                        {/* Sub Category — scoped to the selected category, asks   */}
                        {/* the user to pick one first.                             */}
                        {/* ----------------------------------------------------- */}
                        <Card className="flex flex-col bg-white dark:bg-background lg:h-full">
                            <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-[#556043]/10">
                                        <Layers3 className="h-4.5 w-4.5 text-[#556043] dark:text-emerald-300" />
                                    </span>
                                    <div className="min-w-0">
                                        <CardTitle className={`text-2xl font-semibold truncate capitalize ${titleTextClass}`}>
                                            {activeCategoryData ? activeCategoryData.category : "Sub Category"}
                                        </CardTitle>
                                        <CardDescription className={supportingTextClass}>
                                            {!activeCategoryData
                                                ? "Please select a category to see its sub categories."
                                                : activeSubCategories.length === 0
                                                    ? "No sub categories for this category."
                                                    : `${activeSubCategories.length} sub categor${activeSubCategories.length === 1 ? "y" : "ies"} in this range.`}
                                        </CardDescription>
                                    </div>
                                </div>

                                {activeCategoryData && (
                                    <span className="shrink-0 text-sm font-bold" style={{ color: BRAND }}>
                                        {formatCurrency(activeCategoryData.amount)}
                                    </span>
                                )}
                            </CardHeader>

                            <CardContent
                                className="
                                space-y-2 pt-4 overflow-y-auto
                                max-h-[420px] lg:max-h-none lg:flex-1
                                scrollbar-thin
                                scrollbar-thumb-slate-300
                                scrollbar-track-transparent
                                hover:scrollbar-thumb-slate-400
                                dark:scrollbar-thumb-slate-700
                                dark:hover:scrollbar-thumb-slate-600
                            "
                            >
                                {!activeCategoryData ? (
                                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                                        <Layers3 className="h-7 w-7 text-slate-300" />
                                        <p className={`mt-2 text-sm font-medium ${titleTextClass}`}>
                                            Please select a category
                                        </p>
                                        <p className={`mt-1 text-sm ${supportingTextClass}`}>
                                            Its sub category breakdown will show up here.
                                        </p>
                                    </div>
                                ) : activeSubCategories.length === 0 ? (
                                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                                        <Layers3 className="h-7 w-7 text-slate-300" />
                                        <p className={`mt-2 text-sm font-medium ${titleTextClass}`}>
                                            No sub categories yet
                                        </p>
                                        <p className={`mt-1 text-sm ${supportingTextClass}`}>
                                            This category has no sub category breakdown in this range.
                                        </p>
                                    </div>
                                ) : (
                                    activeSubCategories.map((sc) => {
                                        const categoryTotal = activeCategoryData.amount;
                                        const pct = categoryTotal > 0 ? Math.round((sc.amount / categoryTotal) * 100) : 0;

                                        return (
                                            <div
                                                key={sc.name}
                                                className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/80 px-4 py-3 transition-all dark:border-white/10 dark:bg-white/5"
                                            >
                                                <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                                                        {sc.name.slice(0, 2).toUpperCase()}
                                                    </span>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium capitalize text-slate-950 dark:text-slate-100 truncate">
                                                            {sc.name}
                                                        </p>
                                                        <span className="mt-1.5 flex items-center gap-2">
                                                            <span className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                                <span
                                                                    className="block h-full rounded-full"
                                                                    style={{ width: `${pct}%`, backgroundColor: BRAND }}
                                                                />
                                                            </span>
                                                            <span className="text-xs text-slate-500">{pct}%</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className="shrink-0 pl-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                    {formatCurrency(sc.amount)}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </section>
    );
}