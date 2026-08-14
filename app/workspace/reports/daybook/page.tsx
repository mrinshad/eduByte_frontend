"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getDaybookReport,
    type DaybookReportResponse,
    type DaybookEntry
} from "@/lib/services/advancedReports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Scale,
    ArrowLeft,
    RefreshCcw,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    Building2,
    Calendar,
    Receipt,
    Coins,
    Banknote
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

function formatCurrency(amount?: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}

export default function DaybookReportPage() {
    const { can } = usePermission();
    const canView = can("report.read");

    const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [paymentMethod, setPaymentMethod] = useState<string>("ALL");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DaybookReportResponse | null>(null);

    const loadDaybook = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getDaybookReport({
                date,
                paymentMethod,
                page,
                limit: 50
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Daybook report");
        } finally {
            setLoading(false);
        }
    }, [date, paymentMethod, page]);

    useEffect(() => {
        loadDaybook();
    }, [loadDaybook]);

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
            {/* Header Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href="/workspace/dashboard"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl flex items-center gap-2">
                                <Scale className="h-6 w-6 text-[#556043]" />
                                Consolidated Daybook (Cashbook)
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Daily chronological register of counter cash & bank receipts, operational expenses, and running balance.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-1 focus:ring-[#556043]"
                        />

                        <select
                            value={paymentMethod}
                            onChange={(e) => {
                                setPaymentMethod(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-1 focus:ring-[#556043]"
                        >
                            <option value="ALL">All Payment Modes</option>
                            <option value="CASH">Cash Drawer Only</option>
                            <option value="BANK">Bank / UPI Only</option>
                        </select>

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
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Opening Balance</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {formatCurrency(data?.summary.openingBalance.total)}
                        </p>
                    )}
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Cash: {formatCurrency(data?.summary.openingBalance.cash)}</span>
                        <span>Bank: {formatCurrency(data?.summary.openingBalance.bank)}</span>
                    </div>
                </div>

                {/* 2. Today Inflows */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Today Receipts (+)</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <ArrowDownLeft className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(data?.summary.todayInflow.total)}
                        </p>
                    )}
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{data?.summary.todayInflow.receiptCount ?? 0} Receipts</span>
                        <span>Cash: {formatCurrency(data?.summary.todayInflow.cash)}</span>
                    </div>
                </div>

                {/* 3. Today Outflows */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Today Outflows (-)</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <ArrowUpRight className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
                            -{formatCurrency(data?.summary.todayOutflow.total)}
                        </p>
                    )}
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{data?.summary.todayOutflow.voucherCount ?? 0} Expenses</span>
                        <span>Cash: {formatCurrency(data?.summary.todayOutflow.cash)}</span>
                    </div>
                </div>

                {/* 4. Closing Balance */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Closing Balance</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#556043]/10 text-[#556043] dark:bg-[#556043]/20">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {formatCurrency(data?.summary.closingBalance.total)}
                        </p>
                    )}
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Cash: {formatCurrency(data?.summary.closingBalance.cash)}</span>
                        <span>Bank: {formatCurrency(data?.summary.closingBalance.bank)}</span>
                    </div>
                </div>
            </div>

            {/* DAYBOOK LEDGER TABLE */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-900/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
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
                            ) : !data?.entries || data.entries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No cashbook transactions recorded for this date.
                                    </td>
                                </tr>
                            ) : (
                                data.entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-xs">
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
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                                                {entry.paymentMethod === "CASH" ? <Coins className="h-3 w-3 text-amber-500" /> : <Banknote className="h-3 w-3 text-blue-500" />}
                                                {entry.paymentMethod}
                                            </span>
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

            {/* PAGINATION */}
            {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Page {data.pagination.page} of {data.pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-8 text-xs"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= data.pagination.totalPages || loading}
                            onClick={() => setPage((p) => p + 1)}
                            className="h-8 text-xs"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
