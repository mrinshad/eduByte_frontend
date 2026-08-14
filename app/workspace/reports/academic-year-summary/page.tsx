"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Calendar,
    RotateCw,
    Users,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Wallet,
    Building2,
    GraduationCap,
    ArrowUpRight,
    ArrowDownRight,
    ArrowLeft,
    Bus,
    BarChart3,
    PieChart as PieChartIcon,
    Percent,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { getAcademicYears, type AcademicYearSummary } from "@/lib/services/academicYear";
import {
    getAcademicYearSummaryReport,
    type AcademicYearSummaryResponse,
} from "@/lib/services/incomeReports";

const BRAND = "#556043";
const BRAND_LIGHT = "#8a9678";
const EXPENSE_COLOR = "#e11d48";

const formatCurrency = (val: number | null | undefined) => {
    const num = Number(val ?? 0);
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatCompactCurrency = (val: number | null | undefined) => {
    const num = Number(val ?? 0);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(num);
};

export default function AcademicYearSummaryPage() {
    const router = useRouter();
    const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [data, setData] = useState<AcademicYearSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial load: fetch academic years
    useEffect(() => {
        async function fetchYears() {
            try {
                const years = await getAcademicYears();
                setAcademicYears(years);
                const active = years.find((y) => y.isActive) || years[0];
                if (active) {
                    setSelectedYearId(active.id);
                }
            } catch (err: any) {
                console.error("Error fetching academic years:", err);
                toast.error("Failed to load academic years");
            }
        }
        fetchYears();
    }, []);

    // Load report data when selected academic year changes
    const loadReport = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            const res = await getAcademicYearSummaryReport(selectedYearId);
            setData(res);
        } catch (err: any) {
            console.error("Error loading academic year summary:", err);
            toast.error(err?.message || "Failed to load academic year summary");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const activeYear = academicYears.find((y) => y.id === selectedYearId) || data?.academicYear;

    // Monthly Trend chart data
    const chartData = useMemo(() => {
        if (!data?.monthlyTrend) return [];
        return data.monthlyTrend.map((m) => ({
            name: m.monthName.split(" ")[0],
            fullName: m.monthName,
            Income: m.income,
            Expenses: m.expense,
            Net: m.net,
        }));
    }, [data?.monthlyTrend]);

    const netSurplus = data?.financialSummary.netSurplus ?? 0;

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 max-w-7xl mx-auto font-sans min-h-screen">
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
                                Academic Year Summary
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Executive operational and financial performance overview for{" "}
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {activeYear?.name ?? "Academic Year"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Select
                            value={selectedYearId}
                            onValueChange={(val) => setSelectedYearId(val)}
                        >
                            <SelectTrigger className="h-9 w-full sm:w-[160px] text-xs font-semibold rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                                <SelectValue placeholder="Select Year" />
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
                            onClick={loadReport}
                            disabled={loading}
                            className="h-9 w-9 shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                            title="Refresh Summary"
                        >
                            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* 4 SUMMARY STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Student Strength */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Student Strength
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-20" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {data?.studentSummary.totalEnrollments ?? 0} Students
                        </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {data?.studentSummary.activeEnrollments ?? 0} Active
                        </span>
                        <span>•</span>
                        <span>{data?.studentSummary.genderStats.male ?? 0} Boys</span>
                        <span>•</span>
                        <span>{data?.studentSummary.genderStats.female ?? 0} Girls</span>
                    </div>
                    {data?.studentSummary.transportOptedCount ? (
                        <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                            <Bus className="h-3 w-3 text-[#556043]" /> {data.studentSummary.transportOptedCount} in Transport
                        </p>
                    ) : null}
                </div>

                {/* 2. Fee Revenue */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Fee Revenue Collected
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <div className="mt-2 flex items-baseline justify-between">
                            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(data?.financialSummary.totalCollected)}
                            </p>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">
                                {data?.financialSummary.collectionRate ?? 0}% Rate
                            </Badge>
                        </div>
                    )}
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Billed: {formatCurrency(data?.financialSummary.totalBilled)}</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Due: {formatCurrency(data?.financialSummary.totalOutstanding)}
                        </span>
                    </div>
                </div>

                {/* 3. Operating Expenses */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Operating Expenses
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                            {formatCurrency(data?.financialSummary.totalExpenses)}
                        </p>
                    )}
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Cash: {formatCurrency(data?.financialSummary.cashExpenses)}</span>
                        <span>Bank: {formatCurrency(data?.financialSummary.bankExpenses)}</span>
                    </div>
                </div>

                {/* 4. Net Surplus / Cash Flow */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Net Operating Cash Flow
                        </span>
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                netSurplus >= 0
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                            }`}
                        >
                            <Wallet className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <div
                            className={`mt-2 text-2xl font-bold tracking-tight flex items-center gap-1 ${
                                netSurplus >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {netSurplus >= 0 ? (
                                <ArrowUpRight className="h-5 w-5 shrink-0" />
                            ) : (
                                <ArrowDownRight className="h-5 w-5 shrink-0" />
                            )}
                            {formatCurrency(netSurplus)}
                        </div>
                    )}
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Net Cash: {formatCurrency(data?.financialSummary.netCashSurplus)}</span>
                        <span>Net Bank: {formatCurrency(data?.financialSummary.netBankSurplus)}</span>
                    </div>
                </div>
            </div>

            {/* MONTHLY CASH FLOW CHART (RECHARTS BAR CHART) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                        <h2 className="text-base font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-[#556043]" />
                            Monthly Financial Inflow vs Outflow Trend
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Month-by-month fee collection revenue compared with institutional operating expenses.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <span className="h-3 w-3 rounded-xs bg-[#556043]" /> Fee Income
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                            <span className="h-3 w-3 rounded-xs bg-[#e11d48]" /> Expenses
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Skeleton className="h-56 w-full rounded-xl" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                        No monthly transaction trend data available.
                    </div>
                ) : (
                    <div className="h-72 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                    tickFormatter={(val) => formatCompactCurrency(val)}
                                />
                                <Tooltip
                                    formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                    }}
                                />
                                <Bar dataKey="Income" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={36} />
                                <Bar dataKey="Expenses" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* TWO CLEAN ANALYTICAL PANELS: INCOME BY FEE TYPE & EXPENSE BY CATEGORY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Fee Revenue by Category */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-emerald-600" />
                            Fee Revenue by Stream
                        </h2>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {data?.feeTypeBreakdown?.length ?? 0} Streams
                        </span>
                    </div>

                    <div className="space-y-3 pt-1">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-2 w-full" />
                                </div>
                            ))
                        ) : !data?.feeTypeBreakdown?.length ? (
                            <p className="text-xs text-slate-400 py-6 text-center">No fee streams recorded.</p>
                        ) : (
                            data.feeTypeBreakdown.map((item) => {
                                const rate = item.collectionRate ?? 0;
                                return (
                                    <div key={item.chargeTypeId} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                {item.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(item.collectedAmount)}
                                                </span>
                                                <span className="text-slate-400">
                                                    / {formatCurrency(item.billedAmount)}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] px-1.5 py-0 font-bold bg-slate-50 dark:bg-slate-800"
                                                >
                                                    {rate}%
                                                </Badge>
                                            </div>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-[#556043] transition-all"
                                                style={{ width: `${Math.min(100, rate)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. Top Operating Expenditures */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-rose-600" />
                            Operating Expenditure by Category
                        </h2>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {data?.expenseCategoryBreakdown?.length ?? 0} Categories
                        </span>
                    </div>

                    <div className="space-y-3 pt-1">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-2 w-full" />
                                </div>
                            ))
                        ) : !data?.expenseCategoryBreakdown?.length ? (
                            <p className="text-xs text-slate-400 py-6 text-center">No expenses recorded.</p>
                        ) : (
                            data.expenseCategoryBreakdown.map((cat) => (
                                <div key={cat.categoryId} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                            {cat.categoryName}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-rose-600 dark:text-rose-400">
                                                {formatCurrency(cat.totalAmount)}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0 font-bold bg-slate-50 dark:bg-slate-800"
                                            >
                                                {cat.percentage}%
                                            </Badge>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-rose-500 transition-all"
                                            style={{ width: `${Math.min(100, cat.percentage)}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* CLASS-WISE ENROLLMENT & COLLECTION SUMMARY TABLE */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800 p-4">
                    <h2 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#556043]" />
                        Class-wise Strength & Collection Performance
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Class / Standard</th>
                                <th className="px-4 py-3 text-center">Enrolled Students</th>
                                <th className="px-4 py-3 text-right">Billed Amount (₹)</th>
                                <th className="px-4 py-3 text-right">Collected (₹)</th>
                                <th className="px-4 py-3 text-right">Outstanding (₹)</th>
                                <th className="px-4 py-3 text-center">Collection Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-12 mx-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-12 mx-auto" /></td>
                                    </tr>
                                ))
                            ) : !data?.classBreakdown || data.classBreakdown.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                                        No class records found for this academic year.
                                    </td>
                                </tr>
                            ) : (
                                data.classBreakdown.map((cls) => (
                                    <tr key={cls.classId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                            {cls.className}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-100">
                                                {cls.studentCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                            {formatCurrency(cls.billedAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(cls.collectedAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                                            {formatCurrency(cls.balanceAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] font-semibold ${
                                                    cls.collectionRate >= 90
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                        : cls.collectionRate >= 70
                                                        ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400"
                                                        : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400"
                                                }`}
                                            >
                                                {cls.collectionRate}%
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {data?.classBreakdown && data.classBreakdown.length > 0 && (
                            <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                                <tr>
                                    <td className="px-4 py-3 uppercase">Total School</td>
                                    <td className="px-4 py-3 text-center">
                                        {data.classBreakdown.reduce((acc, c) => acc + c.studentCount, 0)} Students
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {formatCurrency(data.classBreakdown.reduce((acc, c) => acc + c.billedAmount, 0))}
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">
                                        {formatCurrency(data.classBreakdown.reduce((acc, c) => acc + c.collectedAmount, 0))}
                                    </td>
                                    <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-400">
                                        {formatCurrency(data.classBreakdown.reduce((acc, c) => acc + c.balanceAmount, 0))}
                                    </td>
                                    <td className="px-4 py-3 text-center text-emerald-700 dark:text-emerald-400 font-bold">
                                        {data.financialSummary.collectionRate}%
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </section>
    );
}
