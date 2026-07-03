"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ArrowLeft
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

// Import your new API function and Type definition
import { getStudentAdmissions, BackendAdmission } from "@/lib/services/admissions";

export default function StudentAdmissionListPage() {
  const router = useRouter();

  // Real Data, Loading & Error States
  const [students, setStudents] = useState<BackendAdmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic UI States
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function fetchAdmissions() {
      try {
        setIsLoading(true);
        const response = await getStudentAdmissions({
          page: currentPage,
          limit: rowsPerPage,
          search,
        });
        setStudents(response.items);
        setPagination(response.pagination);
      } catch (err) {
        console.error("Failed to load admissions:", err);
        setError("Could not retrieve student admissions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAdmissions();
  }, [currentPage, rowsPerPage, search]);

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const startEntry = pagination.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = pagination.total === 0 ? 0 : Math.min(currentPage * rowsPerPage, pagination.total);

  return (
    <section className="w-full px-6 py-4 space-y-6">

      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"

            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Student Admissions
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Manage and view all enrolled students.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Enhanced High-Visibility Search Bar */}
          <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search by name, ID, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[oklch(0.46_0.04_125)] focus-visible:border-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <Button
            className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={() => router.push('/admin/admissions/createAdmission')}
          >
            <Plus className="h-4 w-4 mr-2 text-white dark:text-slate-900" />
            New Admission
          </Button>
        </div>
      </div>

      {/* ── Data Table Container ── */}
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
              {isLoading ? (
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
                  <TableRow key={student.id} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">

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
                      {student.vehicleName ? `${student.vehicleName}${student.vehicleNumber ? ` (${student.vehicleNumber})` : ""}` : "-"}
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
                            : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 font-medium"
                        }
                      >
                        {student.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
                          onClick={() => router.push(`/admin/admissions/viewAdmission?id=${student.id}`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
                          onClick={() => router.push(`/admin/admissions/createAdmission?id=${student.id}`)}
                          title="Edit Student"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete Student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Premium Pagination ── */}
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0 || isLoading}
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0 || isLoading}
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