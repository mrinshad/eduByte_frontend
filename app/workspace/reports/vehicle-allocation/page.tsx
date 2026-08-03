"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Bus,
    ChevronDown,
    ChevronUp,
    Loader2,
    Phone,
    Receipt,
    Search,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    getVehicleLists,
    getStudentsByVehicle,
    type Vehicle,
    type VehicleStudent,
} from "@/lib/services/reports";

const BRAND = "#556043";
const PAGE_SIZE = 10;

function initials(name: string) {
    return (
        name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("") || "V"
    );
}

export default function VehicleStudentsReportPage() {
    const router = useRouter();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [studentsCache, setStudentsCache] = useState<Record<string, VehicleStudent[]>>({});
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

    /* ---- debounce search ---- */
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    /* ---- load vehicles ---- */
    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getVehicleLists();
                setVehicles(data);
            } catch {
                setError("Could not load vehicles. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    /* ---- filter ---- */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return vehicles;
        return vehicles.filter(
            (v) =>
                v.vehicleName.toLowerCase().includes(q) ||
                v.vehicleNumber.toLowerCase().includes(q) ||
                v.driverName.toLowerCase().includes(q)
        );
    }, [vehicles, search]);

    /* ---- pagination ---- */
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageSafe = Math.min(page, totalPages);
    const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

    /* ---- totals ---- */
    const totalStudents = useMemo(
        () => vehicles.reduce((sum, v) => sum + v.totalStudents, 0),
        [vehicles]
    );
    const activeVehicles = useMemo(
        () => vehicles.filter((v) => v.totalStudents > 0).length,
        [vehicles]
    );

    /* ---- expand & fetch students ---- */
    async function toggleExpand(vehicleId: string) {
        const isOpen = expandedIds.has(vehicleId);
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (isOpen) next.delete(vehicleId);
            else next.add(vehicleId);
            return next;
        });
        if (isOpen) return;

        if (studentsCache[vehicleId] || loadingIds.has(vehicleId)) return;

        setLoadingIds((prev) => new Set(prev).add(vehicleId));
        try {
            const data = await getStudentsByVehicle(vehicleId);
            setStudentsCache((prev) => ({
                ...prev,
                [vehicleId]: data?.Students ?? [],
            }));
            setRowErrors((prev) => {
                const next = { ...prev };
                delete next[vehicleId];
                return next;
            });
        } catch {
            setRowErrors((prev) => ({
                ...prev,
                [vehicleId]: "Could not load students for this vehicle.",
            }));
        } finally {
            setLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(vehicleId);
                return next;
            });
        }
    }

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6">
            {/* ==================== HEADER ==================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 shrink-0 text-white"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                                Vehicle Students Report
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Students assigned to each vehicle
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* ==================== SEARCH ==================== */}
                    <div className="flex justify-end">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search vehicle, plate or driver..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 dark:focus-visible:border-[#6b7a55] dark:focus-visible:ring-[#6b7a55]/30"
                            />
                        </div>
                    </div>

                    {/* ==================== SUMMARY CARDS ==================== */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        <SummaryCard
                            label="Total Vehicles"
                            value={String(vehicles.length)}
                            icon={<Bus className="h-4 w-4" />}
                            accent={BRAND}
                        />
                        <SummaryCard
                            label="Total Students"
                            value={String(totalStudents)}
                            icon={<Users className="h-4 w-4" />}
                            accent="#3b6e91"
                        />
                        <SummaryCard
                            label="Active Vehicles"
                            value={String(activeVehicles)}
                            icon={<Bus className="h-4 w-4" />}
                            accent="#a8763e"
                        />
                        <SummaryCard
                            label="Avg / Vehicle"
                            value={
                                vehicles.length > 0
                                    ? String(Math.round(totalStudents / vehicles.length))
                                    : "0"
                            }
                            icon={<Users className="h-4 w-4" />}
                            accent="#7a4a8f"
                        />
                    </div>

                    
                    {/* ==================== TABLE ==================== */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/60">
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 sm:px-5 w-12">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 sm:px-5">
                                            Vehicle
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 sm:px-5">
                                            Driver
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-5">
                                            Students
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 sm:px-5 w-16">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {isLoading && vehicles.length === 0 ? (
                                        <SkeletonRows count={6} />
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5}>
                                                <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
                                                    <Receipt className="h-7 w-7 text-slate-300" />
                                                    <p className="text-sm">
                                                        {search
                                                            ? `No vehicles match "${search}"`
                                                            : "No vehicles found."}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paged.map((v, idx) => {
                                            const isExpanded = expandedIds.has(v.id);
                                            const students = studentsCache[v.id] ?? [];
                                            const isLoadingStudents = loadingIds.has(v.id);
                                            const studentError = rowErrors[v.id];

                                            return (
                                                <Fragment key={v.id}>
                                                    <tr
                                                        className={cn(
                                                            "transition-colors",
                                                            isExpanded
                                                                ? "bg-[#556043]/[0.03] dark:bg-emerald-400/[0.03]"
                                                                : "hover:bg-slate-50/60 dark:hover:bg-white/[0.03]"
                                                        )}
                                                    >
                                                        <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400 sm:px-5">
                                                            {(pageSafe - 1) * PAGE_SIZE + idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3.5 sm:px-5">
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm"
                                                                    style={{ backgroundColor: BRAND }}
                                                                >
                                                                    {initials(v.vehicleName)}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                                        {v.vehicleName}
                                                                    </p>
                                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                        {v.vehicleNumber}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 sm:px-5">
                                                            {v.driverName}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right sm:px-5">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "gap-1 font-medium",
                                                                    v.totalStudents > 0
                                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                                        : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                                )}
                                                            >
                                                                <Users className="h-3 w-3" />
                                                                {v.totalStudents}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center sm:px-5">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => toggleExpand(v.id)}
                                                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded student list */}
                                                    {isExpanded && (
                                                        <tr className="bg-[#556043]/[0.02] dark:bg-emerald-400/[0.02]">
                                                            <td colSpan={5} className="px-4 py-4 sm:px-5">
                                                                <ExpandedStudents
                                                                    vehicle={v}
                                                                    students={students}
                                                                    isLoading={isLoadingStudents}
                                                                    error={studentError}
                                                                />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!isLoading && filtered.length > 0 && (
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800/50 sm:flex-row sm:px-5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing {(pageSafe - 1) * PAGE_SIZE + 1}–
                                    {Math.min(pageSafe * PAGE_SIZE, filtered.length)} of{" "}
                                    {filtered.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={pageSafe <= 1}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                        Page {pageSafe} of {totalPages}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={pageSafe >= totalPages}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SummaryCard({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-4">
            <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-xl"
                style={{ backgroundColor: accent }}
            />
            <div className="relative flex items-center gap-2">
                <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: accent }}
                >
                    {icon}
                </span>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            </div>
            <p className="relative mt-2 text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-xl">
                {value}
            </p>
        </div>
    );
}

function SkeletonRows({ count }: { count: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5 sm:px-5">
                        <div className="h-4 w-6 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="space-y-1.5">
                                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="ml-auto h-5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-4 py-3.5 text-center sm:px-5">
                        <div className="mx-auto h-8 w-8 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                </tr>
            ))}
        </>
    );
}

function ExpandedStudents({
    vehicle,
    students,
    isLoading,
    error,
}: {
    vehicle: Vehicle;
    students: VehicleStudent[];
    isLoading: boolean;
    error: string | null;
}) {
    const [innerSearch, setInnerSearch] = useState("");

    const filtered = useMemo(() => {
        const q = innerSearch.trim().toLowerCase();
        if (!q) return students;
        return students.filter(
            (s) =>
                s.studentName.toLowerCase().includes(q) ||
                s.admissionNumber.toLowerCase().includes(q) ||
                s.class.toLowerCase().includes(q) ||
                s.whatsappNumber.toLowerCase().includes(q)
        );
    }, [students, innerSearch]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#556043]" />
                <p className="text-xs">Loading students for {vehicle.vehicleName}…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Mini header + inner search */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm"
                        style={{ backgroundColor: BRAND }}
                    >
                        {initials(vehicle.vehicleName)}
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                            {vehicle.vehicleName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {vehicle.vehicleNumber} • {students.length} student
                            {students.length === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>

                <div className="relative w-full sm:max-w-[220px]">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search students..."
                        value={innerSearch}
                        onChange={(e) => setInnerSearch(e.target.value)}
                        className="h-8 rounded-md pl-8 text-xs border-slate-300 dark:border-slate-700"
                    />
                </div>
            </div>

            {/* Students table — header fixed, only body scrolls */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[560px]">
                        {/* Fixed header (outside the scroll area) */}
                        <table className="w-full text-sm table-fixed">
                            <colgroup>
                                <col className="w-10" />
                                <col className="w-32" />
                                <col className="w-40" />
                                <col className="w-24" />
                                <col className="w-36" />
                            </colgroup>
                            <thead>
                                <tr className="bg-[#556043] dark:bg-background border-none">
                                    <th className="px-3 h-9 text-left text-white dark:text-foreground font-semibold text-xs whitespace-nowrap">
                                        #
                                    </th>
                                    <th className="px-3 h-9 text-left text-white dark:text-foreground font-semibold text-xs whitespace-nowrap">
                                        Admission No.
                                    </th>
                                    <th className="px-3 h-9 text-left text-white dark:text-foreground font-semibold text-xs whitespace-nowrap">
                                        Student Name
                                    </th>
                                    <th className="px-3 h-9 text-left text-white dark:text-foreground font-semibold text-xs whitespace-nowrap">
                                        Class
                                    </th>
                                    <th className="px-3 h-9 text-left text-white dark:text-foreground font-semibold text-xs whitespace-nowrap">
                                        WhatsApp
                                    </th>
                                </tr>
                            </thead>
                        </table>

                        {/* Scrollable body only */}
                        <div className="max-h-[240px] overflow-y-auto">
                            <table className="w-full text-sm table-fixed">
                                <colgroup>
                                    <col className="w-10" />
                                    <col className="w-32" />
                                    <col className="w-40" />
                                    <col className="w-24" />
                                    <col className="w-36" />
                                </colgroup>
                                <tbody>
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="h-24 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-1 py-6">
                                                    <Users className="h-6 w-6 text-slate-300" />
                                                    <p className="text-xs">No students assigned.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="h-24 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-1 py-6">
                                                    <Search className="h-6 w-6 text-slate-300" />
                                                    <p className="text-xs">No students match your search.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((s, i) => (
                                            <tr
                                                key={s.admissionNumber}
                                                className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                            >
                                                <td className="px-3 py-2.5 text-xs font-medium text-slate-500">
                                                    {i + 1}
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                                                    {s.admissionNumber}
                                                </td>
                                                <td className="px-3 py-2.5 text-xs font-semibold text-slate-950 dark:text-slate-100">
                                                    {s.studentName}
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                                                    {s.class}
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-slate-400" />
                                                        {s.whatsappNumber}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}