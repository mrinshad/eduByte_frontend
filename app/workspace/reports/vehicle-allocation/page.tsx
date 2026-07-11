"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bus,
    ChevronRight,
    Loader2,
    Phone,
    Search,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getVehicleLists,
    getStudentsByVehicle,
    type Vehicle,
    type StudentsByVehicleData,
} from "@/lib/services/reports"; // <-- adjust to wherever you saved the API file

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

export default function VehiclesPage() {
    const router = useRouter();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehiclesError, setVehiclesError] = useState<string | null>(null);

    const [searchInput, setSearchInput] = useState("");

    // No vehicle selected on initial load — user must click one.
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const [detail, setDetail] = useState<StudentsByVehicleData | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    // Search within the currently loaded student list.
    const [studentSearchInput, setStudentSearchInput] = useState("");

    // Load vehicle list once. The list endpoint already returns totalStudents
    // per vehicle, so the left-side badges don't need any extra fetching.
    // NOTE: we deliberately do NOT auto-select the first vehicle here —
    // the right panel should stay empty ("Select a vehicle...") until the
    // user actually clicks one.
    useEffect(() => {
        async function load() {
            try {
                setIsLoadingVehicles(true);
                setVehiclesError(null);
                const data = await getVehicleLists();
                setVehicles(data);
            } catch (err) {
                setVehiclesError("Could not load vehicles. Please try again.");
            } finally {
                setIsLoadingVehicles(false);
            }
        }
        load();
    }, []);

    // Fetch students for ONLY the currently selected vehicle. Re-runs every
    // time selectedVehicleId changes, so switching buses always replaces
    // (never merges with) the previous bus's student list.
    useEffect(() => {
        if (!selectedVehicleId) {
            setDetail(null);
            setDetailError(null);
            return;
        }

        let cancelled = false;

        async function loadDetail(vehicleId: string) {
            try {
                setIsLoadingDetail(true);
                setDetailError(null);
                setDetail(null);
                const data = await getStudentsByVehicle(vehicleId);
                if (!cancelled) setDetail(data);
            } catch (err) {
                if (!cancelled) setDetailError("Could not load students for this vehicle.");
            } finally {
                if (!cancelled) setIsLoadingDetail(false);
            }
        }

        loadDetail(selectedVehicleId);

        return () => {
            cancelled = true;
        };
    }, [selectedVehicleId]);

    // Reset the student search whenever the selected vehicle changes, so a
    // leftover query from Bus 1 doesn't silently filter out Bus 2's students.
    useEffect(() => {
        setStudentSearchInput("");
    }, [selectedVehicleId]);

    const filteredVehicles = useMemo(() => {
        const q = searchInput.trim().toLowerCase();
        if (!q) return vehicles;
        return vehicles.filter(
            (v) =>
                v.vehicleName.toLowerCase().includes(q) ||
                v.vehicleNumber.toLowerCase().includes(q) ||
                v.driverName.toLowerCase().includes(q)
        );
    }, [vehicles, searchInput]);

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
    // Fixed: API returns "Students" (capital S), not "Student".
    const selectedStudents = detail?.Students ?? [];

    const filteredStudents = useMemo(() => {
        const q = studentSearchInput.trim().toLowerCase();
        if (!q) return selectedStudents;
        return selectedStudents.filter(
            (s) =>
                s.studentName.toLowerCase().includes(q) ||
                s.admissionNumber.toLowerCase().includes(q) ||
                s.class.toLowerCase().includes(q) ||
                s.whatsappNumber.toLowerCase().includes(q)
        );
    }, [selectedStudents, studentSearchInput]);

    return (
        <section className="w-full px-6 py-4 space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 shrink-0"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                Vehicles
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Your fleet, at a glance
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search plate, name, or driver..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Body: vehicle list + detail */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] lg:h-[calc(90vh-180px)]">
                {/* Vehicle list — full height, scrolls internally if the list is long */}
                <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                    {isLoadingVehicles ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                            <p className="text-sm">Loading vehicles...</p>
                        </div>
                    ) : vehiclesError ? (
                        <div className="flex-1 py-16 text-center text-sm font-medium text-red-500">
                            {vehiclesError}
                        </div>
                    ) : filteredVehicles.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
                            <Bus className="h-7 w-7 text-slate-300" />
                            <p className="text-sm">No vehicles found.</p>
                        </div>
                    ) : (
                        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/50">
                            {filteredVehicles.map((v) => {
                                const isSelected = v.id === selectedVehicleId;

                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVehicleId(v.id)}
                                        className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors ${isSelected
                                                ? "border-[#556043] bg-[#556043]/10 dark:bg-[#556043]/20"
                                                : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                            }`}
                                    >
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isSelected
                                                    ? "bg-[#556043] text-white"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                }`}
                                        >
                                            {initials(v.vehicleName)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                {v.vehicleName}
                                            </span>
                                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                                {v.vehicleNumber}
                                            </span>
                                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                                {v.driverName}
                                            </span>
                                        </span>

                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 gap-1 font-medium ${v.totalStudents > 0
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                    : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                }`}
                                        >
                                            <Users className="h-3 w-3" />
                                            {v.totalStudents}
                                        </Badge>

                                        <ChevronRight
                                            className={`h-4 w-4 shrink-0 ${isSelected ? "text-[#556043]" : "text-slate-300"
                                                }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Detail panel — full height, table area scrolls internally */}
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    {!selectedVehicle ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
                            <Bus className="h-7 w-7 text-slate-300" />
                            <p className="text-sm">Please select a vehicle to see its students.</p>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col space-y-6">
                            {/* Vehicle header */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Vehicle
                                    </p>
                                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                        {selectedVehicle.vehicleName}
                                    </h2>
                                </div>
                               <div className="flex items-center gap-3">
                                 <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Search student, admission no, class..."
                                        value={studentSearchInput}
                                        onChange={(e) => setStudentSearchInput(e.target.value)}
                                        className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
                                    />
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#556043] text-white">
                                    <Bus className="h-5 w-5" />
                                </div>
                               </div>
                            </div>

                            {/* Student search */}


                            {/* Students table — only the selected vehicle's students */}
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800/50 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                                <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                                    #
                                                </TableHead>
                                                <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                                    Admission No.
                                                </TableHead>
                                                <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                                    Student Name
                                                </TableHead>
                                                <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                                    Class
                                                </TableHead>
                                                <TableHead className="px-4 h-11 text-white dark:text-foreground font-semibold whitespace-nowrap">
                                                    WhatsApp
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingDetail ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-32 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                                            <p className="text-sm">Loading students...</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : detailError ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={5}
                                                        className="h-32 text-center text-sm font-medium text-red-500"
                                                    >
                                                        {detailError}
                                                    </TableCell>
                                                </TableRow>
                                            ) : selectedStudents.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <Users className="h-7 w-7 text-slate-300" />
                                                            <p className="text-sm">No students assigned to this vehicle.</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredStudents.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <Search className="h-7 w-7 text-slate-300" />
                                                            <p className="text-sm">No students match your search.</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredStudents.map((s, i) => (
                                                    <TableRow
                                                        key={s.admissionNumber}
                                                        className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                                    >
                                                        <TableCell className="px-4 py-3 text-sm font-medium text-slate-500">
                                                            {i + 1}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                            {s.admissionNumber}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                            {s.studentName}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                            {s.class}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                            {s.whatsappNumber}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}