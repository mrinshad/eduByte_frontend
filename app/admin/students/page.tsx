"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Trash2, Plus,
  Eye, ChevronLeft, ChevronRight, Search, Loader2, Users,
  ArrowUpAZ, ArrowDownAZ, X, LogOut, Download, CalendarIcon,
} from "lucide-react";
import { exportToCsv, type CsvColumn } from "@/lib/utils/csvExport";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { getStudents, deleteStudent, type StudentListItem } from "@/lib/services/student";
import { getClasses, type SchoolClass } from "@/lib/services/class";
import { individualRelieveStudent } from "@/lib/services/studentRelieving";
import { PermissionGate } from "@/components/auth/PermissionGate";

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

const ADMISSION_STATUS_OPTIONS = [
  { value: "ADMITTED", label: "Admitted" },
  { value: "NOT_ADMITTED", label: "Not Admitted" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "WITHDRAWN", label: "Withdrawn" }
];

export default function Page() {
  const router = useRouter();

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [admissionFilter, setAdmissionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortByClass, setSortByClass] = useState(false); // ← off by default
  const [order, setOrder] = useState<"asc" | "desc">("asc"); // ← used only when sortByClass is true
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Full, unpaginated list of classes for the filter dropdown — fetched
  // once from the dedicated /api/classes endpoint, independent of the
  // (paginated) students table data.
  const [classOptions, setClassOptions] = useState<SchoolClass[]>([]);
  const [classOptionsLoading, setClassOptionsLoading] = useState(true);

  const [studentToDelete, setStudentToDelete] = useState<StudentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentToRelieve, setStudentToRelieve] = useState<StudentListItem | null>(null);
  const [isRelieving, setIsRelieving] = useState(false);
  const [relieveDate, setRelieveDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await getStudents({
        page: currentPage,
        limit: rowsPerPage,
        search,
        className: classFilter === "all" ? "" : classFilter,
        admissionStatus: admissionFilter === "all" ? "" : admissionFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        sortBy: sortByClass ? "className" : "admissionNumber",
        order: sortByClass ? order : "desc",
      });
      setStudents(response.data ?? []);
      setPagination(response.pagination);
    } catch (error) {
      console.error(error);
      setStudents([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  };

  const loadClassOptions = async () => {
    try {
      setClassOptionsLoading(true);
      const classes = await getClasses();
      setClassOptions(classes);
    } catch (error) {
      console.error(error);
      setClassOptions([]);
    } finally {
      setClassOptionsLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudent(studentToDelete.id);
      toast.success("Student deleted successfully");
      setStudentToDelete(null);

      // If this was the last row on the page, step back a page — otherwise
      // just reload the current page.
      if (students.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadStudents();
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRelieveStudent = async () => {
    if (!studentToRelieve) return;

    try {
      setIsRelieving(true);
      const targetId = studentToRelieve.enrollmentId || studentToRelieve.id;
      await individualRelieveStudent(targetId, { relievedDate: relieveDate });
      toast.success(`Successfully relieved ${studentToRelieve.studentName} as COMPLETED.`);
      setStudentToRelieve(null);
      await loadStudents();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to relieve student");
    } finally {
      setIsRelieving(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch the full class list once on mount — not tied to pagination/search,
  // so the dropdown always shows every class, not just whatever is on the
  // current table page.
  useEffect(() => {
    loadClassOptions();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [
    currentPage,
    rowsPerPage,
    search,
    classFilter,
    admissionFilter,
    statusFilter,
    sortByClass,
    order,
  ]);

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const startEntry = pagination.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = pagination.total === 0 ? 0 : Math.min(currentPage * rowsPerPage, pagination.total);

  const handleClassSortClick = () => {
    if (!sortByClass) {
      setSortByClass(true);
      setOrder("asc");
    } else {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    }
    setCurrentPage(1);
  };

  const availableAdmissionOptions = useMemo(() => {
    if (classFilter !== "all") {
      return ADMISSION_STATUS_OPTIONS.filter((opt) => opt.value !== "NOT_ADMITTED");
    }
    return ADMISSION_STATUS_OPTIONS;
  }, [classFilter]);

  const hasActiveFilters = useMemo(
    () =>
      classFilter !== "all" ||
      admissionFilter !== "all" ||
      statusFilter !== "all" ||
      search.trim().length > 0,
    [classFilter, admissionFilter, statusFilter, search]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setClassFilter("all");
    setAdmissionFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await getStudents({
        page: 1,
        limit: 10000,
        search,
        className: classFilter !== "all" ? classFilter : "",
        admissionStatus: admissionFilter !== "all" ? admissionFilter : "",
        status: statusFilter !== "all" ? statusFilter : "",
        sortBy: sortByClass ? "className" : "admissionNumber",
        order,
      });

      const studentList = res?.data || [];
      if (!studentList.length) {
        toast.info("No student records found to export.");
        return;
      }

      const columns: CsvColumn<StudentListItem>[] = [
        { header: "Admission No", accessor: (s) => s.admissionNumber || "" },
        { header: "Student Name", accessor: (s) => s.studentName || "" },
        { header: "Gender", accessor: (s) => s.gender || "" },
        { header: "Class", accessor: (s) => s.className || "-" },
        { header: "Division", accessor: (s) => s.divisionName || "-" },
        {
          header: "Admission Status",
          accessor: (s) => (s.admissionStatus === "ADMITTED" ? "Admitted" : "Not Admitted"),
        },
        { header: "Student Status", accessor: (s) => s.status || "" },
        {
          header: "Date of Birth",
          accessor: (s) => (s.dob ? new Date(s.dob).toLocaleDateString() : "-"),
        },
        { header: "Blood Group", accessor: (s) => s.bloodGroup || "-" },
        { header: "Place", accessor: (s) => s.place || "-" },
        { header: "Father Name", accessor: (s) => s.fatherName || "-" },
        { header: "Father Mobile", accessor: (s) => s.fatherMobile || "-" },
        { header: "Mother Name", accessor: (s) => s.motherName || "-" },
        { header: "Mother Mobile", accessor: (s) => s.motherMobile || "-" },
        { header: "WhatsApp Number", accessor: (s) => s.whatsappNumber || "-" },
        { header: "Address", accessor: (s) => s.address || "-" },
      ];

      const success = exportToCsv({
        filename: "students_roster",
        columns,
        data: studentList,
      });

      if (success) {
        toast.success(`Exported ${studentList.length} student records successfully.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to export student records");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">

      {/* ── Header & Actions ── */}
      <div className="flex flex-col gap-4">
        {/* Top row: title (left) + Search + Create Student button (right) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Student Directory
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                View and manage student records, enrollment details, and academic information.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
              <Input
                placeholder="Search students..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <Button
              variant="outline"
              className="w-full sm:w-auto shrink-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              onClick={handleExportCsv}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>

            <PermissionGate permission="students.createStudentButton">
              <Button
                className="w-full sm:w-auto shrink-0 bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                onClick={() => router.push("/admin/students/createStudent")}
              >
                <Plus className="h-4 w-4 mr-2 text-white dark:text-slate-900" />
                Create Student
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Second row: filters, right-aligned below the search/button row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full flex-wrap sm:justify-end">
          {/* 👇 Class filter dropdown — populated from /api/classes, not the paginated table */}
          <Select
            value={classFilter}
            disabled={admissionFilter === "NOT_ADMITTED"}
            onValueChange={(value) => {
              setClassFilter(value);
              if (value !== "all" && admissionFilter === "NOT_ADMITTED") {
                setAdmissionFilter("all");
              }
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[140px] rounded-lg border-slate-300 shrink-0">
              <SelectValue placeholder={classOptionsLoading ? "Loading..." : "All Classes"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classOptions.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 👇 Admission status filter */}
          <Select
            value={admissionFilter}
            onValueChange={(value) => {
              setAdmissionFilter(value);
              if (value === "NOT_ADMITTED") {
                setClassFilter("all");
              }
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[150px] rounded-lg border-slate-300 shrink-0">
              <SelectValue placeholder="Admission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Admission</SelectItem>
              {availableAdmissionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 👇 Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[140px] rounded-lg border-slate-300 shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
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
            <FilterChip label={`Class: ${classFilter}`} onRemove={() => { setClassFilter("all"); setCurrentPage(1); }} />
          )}
          {admissionFilter !== "all" && (
            <FilterChip
              label={`Admission: ${admissionFilter === "ADMITTED" ? "Admitted" : "Not Admitted"}`}
              onRemove={() => { setAdmissionFilter("all"); setCurrentPage(1); }}
            />
          )}
          {statusFilter !== "all" && (
            <FilterChip
              label={`Status: ${statusFilter === "ACTIVE" ? "Active" : statusFilter === "WITHDRAWN" ? "Withdrawn" : statusFilter}`}
              onRemove={() => { setStatusFilter("all"); setCurrentPage(1); }}
            />
          )}
          {search.trim() && (
            <FilterChip
              label={`Search: ${search}`}
              onRemove={() => { setSearchInput(""); setSearch(""); setCurrentPage(1); }}
            />
          )}
        </div>
      )}

      {/* ── Data Table Container ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  ID
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Student Name
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  WhatsApp Number
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Place & Address
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Class | Division
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Admission
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
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Loading students...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No students found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, index) => (
                  <TableRow
                    key={student.id}
                    className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                  >
                    <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">
                      {startEntry + index}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {student.studentName}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {student.whatsappNumber}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-[200px]">
                      {student.place ? (
                        <div>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{student.place}</span>
                          {student.address && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate" title={student.address}>
                              {student.address}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="truncate block" title={student.address || "—"}>
                          {student.address || "—"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {(student.className || "-") + " | " + (student.divisionName || "-")}
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          student.admissionStatus === "ADMITTED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 font-medium"
                        }
                      >
                        {student.admissionStatus || "NOT_ADMITTED"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          student.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                            : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 font-medium"
                        }
                      >
                        {student.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <PermissionGate permission="students.editStudentButton">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                            onClick={() => router.push(`/admin/students/createStudent?id=${student.id}`)}
                            title="Edit Student"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="students.viewStudentButton">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                            onClick={() => router.push(`/admin/students/viewStudent?id=${student.id}`)}
                            title="View Student"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        {student.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            title="Relieve Student"
                            onClick={() => setStudentToRelieve(student)}
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                        <PermissionGate permission="students.deleteStudentButton">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete Student"
                            onClick={() => setStudentToDelete(student)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* ── Pagination ── */}
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
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 text-white dark:text-foreground" />
                Prev
              </Button>

              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[4rem] text-center">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pr-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 text-white dark:text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Relieve Student Confirmation Dialog */}
      <AlertDialog open={!!studentToRelieve} onOpenChange={(open) => !open && setStudentToRelieve(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-amber-100" />
              Relieve Student
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-slate-300 dark:text-slate-300">
                <p>
                  Are you sure you want to relieve <strong>{studentToRelieve?.studentName}</strong> ({studentToRelieve?.admissionNumber})?
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 dark:text-slate-300">
                    Relieving Date:
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full h-10 justify-start text-left font-normal text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 px-3",
                          !relieveDate && "text-slate-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {relieveDate ? format(new Date(`${relieveDate}T00:00:00`), "dd MMM yyyy") : "Pick relieving date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={relieveDate ? new Date(`${relieveDate}T00:00:00`) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setRelieveDate(format(date, "yyyy-MM-dd"));
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="rounded-lg bg-slate-100 p-3 text-slate-900 dark:text-slate-200 text-xs dark:bg-slate-800/60 space-y-1">
                  <p>• Enrollment status will transition to <strong>COMPLETED</strong>.</p>
                  <p>• Student master status will transition to <strong>WITHDRAWN</strong>.</p>
                  <p>• Recurring charge templates and vehicle assignments will be deactivated.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRelieving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRelieving}
              onClick={(e) => {
                e.preventDefault();
                void handleRelieveStudent();
              }}
              className="bg-[#556043] "
            >
              {isRelieving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Relieving...
                </>
              ) : (
                "Confirm Relieve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(studentToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setStudentToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{studentToDelete?.studentName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this student record. This can't be undone, and it will
              fail if the student has associated fee, admission, or academic records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteStudent();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}