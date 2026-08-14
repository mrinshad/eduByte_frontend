"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    getVehicleProfitabilityReport,
    type VehicleProfitabilityResponse,
    type VehicleProfitabilityItem,
    type ExpenseBreakdownItem
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
    TrendingUp,
    TrendingDown,
    Bus,
    ArrowLeft,
    RefreshCcw,
    DollarSign,
    Search,
    ChevronLeft,
    ChevronRight,
    X
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

function formatCurrency(amount?: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}

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

export default function TransportProfitabilityReportPage() {
    const router = useRouter();
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [searchInput, setSearchInput] = useState<string>("");
    const [search, setSearch] = useState<string>("");
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

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const loadProfitability = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getVehicleProfitabilityReport({
                academicYearId: selectedYearId
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Transport Profitability report");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId]);

    useEffect(() => {
        loadProfitability();
    }, [loadProfitability]);

    const filteredVehicles = useMemo(() => {
        if (!data?.vehicles) return [];
        if (!search.trim()) return data.vehicles;
        const q = search.toLowerCase();
        return data.vehicles.filter(
            (v: VehicleProfitabilityItem) =>
                v.vehicleName.toLowerCase().includes(q) ||
                v.vehicleNumber.toLowerCase().includes(q)
        );
    }, [data?.vehicles, search]);

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
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have permission to view Financial Reports.</p>
                </div>
            </div>
        );
    }

    const netSurplus = (data?.summary.totalRevenue ?? 0) - (data?.summary.totalExpenses ?? 0);

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
                                <Bus className="h-6 w-6 text-[#556043]" />
                                Transport Revenue & Cost Analysis
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Vehicle-by-vehicle fee collections against fuel, maintenance, and driver payroll.
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
                            onClick={loadProfitability}
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
                {/* 1. Fleet Revenue */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Transport Fee Revenue</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(data?.summary.totalRevenue)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Passenger fee collections</p>
                </div>

                {/* 2. Fleet Expenses */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Operating Costs</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                            {formatCurrency(data?.summary.totalExpenses)}
                        </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {(data?.summary.categoryBreakdown || []).slice(0, 3).map((cat) => (
                            <span key={cat.category}>{cat.category}: {formatCurrency(cat.amount)}</span>
                        ))}
                    </div>
                </div>

                {/* 3. Net Balance */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Operating Balance</span>
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                netSurplus >= 0
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                            }`}
                        >
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p
                            className={`mt-2 text-2xl font-bold tracking-tight ${
                                netSurplus >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {formatCurrency(netSurplus)}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {netSurplus >= 0 ? "Surplus operational margin" : "Operating deficit"}
                    </p>
                </div>

                {/* 4. Fleet Capacity */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Fleet Vehicles</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Bus className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {data?.vehicles?.length ?? 0} Vehicles
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total fleet operations</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search vehicle name or registration..."
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

            {/* VEHICLES P&L TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Vehicle Details</th>
                                <th className="px-4 py-3 text-center">Passengers</th>
                                <th className="px-4 py-3 text-right">Fee Collected (₹)</th>
                                <th className="px-4 py-3">Expense Breakdown</th>
                                <th className="px-4 py-3 text-right">Total Cost (₹)</th>
                                <th className="px-4 py-3 text-right">Net Balance (₹)</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-12 mx-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 mx-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                                        No vehicle records found for this academic year.
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map((v: VehicleProfitabilityItem) => (
                                    <tr key={v.vehicleId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                {v.vehicleName}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {v.vehicleNumber}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200">
                                                {v.passengerCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(v.revenueCollected)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {v.expenseBreakdown && v.expenseBreakdown.length > 0 ? (
                                                    v.expenseBreakdown.map((cat) => (
                                                        <span key={cat.category} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-semibold bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                                                            {cat.category}: {formatCurrency(cat.amount)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                                            {formatCurrency(v.totalExpenses)}
                                        </td>
                                        <td
                                            className={`px-4 py-3 text-right font-semibold text-sm ${
                                                v.netMargin >= 0
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-rose-600 dark:text-rose-400"
                                            }`}
                                        >
                                            {formatCurrency(v.netMargin)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] font-semibold ${
                                                    v.netMargin >= 0
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                        : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400"
                                                }`}
                                            >
                                                {v.netMargin >= 0 ? "Surplus" : "Deficit"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
