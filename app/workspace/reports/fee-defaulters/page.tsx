"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getFeeDefaultersReport,
    type FeeDefaultersReportResponse,
    type FeeDefaulterItem
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { getClasses } from "@/lib/services/class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertTriangle,
    ArrowLeft,
    RefreshCcw,
    Search,
    Phone,
    MessageSquare,
    AlertCircle,
    Clock,
    UserX,
    Coins
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

function formatCurrency(amount?: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}

export default function FeeDefaultersReportPage() {
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
    const [agingBracket, setAgingBracket] = useState<string>("ALL");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<FeeDefaultersReportResponse | null>(null);

    // Initial Filter Options
    useEffect(() => {
        async function fetchFilters() {
            try {
                const [yearsRes, classesRes] = await Promise.all([
                    getAcademicYears(),
                    getClasses()
                ]);
                const yList = (yearsRes as any)?.data || yearsRes || [];
                setAcademicYears(yList);
                const active = yList.find((y: any) => y.isActive);
                if (active) setSelectedYearId(active.id);
                else if (yList.length > 0) setSelectedYearId(yList[0].id);

                const cList = (classesRes as any)?.data || classesRes || [];
                setClasses(cList);
            } catch (err) {
                console.error("Failed to load filter options", err);
            }
        }
        fetchFilters();
    }, []);

    const loadDefaulters = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getFeeDefaultersReport({
                academicYearId: selectedYearId,
                classId: selectedClassId,
                agingBracket,
                search: search.trim() || undefined,
                page,
                limit: 20
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Fee Defaulters report");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId, selectedClassId, agingBracket, search, page]);

    useEffect(() => {
        loadDefaulters();
    }, [loadDefaulters]);

    const handleWhatsAppReminder = (student: FeeDefaulterItem) => {
        const phone = student.whatsappNumber.replace(/[^0-9]/g, "");
        const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
        const msg = encodeURIComponent(
            `Dear Parent of ${student.studentName} (${student.className}),\n` +
            `This is a gentle reminder from School regarding pending fee dues of ₹${student.totalOutstanding.toLocaleString("en-IN")}.\n` +
            `Kindly clear the pending balance at the school office or via online payment at your earliest convenience.\nThank you.`
        );
        window.open(`https://wa.me/${formattedPhone}?text=${msg}`, "_blank");
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
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                                Fee Defaulters & Aging Dues
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Overdue student fees categorized into aging brackets with parent contacts and reminder triggers.
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

                        {/* Class Filter */}
                        <select
                            value={selectedClassId}
                            onChange={(e) => {
                                setSelectedClassId(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-1 focus:ring-[#556043]"
                        >
                            <option value="ALL">All Classes</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Aging Filter */}
                        <select
                            value={agingBracket}
                            onChange={(e) => {
                                setAgingBracket(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-1 focus:ring-[#556043]"
                        >
                            <option value="ALL">All Aging Buckets</option>
                            <option value="0_30">0 – 30 Days (Current)</option>
                            <option value="31_60">31 – 60 Days</option>
                            <option value="61_90">61 – 90 Days</option>
                            <option value="90_PLUS">90+ Days (Critical)</option>
                        </select>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadDefaulters}
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
                {/* 1. Total Outstanding */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Outstanding Dues</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
                            {formatCurrency(data?.summary.totalOutstanding)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data?.summary.totalDefaulters ?? 0} Students with Dues</p>
                </div>

                {/* 2. 0-30 Days */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">0 – 30 Days (Current)</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-600 dark:text-blue-400">
                            {formatCurrency(data?.summary.agingSummary.bucket0_30.amount)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data?.summary.agingSummary.bucket0_30.studentCount ?? 0} Students</p>
                </div>

                {/* 3. 31-60 Days */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">31 – 60 Days</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
                            {formatCurrency(data?.summary.agingSummary.bucket31_60.amount)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data?.summary.agingSummary.bucket31_60.studentCount ?? 0} Students</p>
                </div>

                {/* 4. 61+ Days */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">60+ Days Overdue</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <UserX className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
                            {formatCurrency((data?.summary.agingSummary.bucket61_90.amount ?? 0) + (data?.summary.agingSummary.bucket90Plus.amount ?? 0))}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{(data?.summary.agingSummary.bucket61_90.studentCount ?? 0) + (data?.summary.agingSummary.bucket90Plus.studentCount ?? 0)} Students</p>
                </div>
            </div>

            {/* SEARCH TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setPage(1);
                        loadDefaulters();
                    }}
                    className="flex items-center gap-2 w-full sm:w-auto"
                >
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search student name, admission no, mobile..."
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
                    Showing {data?.defaulters.length ?? 0} of {data?.pagination.total ?? 0} students with balance
                </div>
            </div>

            {/* DEFAULTERS TABLE */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-900/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Admission No</th>
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Class</th>
                                <th className="px-4 py-3">Parent Contact</th>
                                <th className="px-4 py-3 text-right">Fee Dues</th>
                                <th className="px-4 py-3 text-right">Fine Dues</th>
                                <th className="px-4 py-3 text-right">Total Due (₹)</th>
                                <th className="px-4 py-3 text-center">Overdue Days</th>
                                <th className="px-4 py-3 text-right">Reminder Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                        <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 mx-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : !data?.defaulters || data.defaulters.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No fee defaulters found matching the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                data.defaulters.map((st) => (
                                    <tr key={st.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-900 dark:text-slate-100">
                                            {st.admissionNumber}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{st.studentName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Father: {st.fatherName}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                            <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                                                {st.className}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                                <Phone className="h-3 w-3 text-slate-400" /> {st.fatherMobile || st.motherMobile || "-"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                            {formatCurrency(st.feeDues)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                            {formatCurrency(st.fineDues)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400 text-sm">
                                            {formatCurrency(st.totalOutstanding)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] font-semibold ${
                                                    st.maxDaysOverdue > 90
                                                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400"
                                                        : st.maxDaysOverdue > 60
                                                        ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400"
                                                        : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400"
                                                }`}
                                            >
                                                {st.maxDaysOverdue} Days Overdue
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => handleWhatsAppReminder(st)}
                                                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs inline-flex items-center gap-1"
                                            >
                                                <MessageSquare className="h-3 w-3" /> WhatsApp
                                            </Button>
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
