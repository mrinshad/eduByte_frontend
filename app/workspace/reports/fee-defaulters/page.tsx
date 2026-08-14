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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    Search,
    Phone,
    MessageSquare,
    AlertCircle,
    Clock,
    UserX,
    Filter,
    ArrowUpRight
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
                        <AlertTriangle className="h-7 w-7 text-amber-600" />
                        Fee Defaulters & Aging Analysis
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                        Categorize unpaid student dues across aging brackets (0–30d, 31–60d, 61–90d, 90d+) with parent contacts and reminder triggers.
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

                    {/* Class Selector */}
                    <select
                        value={selectedClassId}
                        onChange={(e) => {
                            setSelectedClassId(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs focus:ring-1 focus:ring-slate-400"
                    >
                        <option value="ALL">All Classes</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadDefaulters}
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

            {/* 4 AGING KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Outstanding */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Outstanding Dues
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {formatCurrency(data?.summary.totalOutstanding)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                            Across {data?.summary.totalDefaulters ?? 0} students with pending dues
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Current Bracket (0-30 Days) */}
                <Card
                    onClick={() => setAgingBracket(agingBracket === "0-30" ? "ALL" : "0-30")}
                    className={`cursor-pointer border transition-all shadow-xs bg-white dark:bg-slate-900 ${
                        agingBracket === "0-30"
                            ? "ring-2 ring-blue-500 border-transparent"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            0 – 30 Days (Current)
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-bold text-blue-700 bg-blue-50 border-blue-200">
                            {data?.summary.agingSummary.bucket0_30.studentCount ?? 0} Students
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(data?.summary.agingSummary.bucket0_30.amount)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Recent current-month charges</p>
                    </CardContent>
                </Card>

                {/* 3. Overdue Bracket (31-60 Days) */}
                <Card
                    onClick={() => setAgingBracket(agingBracket === "31-60" ? "ALL" : "31-60")}
                    className={`cursor-pointer border transition-all shadow-xs bg-white dark:bg-slate-900 ${
                        agingBracket === "31-60"
                            ? "ring-2 ring-amber-500 border-transparent"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            31 – 60 Days Overdue
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-200">
                            {data?.summary.agingSummary.bucket31_60.studentCount ?? 0} Students
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {formatCurrency(data?.summary.agingSummary.bucket31_60.amount)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">1 month delinquent</p>
                    </CardContent>
                </Card>

                {/* 4. Critical Bracket (>60 & >90 Days) */}
                <Card
                    onClick={() => setAgingBracket(agingBracket === "90+" ? "ALL" : "90+")}
                    className={`cursor-pointer border transition-all shadow-xs bg-white dark:bg-slate-900 ${
                        agingBracket === "90+"
                            ? "ring-2 ring-rose-500 border-transparent"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            90+ Days (High Risk)
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-bold text-rose-700 bg-rose-50 border-rose-200">
                            {data?.summary.agingSummary.bucket90Plus.studentCount ?? 0} Students
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                                {formatCurrency(data?.summary.agingSummary.bucket90Plus.amount)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Requires immediate follow-up</p>
                    </CardContent>
                </Card>
            </div>

            {/* SEARCH & AGING TAB FILTER */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    {[
                        { key: "ALL", label: "All Delinquencies" },
                        { key: "0-30", label: "0–30 Days" },
                        { key: "31-60", label: "31–60 Days" },
                        { key: "61-90", label: "61–90 Days" },
                        { key: "90+", label: "90+ Days Critical" }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setAgingBracket(tab.key);
                                setPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                agingBracket === tab.key
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search student, adm no, parent phone..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:ring-1 focus:ring-slate-400"
                    />
                </div>
            </div>

            {/* DEFAULTERS ROSTER TABLE */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <UserX className="h-4 w-4 text-rose-600" />
                        Defaulters Roster & Parent Follow-up
                    </CardTitle>
                    <span className="text-xs font-semibold text-slate-500">
                        {data?.pagination.total ?? 0} Students Listed
                    </span>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Student & Class</th>
                                    <th className="px-4 py-3">Parent & Contact</th>
                                    <th className="px-4 py-3 text-right">Fee Due (₹)</th>
                                    <th className="px-4 py-3 text-right">Fine Due (₹)</th>
                                    <th className="px-4 py-3 text-right">Total Outstanding (₹)</th>
                                    <th className="px-4 py-3 text-center">Aging Bracket</th>
                                    <th className="px-4 py-3 text-center">Risk Level</th>
                                    <th className="px-4 py-3 text-center">Remind</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-7 w-20 mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.defaulters?.length ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-slate-400">
                                            No fee defaulters found matching the selected criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    data.defaulters.map((d) => (
                                        <tr key={d.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {d.studentName}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                    Adm: {d.admissionNumber} | {d.className}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    {d.fatherName !== "-" ? d.fatherName : d.motherName}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Phone className="h-3 w-3 text-slate-400" />
                                                    {d.fatherMobile !== "-" ? d.fatherMobile : d.motherMobile}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                                                {formatCurrency(d.feeDues)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-amber-700 dark:text-amber-400">
                                                {d.fineDues > 0 ? formatCurrency(d.fineDues) : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                                                {formatCurrency(d.totalOutstanding)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                    {d.maxDaysOverdue} Days Overdue
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    className={`text-[10px] font-bold border-none ${
                                                        d.riskLevel === "CRITICAL"
                                                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                                            : d.riskLevel === "HIGH"
                                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                            : d.riskLevel === "MEDIUM"
                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                                                    }`}
                                                >
                                                    {d.riskLevel}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleWhatsAppReminder(d)}
                                                    className="h-7 px-2.5 text-xs text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold"
                                                >
                                                    <MessageSquare className="h-3 w-3 mr-1" />
                                                    WhatsApp
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {data?.defaulters && data.defaulters.length > 0 && (
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-3 uppercase text-xs">Total Outstanding Dues</td>
                                        <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                                            {formatCurrency(data.summary.totalOutstanding)}
                                        </td>
                                        <td colSpan={3}></td>
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
