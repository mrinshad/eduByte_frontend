"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
    Calendar,
    RotateCw,
    Printer,
    Users,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Wallet,
    Building2,
    GraduationCap,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const SAGE = "#556043";

const formatCurrency = (val: number | null | undefined) => {
    const num = Number(val ?? 0);
    return `₹ ${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export default function AcademicYearSummaryPage() {
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

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full print:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                        <GraduationCap className="h-7 w-7 text-emerald-700 dark:text-emerald-500" />
                        Academic Year Summary
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Executive operational and financial performance overview for{" "}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {activeYear?.name ?? "Academic Year"}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Academic Year Dropdown */}
                    <div className="w-48">
                        <Select
                            value={selectedYearId}
                            onValueChange={(val) => setSelectedYearId(val)}
                        >
                            <SelectTrigger className="h-9 w-full bg-white text-slate-900 border border-slate-300 font-medium dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYears.map((y) => (
                                    <SelectItem key={y.id} value={y.id}>
                                        {y.name} {y.isActive ? " (Active)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadReport}
                        disabled={loading}
                        className="h-9 w-9 shrink-0 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                        title="Refresh Data"
                    >
                        <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>

                    {/* <Button
                        onClick={() => window.print()}
                        className="h-9 text-white font-medium shadow-xs"
                        style={{ backgroundColor: SAGE }}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Summary
                    </Button> */}
                </div>
            </div>

            {/* Print Header (Only visible on print) */}
            <div className="hidden print:block text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold uppercase">Kids covE School of Excellence</h1>
                <p className="text-xs text-slate-600 mt-0.5">Run by: KC Ibrahim Haji Memorial Education Board</p>
                <h2 className="text-lg font-bold mt-2 uppercase underline">
                    Academic Year Executive Summary — {activeYear?.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                    Period: {data?.academicYear?.startDate ? new Date(data.academicYear.startDate).toLocaleDateString("en-IN") : "—"} to{" "}
                    {data?.academicYear?.endDate ? new Date(data.academicYear.endDate).toLocaleDateString("en-IN") : "—"}
                </p>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Student Strength */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Student Strength
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-20 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {data?.studentSummary.totalEnrollments ?? 0}
                            </div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                {data?.studentSummary.activeEnrollments ?? 0} Active
                            </span>
                            <span>•</span>
                            <span>{data?.studentSummary.genderStats.male ?? 0} Boys</span>
                            <span>•</span>
                            <span>{data?.studentSummary.genderStats.female ?? 0} Girls</span>
                        </div>
                        {data?.studentSummary.transportOptedCount ? (
                            <p className="text-[11px] text-slate-400 mt-1.5">
                                🚍 {data.studentSummary.transportOptedCount} students enrolled in Transport
                            </p>
                        ) : null}
                    </CardContent>
                </Card>

                {/* 2. Fee Collection (Income) */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Fee Revenue
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {formatCurrency(data?.financialSummary.totalCollected)}
                                </span>
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 border-none text-[11px] font-bold">
                                    {data?.financialSummary.collectionRate ?? 0}%
                                </Badge>
                            </div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                            <span>Billed: {formatCurrency(data?.financialSummary.totalBilled)}</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Due: {formatCurrency(data?.financialSummary.totalOutstanding)}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                            <span>Cash: {formatCurrency(data?.financialSummary.cashCollected)}</span>
                            <span>Bank/UPI: {formatCurrency(data?.financialSummary.bankCollected)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Operating Expenses */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Operating Expenses
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(data?.financialSummary.totalExpenses)}
                            </div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Disbursed during this academic year period
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                            <span>Cash: {formatCurrency(data?.financialSummary.cashExpenses)}</span>
                            <span>Bank/Online: {formatCurrency(data?.financialSummary.bankExpenses)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Net Surplus / Cash Flow */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Net Cash Flow / Surplus
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div
                                className={`text-2xl font-bold flex items-center gap-1 ${(data?.financialSummary.netSurplus ?? 0) >= 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400"
                                    }`}
                            >
                                {(data?.financialSummary.netSurplus ?? 0) >= 0 ? (
                                    <ArrowUpRight className="h-5 w-5" />
                                ) : (
                                    <ArrowDownRight className="h-5 w-5" />
                                )}
                                {formatCurrency(data?.financialSummary.netSurplus)}
                            </div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Net Revenue minus Total Expenses
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                            <span>Net Cash: {formatCurrency(data?.financialSummary.netCashSurplus)}</span>
                            <span>Net Bank: {formatCurrency(data?.financialSummary.netBankSurplus)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SECTION 1: Income by Fee Type */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                        Income Breakdown by Fee Type
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Fee Particulars</th>
                                    <th className="px-4 py-3">Frequency</th>
                                    <th className="px-4 py-3 text-right">Billed Amount</th>
                                    <th className="px-4 py-3 text-right">Cash Received</th>
                                    <th className="px-4 py-3 text-right">Bank Received</th>
                                    <th className="px-4 py-3 text-right">Total Collected</th>
                                    <th className="px-4 py-3 text-right">Outstanding</th>
                                    <th className="px-4 py-3 text-center">Collection %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.feeTypeBreakdown?.length ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-slate-400">
                                            No fee charges recorded for this academic year.
                                        </td>
                                    </tr>
                                ) : (
                                    data.feeTypeBreakdown.map((item) => (
                                        <tr key={item.chargeTypeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                {item.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                                                    {item.frequency}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                                                {formatCurrency(item.billedAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                {formatCurrency(item.cashAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                {formatCurrency(item.bankAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(item.collectedAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400">
                                                {formatCurrency(item.balanceAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${item.collectionRate >= 90
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                        : item.collectionRate >= 70
                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                    }`}>
                                                    {item.collectionRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {data?.feeTypeBreakdown && data.feeTypeBreakdown.length > 0 && (
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 uppercase text-xs">Total Fee Revenue</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(data.financialSummary.totalBilled)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(data.financialSummary.cashCollected)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(data.financialSummary.bankCollected)}</td>
                                        <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">{formatCurrency(data.financialSummary.totalCollected)}</td>
                                        <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{formatCurrency(data.financialSummary.totalOutstanding)}</td>
                                        <td className="px-4 py-3 text-center text-emerald-700 dark:text-emerald-400 font-bold">{data.financialSummary.collectionRate}%</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 2 & 3: Expense Breakdown and Class Breakdown in 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expenditure by Category */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-rose-600" />
                            Expenditure by Category
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3 text-right">Cash</th>
                                        <th className="px-4 py-3 text-right">Bank/Online</th>
                                        <th className="px-4 py-3 text-right">Total Amount</th>
                                        <th className="px-4 py-3 text-right">% Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : !data?.expenseCategoryBreakdown?.length ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-slate-400">
                                                No expenses recorded for this academic year.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.expenseCategoryBreakdown.map((cat) => (
                                            <tr key={cat.categoryId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                    {cat.categoryName}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                    {formatCurrency(cat.cashAmount)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                    {formatCurrency(cat.bankAmount)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                                    {formatCurrency(cat.totalAmount)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-500">
                                                    {cat.percentage}%
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {data?.expenseCategoryBreakdown && data.expenseCategoryBreakdown.length > 0 && (
                                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                                        <tr>
                                            <td className="px-4 py-3 uppercase text-xs">Total Expenses</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(data.financialSummary.cashExpenses)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(data.financialSummary.bankExpenses)}</td>
                                            <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">{formatCurrency(data.financialSummary.totalExpenses)}</td>
                                            <td className="px-4 py-3 text-right">100%</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Class-wise Enrollment & Collection Matrix */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            Class-wise Enrollment & Collections
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3">Class</th>
                                        <th className="px-4 py-3 text-center">Students</th>
                                        <th className="px-4 py-3 text-right">Billed</th>
                                        <th className="px-4 py-3 text-right">Collected</th>
                                        <th className="px-4 py-3 text-right">Due</th>
                                        <th className="px-4 py-3 text-center">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-10 mx-auto" /></td>
                                            </tr>
                                        ))
                                    ) : !data?.classBreakdown?.length ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-slate-400">
                                                No class data available.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.classBreakdown.map((cls) => (
                                            <tr key={cls.classId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                    {cls.className}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                                                        {cls.studentCount}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                                                    {formatCurrency(cls.billedAmount)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                    {formatCurrency(cls.collectedAmount)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-amber-700 dark:text-amber-400">
                                                    {formatCurrency(cls.balanceAmount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${cls.collectionRate >= 90
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                            : cls.collectionRate >= 70
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                        }`}>
                                                        {cls.collectionRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {data?.classBreakdown && data.classBreakdown.length > 0 && (
                                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                                        <tr>
                                            <td className="px-4 py-3 uppercase text-xs">Total</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-200 text-slate-900 border border-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                                                    {data.classBreakdown.reduce((acc, c) => acc + c.studentCount, 0)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(data.classBreakdown.reduce((acc, c) => acc + c.billedAmount, 0))}</td>
                                            <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">{formatCurrency(data.classBreakdown.reduce((acc, c) => acc + c.collectedAmount, 0))}</td>
                                            <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-400">{formatCurrency(data.classBreakdown.reduce((acc, c) => acc + c.balanceAmount, 0))}</td>
                                            <td className="px-4 py-3 text-center text-emerald-700 dark:text-emerald-400 font-bold">
                                                {data.financialSummary.collectionRate}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SECTION 4: Monthly Cash Flow Ledger */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        Monthly Inflow vs Outflow Ledger
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Month</th>
                                    <th className="px-4 py-3 text-right">Fee Inflow (₹)</th>
                                    <th className="px-4 py-3 text-right">Expenses Outflow (₹)</th>
                                    <th className="px-4 py-3 text-right">Net Monthly Flow (₹)</th>
                                    <th className="px-4 py-3 text-center">Cash Flow Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-24 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-24 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-24 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.monthlyTrend?.length ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-slate-400">
                                            No monthly trend data available.
                                        </td>
                                    </tr>
                                ) : (
                                    data.monthlyTrend.map((m) => (
                                        <tr key={m.monthKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                {m.monthName}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(m.income)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-rose-600 dark:text-rose-400">
                                                {formatCurrency(m.expense)}
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right font-bold ${m.net >= 0
                                                        ? "text-emerald-700 dark:text-emerald-400"
                                                        : "text-rose-600 dark:text-rose-400"
                                                    }`}
                                            >
                                                {formatCurrency(m.net)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {m.net >= 0 ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none text-[10px] font-bold">
                                                        Surplus
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-none text-[10px] font-bold">
                                                        Deficit
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
