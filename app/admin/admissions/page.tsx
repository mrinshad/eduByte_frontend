"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Plus,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStudentAdmissions, type BackendAdmission } from "@/lib/services/admissions";
import { getClasses, type SchoolClass } from "@/lib/services/class";
import { getFeeStructures, type FeeStructureSummary } from "@/lib/services/feeStructure";
import { useCurrentAcademicYear } from "@/lib/academic-year-store";

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {label}
      <button onClick={onRemove} className="rounded-full hover:text-red-600">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function StudentAdmissionListPage() {
  const router = useRouter();
  const currentAcademicYear = useCurrentAcademicYear();

  const [students, setStudents] = useState<BackendAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [feeStructureFilter, setFeeStructureFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });

  const [classOptions, setClassOptions] = useState<SchoolClass[]>([]);
  const [classOptionsLoading, setClassOptionsLoading] = useState(true);
  const [feeStructureOptions, setFeeStructureOptions] = useState<FeeStructureSummary[]>([]);
  const [feeStructureOptionsLoading, setFeeStructureOptionsLoading] = useState(true);

  const loadClassOptions = async () => {
    try {
      setClassOptionsLoading(true);
      const classes = await getClasses();
      setClassOptions(classes);
    } catch (error) {
      console.error("Failed to load classes:", error);
      setClassOptions([]);
    } finally {
      setClassOptionsLoading(false);
    }
  };

  const loadFeeStructureOptions = async () => {
    try {
      setFeeStructureOptionsLoading(true);
      const feeStructures = await getFeeStructures({
        page: 1,
        limit: 500,
        academicYear: currentAcademicYear !== "Academic Year" ? currentAcademicYear : undefined
      });
      setFeeStructureOptions(feeStructures.items);
    } catch (error) {
      console.error("Failed to load fee structures:", error);
      setFeeStructureOptions([]);
    } finally {
      setFeeStructureOptionsLoading(false);
    }
  };

  useEffect(() => {
    loadClassOptions();
    loadFeeStructureOptions();
  }, [currentAcademicYear]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    async function fetchAdmissions() {
      try {
        setLoading(true);
        setError(null);
        const response = await getStudentAdmissions({
          page: currentPage,
          limit: rowsPerPage,
          search,
          className: classFilter === "all" ? "" : classFilter,
          feeStructure: feeStructureFilter === "all" ? "" : feeStructureFilter,
          academicYear: currentAcademicYear !== "Academic Year" ? currentAcademicYear : undefined,
        });
        if (!active) return;

        setStudents(Array.isArray(response.items) ? response.items : []);
        setPagination({
          page: response.pagination?.page ?? currentPage,
          limit: response.pagination?.limit ?? rowsPerPage,
          total: response.pagination?.total ?? 0,
          totalPages: response.pagination?.totalPages ?? 1,
        });
      } catch (err) {
        if (!active) return;
        console.error("Failed to load admissions:", err);
        setStudents([]);
        setPagination({
          page: currentPage,
          limit: rowsPerPage,
          total: 0,
          totalPages: 1,
        });
        setError("Could not retrieve student admissions. Please try again.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchAdmissions();

    return () => {
      active = false;
    };
  }, [currentPage, rowsPerPage, search, classFilter, feeStructureFilter, currentAcademicYear]);

  const filteredClassOptions = useMemo(() => {
    if (feeStructureFilter !== "all") {
      const selectedFee = feeStructureOptions.find((f) => f.name === feeStructureFilter);
      if (selectedFee) {
        return classOptions.filter(
          (c) => c.name === selectedFee.className || c.id === selectedFee.classId
        );
      }
    }
    return classOptions;
  }, [feeStructureFilter, feeStructureOptions, classOptions]);

  const filteredFeeStructureOptions = useMemo(() => {
    if (classFilter !== "all") {
      const selectedClass = classOptions.find((c) => c.name === classFilter);
      return feeStructureOptions.filter(
        (f) =>
          f.className === classFilter ||
          (selectedClass && f.classId === selectedClass.id)
      );
    }
    return feeStructureOptions;
  }, [classFilter, classOptions, feeStructureOptions]);

  const hasActiveFilters = useMemo(
    () =>
      classFilter !== "all" ||
      feeStructureFilter !== "all" ||
      search.trim().length > 0,
    [classFilter, feeStructureFilter, search]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setClassFilter("all");
    setFeeStructureFilter("all");
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const startEntry = pagination.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = pagination.total === 0 ? 0 : Math.min(currentPage * rowsPerPage, pagination.total);

  return (
    <section className="w-full px-6 py-4 space-y-6">
      {/* ── Header & Actions ── */}
      <div className="flex flex-col gap-4">
        {/* Top row: title (left) + Search + New Admission button (right) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0">
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Admissions
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Process new student admissions, manage enrollments, and assign fee structures.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
              <Input
                placeholder="Search by name, ID, or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[oklch(0.46_0.04_125)] focus-visible:border-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <PermissionGate permission="admissions.newAdmissionButton">
            <Button
              className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={() => router.push("/admin/admissions/createAdmission")}
            >
              <Plus className="h-4 w-4 mr-2 text-white dark:text-slate-900" />
              New Admission
            </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Second row: filters, right-aligned below the search/button row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full flex-wrap sm:justify-end">
          {/* 👇 Class filter dropdown */}
          <Select
            value={classFilter}
            onValueChange={(value) => {
              setClassFilter(value);
              if (value !== "all" && feeStructureFilter !== "all") {
                const selectedFee = feeStructureOptions.find((f) => f.name === feeStructureFilter);
                const selectedClass = classOptions.find((c) => c.name === value);
                const matches =
                  selectedFee &&
                  (selectedFee.className === value ||
                    (selectedClass && selectedFee.classId === selectedClass.id));
                if (!matches) {
                  setFeeStructureFilter("all");
                }
              }
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[160px] rounded-lg border-slate-300 shrink-0">
              <SelectValue placeholder={classOptionsLoading ? "Loading..." : "All Classes"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {filteredClassOptions.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 👇 Fee Structure filter dropdown */}
          <Select
            value={feeStructureFilter}
            onValueChange={(value) => {
              setFeeStructureFilter(value);
              if (value !== "all" && classFilter !== "all") {
                const selectedFee = feeStructureOptions.find((f) => f.name === value);
                const selectedClass = classOptions.find((c) => c.name === classFilter);
                const matches =
                  selectedFee &&
                  (selectedFee.className === classFilter ||
                    (selectedClass && selectedFee.classId === selectedClass.id));
                if (!matches) {
                  setClassFilter("all");
                }
              }
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[220px] rounded-lg border-slate-300 shrink-0">
              <SelectValue placeholder={feeStructureOptionsLoading ? "Loading..." : "All Fee Structures"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fee Structures</SelectItem>
              {filteredFeeStructureOptions.map((f) => (
                <SelectItem key={f.id} value={f.name}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-full sm:w-auto text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/30 shrink-0"
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
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-xs font-medium text-slate-400">Filters:</span>
          {classFilter !== "all" && (
            <FilterChip
              label={`Class: ${classFilter}`}
              onRemove={() => {
                setClassFilter("all");
                setCurrentPage(1);
              }}
            />
          )}
          {feeStructureFilter !== "all" && (
            <FilterChip
              label={`Fee Structure: ${feeStructureFilter}`}
              onRemove={() => {
                setFeeStructureFilter("all");
                setCurrentPage(1);
              }}
            />
          )}
          {search.trim() && (
            <FilterChip
              label={`Search: ${search}`}
              onRemove={() => {
                setSearchInput("");
                setSearch("");
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Admission No.
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Student Name
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Class & Div
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Parent Contact
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Vehicle
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Fee Structure
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[oklch(0.46_0.04_125)]" />
                      <p className="text-sm">Fetching student records...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <GraduationCap className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No student allocation matches your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow
                    key={student.id}
                    className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                  >
                    <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">
                      {student.admissionNumber || student.rollNumber || `REF-${student.id.slice(0, 5)}`}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {student.studentName || `ID: ${student.studentId.slice(0, 8)}`}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {student.class || student.classId.slice(0, 6)}
                      <span className="text-slate-300 mx-1.5 dark:text-slate-700">|</span>
                      {student.division || student.divisionId.slice(0, 6)}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {student.fatherName || "—"}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5">
                          {student.fatherMobile || "No contact info"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {student.vehicleName || "-"}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {student.feeStructureName || "-"}
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          student.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                            : student.status === "WITHDRAWN"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 font-medium"
                            : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 font-medium"
                        }
                      >
                        {student.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <PermissionGate permission="admissions.editAdmissionButton">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
                            onClick={() => router.push(`/admin/admissions/createAdmission?id=${student.id}`)}
                            title="Edit Admission"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="admissions.viewAdmissionButton">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
                            onClick={() => router.push(`/admin/admissions/viewAdmission?id=${student.id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4 gap-4 dark:border-slate-800 dark:bg-slate-900/40">

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{startEntry}</span> to{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{endEntry}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> entries
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-end">

            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[oklch(0.46_0.04_125)] focus:ring-1 focus:ring-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0 || loading}
              >

                <ChevronLeft className="h-4 w-4 text-white dark:text-foreground" />
                Prev
              </Button>

              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[4rem] text-center">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0 || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 text-white dark:text-foreground" />
              </Button>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}