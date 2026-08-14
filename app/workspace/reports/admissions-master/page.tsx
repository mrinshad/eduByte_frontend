"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Eye,
    GraduationCap,
    Loader2,
    RefreshCcw,
    Search,
    Users,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getAdmissionsMasterReport,
    type AdmissionsMasterReportResponse,
} from "@/lib/services/incomeReports";
import { getClasses, type SchoolClass } from "@/lib/services/class";

function formatDate(isoStr?: string | null) {
    if (!isoStr) return "-";
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
        PROMOTED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400",
        COMPLETED: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400",
        WITHDRAWN: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
    };
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] ?? "border-slate-200 bg-slate-100 text-slate-700"}`}>
            {status}
        </span>
    );
}

export default function AdmissionsMasterReportPage() {
    const router = useRouter();

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [classes, setClasses] = useState<SchoolClass[]>([]);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [report, setReport] = useState<AdmissionsMasterReportResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Load classes for filter dropdown
    useEffect(() => {
        getClasses()
            .then(setClasses)
            .catch(() => {});
    }, []);

    // Load report data
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAdmissionsMasterReport({
                    page,
                    limit,
                    search,
                    classId: classFilter === "all" ? undefined : classFilter,
                    status: statusFilter === "all" ? undefined : statusFilter,
                });
                if (!cancelled) setReport(data);
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load admissions master report.");
                    setReport(null);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [page, limit, search, classFilter, statusFilter]);

    const items = report?.items ?? [];
    const summary = report?.summary ?? { totalAdmissions: 0, activeEnrollments: 0 };
    const pagination = report?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };

    const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const end = pagination.total === 0 ? 0 : Math.min(pagination.page * pagination.limit, pagination.total);

    const hasActiveFilters = useMemo(
        () => classFilter !== "all" || statusFilter !== "all" || search.length > 0,
        [classFilter, statusFilter, search]
    );

    const clearAllFilters = () => {
        setSearchInput("");
        setSearch("");
        setClassFilter("all");
        setStatusFilter("all");
        setPage(1);
    };

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6">
            {/* Header */}
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
                                Admissions Master Roster
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Complete master record of enrolled students, contacts, transport, and fee allocations.
                            </p>
                        </div>
                    </div>

                    <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 shrink-0 self-end border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white sm:self-auto"
                        onClick={() => setPage((p) => p)}
                        disabled={isLoading}
                    >
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#556043]/10 text-[#556043] dark:bg-slate-800 dark:text-slate-200">
                            <GraduationCap className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                                {summary.totalAdmissions.toLocaleString()}
                            </p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total Admissions
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                                {summary.activeEnrollments.toLocaleString()}
                            </p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Active Students
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search student, adm no, mobile..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-10 w-full rounded-lg pl-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={classFilter}
                        onValueChange={(v) => {
                            setClassFilter(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[150px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                            <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-10 w-full sm:w-[150px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PROMOTED">Promoted</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
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

            {/* Table Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="w-full min-w-[900px] text-sm">
                        <TableHeader>
                            <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Adm #</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Student Name</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Class & Div</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Parent Contact</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Transport</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Fee Structure</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Status</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap">Adm Date</TableHead>
                                <TableHead className="px-4 py-3 text-white font-semibold whitespace-nowrap text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-44 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                            <p className="text-sm">Loading admissions master report...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-44 text-center text-red-500">
                                        <p className="text-sm font-medium">{error}</p>
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-44 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <GraduationCap className="h-8 w-8 text-slate-300" />
                                            <p className="text-sm">No student records match your criteria.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.enrollmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                        <TableCell className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                            {item.admissionNumber}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 font-medium text-slate-950 dark:text-white whitespace-nowrap">
                                            {item.studentName}
                                            <span className="ml-1.5 text-xs text-slate-400">({item.gender.charAt(0)})</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            {item.className}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            <div>{item.fatherName}</div>
                                            <div className="text-slate-400">{item.fatherMobile !== "-" ? item.fatherMobile : item.whatsappNumber}</div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {item.assignedVehicle}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {item.feeStructure}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 whitespace-nowrap">
                                            <StatusBadge status={item.enrollmentStatus} />
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {formatDate(item.admissionDate)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-[#556043] hover:text-[#4a533b] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:bg-slate-800"
                                                onClick={() => router.push(`/admin/admissions/viewAdmission/${item.enrollmentId}`)}
                                                title="View Admission Details"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {items.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800/50 sm:px-5 gap-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Showing <span className="font-semibold text-slate-900 dark:text-white">{start}</span> to{" "}
                            <span className="font-semibold text-slate-900 dark:text-white">{end}</span> of{" "}
                            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> entries
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>Rows per page:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#556043] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={pagination.page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
