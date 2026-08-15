"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    getDaybookReport,
    type DaybookReportResponse,
    type DaybookEntry
} from "@/lib/services/advancedReports";
import { getPaymentMethodAccounts, type PaymentMethodAccount } from "@/lib/services/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar as CalendarIcon,
    ArrowLeft,
    RefreshCcw,
    Search,
    BookOpen,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    Coins,
    Banknote,
    Lock,
    X
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

function formatCurrency(amount?: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount ?? 0);
}

function FilterChip({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="max-w-[10rem] truncate sm:max-w-none">{label}</span>
            <button
                onClick={onRemove}
                className="shrink-0 rounded-full hover:text-red-600"
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    );
}

export default function DaybookReportPage() {
    const router = useRouter();
    const { can } = usePermission();
    const canView = can("report.read");

    const [date, setDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [paymentMethod, setPaymentMethod] = useState<string>("ALL");
    const [searchInput, setSearchInput] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DaybookReportResponse | null>(null);
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentMethodAccount[]>([]);

    useEffect(() => {
        getPaymentMethodAccounts().then(setPaymentAccounts).catch(() => {});
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const loadDaybook = useCallback(async () => {
        if (!date) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getDaybookReport({
                date,
                paymentMethod: paymentMethod === "ALL" ? undefined : paymentMethod,
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Daybook report");
        } finally {
            setLoading(false);
        }
    }, [date, paymentMethod]);

    useEffect(() => {
        loadDaybook();
    }, [loadDaybook]);

    const filteredEntries = useMemo(() => {
        if (!data?.entries) return [];
        if (!search.trim()) return data.entries;
        const q = search.toLowerCase();
        return data.entries.filter(
            (e) =>
                e.voucherNumber.toLowerCase().includes(q) ||
                e.entityName.toLowerCase().includes(q) ||
                e.category.toLowerCase().includes(q) ||
                e.entityDetail.toLowerCase().includes(q)
        );
    }, [data?.entries, search]);

    const hasActiveFilters = useMemo(
        () =>
            paymentMethod !== "ALL" ||
            search.trim().length > 0,
        [paymentMethod, search]
    );

    const clearAllFilters = () => {
        setSearchInput("");
        setSearch("");
        setPaymentMethod("ALL");
    };

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center font-sans">
                <div className="max-w-md">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have permission to view Financial Reports.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 max-w-7xl mx-auto font-sans min-h-screen">
            {/* Header Card */}
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
                                Daybook & Cash Register
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                View all money received and spent on any selected day.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-lg">
                            <CalendarIcon className="h-4 w-4 text-slate-500" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadDaybook}
                            disabled={loading}
                            className="h-9 w-9 shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                            title="Refresh Daybook"
                        >
                            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* 4 SUMMARY STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Opening Balance */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Opening Balance</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {formatCurrency(data?.summary.openingBalance.total)}
                        </p>
                    )}
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Balance brought forward
                    </div>
                </div>

                {/* 2. Today Inflow */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Today Receipts (+)</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <ArrowDownLeft className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(data?.summary.todayInflow.total)}
                        </p>
                    )}
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {data?.summary.todayInflow.receiptCount ?? 0} receipt(s) collected
                    </div>
                </div>

                {/* 3. Today Outflow */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Today Disbursements (-)</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <ArrowUpRight className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                            {formatCurrency(data?.summary.todayOutflow.total)}
                        </p>
                    )}
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {data?.summary.todayOutflow.voucherCount ?? 0} expense voucher(s)
                    </div>
                </div>

                {/* 4. Closing Balance */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Closing Balance</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#556043]/10 text-[#556043] dark:bg-[#556043]/20">
                            <Lock className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {formatCurrency(data?.summary.closingBalance.total)}
                        </p>
                    )}
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Net flow: {formatCurrency(data?.summary.netFlow.total ?? 0)}
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search voucher, payee, remarks..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-10 w-full rounded-lg pl-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 text-xs sm:text-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={paymentMethod}
                        onValueChange={(val) => {
                            setPaymentMethod(val);
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[170px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium">
                            <SelectValue placeholder="All Payment Accounts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Payment Accounts</SelectItem>
                            {paymentAccounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.name}>
                                    {acc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/30"
                            onClick={clearAllFilters}
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-400">
                        Filters:
                    </span>

                    {paymentMethod !== "ALL" && (
                        <FilterChip
                            label={`Mode: ${paymentMethod}`}
                            onRemove={() => {
                                setPaymentMethod("ALL");
                            }}
                        />
                    )}

                    {search.trim() && (
                        <FilterChip
                            label={`Search: ${search}`}
                            onRemove={() => {
                                setSearch("");
                                setSearchInput("");
                            }}
                        />
                    )}
                </div>
            )}

            {/* TRANSACTIONS TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Voucher / Receipt</th>
                                <th className="px-4 py-3">Particulars & Category</th>
                                <th className="px-4 py-3 text-center">Type</th>
                                <th className="px-4 py-3 text-center">Payment Mode</th>
                                <th className="px-4 py-3 text-right">Inflow (+)</th>
                                <th className="px-4 py-3 text-right">Outflow (-)</th>
                                <th className="px-4 py-3 text-right">Running Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-48" /></td>
                                        <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 mx-auto" /></td>
                                        <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 mx-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-24 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No cashbook transactions recorded for this date.
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                            {entry.voucherNumber}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{entry.entityName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {entry.category} {entry.entityDetail !== "-" ? `• ${entry.entityDetail}` : ""}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] font-semibold ${
                                                    entry.entryType === "INFLOW"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                        : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400"
                                                }`}
                                            >
                                                {entry.entryType}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <Badge
                                                variant="outline"
                                                className="text-xs font-semibold bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                                            >
                                                {entry.paymentMethod}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {entry.inflowAmount > 0 ? `+${formatCurrency(entry.inflowAmount)}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400 text-sm">
                                            {entry.outflowAmount > 0 ? `-${formatCurrency(entry.outflowAmount)}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                            {formatCurrency(entry.runningBalance)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
