"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    getClassDemographicsReport,
    type ClassDemographicsResponse,
    type ClassDemographicItem,
    type BloodGroupItem
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
    Users,
    ArrowLeft,
    RefreshCcw,
    School,
    HeartPulse,
    UserCheck,
    Search,
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

export default function ClassDemographicsReportPage() {
    const router = useRouter();
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [searchInput, setSearchInput] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ClassDemographicsResponse | null>(null);

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
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const loadDemographics = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getClassDemographicsReport({
                academicYearId: selectedYearId
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Class Demographics report");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId]);

    useEffect(() => {
        loadDemographics();
    }, [loadDemographics]);

    const filteredClasses = useMemo(() => {
        if (!data?.classMatrix) return [];
        if (!search.trim()) return data.classMatrix;
        const q = search.toLowerCase();
        return data.classMatrix.filter(
            (c: ClassDemographicItem) =>
                c.className.toLowerCase().includes(q) ||
                c.divisions.some((d) => d.divisionName.toLowerCase().includes(q))
        );
    }, [data?.classMatrix, search]);

    const hasActiveFilters = useMemo(
        () => search.trim().length > 0,
        [search]
    );

    const clearAllFilters = () => {
        setSearchInput("");
        setSearch("");
    };

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center font-sans">
                <div className="max-w-md">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have permission to view Student Demographics Reports.</p>
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
                                Class Demographics & Student Strength
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Total student count, boys and girls count, and blood groups for each class.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Select
                            value={selectedYearId}
                            onValueChange={(val) => {
                                setSelectedYearId(val);
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
                            onClick={loadDemographics}
                            disabled={loading}
                            className="h-9 w-9 shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                            title="Refresh Census"
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
                {/* 1. Total Students */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total School Strength</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {data?.summary.totalStudents ?? 0} Students
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Across {data?.summary.totalClasses ?? 0} classes</p>
                </div>

                {/* 2. Boys Strength */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Boys Enrolled</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                            {data?.summary.totalBoys ?? 0} Boys
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Male student headcount</p>
                </div>

                {/* 3. Girls Strength */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Girls Enrolled</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-pink-600 dark:text-pink-400">
                            {data?.summary.totalGirls ?? 0} Girls
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Female student headcount</p>
                </div>

                {/* 4. Active Classes */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Standards</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#556043]/10 text-[#556043] dark:bg-[#556043]/20">
                            <School className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {data?.summary.totalClasses ?? 0} Classes
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Configured grade levels</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search class or division..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-10 w-full rounded-lg pl-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 text-xs sm:text-sm"
                    />
                </div>

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

            {/* Active filter chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-400">
                        Filters:
                    </span>

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

            {/* CLASS STRENGTH CENSUS TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Class / Standard</th>
                                <th className="px-4 py-3 text-center">Divisions / Sections</th>
                                <th className="px-4 py-3 text-center">Boys</th>
                                <th className="px-4 py-3 text-center">Girls</th>
                                <th className="px-4 py-3 text-center">Active Enrolled</th>
                                <th className="px-4 py-3 text-right">Total Strength</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-36 mx-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-12 mx-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-12 mx-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-12 mx-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredClasses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                                        No class records match your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredClasses.map((cls: ClassDemographicItem) => (
                                    <tr key={cls.classId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 font-medium">
                                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-semibold flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-[#556043]" />
                                            {cls.className}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-wrap items-center justify-center gap-1">
                                                {cls.divisions.map((d) => (
                                                    <span
                                                        key={d.divisionId}
                                                        className="inline-block px-2 py-0.5 text-xs font-semibold rounded-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                                                    >
                                                        {d.divisionName} ({d.totalStudents})
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-blue-700 dark:text-blue-400">
                                            {cls.boysCount}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-pink-700 dark:text-pink-400">
                                            {cls.girlsCount}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                                            {cls.activeCount}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-100">
                                                {cls.totalStudents}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-sm">
                            <tr>
                                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">Total School Count</td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-normal">
                                    {data?.summary.totalClasses ?? 0} Classes
                                </td>
                                <td className="px-4 py-3 text-center text-blue-700 dark:text-blue-400">
                                    {data?.summary.totalBoys ?? 0}
                                </td>
                                <td className="px-4 py-3 text-center text-pink-700 dark:text-pink-400">
                                    {data?.summary.totalGirls ?? 0}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                                    {data?.summary.totalStudents ?? 0}
                                </td>
                                <td className="px-4 py-3 text-right text-base text-slate-900 dark:text-slate-100">
                                    {data?.summary.totalStudents ?? 0}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* BLOOD GROUP DISTRIBUTION */}
            {data?.bloodGroupSummary && data.bloodGroupSummary.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <HeartPulse className="h-4 w-4 text-rose-500" />
                            Student Blood Group Distribution
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 pt-4">
                        {data.bloodGroupSummary.map((bg: BloodGroupItem) => (
                            <div
                                key={bg.bloodGroup}
                                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3 text-center"
                            >
                                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block">
                                    {bg.bloodGroup}
                                </span>
                                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block mt-1">
                                    {bg.studentCount}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                    Students
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
