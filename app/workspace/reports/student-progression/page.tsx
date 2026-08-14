"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    getStudentProgressionReport,
    type StudentProgressionResponse,
    type StudentProgressionItem
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
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
    GraduationCap,
    ArrowLeft,
    RefreshCcw,
    Search,
    UserMinus,
    ArrowRightCircle,
    Users,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    X
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

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

export default function StudentProgressionReportPage() {
    const router = useRouter();
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [status, setStatus] = useState<string>("ALL");
    const [searchInput, setSearchInput] = useState<string>("");
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

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const loadProgression = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getStudentProgressionReport({
                academicYearId: selectedYearId,
                status: status === "ALL" ? undefined : status,
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

    const hasActiveFilters = useMemo(
        () =>
            status !== "ALL" ||
            search.trim().length > 0,
        [status, search]
    );

    const clearAllFilters = () => {
        setSearchInput("");
        setSearch("");
        setStatus("ALL");
        setPage(1);
    };

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center font-sans">
                <div className="max-w-md">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have permission to view Student Progression Reports.</p>
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
                            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl flex items-center gap-2">
                                <GraduationCap className="h-6 w-6 text-[#556043]" />
                                Student Progression & Exit Register
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Student promotions, active enrolled students, and Transfer Certificate (TC) withdrawals.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Select
                            value={selectedYearId}
                            onValueChange={(val) => {
                                setSelectedYearId(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-9 w-full sm:w-[150px] text-xs font-semibold rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                                <SelectValue placeholder="Academic Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYears.map((y) => (
                                    <SelectItem key={y.id} value={y.id}>
                                        {y.name} {y.isActive ? "(Active)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadProgression}
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
                {/* 1. Total Enrollments */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Students</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {data?.summary.totalEnrollments ?? 0} Students
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Registered in academic year</p>
                </div>

                {/* 2. Currently Active */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Currently Enrolled</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                            {data?.summary.activeCount ?? 0} Students
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active studying students</p>
                </div>

                {/* 3. Promoted Count */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Promoted Students</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <ArrowRightCircle className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {data?.summary.promotedCount ?? 0} Students
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Advanced to higher class</p>
                </div>

                {/* 4. Withdrawn / TC Count */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">TC Issued / Departures</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <UserMinus className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                            {data?.summary.withdrawnCount ?? 0} Students
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Transferred or withdrawn</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search student, adm no, mobile..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-10 w-full rounded-lg pl-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 text-xs sm:text-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={status}
                        onValueChange={(val) => {
                            setStatus(val);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[190px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium">
                            <SelectValue placeholder="All Progression Stages" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Progression Stages</SelectItem>
                            <SelectItem value="ACTIVE">Currently Enrolled</SelectItem>
                            <SelectItem value="PROMOTED">Promoted to Next Standard</SelectItem>
                            <SelectItem value="WITHDRAWN">TC Issued / Withdrawn</SelectItem>
                            <SelectItem value="COMPLETED">Graduated / Completed</SelectItem>
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

                    {status !== "ALL" && (
                        <FilterChip
                            label={`Status: ${status}`}
                            onRemove={() => {
                                setStatus("ALL");
                                setPage(1);
                            }}
                        />
                    )}

                    {search.trim() && (
                        <FilterChip
                            label={`Search: ${search}`}
                            onRemove={() => {
                                setSearch("");
                                setSearchInput("");
                                setPage(1);
                            }}
                        />
                    )}
                </div>
            )}

            {/* PROGRESSION ROSTER TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
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
                                Array.from({ length: 6 }).map((_, i) => (
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
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No student progression records match your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                data.students.map((st) => (
                                    <tr key={st.enrollmentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-900 dark:text-slate-100">
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
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">
                                            {st.parentContact}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] font-semibold ${
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
                                        <td className="px-4 py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                                            {st.admissionDate ? new Date(st.admissionDate).toLocaleDateString("en-IN") : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 sm:px-6 py-4 gap-4 dark:border-slate-800 dark:bg-slate-900/40">
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
        </div>
    );
}
