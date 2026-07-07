"use client";
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Search, Loader2, Wallet, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getStudentFeeCollection, type studentFeeCollection } from "@/lib/services/feeCollection";

export default function FeeCollectionPage() {

  const router = useRouter();

  // Table headers. `hideOn` marks columns that collapse on narrower breakpoints
  // to keep the table readable without needing to shrink text below the standard size.
  const tableHeader: { label: string; hideOn?: "sm" | "md" }[] = [
    { label: "Admission No" },
    { label: "Name" },
    { label: "Class", hideOn: "sm" },
    { label: "Vehicle", hideOn: "md" },
    { label: "Total Due" },
    { label: "Status" },
  ];

  // Real Data, Loading & Error States
  const [students, setStudents] = useState<studentFeeCollection[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)

  // Dynamic UI States
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  //fetch data
  useEffect(() => {
    async function fetchFeeCollection() {
      try {
        setLoading(true);
        const data = await getStudentFeeCollection();
        setStudents(data);
      } catch (err) {
        console.error("Fee Collection API Error:", err);

        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchFeeCollection();
  }, []);

  // Client-side filtering, resets to page 1 whenever the query or dataset changes
  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return students;

    return students.filter((student) => {
      const admissionNumber = student.admissionNumber || "";
      const name = student.student || "";
      const studentClass = student.class || "";
      const vehicle = student.vehicle || "";

      return (
        admissionNumber.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query) ||
        studentClass.toLowerCase().includes(query) ||
        vehicle.toLowerCase().includes(query)
      );
    });
  }, [search, students]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredStudents.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredStudents, currentPage, rowsPerPage]);

  const entryMetrics = useMemo(() => {
    if (filteredStudents.length === 0) return { start: 0, end: 0 };
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, filteredStudents.length);
    return { start, end };
  }, [filteredStudents, currentPage, rowsPerPage]);

  const hideOnClass = (hideOn?: "sm" | "md") => {
    if (hideOn === "sm") return "hidden sm:table-cell";
    if (hideOn === "md") return "hidden md:table-cell";
    return "";
  };

  const hasData = !loading && !error && filteredStudents.length > 0;

  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">

      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Fee Collection
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              View and manage student fee collection.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search by name, admission no, class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[oklch(0.46_0.04_125)] focus-visible:border-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

        </div>
      </div>

      {/* ── Data Table Container ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[720px]">
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                {tableHeader.map(({ label, hideOn }) => (
                  <TableHead
                    key={label}
                    className={`px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap ${hideOnClass(hideOn)} text-left`}
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Loading students fee...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No fee records match your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student) => (
                  <TableRow key={student.enrollmentId} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-500">
                      {student.admissionNumber || "-"}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {student.student || "-"}
                    </TableCell>
                    <TableCell className={`px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 ${hideOnClass("sm")}`}>
                      {student.class || "-"}
                    </TableCell>
                    <TableCell className={`px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 ${hideOnClass("md")}`}>
                      {student.vehicle || "-"}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      {student.TotalDue}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4">
                      {student.TotalDue === 0 ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                          Pending
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination (hidden when there's no data) ── */}
        {hasData && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 sm:px-6 py-4 gap-4 dark:border-slate-800 dark:bg-slate-900/40">

            <p className="text-sm text-slate-500 dark:text-slate-400 order-2 sm:order-1">
              Showing <span className="font-semibold text-slate-900 dark:text-white">{entryMetrics.start}</span> to{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{entryMetrics.end}</span> of{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{filteredStudents.length}</span> entries
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
                </select>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
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
                  Page {totalPages === 0 ? 0 : currentPage}
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
        )}
      </div>

    </section>
  )
}