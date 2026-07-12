"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Banknote,
    Calendar,
    IndianRupee,
    Loader2,
    Receipt,
    RefreshCcw,
    Smartphone,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getDailyCollectionReport,
    type DailyCollectionData,
} from "@/lib/services/reports"; // <-- adjust to wherever you saved the API file

const BRAND = "#556043";

// Icon + accent per payment method. Falls back to a generic wallet icon
// for any method the backend adds later that we haven't styled yet.
const PAYMENT_METHOD_STYLES: Record<
    string,
    { icon: React.ElementType; accent: string }
> = {
    cash: { icon: Banknote, accent: "#556043" },
    upi: { icon: Smartphone, accent: "#3b6e91" },
};

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

// The API returns `date` as a full ISO timestamp (e.g.
// "2026-07-12T00:00:00.000Z"). Take just the yyyy-mm-dd part before
// building a display date, otherwise appending "T00:00:00" again
// produces an invalid string.
function formatDisplayDate(date: string) {
    if (!date) return "";

    const datePart = date.slice(0, 10);
    return new Date(`${datePart}T00:00:00`).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function DailyCollectionReportPage() {
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState<string>(todayISO());
    const [report, setReport] = useState<DailyCollectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Re-fetches every time the date changes, so switching dates always
    // replaces (never merges with) the previous day's numbers.
    useEffect(() => {
        if (!selectedDate) return;

        let cancelled = false;

        async function load(date: string) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getDailyCollectionReport(date);
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

        load(selectedDate);

        return () => {
            cancelled = true;
        };
    }, [selectedDate]);

    const paymentMethods = report?.paymentMethodData ?? [];
    const chargeTypes = report?.collectionByChargeType ?? [];
    const total = report?.totalCollection ?? 0;

    // Sorted so the largest contributor leads the table — makes the
    // breakdown scannable without the user having to hunt for it.
    const sortedChargeTypes = useMemo(
        () => [...chargeTypes].sort((a, b) => b.amount - a.amount),
        [chargeTypes]
    );

    function handleRefresh() {
        // Re-trigger the effect by nudging state through the same setter
        // the date picker uses, so refresh and date-change share one path.
        setSelectedDate((d) => d);
        setIsLoading(true);
        setError(null);
        getDailyCollectionReport(selectedDate)
            .then(setReport)
            .catch(() => setError("Could not load the collection report. Please try again."))
            .finally(() => setIsLoading(false));
    }

    return (
        <section className="w-full px-6 py-4 space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 shrink-0"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                Daily Collection Report
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {report ? formatDisplayDate(report.date) : "Fee collection, at a glance"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-48">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="date"
                                value={selectedDate}
                                max={tomorrowISO()}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
                            />
                        </div>
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 shrink-0 text-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            onClick={handleRefresh}
                            disabled={isLoading}
                        >
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-24 text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                    <p className="text-sm">Loading collection report...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Total collection — modern full-width hero */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-7 shadow-lg"
                        style={{
                            background: `linear-gradient(120deg, #3d4632 0%, ${BRAND} 55%, #6b7a55 100%)`,
                        }}
                    >
                        {/* Decorative glow accents — purely visual, clipped by overflow-hidden */}
                        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

                        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                                        <IndianRupee className="h-4.5 w-4.5 text-white" />
                                    </span>
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                                        Total Collection
                                    </p>
                                </div>
                                <p className="text-5xl font-bold tracking-tight text-white">
                                    {formatCurrency(total)}
                                </p>
                            </div>

                            {paymentMethods.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {paymentMethods.map((pm) => (
                                        <span
                                            key={pm.paymentMethod}
                                            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm"
                                        >
                                            <span className="capitalize">{pm.paymentMethod}</span>
                                            <span className="ml-1.5 font-semibold">
                                                {formatCurrency(pm.amount)}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment methods + charge type — matched height, each scrolls internally */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] lg:h-[480px]">
                        {/* Payment method breakdown */}
                        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                            <p className="mb-4 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                By Payment Method
                            </p>

                            {paymentMethods.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
                                    <Wallet className="h-7 w-7 text-slate-300" />
                                    <p className="text-sm">No payments recorded for this date.</p>
                                </div>
                            ) : (
                                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                                    {paymentMethods.map((pm) => {
                                        const key = pm.paymentMethod.toLowerCase();
                                        const style = PAYMENT_METHOD_STYLES[key] ?? {
                                            icon: Wallet,
                                            accent: "#556043",
                                        };
                                        const Icon = style.icon;
                                        const pct = total > 0 ? Math.round((pm.amount / total) * 100) : 0;

                                        return (
                                            <div
                                                key={pm.paymentMethod}
                                                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800/50"
                                            >
                                                <span
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                                                    style={{ backgroundColor: style.accent }}
                                                >
                                                    <Icon className="h-4.5 w-4.5" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span className="truncate text-sm font-semibold capitalize text-slate-950 dark:text-slate-100">
                                                            {pm.paymentMethod}
                                                        </span>
                                                        <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                            {formatCurrency(pm.amount)}
                                                        </span>
                                                    </span>
                                                    <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <span
                                                            className="block h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor: style.accent,
                                                            }}
                                                        />
                                                    </span>
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                >
                                                    {pct}%
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Charge type breakdown — plain table, no card chrome, height-matched with scroll */}
                        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/50">
                            <div className="flex-1 overflow-y-auto">
                                <Table>
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
                                                Amount
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedChargeTypes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Receipt className="h-7 w-7 text-slate-300" />
                                                        <p className="text-sm">No collections recorded for this date.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            sortedChargeTypes.map((c, i) => {
                                                const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0;
                                                return (
                                                    <TableRow
                                                        key={c.chargeType}
                                                        className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                                    >
                                                        <TableCell className="px-4 py-3 text-sm font-medium text-slate-500">
                                                            {i + 1}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-sm font-semibold capitalize text-slate-950 dark:text-slate-100">
                                                            {c.chargeType}
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

                            {sortedChargeTypes.length > 0 && (
                                <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800/50 dark:bg-slate-900/40">
                                    <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                                        Total
                                    </span>
                                    <span className="text-sm font-bold text-[#556043]">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}