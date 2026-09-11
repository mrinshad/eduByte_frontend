"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    getVehicleRouteRosterReport,
    type VehicleRouteRosterResponse,
    type PassengerRosterItem
} from "@/lib/services/advancedReports";
import { getAcademicYears } from "@/lib/services/academicYear";
import { getVehicles } from "@/lib/services/vehicle";
import { getReportConfig } from "@/lib/report-definitions";
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
    Bus,
    ArrowLeft,
    RefreshCcw,
    Search,
    Users,
    Phone,
    ChevronLeft,
    ChevronRight,
    X,
    Download,
    Loader2,
} from "lucide-react";
import { exportToCsv, type CsvColumn } from "@/lib/utils/csvExport";
import { toast } from "sonner";
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

export default function TransportRosterReportPage() {
    const router = useRouter();
    const reportConfig = getReportConfig("reports/transport-roster");
    const { can } = usePermission();
    const canView = can("report.read");

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("ALL");
    const [searchInput, setSearchInput] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [exporting, setExporting] = useState<boolean>(false);
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

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const loadRoster = useCallback(async () => {
        if (!selectedYearId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getVehicleRouteRosterReport({
                academicYearId: selectedYearId,
                vehicleId: selectedVehicleId === "ALL" ? undefined : selectedVehicleId,
                search: search.trim() || undefined,
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

    const selectedVehicleName = useMemo(() => {
        if (selectedVehicleId === "ALL") return "";
        const veh = vehicles.find((v) => v.id === selectedVehicleId);
        return veh ? `${veh.vehicleName} (${veh.vehicleNumber})` : selectedVehicleId;
    }, [selectedVehicleId, vehicles]);

    const hasActiveFilters = useMemo(
        () =>
            selectedVehicleId !== "ALL" ||
            search.trim().length > 0,
        [selectedVehicleId, search]
    );

    const clearAllFilters = () => {
        setSearchInput("");
        setSearch("");
        setSelectedVehicleId("ALL");
        setPage(1);
    };

    const handleExportCsv = async () => {
        if (!selectedYearId) return;
        try {
            setExporting(true);
            const res = await getVehicleRouteRosterReport({
                academicYearId: selectedYearId,
                vehicleId: selectedVehicleId === "ALL" ? undefined : selectedVehicleId,
                search: search.trim() || undefined,
                page: 1,
                limit: 10000,
            });

            const passengersList = res?.passengers || [];
            if (!passengersList.length) {
                toast.info("No passengers found in transport roster to export.");
                return;
            }

            const columns: CsvColumn<PassengerRosterItem>[] = [
                { header: "Vehicle Name", accessor: (p) => p.vehicleName || "" },
                { header: "Vehicle Number", accessor: (p) => p.vehicleNumber || "" },
                { header: "Driver Name", accessor: (p) => p.driverName || "-" },
                { header: "Student Name", accessor: (p) => p.studentName || "" },
                { header: "Admission No", accessor: (p) => p.admissionNumber || "" },
                { header: "Class", accessor: (p) => p.className || "-" },
                { header: "Division", accessor: (p) => p.divisionName || "-" },
                { header: "Roll No", accessor: (p) => p.rollNumber || "-" },
                { header: "Parent Name", accessor: (p) => p.parentName || "-" },
                { header: "Parent Contact", accessor: (p) => p.parentPhone || "-" },
                { header: "WhatsApp Number", accessor: (p) => p.whatsappNumber || "-" },
                { header: "Address", accessor: (p) => p.address || "-" },
            ];

            const success = exportToCsv({
                filename: "transport_route_roster",
                columns,
                data: passengersList,
            });

            if (success) {
                toast.success(`Exported ${passengersList.length} passenger records successfully.`);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to export transport roster");
        } finally {
            setExporting(false);
        }
    };

    if (!canView) {
        return (
            <div className="flex h-96 items-center justify-center p-8 text-center font-sans">
                <div className="max-w-md">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Access Restricted</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have permission to view Transportation Reports.</p>
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
                            <div className="flex items-center gap-2">
                                <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                                    {reportConfig.title}
                                </h1>
                                {reportConfig.badgeText && (
                                    <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider text-[#556043] border-[#556043]/30 bg-[#556043]/5">
                                        {reportConfig.badgeText}
                                    </Badge>
                                )}
                            </div>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {reportConfig.subtitle}
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
                            size="sm"
                            onClick={handleExportCsv}
                            disabled={exporting || loading}
                            className="h-9 gap-1.5 border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                        >
                            {exporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Export CSV
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadRoster}
                            disabled={loading}
                            className="h-9 w-9 shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                            title="Refresh Roster"
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

            {/* 2 SUMMARY STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Fleet Vehicles */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Fleet Vehicles</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Bus className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {data?.summary.totalVehicles ?? 0}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Buses & transport vans</p>
                </div>

                {/* 2. Assigned Students */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Students</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {data?.summary.totalPassengers ?? 0} Students
                        </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active transport passengers</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search student, adm no, vehicle, phone..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-10 w-full rounded-lg pl-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 text-xs sm:text-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={selectedVehicleId}
                        onValueChange={(val) => {
                            setSelectedVehicleId(val);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[170px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium">
                            <SelectValue placeholder="All Fleet Vehicles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Fleet Vehicles</SelectItem>
                            {vehicles.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.vehicleName} ({v.vehicleNumber})
                                </SelectItem>
                            ))}
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

                    {selectedVehicleId !== "ALL" && (
                        <FilterChip
                            label={`Vehicle: ${selectedVehicleName}`}
                            onRemove={() => {
                                setSelectedVehicleId("ALL");
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

            {/* PASSENGER ROSTER TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-[#556043] text-xs font-semibold uppercase tracking-wider text-white dark:bg-background dark:text-foreground border-none">
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
                                Array.from({ length: 6 }).map((_, i) => (
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
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No passenger records found for this vehicle.
                                    </td>
                                </tr>
                            ) : (
                                data.passengers.map((p) => (
                                    <tr key={p.assignmentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                                {p.vehicleName}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{p.vehicleNumber}</div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                            {p.studentName}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                                            {p.admissionNumber}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                            <Badge variant="outline" className="text-xs font-semibold bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                                                {p.className} - {p.divisionName}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{p.parentName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {p.parentPhone}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                                            {p.address}
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                                            {p.assignedDate ? new Date(p.assignedDate).toLocaleDateString("en-IN") : "-"}
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
