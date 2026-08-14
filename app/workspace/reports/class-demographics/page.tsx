"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getClassDemographicsReport,
    type ClassDemographicsResponse
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users,
    ChevronLeft,
    RotateCw,
    UserCheck,
    HeartPulse,
    Layers,
    PieChart,
    Building
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

export default function ClassDemographicsReportPage() {
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
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
                        <Layers className="h-7 w-7 text-indigo-600" />
                        Class Strength & Demographic Census
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                        Standard class and division census, boy/girl student counts, gender parity ratio, and blood group distributions.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Academic Year Selector */}
                    <select
                        value={selectedYearId}
                        onChange={(e) => setSelectedYearId(e.target.value)}
                        className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs focus:ring-1 focus:ring-slate-400"
                    >
                        {academicYears.map((y) => (
                            <option key={y.id} value={y.id}>
                                {y.name} {y.isActive ? "(Active)" : ""}
                            </option>
                        ))}
                    </select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadDemographics}
                        disabled={loading}
                        className="h-9 w-9 shrink-0 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-100"
                        title="Refresh Census"
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

            {/* 4 DEMOGRAPHIC KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Students */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total School Strength
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
                                {data?.summary.totalStudents ?? 0} Students
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Across {data?.summary.totalClasses ?? 0} class standards</p>
                    </CardContent>
                </Card>

                {/* 2. Boys Strength */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Boys Enrolled
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
                                {data?.summary.totalBoys ?? 0} ({data?.summary.boysPercentage ?? 0}%)
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Male student census</p>
                    </CardContent>
                </Card>

                {/* 3. Girls Strength */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Girls Enrolled
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-pink-50 dark:bg-pink-950/60 flex items-center justify-center text-pink-600">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                                {data?.summary.totalGirls ?? 0} ({data?.summary.girlsPercentage ?? 0}%)
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Female student census</p>
                    </CardContent>
                </Card>

                {/* 4. Gender Ratio */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Gender Parity Ratio
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                            <PieChart className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {data?.summary.genderRatio ?? "0:0"}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Boys to Girls ratio</p>
                    </CardContent>
                </Card>
            </div>

            {/* CLASS AND DIVISION CENSUS MATRIX */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building className="h-4 w-4 text-indigo-600" />
                        Class & Division Demographic Census
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Class Standard</th>
                                    <th className="px-4 py-3 text-center">Sections / Divisions</th>
                                    <th className="px-4 py-3 text-center">Boys</th>
                                    <th className="px-4 py-3 text-center">Girls</th>
                                    <th className="px-4 py-3 text-center">Ratio (B:G)</th>
                                    <th className="px-4 py-3 text-center">Active Enrolled</th>
                                    <th className="px-4 py-3 text-right">Total Strength</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-32 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.classMatrix?.length ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-slate-400">
                                            No class demographic data available for this academic year.
                                        </td>
                                    </tr>
                                ) : (
                                    data.classMatrix.map((cls) => (
                                        <tr key={cls.classId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                {cls.className}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {cls.divisions.map((d) => (
                                                        <Badge key={d.divisionId} variant="outline" className="text-[10px] font-semibold text-slate-700 bg-slate-50 border-slate-200">
                                                            {d.divisionName}: {d.totalStudents}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-blue-700 dark:text-blue-400">
                                                {cls.boysCount}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-pink-700 dark:text-pink-400">
                                                {cls.girlsCount}
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs font-mono text-slate-600 dark:text-slate-400">
                                                {cls.genderRatio}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                    {cls.activeCount}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                                {cls.totalStudents}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {data?.classMatrix && data.classMatrix.length > 0 && (
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 uppercase text-xs">Total School Census</td>
                                        <td className="px-4 py-3 text-center text-blue-700 dark:text-blue-400">{data.summary.totalBoys}</td>
                                        <td className="px-4 py-3 text-center text-pink-700 dark:text-pink-400">{data.summary.totalGirls}</td>
                                        <td className="px-4 py-3 text-center text-xs font-mono">{data.summary.genderRatio}</td>
                                        <td className="px-4 py-3 text-center text-emerald-700 dark:text-emerald-400">{data.summary.totalStudents}</td>
                                        <td className="px-4 py-3 text-right">{data.summary.totalStudents}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* BLOOD GROUP DISTRIBUTION */}
            {data?.bloodGroupSummary && data.bloodGroupSummary.length > 0 && (
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <HeartPulse className="h-4 w-4 text-rose-600" />
                            Blood Group Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                            {data.bloodGroupSummary.map((bg) => (
                                <div
                                    key={bg.bloodGroup}
                                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center"
                                >
                                    <div className="text-xs font-bold text-rose-600">{bg.bloodGroup}</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                        {bg.studentCount}
                                    </div>
                                    <div className="text-[11px] text-slate-500">{bg.percentage}%</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
