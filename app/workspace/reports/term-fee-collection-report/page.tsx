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
import { useState, useEffect } from "react";
import {
  getFeeCollectionReport,
  type ReportYearGroup,
} from "@/lib/services/feeCollectionReport";

const CATEGORIES = ["TUITION", "TRANSPORT", "ADMISSION", "BOOK", "MADRASA", "EXAM", "OTHER"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
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

export default function FeeCollectionReportPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<ReportYearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

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

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const hasActiveFilters = categoryFilter !== "all" || search.trim().length > 0;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Fee Collection Report
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Grouped by term/month based on charge frequency, including late fees.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search student, class, txn..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700 w-full sm:w-[260px]"
            />
          </div>

          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-10 w-[150px] rounded-lg border-slate-300">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-10 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={clearAllFilters}>
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
            <p className="text-sm">Loading report...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm font-medium text-red-500">{error}</div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
            <Wallet className="h-8 w-8 text-slate-300" />
            <p className="text-sm">No records match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {groups.map((yearGroup) => (
              <div key={yearGroup.year} className="p-4 sm:p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {yearGroup.year}
                </h2>
                <div className="space-y-6">
                  {yearGroup.periods.map((periodGroup) => (
                    <div key={periodGroup.period}>
                      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {periodGroup.period}
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800/50">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-500">
                              <th className="px-4 py-2 text-left font-medium">Student</th>
                              <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Class</th>
                              <th className="px-4 py-2 text-left font-medium">Charge</th>
                              <th className="px-4 py-2 text-right font-medium">Amount</th>
                              <th className="px-4 py-2 text-right font-medium">Paid</th>
                              <th className="px-4 py-2 text-left font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {periodGroup.charges.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.studentName}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{c.class}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                  {c.label}
                                  {c.type === "Fine" && (
                                    <span className="ml-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                                      Fine
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatCurrency(c.amount)}</td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(c.paidAmount)}</td>
                                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 sm:px-6 py-4 gap-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm text-slate-500 dark:text-slate-400 order-2 sm:order-1">
            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> total rows
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 sm:justify-end order-1 sm:order-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[4rem] text-center">
                Page {currentPage} / {totalPages}
              </div>
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
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