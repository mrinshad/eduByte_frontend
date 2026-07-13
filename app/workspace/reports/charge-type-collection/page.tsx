"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    IndianRupee,
    Loader2,
    Receipt,
    RefreshCcw,
    Wallet,
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
    getChargeTypeCollectionReport,
    type ChargeTypeCollectionData,
} from "@/lib/services/reports"; // <-- adjust to wherever you saved the API file

const BRAND = "#556043";

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

// Defaults the range to the first day of the current month through today,
// so the page shows something meaningful before the user picks dates.
function firstOfMonthISO() {
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    now.setDate(1);
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
}

function formatDisplayDate(date: string) {
    if (!date) return "";
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function ChargeTypeCollectionReportPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<string>(firstOfMonthISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [report, setReport] = useState<ChargeTypeCollectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Re-fetches whenever either end of the range changes, so switching
    // dates always replaces (never merges with) the previous range's data.
    useEffect(() => {
        if (!fromDate || !toDate) return;
        if (fromDate > toDate) return;

        let cancelled = false;

        async function load(from: string, to: string) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getChargeTypeCollectionReport(from, to);
                if (!cancelled) setReport(data);
            } catch (err) {
                if (!cancelled) {
                    setError("Could not load the collection report. Please try again.");
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

    const summary = report?.summary ?? [];
    const grandTotal = report?.grandTotal ?? 0;

    // Sorted so the largest contributor leads the table — makes the
    // breakdown scannable without the user having to hunt for it.
    const sortedSummary = useMemo(
        () => [...summary].sort((a, b) => b.totalCollected - a.totalCollected),
        [summary]
    );

    const totalTransactions = useMemo(
        () => summary.reduce((sum, s) => sum + s.transactionCount, 0),
        [summary]
    );

    const dateRangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);

    function handleRefresh() {
        if (!fromDate || !toDate || fromDate > toDate) return;
        setIsLoading(true);
        setError(null);
        getChargeTypeCollectionReport(fromDate, toDate)
            .then(setReport)
            .catch(() => setError("Could not load the collection report. Please try again."))
            .finally(() => setIsLoading(false));
    }

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
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
                                Charge Type Collection Report
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {report
                                    ? `${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)}`
                                    : "Collection by charge type, over a date range"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-40">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="date"
                                    value={fromDate}
                                    max={toDate || todayISO()}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
                                />
                            </div>
                            <span className="shrink-0 text-sm text-slate-400">to</span>
                            <div className="relative w-full sm:w-40">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="date"
                                    value={toDate}
                                    min={fromDate}
                                    max={todayISO()}
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
                            disabled={isLoading || dateRangeInvalid}
                        >
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {dateRangeInvalid ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    The "from" date can't be after the "to" date.
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-24 text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                    <p className="text-sm">Loading collection report...</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* Grand total — modern full-width hero */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-5 shadow-lg sm:p-7"
                        style={{
                            background: `linear-gradient(120deg, #3d4632 0%, ${BRAND} 55%, #6b7a55 100%)`,
                        }}
                    >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

                        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end sm:gap-6">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                                        <IndianRupee className="h-4.5 w-4.5 text-white" />
                                    </span>
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                                        Grand Total
                                    </p>
                                </div>
                                <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                                    {formatCurrency(grandTotal)}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm">
                                    {sortedSummary.length} charge type
                                    {sortedSummary.length === 1 ? "" : "s"}
                                </span>
                                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm">
                                    {totalTransactions} transaction
                                    {totalTransactions === 1 ? "" : "s"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charge type table */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/50">
                        <div className="overflow-auto">
                            <Table className="min-w-[640px]">
                                <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                        <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            #
                                        </TableHead>
                                        <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            Charge Type
                                        </TableHead>
                                        <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            Share
                                        </TableHead>
                                        <TableHead className="px-4 h-11 text-right text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            Transactions
                                        </TableHead>
                                        <TableHead className="px-4 h-11 text-right text-white dark:text-foreground font-semibold whitespace-nowrap">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedSummary.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Receipt className="h-7 w-7 text-slate-300" />
                                                    <p className="text-sm">No collections recorded for this range.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedSummary.map((c, i) => (
                                            <TableRow
                                                key={c.chargeTypeId}
                                                className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                            >
                                                <TableCell className="px-4 py-3 text-sm font-medium text-slate-500">
                                                    {i + 1}
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#556043]/10 text-[#556043] dark:bg-[#556043]/20">
                                                            <Wallet className="h-3.5 w-3.5" />
                                                        </span>
                                                        <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                            {c.chargeTypeName}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                            <span
                                                                className="block h-full rounded-full bg-[#556043]"
                                                                style={{ width: `${c.percentageOfTotal}%` }}
                                                            />
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {c.percentageOfTotal.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-300">
                                                    {c.transactionCount}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                    {formatCurrency(c.totalCollected)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {sortedSummary.length > 0 && (
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800/50 dark:bg-slate-900/40">
                                <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                                    Total
                                </span>
                                <span className="text-sm font-bold text-[#556043]">
                                    {formatCurrency(grandTotal)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}