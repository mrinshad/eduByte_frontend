"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getFinesRegisterReport,
    type FinesRegisterReportResponse,
    type FineRecordItem,
    type FineTypeSummaryItem
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { getFineTypes } from "@/lib/services/fineTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertOctagon,
    ArrowLeft,
    RefreshCcw,
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    Receipt,
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

export default function FinesRegisterReportPage() {
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [fineTypes, setFineTypes] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [selectedFineTypeId, setSelectedFineTypeId] = useState<string>("ALL");
    const [status, setStatus] = useState<string>("ALL");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<FinesRegisterReportResponse | null>(null);

    useEffect(() => {
        async function fetchMetadata() {
            try {
                const [yearsRes, fineTypesRes] = await Promise.all([
                    getAcademicYears(),
                    getFineTypes()
                ]);
                const yList = (yearsRes as any)?.data || yearsRes || [];
                setAcademicYears(yList);
                const active = yList.find((y: any) => y.isActive);
                if (active) setSelectedYearId(active.id);
                else if (yList.length > 0) setSelectedYearId(yList[0].id);

                const ftList = (fineTypesRes as any)?.data || fineTypesRes || [];
                setFineTypes(ftList);
            } catch (err) {
                console.error("Failed to load fines metadata", err);
            }
        }
        fetchMetadata();
    }, []);

    const loadFines = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getFinesRegisterReport({
                academicYearId: selectedYearId,
                fineTypeId: selectedFineTypeId,
                status,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                search,
                page,
                limit: 20
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Fines Register report");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId, selectedFineTypeId, status, fromDate, toDate, search, page]);

    useEffect(() => {
        loadFines();
    }, [loadFines]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadFines();
    };

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center font-sans">
                <div className="max-w-md">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have permission to view Income Reports.</p>
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
                                <AlertOctagon className="h-6 w-6 text-indigo-600" />
                                Fines & Penalties Register
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Audit of late payment fees, library fines, penalties, collections, and waivers.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Academic Year Selector */}
                        <select
                            value={selectedYearId}
                            onChange={(e) => {
                                setSelectedYearId(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-1 focus:ring-[#556043]"
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
                            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-1 focus:ring-[#556043]"
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
                            className="h-9 w-9 shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                            title="Refresh Report"
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
                {/* 1. Total Fines Levied */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Fines Levied</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <AlertOctagon className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {formatCurrency(data?.summary.totalLevied)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data?.summary.count ?? 0} Penalties Issued</p>
                </div>

                {/* 2. Total Collected */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Fines Collected</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(data?.summary.totalCollected)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paid penalty amount</p>
                </div>

                {/* 3. Total Waived */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Waived / Written Off</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <XCircle className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                            {formatCurrency(data?.summary.totalWaived)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Forgiven by school</p>
                </div>

                {/* 4. Total Outstanding */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Outstanding Balance Due</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
                            {formatCurrency(data?.summary.totalOutstanding)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pending fine balances</p>
                </div>
            </div>

            {/* CATEGORY BREAKDOWN */}
            {data?.fineTypeBreakdown && data.fineTypeBreakdown.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="border-b border-slate-100 dark:border-slate-800 p-4">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-[#556043]" />
                            Fine Category Breakdown
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm font-sans">
                            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-900/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-2.5">Fine Type</th>
                                    <th className="px-4 py-2.5 text-center">Count</th>
                                    <th className="px-4 py-2.5 text-right">Billed (₹)</th>
                                    <th className="px-4 py-2.5 text-right">Collected (₹)</th>
                                    <th className="px-4 py-2.5 text-right">Waived (₹)</th>
                                    <th className="px-4 py-2.5 text-right">Due (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {data.fineTypeBreakdown.map((ft) => (
                                    <tr key={ft.fineTypeId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                                            {ft.fineTypeName}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-xs text-slate-600 dark:text-slate-400">
                                            {ft.count}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-800 dark:text-slate-200">
                                            {formatCurrency(ft.billedAmount)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(ft.collectedAmount)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                                            {formatCurrency(ft.waivedAmount)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                                            {formatCurrency(ft.balanceAmount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SEARCH TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by student, admission no..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9 text-xs"
                        />
                    </div>
                    <Button type="submit" size="sm" className="h-9 px-3 text-xs bg-[#556043] hover:bg-[#626e4e] text-white">
                        Search
                    </Button>
                </form>

                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Showing {data?.fines.length ?? 0} of {data?.pagination.total ?? 0} fine records
                </div>
            </div>

            {/* FINES TABLE */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-900/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Class</th>
                                <th className="px-4 py-3">Fine Type & Reason</th>
                                <th className="px-4 py-3 text-right">Amount (₹)</th>
                                <th className="px-4 py-3 text-right">Paid (₹)</th>
                                <th className="px-4 py-3 text-right">Due (₹)</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Last Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 mx-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : !data?.fines || data.fines.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No fines or penalty records match your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                data.fines.map((f) => (
                                    <tr key={f.fineId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                            {f.leviedDate ? new Date(f.leviedDate).toLocaleDateString("en-IN") : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{f.studentName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{f.admissionNumber}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                            <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                                                {f.className}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                                {f.fineTypeName}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{f.reason}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">
                                            {formatCurrency(f.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(f.paidAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                                            {formatCurrency(f.balanceAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] font-semibold ${
                                                    f.status === "PAID"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                        : f.status === "WAIVED"
                                                            ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                                                            : f.status === "PARTIALLY_PAID"
                                                                ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400"
                                                                : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400"
                                                }`}
                                            >
                                                {f.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-slate-600 dark:text-slate-400">
                                            {f.lastReceiptNumber}
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
