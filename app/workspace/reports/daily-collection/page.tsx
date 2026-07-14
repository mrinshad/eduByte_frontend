"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
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
    getDailyCollectionReport,
    type DailyCollectionData,
} from "@/lib/services/reports"; // <-- adjust to wherever you saved the API file

const BRAND = "#556043";

// Icon + accent per payment method. Falls back to a generic wallet icon
// for any method the backend adds later that we haven't styled yet.
const PAYMENT_METHOD_STYLES: Record<string, { icon: React.ElementType; accent: string }> = {
    cash: { icon: Banknote, accent: "#556043" },
    upi: { icon: Smartphone, accent: "#3b6e91" },
};

// Charge types are dynamic (school-defined), so instead of a lookup map
// we rotate a small accent palette and use one consistent icon.
const CHARGE_TYPE_ACCENTS = [
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
    if (!fromDate || !toDate) return "Fee collection, at a glance";

    const fromPart = fromDate.slice(0, 10);
    const toPart = toDate.slice(0, 10);

    if (fromPart === toPart) return formatDisplayDate(fromPart);

    return `${formatDisplayDate(fromPart)} — ${formatDisplayDate(toPart)}`;
}

export default function DailyCollectionReportPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [report, setReport] = useState<DailyCollectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Re-fetches every time either end of the range changes, so switching
    // dates always replaces (never merges with) the previous numbers.
    useEffect(() => {
        if (!fromDate || !toDate) return;

        // Guard against an inverted range (e.g. user picks "to" before "from")
        if (fromDate > toDate) return;

        let cancelled = false;

        async function load(from: string, to: string) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getDailyCollectionReport(from, to);
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

    const paymentMethods = report?.paymentMethodData ?? [];
    const chargeTypes = report?.collectionByChargeType ?? [];
    const total = report?.totalCollection ?? 0;
    const isRangeInvalid = fromDate > toDate;

    // Sorted so the largest contributor leads the list — makes the
    // breakdown scannable without the user having to hunt for it.
    const sortedChargeTypes = useMemo(
        () => [...chargeTypes].sort((a, b) => b.amount - a.amount),
        [chargeTypes]
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
        getDailyCollectionReport(fromDate, toDate)
            .then(setReport)
            .catch(() => setError("Could not load the collection report. Please try again."))
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
                                Daily Collection Report
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {report
                                    ? formatDisplayDateRange(report.fromDate, report.toDate)
                                    : "Fee collection, at a glance"}
                            </p>
                        </div>
                    </div>

                    {/* Date range picker — stacks on mobile, inline from tablet up */}
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
                    <p className="text-sm">Loading collection report...</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* Total collection — modern full-width hero */}
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
                                        <IndianRupee className="h-4 w-4 text-white" />
                                    </span>

                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                                        Total Collection
                                    </p>
                                </div>

                                <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    {formatCurrency(total)}
                                </p>
                            </div>

                            {paymentMethods.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {paymentMethods.map((pm) => (
                                        <span
                                            key={pm.paymentMethod}
                                            className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm"
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

                    {/* Payment methods + charge type — both card-list style now,
                        matched height on large screens, each scrolls internally */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:h-[480px]">
                        {/* Payment method breakdown */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5 lg:h-full">
                            <p className="mb-4 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                By Payment Method
                            </p>

                            {paymentMethods.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-slate-500 lg:py-0">
                                    <Wallet className="h-7 w-7 text-slate-300" />
                                    <p className="text-sm">No payments recorded for this range.</p>
                                </div>
                            ) : (
                                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
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

                        {/* Charge type breakdown — card list, matched to Payment Method styling */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5 lg:h-full">
                            <p className="mb-4 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                By Charge Type
                            </p>

                            {sortedChargeTypes.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-slate-500 lg:py-0">
                                    <Receipt className="h-7 w-7 text-slate-300" />
                                    <p className="text-sm">No collections recorded for this range.</p>
                                </div>
                            ) : (
                                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
                                    {sortedChargeTypes.map((c, i) => {
                                        const accent = CHARGE_TYPE_ACCENTS[i % CHARGE_TYPE_ACCENTS.length];
                                        const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0;

                                        return (
                                            <div
                                                key={c.chargeType}
                                                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800/50"
                                            >
                                                <span
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                                                    style={{ backgroundColor: accent }}
                                                >
                                                    <Receipt className="h-4.5 w-4.5" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span className="truncate text-sm font-semibold capitalize text-slate-950 dark:text-slate-100">
                                                            {c.chargeType}
                                                        </span>
                                                        <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                            {formatCurrency(c.amount)}
                                                        </span>
                                                    </span>
                                                    <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <span
                                                            className="block h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor: accent,
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

                            {sortedChargeTypes.length > 0 && (
                                <div className="mt-3 flex shrink-0 items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/50">
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