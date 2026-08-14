"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    getVehicleRouteRosterReport,
    type VehicleRouteRosterResponse,
    type PassengerRosterItem,
    type VehicleSummaryItem
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { getVehicles } from "@/lib/services/vehicle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Bus,
    ChevronLeft,
    RotateCw,
    Search,
    Users,
    UserCheck,
    Gauge,
    Phone,
    MapPin,
    ShieldAlert,
    CheckCircle
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

export default function TransportRosterReportPage() {
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("ALL");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<VehicleRouteRosterResponse | null>(null);

    useEffect(() => {
        async function fetchMetadata() {
            try {
                const [yearsRes, vehRes] = await Promise.all([
                    getAcademicYears(),
                    getVehicles()
                ]);
                const yList = (yearsRes as any)?.data || yearsRes || [];
                setAcademicYears(yList);
                const active = yList.find((y: any) => y.isActive);
                if (active) setSelectedYearId(active.id);
                else if (yList.length > 0) setSelectedYearId(yList[0].id);

                const vList = (vehRes as any)?.data || vehRes || [];
                setVehicles(vList);
            } catch (err) {
                console.error("Failed to load transport metadata", err);
            }
        }
        fetchMetadata();
    }, []);

    const loadRoster = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getVehicleRouteRosterReport({
                academicYearId: selectedYearId,
                vehicleId: selectedVehicleId,
                search,
                page,
                limit: 25
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load Transport Roster");
        } finally {
            setLoading(false);
        }
    }, [selectedYearId, selectedVehicleId, search, page]);

    useEffect(() => {
        loadRoster();
    }, [loadRoster]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadRoster();
    };

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center">
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500">You do not have permission to view Transportation Reports.</p>
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
                        Vehicle Route & Passenger Roster
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                        School fleet seating capacity, driver details, and student passenger manifests.
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

                    {/* Vehicle Filter */}
                    <select
                        value={selectedVehicleId}
                        onChange={(e) => {
                            setSelectedVehicleId(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs focus:ring-1 focus:ring-slate-400"
                    >
                        <option value="ALL">All Fleet Vehicles</option>
                        {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.vehicleName} ({v.vehicleNumber})
                            </option>
                        ))}
                    </select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadRoster}
                        disabled={loading}
                        className="h-9 w-9 shrink-0 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-100"
                        title="Refresh Roster"
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

            {/* 4 FLEET KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Fleet Vehicles */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Active Fleet Vehicles
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                            <Bus className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {data?.summary.totalVehicles ?? 0}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Buses & transport vans</p>
                    </CardContent>
                </Card>

                {/* 2. Total Seating Capacity */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Seating Capacity
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                            <Gauge className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {data?.summary.totalCapacity ?? 0} Seats
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Total seats across vehicles</p>
                    </CardContent>
                </Card>

                {/* 3. Total Assigned Passengers */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Assigned Students
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {data?.summary.totalPassengers ?? 0} Students
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Active transport users</p>
                    </CardContent>
                </Card>

                {/* 4. Available Seats */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Available Seats
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-7 w-28 mb-2" />
                        ) : (
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {data?.summary.availableSeats ?? 0} Seats
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Remaining seating capacity</p>
                    </CardContent>
                </Card>
            </div>

            {/* FLEET SUMMARY MATRIX */}
            {data?.vehiclesSummary && data.vehiclesSummary.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.vehiclesSummary.map((v) => (
                        <Card key={v.vehicleId} className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                            <Bus className="h-4 w-4 text-indigo-600" />
                                            {v.vehicleName}
                                        </CardTitle>
                                        <p className="text-xs font-mono text-slate-500 mt-0.5">{v.vehicleNumber}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {v.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-3 space-y-2 text-xs">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span>Driver:</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{v.driverName}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span>Seating Capacity:</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{v.capacity} Seats</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span>Assigned Students:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{v.assignedCount} Students</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span>Available Seats:</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{v.availableSeats} Seats</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* SEARCH TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by student, admission no, vehicle, phone..."
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
                    Showing {data?.passengers.length ?? 0} of {data?.pagination.total ?? 0} passenger records
                </div>
            </div>

            {/* PASSENGER ROSTER TABLE */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Vehicle Details</th>
                                    <th className="px-4 py-3">Student Name</th>
                                    <th className="px-4 py-3">Admission No</th>
                                    <th className="px-4 py-3">Class & Section</th>
                                    <th className="px-4 py-3">Parent Name & Phone</th>
                                    <th className="px-4 py-3">Stop / Address</th>
                                    <th className="px-4 py-3 text-right">Assigned Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                                            <td className="px-4 py-3 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : !data?.passengers || data.passengers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                            No passenger records found for this vehicle.
                                        </td>
                                    </tr>
                                ) : (
                                    data.passengers.map((p) => (
                                        <tr key={p.assignmentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                                    {p.vehicleName}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-500">{p.vehicleNumber}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-semibold">
                                                {p.studentName}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                                                {p.admissionNumber}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                                                    {p.className}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{p.parentName}</div>
                                                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {p.parentPhone}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                                                {p.address}
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-slate-500 font-mono">
                                                {p.assignedDate ? new Date(p.assignedDate).toLocaleDateString("en-IN") : "-"}
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
