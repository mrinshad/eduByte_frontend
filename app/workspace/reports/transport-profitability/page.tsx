"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getVehicleProfitabilityReport,
    type VehicleProfitabilityResponse
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Bus,
    ChevronLeft,
    RotateCw,
    TrendingUp,
    TrendingDown,
    Fuel,
    Wrench,
    Coins,
    DollarSign,
    Scale,
    Users
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

function formatCurrency(amount?: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}

export default function TransportProfitabilityReportPage() {
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<VehicleProfitabilityResponse | null>(null);

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

    const loadProfitability = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getVehicleProfitabilityReport({
                academicYearId: selectedYearId,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Vehicle Profitability report");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId, fromDate, toDate]);

    useEffect(() => {
        loadProfitability();
    }, [loadProfitability]);

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center">
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500">You do not have permission to view Transport Reports.</p>
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
                        <Bus className="h-7 w-7 text-indigo-600" />
                        Vehicle Profitability & Cost Analysis (P&L)
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                        Transport fee collections vs. operational costs (fuel, repairs, and driver salaries) per vehicle.
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
                        onClick={loadProfitability}
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

            {/* 4 EXECUTIVE KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Fleet Revenue */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Transport Fee Revenue
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(data?.summary.totalRevenue)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Passenger fee collections</p>
                    </CardContent>
                </Card>

                {/* 2. Fleet Expenses */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Operating Costs
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {formatCurrency(data?.summary.totalExpenses)}
                            </div>
                        )}
                        <div className="flex justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span>Fuel: {formatCurrency(data?.summary.fuelExpenses)}</span>
                            <span>Repairs: {formatCurrency(data?.summary.maintenanceExpenses)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Driver Salaries */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Driver Salaries Paid
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(data?.summary.driverSalaries)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Driver payroll compensation</p>
                    </CardContent>
                </Card>

                {/* 4. Net Balance */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Net Balance
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                            <Scale className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div
                                className={`text-2xl font-bold ${
                                    (data?.summary.netFleetMargin ?? 0) >= 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400"
                                }`}
                            >
                                {formatCurrency(data?.summary.netFleetMargin)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                            {(data?.summary.netFleetMargin ?? 0) >= 0 ? "Surplus Balance" : "Operating Deficit"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* VEHICLE P&L COMPARISON TABLE */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Bus className="h-4 w-4 text-indigo-600" />
                        Vehicle-by-Vehicle Cost & Collection Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Vehicle</th>
                                    <th className="px-4 py-3 text-center">Passengers</th>
                                    <th className="px-4 py-3 text-right">Fee Collected (₹)</th>
                                    <th className="px-4 py-3 text-right">Fuel (₹)</th>
                                    <th className="px-4 py-3 text-right">Repairs (₹)</th>
                                    <th className="px-4 py-3 text-right">Driver Salary (₹)</th>
                                    <th className="px-4 py-3 text-right">Total Cost (₹)</th>
                                    <th className="px-4 py-3 text-right">Net Balance (₹)</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.vehicles?.length ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-slate-400">
                                            No vehicle data recorded for this academic year.
                                        </td>
                                    </tr>
                                ) : (
                                    data.vehicles.map((v) => (
                                        <tr key={v.vehicleId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {v.vehicleName}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                    {v.vehicleNumber} ({v.capacity} Seats)
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                    {v.passengerCount}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(v.revenueCollected)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                {formatCurrency(v.fuelCost)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                {formatCurrency(v.maintenanceCost)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                {formatCurrency(v.driverSalary)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-rose-700 dark:text-rose-400">
                                                {formatCurrency(v.totalExpenses)}
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right font-bold text-sm ${
                                                    v.netMargin >= 0
                                                        ? "text-emerald-700 dark:text-emerald-400"
                                                        : "text-rose-700 dark:text-rose-400"
                                                }`}
                                            >
                                                {formatCurrency(v.netMargin)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs font-bold ${
                                                        v.status === "SURPLUS"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                            : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400"
                                                    }`}
                                                >
                                                    {v.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {data?.vehicles && data.vehicles.length > 0 && (
                                <tfoot className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                                    <tr>
                                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">Total Fleet Cost</td>
                                        <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                                            {data.vehicles.reduce((sum, v) => sum + v.passengerCount, 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">
                                            {formatCurrency(data.summary.totalRevenue)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                            {formatCurrency(data.summary.fuelExpenses)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                            {formatCurrency(data.summary.maintenanceExpenses)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                            {formatCurrency(data.summary.driverSalaries)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-rose-700 dark:text-rose-400">
                                            {formatCurrency(data.summary.totalExpenses)}
                                        </td>
                                        <td
                                            className={`px-4 py-3 text-right text-base ${
                                                data.summary.netFleetMargin >= 0
                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                    : "text-rose-700 dark:text-rose-400"
                                            }`}
                                        >
                                            {formatCurrency(data.summary.netFleetMargin)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs font-bold ${
                                                    data.summary.netFleetMargin >= 0
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                        : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400"
                                                }`}
                                            >
                                                {data.summary.netFleetMargin >= 0 ? "SURPLUS" : "DEFICIT"}
                                            </Badge>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
