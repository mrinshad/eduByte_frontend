"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Receipt,
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

// Import your charges API function and type definition
import { getStudentCharges, StudentCharge } from "@/lib/services/studentCharges";

// Small helper so "undefined - undefined" class strings render cleanly
function formatClass(value: string) {
  if (!value || value.toLowerCase() === "undefined - undefined") return "—";
  return value;
}

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`;
}

const statusStyles: Record<string, string> = {
  NOT_GENERATED:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium",
  PAID:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium",
  PARTIAL:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 font-medium",
  PARTIALLY_PAID:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 font-medium",
  OVERDUE:
    "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300 font-semibold",
  PENDING:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 font-medium",
};

export default function StudentChargesListPage() {
  const router = useRouter();

  // Real Data, Loading & Error States
  const [charges, setCharges] = useState<StudentCharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic UI States
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch data on component mount
  useEffect(() => {
    async function fetchCharges() {
      try {
        setIsLoading(true);
        const data = await getStudentCharges();
        setCharges(data);
      } catch (err) {
        console.error("Failed to load student charges:", err);
        setError("Could not retrieve student charges. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCharges();
  }, []);

  // 1. Client-side filtering + automatic pagination reset on query mutation
  const filteredCharges = useMemo(() => {
    setCurrentPage(1); // Auto-fallback to page 1 during filter operations
    const query = search.toLowerCase();
    return charges.filter((charge) => {
      return (
        charge.student.toLowerCase().includes(query) ||
        charge.admissionNumber.toLowerCase().includes(query)
      );
    });
  }, [search, charges]);

  // 2. Compute dynamic pagination bounds
  const totalPages = Math.max(1, Math.ceil(filteredCharges.length / rowsPerPage));

  const paginatedCharges = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredCharges.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCharges, currentPage, rowsPerPage]);

  const entryMetrics = useMemo(() => {
    if (filteredCharges.length === 0) return { start: 0, end: 0 };
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, filteredCharges.length);
    return { start, end };
  }, [filteredCharges, currentPage, rowsPerPage]);

  return (
    <section className="w-full px-6 py-4 space-y-6">

      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-4">
            <Button
              className="bg-background text-foreground hover:opacity-90 shadow-sm"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white break-words">
                Fee Ledgers
              </h1>

              <p className="mt-1 text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400">
                View individual fee billing statements and balance ledgers per student.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search by name or admission no..."
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
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">
                  Final Amount
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">
                  Paid Amount
                </TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">
                  Balance
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
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Fetching student charges...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </TableCell>
                </TableRow>
              ) : paginatedCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No charges match your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCharges.map((charge) => {
                  const balance = (charge.finalAmount ?? 0) - (charge.paidAmount ?? 0);
                  return (
                    <TableRow
                      key={charge.admissionNumber}
                      className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                    >
                      <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">
                        {charge.admissionNumber}
                      </TableCell>

                      <TableCell className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {charge.student}
                      </TableCell>

                      <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatClass(charge.class)}
                      </TableCell>

                      <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-right">
                        {formatCurrency(charge.finalAmount)}
                      </TableCell>

                      <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-right">
                        {formatCurrency(charge.paidAmount)}
                      </TableCell>

                      <TableCell
                        className={`px-6 py-4 text-sm text-right font-semibold ${balance > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                          }`}
                      >
                        {formatCurrency(balance)}
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={statusStyles[charge.status] ?? statusStyles.PENDING}>
                          {charge.status ? charge.status.replace("_", " ") : "—"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PermissionGate permission="studentcharges.viewStudentChargesButton">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                            onClick={() =>

                              router.push(
                                `/workspace/student-charges/student-charges/View-student-charge?id=${charge.enrollmentId}`
                              )
                            }
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          </PermissionGate>


                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4 gap-4 dark:border-slate-800 dark:bg-slate-900/40">

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{entryMetrics.start}</span> to{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{entryMetrics.end}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{filteredCharges.length}</span> entries
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
                disabled={currentPage === 1 || totalPages === 0 || isLoading}
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