"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getStudentProgressionReport,
    type StudentProgressionResponse,
    type StudentProgressionItem
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    GraduationCap,
    ChevronLeft,
    RotateCw,
    Search,
    UserMinus,
    ArrowRightCircle,
    Users,
    UserCheck,
    CheckCircle2,
    Calendar
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

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
                search,
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadProgression();
    };

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center">
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500">You do not have permission to view Student Progression Reports.</p>
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
                        Student promotions, active enrolled students, and Transfer Certificate (TC) withdrawals.
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
                            Total Registered Students
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
                        <p className="text-xs text-slate-500 mt-1">Total registered in academic year</p>
                    </CardContent>
                </Card>

                {/* 2. Currently Active */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Currently Enrolled
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {data?.summary.activeCount ?? 0} Students
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Active studying students</p>
                    </CardContent>
                </Card>

                {/* 3. Promoted Count */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Promoted Students
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
                        <p className="text-xs text-slate-500 mt-1">Advanced to higher class</p>
                    </CardContent>
                </Card>

                {/* 4. Withdrawn / TC Count */}
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
                        <p className="text-xs text-slate-500 mt-1">Transferred or withdrawn</p>
                    </CardContent>
                </Card>
            </div>

            {/* SEARCH TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by student, admission no, mobile..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9 text-xs"
                        />
                    </div>
                    <Button type="submit" size="sm" className="h-9 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                        Search
                    </Button>
                </form>

                <div className="text-xs font-semibold text-slate-500">
                    Showing {data?.students.length ?? 0} of {data?.pagination.total ?? 0} student records
                </div>
            </div>

            {/* PROGRESSION ROSTER TABLE */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Admission No</th>
                                    <th className="px-4 py-3">Student Name</th>
                                    <th className="px-4 py-3">Class & Section</th>
                                    <th className="px-4 py-3">Parent Contact</th>
                                    <th className="px-4 py-3 text-center">Enrollment Status</th>
                                    <th className="px-4 py-3">Progression / Next Stage</th>
                                    <th className="px-4 py-3 text-right">Enrolled Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                                            <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-20 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                                            <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.students || data.students.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                            No student progression records match your search criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    data.students.map((st) => (
                                        <tr key={st.enrollmentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                            <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                                                {st.admissionNumber}
                                            </td>
                                            <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-semibold">
                                                {st.studentName}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                                                    {st.className} {st.rollNumber !== "-" ? `(#${st.rollNumber})` : ""}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs">
                                                {st.parentContact}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[11px] font-bold ${
                                                        st.enrollmentStatus === "PROMOTED"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                            : st.enrollmentStatus === "WITHDRAWN"
                                                            ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400"
                                                            : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400"
                                                    }`}
                                                >
                                                    {st.enrollmentStatus}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                                                {st.nextStage}
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-slate-500 font-mono">
                                                {st.admissionDate ? new Date(st.admissionDate).toLocaleDateString("en-IN") : "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* PAGINATION CONTROLS */}
            {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-xs text-slate-500">
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
