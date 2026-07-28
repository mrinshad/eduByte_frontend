"use client";
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Search,
  Loader2,
  Wallet,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
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

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full hover:text-red-600"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

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
    { label: "Action" },
  ];

  // Real Data, Loading & Error States
  const [students, setStudents] = useState<StudentFeeCollection[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)

  // Dynamic UI States
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");


  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  //fetch data
  useEffect(() => {
    async function fetchFeeCollection() {
      try {
        setLoading(true);

        const response = await getStudentFeeCollection({
          page: currentPage,
          limit: rowsPerPage,
          search,
          
          vehicle: vehicleFilter === "all" ? "" : vehicleFilter,
          status: statusFilter as "all" | "paid" | "pending",
        });

        setStudents(response.items);
        setPagination(response.pagination);

        setClassOptions((prev) =>
          Array.from(
            new Set([
              ...prev,
              ...response.items.map((i) => i.class).filter(Boolean),
            ])
          )
        );

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

  const hasActiveFilters = useMemo(
    () =>
     
      vehicleFilter !== "all" ||
      statusFilter !== "all" ||
      search.trim().length > 0,
    [ vehicleFilter, statusFilter, search]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    
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
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">

      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Left: Title */}
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

        {/* Right: Search + Filters — pushed to the right on desktop */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:ml-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search student..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700 w-full sm:w-[240px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
           

            {/* Vehicle */}
            <Select
              value={vehicleFilter}
              onValueChange={(value) => {
                setVehicleFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[140px] rounded-lg border-slate-300">
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
              <SelectTrigger className="h-10 w-[130px] rounded-lg border-slate-300">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-400">
            Filters:
          </span>

         

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
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                {tableHeader.map(({ label, hideOn }) => (
                  <TableHead
                    key={label}
                    className={`px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap ${hideOnClass(hideOn)} ${label === "Action" ? "text-right" : "text-left"}`}
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
                      <p className="text-sm">Loading students fee...</p>
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
                      <p className="text-sm">No fee records match your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
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
                    <TableCell className="px-4 sm:px-6 py-4 text-right">
                      <Button
                        size="sm"
                        className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        onClick={() => router.push(`/workspace/fee-management/collection/viewCollection?id=${student.enrollmentId}`)}
                      >
                        Collect
                      </Button>
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
      </div>

    </section>
  )
}