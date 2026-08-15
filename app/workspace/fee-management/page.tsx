"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Search,
  Loader2,
  Wallet,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getStudentFeeCollection, type StudentFeeCollection } from "@/lib/services/feeCollection";
import { getClasses, type SchoolClass } from "@/lib/services/class";
import { getDivisions, type Division } from "@/lib/services/division";
import { formatCurrency } from "@/lib/utils";

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

export default function FeeCollectionPage() {
  const router = useRouter();

  // Table headers
  const tableHeader: { label: string; hideOn?: "sm" | "md" }[] = [
    { label: "Admission No" },
    { label: "Name" },
    { label: "Class & Division", hideOn: "sm" },
    { label: "Vehicle", hideOn: "md" },
    { label: "Total Due" },
    { label: "Status" },
    { label: "Action" },
  ];

  // Real Data, Loading & Error States
  const [students, setStudents] = useState<StudentFeeCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter Master Options
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);

  // Filter States
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Classes on mount
  useEffect(() => {
    async function loadClassOptions() {
      try {
        const clsList = await getClasses();
        setClasses(clsList);
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    }
    loadClassOptions();
  }, []);

  // Load Divisions when classFilter changes
  useEffect(() => {
    async function loadDivisionOptions() {
      if (classFilter === "all") {
        setDivisions([]);
        setDivisionFilter("all");
        return;
      }
      try {
        const divList = await getDivisions(classFilter);
        setDivisions(divList);
      } catch (err) {
        console.error("Failed to load divisions", err);
        setDivisions([]);
      }
    }
    loadDivisionOptions();
  }, [classFilter]);

  // Fetch Fee Collection Data
  useEffect(() => {
    async function fetchFeeCollection() {
      try {
        setLoading(true);
        setError(null);

        const response = await getStudentFeeCollection({
          page: currentPage,
          limit: rowsPerPage,
          search,
          classId: classFilter === "all" ? undefined : classFilter,
          divisionId: divisionFilter === "all" ? undefined : divisionFilter,
          vehicle: vehicleFilter === "all" ? "" : vehicleFilter,
          status: statusFilter,
        });

        setStudents(response.items);
        setPagination(response.pagination);

        setVehicleOptions((prev) =>
          Array.from(
            new Set([
              ...prev,
              ...response.items.map((i) => i.vehicle).filter(Boolean),
            ])
          )
        );
      } catch (err) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchFeeCollection();
  }, [
    currentPage,
    rowsPerPage,
    search,
    classFilter,
    divisionFilter,
    vehicleFilter,
    statusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerPage]);

  const totalPages = Math.max(1, pagination.totalPages || 1);

  const start =
    pagination.total === 0
      ? 0
      : (currentPage - 1) * rowsPerPage + 1;

  const end =
    pagination.total === 0
      ? 0
      : Math.min(currentPage * rowsPerPage, pagination.total);

  const selectedClassName = useMemo(() => {
    if (classFilter === "all") return "";
    return classes.find((c) => c.id === classFilter)?.name || classFilter;
  }, [classFilter, classes]);

  const selectedDivisionName = useMemo(() => {
    if (divisionFilter === "all") return "";
    return divisions.find((d) => d.id === divisionFilter)?.name || divisionFilter;
  }, [divisionFilter, divisions]);

  const hasActiveFilters = useMemo(
    () =>
      classFilter !== "all" ||
      divisionFilter !== "all" ||
      vehicleFilter !== "all" ||
      statusFilter !== "all" ||
      search.trim().length > 0,
    [classFilter, divisionFilter, vehicleFilter, statusFilter, search]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setClassFilter("all");
    setDivisionFilter("all");
    setVehicleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hideOnClass = (hideOn?: "sm" | "md") => {
    if (hideOn === "sm") return "hidden sm:table-cell";
    if (hideOn === "md") return "hidden md:table-cell";
    return "";
  };

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
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Fee Collection
              </h1>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                Collect student payments, record fee receipts, and view payment history.
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
            placeholder="Search student, admission no..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-lg pl-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <Select
            value={classFilter}
            onValueChange={(value) => {
              setClassFilter(value);
              setDivisionFilter("all");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[140px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Division Filter */}
          <Select
            value={divisionFilter}
            onValueChange={(value) => {
              setDivisionFilter(value);
              setCurrentPage(1);
            }}
            disabled={classFilter === "all" || divisions.length === 0}
          >
            <SelectTrigger className="h-10 w-full sm:w-[130px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-50">
              <SelectValue placeholder={classFilter === "all" ? "Divisions" : "All Divisions"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map((div) => (
                <SelectItem key={div.id} value={div.id}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Vehicle */}
          <Select
            value={vehicleFilter}
            onValueChange={(value) => {
              setVehicleFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[130px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium">
              <SelectValue placeholder="All Vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicleOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[130px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="NOT_GENERATED">Not Generated</SelectItem>
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

          {classFilter !== "all" && (
            <FilterChip
              label={`Class: ${selectedClassName}`}
              onRemove={() => {
                setClassFilter("all");
                setDivisionFilter("all");
                setCurrentPage(1);
              }}
            />
          )}

          {divisionFilter !== "all" && (
            <FilterChip
              label={`Division: ${selectedDivisionName}`}
              onRemove={() => {
                setDivisionFilter("all");
                setCurrentPage(1);
              }}
            />
          )}

          {vehicleFilter !== "all" && (
            <FilterChip
              label={`Vehicle: ${vehicleFilter}`}
              onRemove={() => {
                setVehicleFilter("all");
                setCurrentPage(1);
              }}
            />
          )}

          {statusFilter !== "all" && (
            <FilterChip
              label={`Status: ${statusFilter}`}
              onRemove={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            />
          )}

          {search.trim() && (
            <FilterChip
              label={`Search: ${search}`}
              onRemove={() => {
                setSearch("");
                setSearchInput("");
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      )}

      {/* ── Data Table Container ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[720px]">
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                {tableHeader.map(({ label, hideOn }) => (
                  <TableHead
                    key={label}
                    className={`px-4 sm:px-6 h-11 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 whitespace-nowrap ${hideOnClass(hideOn)} ${label === "Action" ? "text-right" : "text-left"}`}
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Loading student fees...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No fee records match your search criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.enrollmentId} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 font-medium">
                    <TableCell className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {student.admissionNumber || "-"}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {student.student || "-"}
                    </TableCell>
                    <TableCell className={`px-4 sm:px-6 py-4 text-sm ${hideOnClass("sm")}`}>
                      {student.className ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{student.className}</span>
                          {student.divisionName && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 font-semibold bg-slate-50 dark:bg-slate-800">
                              {student.divisionName}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">{student.class || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell className={`px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 ${hideOnClass("md")}`}>
                      {student.vehicle || "-"}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(student.TotalDue)}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4">
                      {student.status === "NOT_GENERATED" ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Not Generated
                        </span>
                      ) : student.status === "PAID" || (student.TotalDue === 0 && student.status !== "PENDING" && student.status !== "PARTIAL") ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Paid
                        </span>
                      ) : student.status === "PARTIAL" ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                          Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-right">
                      <PermissionGate permission="feecollection.collectButton">
                        <Button
                          size="sm"
                          className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-medium"
                          onClick={() => router.push(`/workspace/fee-management/viewCollection?id=${student.enrollmentId}`)}
                        >
                          Collect
                        </Button>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 sm:px-6 py-4 gap-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm text-slate-500 dark:text-slate-400 order-2 sm:order-1">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{start}</span> to{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{end}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> entries
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 sm:justify-end order-1 sm:order-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[oklch(0.46_0.04_125)] focus:ring-1 focus:ring-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}