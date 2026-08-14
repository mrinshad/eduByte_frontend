"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getDaybookReport,
    type DaybookReportResponse,
    type DaybookEntry
} from "@/lib/services/advancedReports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Landmark,
    Coins,
    Receipt,
    Printer,
    FileText,
    TrendingUp,
    TrendingDown,
    Scale
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

const SAGE = "#556043";

function formatCurrency(amount?: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}

function formatDateDisplay(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatTime(isoStr: string) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
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
            setError(err.message || "Failed to load Consolidated Daybook");
        } finally {
            setLoading(false);
        }
    }, [date, paymentMethod, page]);

    useEffect(() => {
        loadDaybook();
    }, [loadDaybook]);

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center">
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500">You do not have permission to view Financial Reports.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/workspace/dashboard"
                            className="inline-flex items-center text-xs text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100 font-medium"
                        >
                            <ChevronLeft className="h-3 w-3 mr-0.5" /> Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2.5">
                        <Scale className="h-7 w-7 text-[#556043]" />
                        Consolidated Daybook (Cashbook)
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                        Daily chronological register of counter cash & bank inflows, fee receipts, operational disbursements, and closing balances.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                            setDate(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs focus:ring-1 focus:ring-slate-400"
                    />

                    <select
                        value={paymentMethod}
                        onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs focus:ring-1 focus:ring-slate-400"
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
                        className="h-9 w-9 shrink-0 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-100"
                        title="Refresh Daybook"
                    >
                        <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                    {error}
                </div>
            )}

            {/* 4 EXECUTIVE SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Opening Balance */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Opening Balance
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(data?.summary.openingBalance.total)}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span>Cash: {formatCurrency(data?.summary.openingBalance.cash)}</span>
                            <span>Bank: {formatCurrency(data?.summary.openingBalance.bank)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Today's Inflows */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Inflows (Revenue)
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                            <ArrowUpRight className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                +{formatCurrency(data?.summary.todayInflow.total)}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span>{data?.summary.todayInflow.receiptCount ?? 0} Receipts</span>
                            <span>Cash: {formatCurrency(data?.summary.todayInflow.cash)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Today's Outflows */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Outflows (Expenses)
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                            <ArrowDownRight className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                -{formatCurrency(data?.summary.todayOutflow.total)}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span>{data?.summary.todayOutflow.voucherCount ?? 0} Vouchers</span>
                            <span>Cash: {formatCurrency(data?.summary.todayOutflow.cash)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Closing Balance */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Closing Balance ({formatDateDisplay(date)})
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                            <Landmark className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(data?.summary.closingBalance.total)}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span>Cash: {formatCurrency(data?.summary.closingBalance.cash)}</span>
                            <span>Bank: {formatCurrency(data?.summary.closingBalance.bank)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CHRONOLOGICAL UNIFIED TRANSACTIONS LEDGER */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#556043]" />
                        Daybook Transaction Entries ({formatDateDisplay(date)})
                    </CardTitle>
                    <span className="text-xs font-semibold text-slate-500">
                        {data?.pagination.total ?? 0} Transactions Recorded
                    </span>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Time & Ref</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Entity / Payee</th>
                                    <th className="px-4 py-3">Particulars / Category</th>
                                    <th className="px-4 py-3">Mode</th>
                                    <th className="px-4 py-3 text-right">Inflow (+)</th>
                                    <th className="px-4 py-3 text-right">Outflow (-)</th>
                                    <th className="px-4 py-3 text-right">Running Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.entries?.length ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-slate-400">
                                            No transactions or expenses recorded on {formatDateDisplay(date)}.
                                        </td>
                                    </tr>
                                ) : (
                                    data.entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                                    {formatTime(entry.timestamp)}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-500">
                                                    {entry.voucherNumber}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.entryType === "INFLOW" ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold border-none">
                                                        Receipt
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold border-none">
                                                        Expense
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {entry.entityName}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {entry.entityDetail}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">
                                                {entry.category}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                                                    {entry.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {entry.inflowAmount > 0 ? formatCurrency(entry.inflowAmount) : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                                                {entry.outflowAmount > 0 ? formatCurrency(entry.outflowAmount) : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                                {formatCurrency(entry.runningBalance)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {data?.entries && data.entries.length > 0 && (
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                                    <tr>
                                        <td colSpan={5} className="px-4 py-3 uppercase text-xs">Day Total</td>
                                        <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">
                                            +{formatCurrency(data.summary.todayInflow.total)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">
                                            -{formatCurrency(data.summary.todayOutflow.total)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black">
                                            {formatCurrency(data.summary.closingBalance.total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {data && data.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-xs text-slate-500">
                                Page {data.pagination.page} of {data.pagination.totalPages}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.pagination.page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="h-8 px-2 text-xs"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.pagination.page >= data.pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="h-8 px-2 text-xs"
                                >
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
