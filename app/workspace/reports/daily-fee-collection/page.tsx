"use client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  RefreshCcw,
  Search,
  Loader2,
  Receipt,
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
  getDailyFeeCollectionReport,
  type DailyCollectionTransaction,
} from "@/lib/services/reports";

function toISTDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function todayISO() {
  return toISTDateString(new Date());
}

function firstOfMonthISO() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return toISTDateString(first);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function DailyCollectionReportPage() {
  const router = useRouter();

  const [fromDate, setFromDate] = useState(firstOfMonthISO());
  const [toDate, setToDate] = useState(todayISO());

  const [transactions, setTransactions] = useState<DailyCollectionTransaction[]>([]);
  const [totalCollection, setTotalCollection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Accumulated across pages so options don't shrink as results are filtered/paged —
  // same convention as the Fee Collection page's classOptions/vehicleOptions.
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<string[]>([]);

  const isRangeInvalid = fromDate > toDate;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function fetchReport() {
      if (isRangeInvalid) return;
      try {
        setLoading(true);
        setError(null);

        const data = await getDailyFeeCollectionReport({
          fromDate: todayISO(),
          toDate: todayISO(),
          page: currentPage,
          limit: rowsPerPage,
          search,
          className: classFilter === "all" ? "" : classFilter,
          paymentMethod: paymentMethodFilter === "all" ? "" : paymentMethodFilter,
        });

        setTransactions(data.studentCollections);
        setTotalCollection(data.totalCollection);
        setPagination(data.pagination);

        setClassOptions((prev) =>
          Array.from(new Set([...prev, ...data.studentCollections.map((t) => t.class).filter(Boolean)]))
        );

        setPaymentMethodOptions((prev) => {
          const incoming = data.studentCollections.flatMap((t) =>
            t.paymentMethods.map((pm) => pm.paymentMethod)
          );
          return Array.from(new Set([...prev, ...incoming]));
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [fromDate, toDate, currentPage, rowsPerPage, search, classFilter, paymentMethodFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, rowsPerPage]);

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (value > toDate) setToDate(value);
  };

  const totalPages = Math.max(1, pagination.totalPages || 1);

  const start = pagination.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = pagination.total === 0 ? 0 : Math.min(currentPage * rowsPerPage, pagination.total);

  const hasActiveFilters = useMemo(
    () => classFilter !== "all" || paymentMethodFilter !== "all" || search.trim().length > 0,
    [classFilter, paymentMethodFilter, search]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setClassFilter("all");
    setPaymentMethodFilter("all");
    setCurrentPage(1);
  };

  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">
      {/* ── Header: title + filters + refresh, all together ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Daily Collection Report
              </h1>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                Total collected:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(totalCollection)}
                </span>
              </p>
            </div>
          </div>

          {/* ── Filters live here, right next to the refresh button ── */}
          <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 shrink-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setCurrentPage((p) => p)} // triggers effect re-run via state identity below
              disabled={loading || isRangeInvalid}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
        </div>

        {isRangeInvalid && (
          <p className="mt-3 text-xs font-medium text-red-600">
            &quot;From&quot; date must be before &quot;To&quot; date.
          </p>
        )}
      </div>

      {/* ── Search, justified to the end ── */}
      <div className="flex justify-end gap-2 sm:gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search student..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
            <Select
              value={classFilter}
              onValueChange={(v) => {
                setClassFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[150px] rounded-lg border-slate-300">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={paymentMethodFilter}
              onValueChange={(v) => {
                setPaymentMethodFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[160px] rounded-lg border-slate-300">
                <SelectValue placeholder="All Payment Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                {paymentMethodOptions.map((pm) => (
                  <SelectItem key={pm} value={pm}>
                    {pm}
                  </SelectItem>
                ))}
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

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[820px]">
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Txn No
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Date
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Student
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap hidden sm:table-cell">
                  Class
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap">
                  Charges
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap hidden md:table-cell">
                  Payment Method
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold whitespace-nowrap text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Loading collections...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No collections match your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow
                    key={tx.transactionNumber}
                    className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                  >
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-500">
                      {tx.transactionNumber}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(tx.transactionDate)}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {tx.studentName}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                      {tx.class}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {tx.collections.map((c, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.type === "Fine"
                                ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                                : "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                          >
                            {c.type === "Fine" ? `Fine: ${c.fineType}` : c.chargeType}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {tx.paymentMethods.length === 0
                        ? "-"
                        : tx.paymentMethods
                          .map((pm) => `${pm.paymentMethod}: ${formatCurrency(pm.amount)}`)
                          .join(", ")}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(tx.Totalamount_from_transaction)}
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