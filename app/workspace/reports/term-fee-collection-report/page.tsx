"use client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Search,
  Loader2,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getFeeCollectionReport,
  type ReportYearGroup,
} from "@/lib/services/feeCollectionReport";

const CATEGORIES = ["TUITION", "TRANSPORT", "ADMISSION", "BOOK", "MADRASA", "EXAM", "OTHER"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount ?? 0);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
    PARTIALLY_PAID: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
    PENDING: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
    OVERDUE: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
    REVERSED: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    WAIVED: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] ?? map.PENDING}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// Flat row shape used for rendering — one row per charge, with its
// year/period carried alongside so the table can be a single flat list
// instead of nested year -> period -> mini-table sections.
type FlatChargeRow = {
  key: string;
  year: string | number;
  period: string;
  studentName: string;
  class: string;
  label: string;
  type: string;
  amount: number;
  paidAmount: number;
  status: string;
};

function flattenGroups(groups: ReportYearGroup[]): FlatChargeRow[] {
  const rows: FlatChargeRow[] = [];
  groups.forEach((yearGroup) => {
    yearGroup.periods.forEach((periodGroup) => {
      periodGroup.charges.forEach((c, i) => {
        rows.push({
          key: `${yearGroup.year}-${periodGroup.period}-${i}`,
          year: yearGroup.year,
          period: periodGroup.period,
          studentName: c.studentName,
          class: c.class,
          label: c.label,
          type: c.type,
          amount: c.amount,
          paidAmount: c.paidAmount,
          status: c.status,
        });
      });
    });
  });
  return rows;
}

export default function FeeCollectionReportPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<ReportYearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await getFeeCollectionReport({
          category: categoryFilter === "all" ? "" : categoryFilter,
          search,
          page: currentPage,
          limit: rowsPerPage,
        });
        setGroups(data.groups);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [categoryFilter, search, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  const totalPages = Math.max(1, pagination.totalPages || 1);

  const hasActiveFilters = useMemo(
    () => categoryFilter !== "all" || search.trim().length > 0,
    [categoryFilter, search]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  // Flatten the grouped API response into one continuous row list for the table.
  const rows = useMemo(() => flattenGroups(groups), [groups]);

  const start = pagination.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = pagination.total === 0 ? 0 : Math.min(currentPage * rowsPerPage, pagination.total);

  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">
      {/* ── Header ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              className="shrink-0 bg-background text-foreground hover:opacity-90 shadow-sm"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Term Collection Report
              </h1>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                View term-wise and monthly fee collections, payment statuses, and late fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search student, class, txn..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-lg pl-9 border-slate-300 dark:border-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full min-w-[150px] rounded-lg border-slate-300 sm:w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 shrink-0 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/30"
              onClick={clearAllFilters}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Year
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Period
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Student
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap hidden sm:table-cell">
                  Class
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Charge
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap text-right">
                  Amount
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap text-right hidden md:table-cell">
                  Paid
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Loading report...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No records match your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.key}
                    className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                  >
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {row.year}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {row.period}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {row.studentName}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                      {row.class}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{row.label}</span>
                        {row.type === "Fine" && (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                            Fine
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-right text-sm text-slate-900 dark:text-white">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {formatCurrency(row.paidAmount)}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4">
                      <StatusBadge status={row.status} />
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
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[4rem] text-center">
                Page {totalPages === 0 ? 0 : currentPage} / {totalPages}
              </div>

              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0 || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}