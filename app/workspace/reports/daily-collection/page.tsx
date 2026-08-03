"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    ChevronLeft,
    ChevronRight,
    IndianRupee,
    Loader2,
    Receipt,
    RefreshCcw,
    Search,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    getDailyFeeCollectionReport,
    type DailyCollectionReportResponse,
    type DailyCollectionTransaction,
} from "@/lib/services/reports";

const BRAND = "#556043";
const PAGE_SIZE = 10;

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

function formatDisplayDateTime(date: string) {
    if (!date) return "";
    const datePart = date.slice(0, 10);
    return new Date(`${datePart}T00:00:00`).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function DailyCollectionReportPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [report, setReport] = useState<DailyCollectionReportResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isRangeInvalid = fromDate > toDate;

    // Debounce search input → actual search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (!fromDate || !toDate || fromDate > toDate) return;

        let cancelled = false;

        async function load(from: string, to: string, pageNum: number) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getDailyFeeCollectionReport({
                    fromDate: from,
                    toDate: to,
                    page: pageNum,
                    limit: PAGE_SIZE,
                    search: search.trim(),
                });
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

        load(fromDate, toDate, page);

        return () => {
            cancelled = true;
        };
    }, [fromDate, toDate, page, search]);

    const transactions = report?.studentCollections ?? [];
    const totalCollection = report?.totalCollection ?? 0;
    const pagination = report?.pagination ?? {
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
    };

    const rangeStart =
        transactions.length === 0
            ? 0
            : (pagination.page - 1) * pagination.limit + 1;
    const rangeEnd =
        transactions.length === 0 ? 0 : rangeStart + transactions.length - 1;

    function handleFromDateChange(value: string) {
        setFromDate(value);
        if (value > toDate) setToDate(value);
        setPage(1);
    }

    function handleToDateChange(value: string) {
        setToDate(value);
        setPage(1);
    }

    function handleRefresh() {
        if (isRangeInvalid) return;

        setIsLoading(true);
        setError(null);
        getDailyFeeCollectionReport({
            fromDate,
            toDate,
            page,
            limit: PAGE_SIZE,
            search: search.trim(),
        })
            .then(setReport)
            .catch(() =>
                setError("Could not load the collection report. Please try again.")
            )
            .finally(() => setIsLoading(false));
    }

    // Derive unique payment methods for hero badges from current page transactions
    const paymentMethodTotals = transactions.reduce<Record<string, number>>(
        (acc, tx) => {
            tx.paymentMethods.forEach((pm) => {
                acc[pm.paymentMethod] = (acc[pm.paymentMethod] ?? 0) + pm.amount;
            });
            return acc;
        },
        {}
    );

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
                                    onChange={(e) => handleToDateChange(e.target.value)}
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
                            <RefreshCcw
                                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                            />
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
                    {/* Search — right-aligned, always mounted, brand focus colour */}
                    <div className="flex justify-end">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search student..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700
                                    focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20
                                    dark:focus-visible:border-[#6b7a55] dark:focus-visible:ring-[#6b7a55]/30"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-24 text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                            <p className="text-sm">Loading collection report...</p>
                        </div>
                    ) : (
                        <>
                            {/* Total collection — hero */}
                            <div
                                className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-[#556043] dark:bg-[#6b7a55]"
                               
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
                                            {formatCurrency(totalCollection)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(paymentMethodTotals).map(
                                            ([method, amount]) => (
                                                <span
                                                    key={method}
                                                    className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm"
                                                >
                                                    <span className="capitalize">{method}</span>
                                                    <span className="ml-1.5 font-semibold">
                                                        {formatCurrency(amount)}
                                                    </span>
                                                </span>
                                            )
                                        )}
                                        {transactions.length === 0 && (
                                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70 ring-1 ring-white/15 backdrop-blur-sm">
                                                No transactions
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Transaction list — ERP-style table */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                <p className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800/50 sm:px-5">
                                    Transactions
                                </p>

                                {transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
                                        <Receipt className="h-7 w-7 text-slate-300" />
                                        <p className="text-sm">
                                            No collections recorded for this range.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1000px] text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-900/60">
                                                <tr className="text-left text-slate-500 dark:text-slate-400">
                                                    <th className="px-4 py-2.5 font-medium sm:px-5">
                                                        Transaction #
                                                    </th>
                                                    <th className="px-4 py-2.5 font-medium sm:px-5">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-2.5 font-medium sm:px-5">
                                                        Student
                                                    </th>
                                                    <th className="px-4 py-2.5 font-medium sm:px-5">
                                                        Class
                                                    </th>
                                                    <th className="px-4 py-2.5 font-medium sm:px-5">
                                                        Payment Methods
                                                    </th>
                                                    <th className="px-4 py-2.5 font-medium sm:px-5">
                                                        Collections
                                                    </th>
                                                    <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                {transactions.map((tx) => (
                                                    <TransactionRow key={tx.transactionNumber} tx={tx} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination footer */}
                                {transactions.length > 0 && (
                                    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800/50 sm:flex-row sm:px-5">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Showing {rangeStart}–{rangeEnd} of {pagination.total}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={pagination.page <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                Page {pagination.page} of {pagination.totalPages}
                                            </span>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    setPage((p) =>
                                                        Math.min(pagination.totalPages, p + 1)
                                                    )
                                                }
                                                disabled={pagination.page >= pagination.totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </section>
    );
}

function TransactionRow({ tx }: { tx: DailyCollectionTransaction }) {
    return (
        <tr>
            <td className="px-4 py-2.5 font-medium text-slate-950 dark:text-slate-100 sm:px-5">
                {tx.transactionNumber}
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300 sm:px-5">
                {formatDisplayDateTime(tx.transactionDate)}
            </td>
            <td className="px-4 py-2.5 font-medium text-slate-950 dark:text-slate-100 sm:px-5">
                {tx.studentName}
            </td>
            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 sm:px-5">
                {tx.class}
            </td>
            <td className="px-4 py-2.5 sm:px-5">
                <div className="flex flex-wrap gap-1.5">
                    {tx.paymentMethods.map((pm) => (
                        <Badge
                            key={pm.paymentMethod}
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        >
                            <Wallet className="mr-1 h-3 w-3" />
                            <span className="capitalize">{pm.paymentMethod}</span>
                            <span className="ml-1 font-semibold">
                                {formatCurrency(pm.amount)}
                            </span>
                        </Badge>
                    ))}
                </div>
            </td>
            <td className="px-4 py-2.5 sm:px-5">
                <div className="flex flex-col gap-1">
                    {tx.collections.map((c, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                        >
                            {c.type === "Fee" ? (
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            ) : (
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                            )}
                            <span className="font-medium">{c.type}:</span>
                            <span>
                                {c.type === "Fee"
                                    ? c.chargeType ?? c.category
                                    : c.fineType}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {formatCurrency(c.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            </td>
            <td className="px-4 py-2.5 text-right font-semibold text-slate-950 dark:text-slate-100 sm:px-5">
                {formatCurrency(tx.Totalamount_from_transaction)}
            </td>
        </tr>
    );
}