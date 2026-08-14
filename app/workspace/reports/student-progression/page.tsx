"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getStudentProgressionReport,
    type StudentProgressionResponse
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    Search,
    UserCheck,
    ArrowRightCircle,
    UserMinus,
    CheckCircle2,
    Users
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

function formatDateDisplay(dateStr?: string | null) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

export default function StudentProgressionReportPage() {
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [status, setStatus] = useState<string>("ALL");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<StudentProgressionResponse | null>(null);

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

    const loadProgression = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getStudentProgressionReport({
                academicYearId: selectedYearId,
                status,
                search: search.trim() || undefined,
                page,
                limit: 25
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Student Progression report");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId, status, search, page]);

    useEffect(() => {
        loadProgression();
    }, [loadProgression]);

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center">
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500">You do not have permission to view Admissions Reports.</p>
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
                        <GraduationCap className="h-7 w-7 text-indigo-600" />
                        Student Progression & Exit Register
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                        Track annual student promotion flows, retainees, Transfer Certificates (TC) issued, and year-over-year retention rates.
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

                    {/* Status Filter */}
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs focus:ring-1 focus:ring-slate-400"
                    >
                        <option value="ALL">All Progression Stages</option>
                        <option value="ACTIVE">Currently Enrolled</option>
                        <option value="PROMOTED">Promoted to Next Standard</option>
                        <option value="WITHDRAWN">TC Issued / Withdrawn</option>
                        <option value="COMPLETED">Graduated / Completed</option>
                    </select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadProgression}
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
                {/* 1. Total Enrollments */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Students in Academic Year
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {data?.summary.totalEnrollments ?? 0} Students
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Total registered enrollments</p>
                    </CardContent>
                </Card>

                {/* 2. Promoted Count */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Promoted to Next Standard
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                            <ArrowRightCircle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {data?.summary.promotedCount ?? 0} Students
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Academic progression flow</p>
                    </CardContent>
                </Card>

                {/* 3. Withdrawn / TC Count */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            TC Issued / Departures
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                            <UserMinus className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {data?.summary.withdrawnCount ?? 0} Students
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">School withdrawals & TC records</p>
                    </CardContent>
                </Card>

                {/* 4. Retention Rate */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Student Retention Rate
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {data?.summary.retentionRate ?? 0}%
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Year-over-year student retention</p>
                    </CardContent>
                </Card>
            </div>

            {/* SEARCH BAR */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search student, admission no, parent phone..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:ring-1 focus:ring-slate-400"
                    />
                </div>
            </div>

            {/* PROGRESSION LOG TABLE */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-indigo-600" />
                        Student Progression & Movement Register
                    </CardTitle>
                    <span className="text-xs font-semibold text-slate-500">
                        {data?.pagination.total ?? 0} Students
                    </span>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Student & Admission</th>
                                    <th className="px-4 py-3">Class & Section</th>
                                    <th className="px-4 py-3">Parent Contact</th>
                                    <th className="px-4 py-3 text-center">Current Status</th>
                                    <th className="px-4 py-3">Progression Stage</th>
                                    <th className="px-4 py-3 text-right">Admission Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.students?.length ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-400">
                                            No student records found matching the selected criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    data.students.map((s) => (
                                        <tr key={s.enrollmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {s.studentName}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                    Adm: {s.admissionNumber} | Roll: {s.rollNumber}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-medium text-slate-800 dark:text-slate-200">
                                                {s.className}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                                                {s.parentContact}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    className={`text-[10px] font-bold border-none ${
                                                        s.enrollmentStatus === "PROMOTED"
                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                                            : s.enrollmentStatus === "ACTIVE"
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                            : s.enrollmentStatus === "WITHDRAWN"
                                                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                                                    }`}
                                                >
                                                    {s.enrollmentStatus}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-medium text-slate-900 dark:text-slate-100">
                                                {s.nextStage}
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-slate-600 dark:text-slate-400">
                                                {formatDateDisplay(s.admissionDate)}
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
