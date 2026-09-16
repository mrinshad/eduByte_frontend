"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Download,
  IndianRupee,
  Loader2,
  Printer,
  RotateCw,
  Search,
  Wallet,
  X,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";
import { exportToCsv, type CsvColumn } from "@/lib/utils/csvExport";
import {
  getRevolvingFundStatement,
  type RevolvingFundStatementResponse,
  type RevolvingFundTransaction,
} from "@/lib/services/accounts";
import { getReportConfig } from "@/lib/report-definitions";

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function firstOfMonthISO() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(first);
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "";
  const datePart = dateStr.slice(0, 10);
  return new Date(`${datePart}T00:00:00`).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseISODate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

function toISODate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function RevolvingFundReportPage() {
  const router = useRouter();
  const reportConfig = getReportConfig("reports/revolving-fund");

  const [fromDate, setFromDate] = useState<string>(firstOfMonthISO());
  const [toDate, setToDate] = useState<string>(todayISO());
  const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
  const [toCalendarOpen, setToCalendarOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [flowFilter, setFlowFilter] = useState<"ALL" | "INFLOW" | "OUTFLOW">("ALL");

  const [statement, setStatement] = useState<RevolvingFundStatementResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Load statement
  const loadStatement = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRevolvingFundStatement({ from: fromDate, to: toDate });
      setStatement(data);
    } catch (err: any) {
      console.error("Failed to load revolving fund statement:", err);
      toast.error(err?.message || "Failed to load revolving fund statement.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleFromDateSelect(date: Date | undefined) {
    if (!date) return;
    const newFrom = toISODate(date);
    setFromDate(newFrom);
    if (newFrom > toDate) setToDate(newFrom);
    setFromCalendarOpen(false);
  }

  function handleToDateSelect(date: Date | undefined) {
    if (!date) return;
    setToDate(toISODate(date));
    setToCalendarOpen(false);
  }

  const rawTransactions = statement?.transactions ?? [];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((tx) => {
      if (flowFilter !== "ALL" && tx.flowType !== flowFilter) {
        return false;
      }
      if (search) {
        const matchNum = tx.transactionNumber.toLowerCase().includes(search);
        const matchDesc = tx.description.toLowerCase().includes(search);
        const matchNotes = tx.notes?.toLowerCase().includes(search);
        if (!matchNum && !matchDesc && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [rawTransactions, flowFilter, search]);

  const summary = statement?.summary ?? {
    openingBalance: 0,
    totalInflow: 0,
    totalOutflow: 0,
    netMovement: 0,
    closingBalance: 0,
    liveBalance: 0,
    transactionCount: 0,
  };

  const hasActiveFilters = flowFilter !== "ALL" || search.length > 0;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setFlowFilter("ALL");
  };

  const handleExportCsv = () => {
    if (!filteredTransactions.length) {
      toast.info("No transactions to export in this period.");
      return;
    }

    const columns: CsvColumn<RevolvingFundTransaction>[] = [
      {
        header: "Date",
        accessor: (t) =>
          t.date ? new Date(t.date).toLocaleDateString("en-IN") : "—",
      },
      { header: "Transaction Ref", accessor: (t) => t.transactionNumber },
      { header: "Description", accessor: (t) => t.description },
      { header: "Notes", accessor: (t) => t.notes || "" },
      { header: "Flow Type", accessor: (t) => t.flowType },
      { header: "Inflow (₹)", accessor: (t) => (t.inflow > 0 ? t.inflow : "") },
      { header: "Outflow (₹)", accessor: (t) => (t.outflow > 0 ? t.outflow : "") },
      { header: "Running Balance (₹)", accessor: (t) => t.runningBalance },
    ];

    exportToCsv({
      filename: `revolving_fund_statement_${fromDate}_to_${toDate}`,
      columns,
      data: filteredTransactions,
    });
    toast.success(`Exported ${filteredTransactions.length} transaction rows.`);
  };

  return (
    <div className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 max-w-7xl mx-auto font-sans min-h-screen">
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  {reportConfig.title}
                </h1>
                {reportConfig.badgeText && (
                  <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider text-[#556043] border-[#556043]/30 bg-[#556043]/5">
                    {reportConfig.badgeText}
                  </Badge>
                )}
              </div>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {reportConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Date Pickers & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start rounded-lg border-slate-300 bg-white px-3 text-left text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 sm:w-36"
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{formatDisplayDate(fromDate)}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseISODate(fromDate)}
                    onSelect={handleFromDateSelect}
                    defaultMonth={parseISODate(fromDate)}
                  />
                </PopoverContent>
              </Popover>

              <div className="hidden shrink-0 items-center justify-center text-slate-400 sm:flex">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>

              <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start rounded-lg border-slate-300 bg-white px-3 text-left text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 sm:w-36"
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{formatDisplayDate(toDate)}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseISODate(toDate)}
                    onSelect={handleToDateSelect}
                    defaultMonth={parseISODate(toDate)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              onClick={loadStatement}
              disabled={loading}
              title="Refresh Statement"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              onClick={handleExportCsv}
              disabled={loading || filteredTransactions.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              onClick={() => window.print()}
              disabled={loading || filteredTransactions.length === 0}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cash in Hand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cash in Hand
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <div className="mt-2 h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {formatCurrency(summary.liveBalance)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Available cash in petty fund</p>
        </div>

        {/* 2. Money Added */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Money Added
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <div className="mt-2 h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              + {formatCurrency(summary.totalInflow)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Transfers in & top-ups</p>
        </div>

        {/* 3. Money Spent */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Money Spent
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <div className="mt-2 h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              - {formatCurrency(summary.totalOutflow)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Expenses & disbursements</p>
        </div>

        {/* 4. Ending Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ending Balance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <div className="mt-2 h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {formatCurrency(summary.closingBalance)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Net: {summary.netMovement >= 0 ? "+" : ""}{formatCurrency(summary.netMovement)}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search reference #, description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-lg pl-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={flowFilter} onValueChange={(val: any) => setFlowFilter(val)}>
            <SelectTrigger className="h-10 w-full sm:w-[160px] rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium">
              <SelectValue placeholder="All Movements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Movements</SelectItem>
              <SelectItem value="INFLOW">Inflows Only (In)</SelectItem>
              <SelectItem value="OUTFLOW">Outflows Only (Out)</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/30"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* FINES-STYLE TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-[#556043] text-xs font-semibold uppercase tracking-wider text-white dark:bg-background dark:text-foreground border-none">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Ref / Voucher #</th>
                <th className="px-4 py-3">Purpose / Description</th>
                <th className="px-4 py-3 text-right">Money Added (₹)</th>
                <th className="px-4 py-3 text-right">Money Spent (₹)</th>
                <th className="px-4 py-3 text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {/* Opening Balance Row */}
              <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {formatDisplayDate(fromDate)}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  OPENING
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  Opening Balance as of {formatDisplayDate(fromDate)}
                </td>
                <td className="px-4 py-3 text-right text-slate-400">—</td>
                <td className="px-4 py-3 text-right text-slate-400">—</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(summary.openingBalance)}
                </td>
              </tr>

              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-5 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-4 py-3 text-right"><div className="h-5 w-16 ml-auto animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-4 py-3 text-right"><div className="h-5 w-16 ml-auto animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-4 py-3 text-right"><div className="h-5 w-20 ml-auto animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No transactions recorded for this period. Closing balance remains at {formatCurrency(summary.closingBalance)}.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {tx.date ? new Date(tx.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {tx.transactionNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{tx.description}</div>
                      {tx.notes && tx.notes !== tx.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">{tx.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {tx.inflow > 0 ? `+ ${formatCurrency(tx.inflow)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {tx.outflow > 0 ? `- ${formatCurrency(tx.outflow)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatCurrency(tx.runningBalance)}
                    </td>
                  </tr>
                ))
              )}

              {/* Closing Summary Row */}
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 font-bold border-t border-slate-200 dark:border-slate-700">
                <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                  {formatDisplayDate(toDate)}
                </td>
                <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  CLOSING
                </td>
                <td className="px-4 py-3.5 text-slate-900 dark:text-slate-100">
                  Closing Balance as of {formatDisplayDate(toDate)}
                </td>
                <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  + {formatCurrency(summary.totalInflow)}
                </td>
                <td className="px-4 py-3.5 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  - {formatCurrency(summary.totalOutflow)}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {formatCurrency(summary.closingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
