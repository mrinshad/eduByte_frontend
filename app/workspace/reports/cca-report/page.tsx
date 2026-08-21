"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  IndianRupee,
  Loader2,
  Printer,
  RefreshCcw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Landmark,
  X,
  Phone,
  MessageCircle,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCCAReport, getCCAActivities, type CCAReportResponse, type CCARosterItem, type CCAPnLSummary, type CCAActivity } from "@/lib/services/cca";
import { getClasses, type SchoolClass } from "@/lib/services/class";
import { cn, formatCurrency } from "@/lib/utils";

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

export default function CCAReportPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"pnl" | "roster">("pnl");
  const [reportData, setReportData] = useState<CCAReportResponse | null>(null);
  const [activitiesList, setActivitiesList] = useState<CCAActivity[]>([]);
  const [classList, setClassList] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Roster
  const [search, setSearch] = useState<string>("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, acts, classes] = await Promise.all([
        getCCAReport(),
        getCCAActivities(),
        getClasses(),
      ]);
      setReportData(data);
      setActivitiesList(acts);
      setClassList(classes);
    } catch (err: any) {
      console.error("Failed to load CCA report:", err);
      setError(err.message || "Failed to load Co-Curricular report data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handlePrint = () => {
    window.print();
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    if (!reportData?.roster) return [];
    return reportData.roster.filter((item: CCARosterItem) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.studentName.toLowerCase().includes(q) ||
        item.admissionNumber.toLowerCase().includes(q) ||
        item.parentPhone.includes(q);

      const matchActivity =
        activityFilter === "all" ||
        item.activityId === activityFilter ||
        item.activityName.toLowerCase() === activityFilter.toLowerCase();

      const matchClass =
        classFilter === "all" ||
        item.class.toLowerCase() === classFilter.toLowerCase();

      return matchSearch && matchActivity && matchClass;
    });
  }, [reportData?.roster, search, activityFilter, classFilter]);

  const summary = reportData?.summary ?? {
    totalEnrolled: 0,
    totalCollected: 0,
    totalCash: 0,
    totalBank: 0,
    totalExpenses: 0,
    netSurplus: 0,
  };

  const overallMargin =
    summary.totalCollected > 0
      ? Math.round((summary.netSurplus / summary.totalCollected) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 dark:bg-slate-950 font-sans space-y-6 print:p-0 print:bg-white">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6D755F] dark:text-[#8d967d]">
              Reports
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Activity className="h-7 w-7 text-[#6D755F]" /> Co-Curricular (CCA) Report
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive financial summary (P&L), fee collections, expense allocations, and participant roster.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReport}
            disabled={loading}
            className="h-9 text-xs"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#6D755F] hover:bg-[#5b624f] text-white shadow-sm text-xs h-9 font-medium"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Export
          </Button>
        </div>
      </div>

      {/* Print Document Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Co-Curricular Activities (CCA) Report</h1>
        <p className="text-xs text-slate-500">Official Institutional Report • Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Enrolled Students */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Enrolled Students
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {summary.totalEnrolled}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Across all CCA activities</span>
          </div>
        </div>

        {/* Card 2: Fee Collections */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total CCA Collections
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              ₹{summary.totalCollected.toLocaleString()}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-0.5">
                <Wallet className="h-3 w-3 text-slate-400" /> Cash: ₹{summary.totalCash.toLocaleString()}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-0.5">
                <Landmark className="h-3 w-3 text-slate-400" /> Bank: ₹{summary.totalBank.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total CCA Expenses
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              ₹{summary.totalExpenses.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Coaches, gear, pool chemicals & supplies</span>
          </div>
        </div>

        {/* Card 4: Net Surplus / Margin */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Profit / Surplus
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6D755F]/15 text-[#6D755F] dark:bg-[#6D755F]/30 dark:text-[#9ea98a]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span
              className={cn(
                "text-2xl font-bold tracking-tight",
                summary.netSurplus >= 0
                  ? "text-slate-900 dark:text-white"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              ₹{summary.netSurplus.toLocaleString()}
            </span>
            <Badge
              className={cn(
                "text-xs font-semibold",
                summary.netSurplus >= 0
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"
              )}
            >
              {overallMargin}% Margin
            </Badge>
          </div>
          <span className="text-xs text-slate-500 block mt-0.5">Collections minus direct expenses</span>
        </div>
      </div>

      {/* Tabs: P&L Summary vs Student Roster */}
      <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/60 w-fit print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("pnl")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
            activeTab === "pnl"
              ? "bg-white text-[#6D755F] shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <TrendingUp className="h-4 w-4" /> Financial Summary (P&L)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roster")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
            activeTab === "roster"
              ? "bg-white text-[#6D755F] shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <Users className="h-4 w-4" /> Student Roster ({reportData?.roster?.length || 0})
        </button>
      </div>

      {activeTab === "pnl" ? (
        /* ── TAB 1: FINANCIAL SUMMARY (P&L) ─────────────────────────────────── */
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Activity-Wise Profit & Loss Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Direct fee revenue collected vs operational expenses incurred per activity.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#6D755F]" />
                <span className="text-sm font-medium">Calculating CCA financials...</span>
              </div>
            ) : !reportData?.activities || reportData.activities.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">No activity financial records found.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Configure activities in Admin &gt; Co-Curricular (CCA) to begin tracking revenue and expenses.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-slate-500">Activity</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500 text-center">Enrolled</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">Total Billed</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">Cash Collected</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">Bank Collected</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">Total Revenue</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">Total Expenses</TableHead>
                      <TableHead className="pr-6 text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">Net Profit / Surplus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.activities.map((act) => (
                      <TableRow key={act.activityId} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="pl-6 font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D755F]/10 text-[#6D755F]">
                              <Activity className="h-4 w-4" />
                            </span>
                            <span>{act.activityName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300">
                          {act.enrolledCount}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          ₹{act.totalBilled.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400 font-mono text-xs">
                          ₹{act.totalCollectedCash.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400 font-mono text-xs">
                          ₹{act.totalCollectedBank.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{act.totalCollected.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">
                          ₹{act.totalExpenses.toLocaleString()}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={cn(
                                "font-bold text-sm",
                                act.netSurplus >= 0
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {act.netSurplus >= 0 ? "+" : ""}₹{act.netSurplus.toLocaleString()}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 font-medium",
                                act.netSurplus >= 0
                                  ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                                  : "border-red-200 text-red-700 bg-red-50 dark:bg-red-950/40"
                              )}
                            >
                              {act.profitMarginPercent}%
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Consolidated Totals Row */}
                    <TableRow className="border-t-2 border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900/80">
                      <TableCell className="pl-6 text-slate-900 dark:text-white">
                        Grand Total
                      </TableCell>
                      <TableCell className="text-center text-slate-900 dark:text-white">
                        {summary.totalEnrolled}
                      </TableCell>
                      <TableCell className="text-right text-slate-900 dark:text-white">
                        ₹{reportData.activities.reduce((s, a) => s + a.totalBilled, 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-900 dark:text-white">
                        ₹{summary.totalCash.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-900 dark:text-white">
                        ₹{summary.totalBank.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-emerald-700 dark:text-emerald-400 text-base">
                        ₹{summary.totalCollected.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-amber-700 dark:text-amber-400 text-base">
                        ₹{summary.totalExpenses.toLocaleString()}
                      </TableCell>
                      <TableCell className="pr-6 text-right text-base text-slate-900 dark:text-white">
                        ₹{summary.netSurplus.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── TAB 2: STUDENT ROSTER ─────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm print:hidden">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search student, admission #, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  {activitiesList.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classList.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(search || activityFilter !== "all" || classFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setActivityFilter("all");
                    setClassFilter("all");
                  }}
                  className="h-9 text-xs text-slate-500 hover:text-slate-900"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Roster Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#6D755F]" />
                <span className="text-sm font-medium">Loading student roster...</span>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">No participants matching filters.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try clearing search or filters to see all participants.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-slate-500">Student Details</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Class & Section</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Enrolled Activity</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">Monthly Fee</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Joining Month</TableHead>
                      <TableHead className="pr-6 text-xs uppercase tracking-wider font-semibold text-slate-500">Parent / Guardian Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoster.map((item) => (
                      <TableRow key={item.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="pl-6 font-medium text-slate-900 dark:text-slate-100">
                          <div>
                            <span className="font-semibold block">{item.studentName}</span>
                            <span className="text-xs text-slate-400 font-mono">Adm: {item.admissionNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium text-slate-700 dark:text-slate-300">
                            {item.class} {item.division ? ` - ${item.division}` : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[#6D755F]/15 text-[#6D755F] dark:bg-[#6D755F]/25 dark:text-[#9ea98a] border-none font-semibold">
                            {item.activityName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                          ₹{item.monthlyFee.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{item.startMonthName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{item.parentName}</span>
                            <span className="font-mono text-slate-500">{item.parentPhone}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
