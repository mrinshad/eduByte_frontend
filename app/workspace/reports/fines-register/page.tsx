"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getFinesRegisterReport,
    type FinesRegisterReportResponse
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertOctagon,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    Search,
    Receipt,
    CheckCircle2,
    Clock,
    XCircle,
    SlidersHorizontal,
    FolderKanban
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

function formatCurrency(amount?: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}

function formatDateDisplay(dateStr?: string | null) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

export default function FinesRegisterReportPage() {
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [status, setStatus] = useState<string>("ALL");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<FinesRegisterReportResponse | null>(null);

    // Initial Filter Options
    useEffect(() => {
        async function fetchYears() {
            try {
                const res = await getAcademicYears();
                const yList = (res as any)?.data || res || [];
                setAcademicYears(yList);
                const active = yList.find((y: any) => y.isActive);
                if (active) setSelectedYearId(active.id);
                else if (yList.length > 0) setSelectedYearId(yList[0].id);
            } catch (err) {
                console.error("Failed to load academic years", err);
            }
        }
        fetchYears();
    }, []);

    const loadFines = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getFinesRegisterReport({
                academicYearId: selectedYearId,
                status,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                search: search.trim() || undefined,
                page,
                limit: 20
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Fines Register report");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId, status, fromDate, toDate, search, page]);

    useEffect(() => {
        loadFines();
    }, [loadFines]);

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
                        <AlertOctagon className="h-7 w-7 text-indigo-600" />
                        Fines & Penalties Register
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                        Detailed audit of late payment fees, library fines, property damage penalties, collections, and waivers.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Academic Year Selector */}
                    <select
                        value={selectedYearId}
                        onChange={(e) => {
                            setSelectedYearId(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs focus:ring-1 focus:ring-slate-400"
                    >
                        {academicYears.map((y) => (
                            <option key={y.id} value={y.id}>
                                {y.name} {y.isActive ? "(Active)" : ""}
                            </option>
                        ))}
                    </select>

                    {/* Status Selector */}
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs focus:ring-1 focus:ring-slate-400"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending / Unpaid</option>
                        <option value="PARTIALLY_PAID">Partially Paid</option>
                        <option value="PAID">Fully Paid</option>
                        <option value="WAIVED">Waived / Forgiven</option>
                    </select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadFines}
                        disabled={loading}
                        className="h-9 w-9 shrink-0 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-100"
                        title="Refresh Report"
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

            {/* 4 KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Fines Levied */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Fines Levied
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                            <AlertOctagon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(data?.summary.totalLevied)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">{data?.summary.count ?? 0} Penalties Issued</p>
                    </CardContent>
                </Card>

                {/* 2. Total Collected */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Fines Collected
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(data?.summary.totalCollected)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Collection Rate: {data?.summary.collectionRate ?? 0}%</p>
                    </CardContent>
                </Card>

                {/* 3. Total Waived */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Waived / Written Off
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <XCircle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                                {formatCurrency(data?.summary.totalWaived)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Forgiven by management</p>
                    </CardContent>
                </Card>

                {/* 4. Total Outstanding */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Outstanding Fines
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {formatCurrency(data?.summary.totalOutstanding)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Pending fine balances</p>
                    </CardContent>
                </Card>
            </div>

            {/* CATEGORY AUDIT BREAKDOWN */}
            {data?.fineTypeBreakdown && data.fineTypeBreakdown.length > 0 && (
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-indigo-600" />
                            Fine Category Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-2.5">Category</th>
                                        <th className="px-4 py-2.5 text-center">Count</th>
                                        <th className="px-4 py-2.5 text-right">Billed (₹)</th>
                                        <th className="px-4 py-2.5 text-right">Collected (₹)</th>
                                        <th className="px-4 py-2.5 text-right">Waived (₹)</th>
                                        <th className="px-4 py-2.5 text-right">Due (₹)</th>
                                        <th className="px-4 py-2.5 text-center">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {data.fineTypeBreakdown.map((ft) => (
                                        <tr key={ft.fineTypeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                                                {ft.fineTypeName}
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-xs text-slate-600">
                                                {ft.count}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                                                {formatCurrency(ft.billedAmount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(ft.collectedAmount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium text-slate-500">
                                                {formatCurrency(ft.waivedAmount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium text-amber-700 dark:text-amber-400">
                                                {formatCurrency(ft.balanceAmount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">
                                                    {ft.collectionRate}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* SEARCH BAR */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search student, admission number, reason..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:ring-1 focus:ring-slate-400"
                    />
                </div>
            </div>

            {/* ITEMIZED FINES LOG TABLE */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-indigo-600" />
                        Itemized Penalties & Fine Logs
                    </CardTitle>
                    <span className="text-xs font-semibold text-slate-500">
                        {data?.pagination.total ?? 0} Records
                    </span>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Date & Type</th>
                                    <th className="px-4 py-3">Student & Class</th>
                                    <th className="px-4 py-3">Reason / Description</th>
                                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                                    <th className="px-4 py-3 text-right">Paid (₹)</th>
                                    <th className="px-4 py-3 text-right">Due (₹)</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Last Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.fines?.length ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-slate-400">
                                            No fine or penalty records found for this academic year.
                                        </td>
                                    </tr>
                                ) : (
                                    data.fines.map((f) => (
                                        <tr key={f.fineId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                                    {f.fineTypeName}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    {formatDateDisplay(f.leviedDate)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {f.studentName}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                    Adm: {f.admissionNumber} | {f.className}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                                                {f.reason}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                                                {formatCurrency(f.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {f.paidAmount > 0 ? formatCurrency(f.paidAmount) : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-amber-700 dark:text-amber-400">
                                                {f.balanceAmount > 0 ? formatCurrency(f.balanceAmount) : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    className={`text-[10px] font-bold border-none ${
                                                        f.status === "PAID"
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                            : f.status === "WAIVED"
                                                            ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                                                            : f.status === "PARTIALLY_PAID"
                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                    }`}
                                                >
                                                    {f.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs font-mono text-slate-600 dark:text-slate-400">
                                                {f.lastReceiptNumber !== "-" ? f.lastReceiptNumber : "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
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
