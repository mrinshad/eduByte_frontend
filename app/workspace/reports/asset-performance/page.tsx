"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  RotateCw,
  Download,
  Printer,
  Bus,
  Building,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Percent,
  Wallet,
  ShieldCheck,
  HelpCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { getAcademicYears, type AcademicYearSummary } from "@/lib/services/academicYear";
import {
  getAssetPerformanceReport,
  type AssetPerformanceReport,
  type VehiclePerformanceRow,
} from "@/lib/services/asset";
import { formatCurrency, cn } from "@/lib/utils";
import { exportToCsv, type CsvColumn } from "@/lib/utils/csvExport";

export default function AssetPerformanceReportPage() {
  const router = useRouter();

  const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [useDateRange, setUseDateRange] = useState<boolean>(false);

  const [report, setReport] = useState<AssetPerformanceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"fleet" | "inventory">("fleet");

  // Load academic years on initial mount
  useEffect(() => {
    async function loadYears() {
      try {
        const years = await getAcademicYears();
        setAcademicYears(years);
        const active = years.find((y) => y.isActive) || years[0];
        if (active) {
          setSelectedYearId(active.id);
        }
      } catch (err) {
        console.error("Failed to load academic years:", err);
      }
    }
    loadYears();
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params: { academicYearId?: string; from?: string; to?: string } = {};

      if (useDateRange) {
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
      } else if (selectedYearId && selectedYearId !== "ALL") {
        params.academicYearId = selectedYearId;
      }

      const data = await getAssetPerformanceReport(params);
      setReport(data);
    } catch (err: any) {
      console.error("Failed to fetch asset performance report:", err);
      toast.error(err?.message || "Failed to load asset performance report.");
    } finally {
      setLoading(false);
    }
  }, [selectedYearId, useDateRange, fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summary = report?.institutionSummary ?? {
    totalInitialAssetValue: 0,
    totalGain: 0,
    gainBreakdown: { studentFees: 0, fines: 0, cca: 0 },
    totalSpend: 0,
    netOperatingBalance: 0,
    netReturnAfterInitialAssets: 0,
    paybackPercentage: null,
    status: "SURPLUS" as const,
    assetCount: 0,
    vehicleCount: 0,
  };

  const vehicles = report?.vehicles ?? [];
  const nonVehicleAssets = report?.nonVehicleAssets ?? [];

  // Aggregated fleet metrics
  const fleetTotals = useMemo(() => {
    const totalFleetInitialCost = vehicles.reduce(
      (sum, v) => sum + (v.hasInitialPrice ? v.initialPrice : 0),
      0
    );
    const totalTransportCollections = vehicles.reduce(
      (sum, v) => sum + (v.totalCollections || 0),
      0
    );
    const totalVehicleExpenses = vehicles.reduce(
      (sum, v) => sum + (v.totalExpenses || 0),
      0
    );
    const netOperatingMargin = totalTransportCollections - totalVehicleExpenses;

    return {
      totalFleetInitialCost,
      totalTransportCollections,
      totalVehicleExpenses,
      netOperatingMargin,
    };
  }, [vehicles]);

  const handleExportCsv = () => {
    if (!vehicles.length) {
      toast.info("No vehicle data to export.");
      return;
    }

    const columns: CsvColumn<VehiclePerformanceRow>[] = [
      { header: "Vehicle Name", accessor: (v) => v.vehicleName },
      { header: "Vehicle Number", accessor: (v) => v.vehicleNumber },
      { header: "Driver Name", accessor: (v) => v.driverName || "—" },
      { header: "Enrolled Students", accessor: (v) => v.passengerCount },
      {
        header: "Initial Asset Cost",
        accessor: (v) => (v.hasInitialPrice ? formatCurrency(v.initialPrice) : "Not Configured"),
      },
      {
        header: "Transport Collections",
        accessor: (v) => formatCurrency(v.totalCollections),
      },
      {
        header: "Vehicle Expenses",
        accessor: (v) => formatCurrency(v.totalExpenses),
      },
      {
        header: "Operating Margin",
        accessor: (v) => formatCurrency(v.netOperatingBalance),
      },
      {
        header: "Net After Initial Cost",
        accessor: (v) => (v.hasInitialPrice ? formatCurrency(v.netAssetReturn) : "—"),
      },
      {
        header: "Payback Status",
        accessor: (v) => v.status,
      },
      {
        header: "Payback %",
        accessor: (v) =>
          v.paybackPercentage !== undefined && v.paybackPercentage !== null
            ? `${v.paybackPercentage}%`
            : "—",
      },
    ];

    exportToCsv({
      filename: `vehicle_asset_roi_performance_${new Date().toISOString().split("T")[0]}`,
      columns,
      data: vehicles,
    });
    toast.success("Exported performance report to CSV.");
  };

  const handlePrint = () => {
    window.print();
  };

  const isOperatingPositive = summary.netOperatingBalance >= 0;
  const isAfterAssetPositive = summary.netReturnAfterInitialAssets >= 0;

  return (
    <div className="space-y-6 px-3 sm:px-6 py-4 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button
            variant="outline"
            size="icon"
            className="text-white shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-950 dark:text-white">
              Fixed Asset & ROI Performance Report
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Institution capital expenditure, operating margins, per-vehicle unit economics, and payback tracking.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {!useDateRange ? (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Academic Years</SelectItem>
                  {academicYears.map((ay) => (
                    <SelectItem key={ay.id} value={ay.id}>
                      {ay.name} {ay.isActive ? "(Current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 text-xs w-[130px]"
                placeholder="From Date"
              />
              <span className="text-xs text-slate-400">to</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 text-xs w-[130px]"
                placeholder="To Date"
              />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUseDateRange(!useDateRange)}
            className="text-xs text-slate-600 dark:text-slate-400 h-9"
          >
            {useDateRange ? "Use Academic Year" : "Use Custom Dates"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            className="h-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <RotateCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!vehicles.length}
            className="h-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Fixed Asset & Performance Report</h2>
        <p className="text-xs text-slate-500">
          Generated on {new Date().toLocaleDateString()} &bull; Scope:{" "}
          {report?.period?.academicYearName || "All Academic Years"}
        </p>
      </div>

      {/* LEVEL 1: Institutional Financial Overview KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Capital Outlay */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Capital Outlay
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-mono">
              {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(summary.totalInitialAssetValue)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {summary.assetCount} registered capital asset{summary.assetCount === 1 ? "" : "s"}
          </p>
        </div>

        {/* Total Gain (Inflow) */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Gain (Inflow)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
              {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(summary.totalGain)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Fees: {formatCurrency(summary.gainBreakdown.studentFees)}
          </p>
        </div>

        {/* Total Spend (Expenses) */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Spend (Outflow)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <ArrowDownRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums font-mono">
              {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(summary.totalSpend)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Operating Costs & Payroll
          </p>
        </div>

        {/* Net Operating Margin */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Operating Margin
            </span>
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              isOperatingPositive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
            )}>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className={cn(
              "text-xl font-bold tracking-tight tabular-nums font-mono",
              isOperatingPositive
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-rose-700 dark:text-rose-400"
            )}>
              {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(summary.netOperatingBalance)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Gain − Spend (Excludes Asset Cost)
          </p>
        </div>

        {/* Net Post-Asset Position */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net After Capital Outlay
            </span>
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              isAfterAssetPositive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
            )}>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className={cn(
              "text-xl font-bold tracking-tight tabular-nums font-mono",
              isAfterAssetPositive
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )}>
              {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(summary.netReturnAfterInitialAssets)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Margin − Capital Valuation
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setActiveTab("fleet")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "fleet"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Bus className="h-3.5 w-3.5" />
              <span>Per-Vehicle ROI & Payback ({vehicles.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "inventory"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Institutional Asset Register ({nonVehicleAssets.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FLEET & PER-VEHICLE ROI BREAKDOWN */}
        {activeTab === "fleet" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Transport Fleet Unit Economics & Asset Payback
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual vehicle initial purchase price, transport fee collections, operating expenses, and asset return.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                <div>
                  <span className="text-slate-500">Fleet Outlay: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(fleetTotals.totalFleetInitialCost)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Fleet Net Margin: </span>
                  <span className={cn(
                    "font-semibold",
                    fleetTotals.netOperatingMargin >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {formatCurrency(fleetTotals.netOperatingMargin)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 dark:bg-slate-800/40">
                    <TableHead className="w-[220px]">Vehicle & Route</TableHead>
                    <TableHead className="text-right">Initial Cost</TableHead>
                    <TableHead className="text-right">Collections (Gain)</TableHead>
                    <TableHead className="text-right">Expenses (Spend)</TableHead>
                    <TableHead className="text-right">Operating Margin</TableHead>
                    <TableHead className="w-[150px] text-center">Payback Status</TableHead>
                    <TableHead className="text-right">Net Return Post-Asset</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto rounded" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-slate-500">
                        <Bus className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm font-medium">No vehicles registered</p>
                        <p className="text-xs text-slate-400">Add vehicles under Transport section to track unit economics.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles.map((v: VehiclePerformanceRow) => {
                      const isMarginPositive = v.netOperatingBalance >= 0;
                      const isPostAssetPositive = v.netAssetReturn >= 0;

                      return (
                        <TableRow key={v.vehicleId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          {/* Vehicle Info */}
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 mt-0.5">
                                <Bus className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {v.vehicleName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {v.vehicleNumber} {v.driverName ? `• ${v.driverName}` : ""}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                                  <Users className="h-3 w-3" /> {v.passengerCount} assigned
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Initial Cost */}
                          <TableCell className="text-right font-mono tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
                            {v.hasInitialPrice ? (
                              formatCurrency(v.initialPrice)
                            ) : (
                              <span className="text-slate-400 font-normal text-xs italic" title="No initial price was entered for this vehicle">
                                — (Not set)
                              </span>
                            )}
                          </TableCell>

                          {/* Collections */}
                          <TableCell className="text-right font-mono tabular-nums text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatCurrency(v.totalCollections)}
                          </TableCell>

                          {/* Expenses */}
                          <TableCell className="text-right font-mono tabular-nums text-sm text-rose-600 dark:text-rose-400 font-medium">
                            {formatCurrency(v.totalExpenses)}
                          </TableCell>

                          {/* Operating Margin */}
                          <TableCell className={cn(
                            "text-right font-mono tabular-nums text-sm font-semibold",
                            isMarginPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                          )}>
                            {formatCurrency(v.netOperatingBalance)}
                          </TableCell>

                          {/* Payback Status */}
                          <TableCell className="text-center">
                            {v.status === "RECOVERED" ? (
                              <div className="inline-flex flex-col items-center">
                                <Badge className="bg-emerald-600 text-white text-[10px] font-semibold py-0.5 px-2">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  RECOVERED
                                </Badge>
                                {v.paybackPercentage && v.paybackPercentage > 100 && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                                    {v.paybackPercentage}% ROI
                                  </span>
                                )}
                              </div>
                            ) : v.status === "PAYING_BACK" ? (
                              <div className="inline-flex flex-col items-center gap-1">
                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-medium py-0.5 px-2">
                                  RECOVERING ({v.paybackPercentage}%)
                                </Badge>
                                <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-amber-500 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(0, v.paybackPercentage || 0))}%` }}
                                  />
                                </div>
                              </div>
                            ) : v.status === "SURPLUS" ? (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-medium py-0.5 px-2">
                                SURPLUS
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-medium py-0.5 px-2">
                                DEFICIT
                              </Badge>
                            )}
                          </TableCell>

                          {/* Net Return Post-Asset */}
                          <TableCell className={cn(
                            "text-right font-mono tabular-nums text-sm font-semibold",
                            v.hasInitialPrice
                              ? isPostAssetPositive
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                              : "text-slate-400 font-normal"
                          )}>
                            {v.hasInitialPrice ? (
                              formatCurrency(v.netAssetReturn)
                            ) : (
                              <span className="text-xs italic text-slate-400">
                                {formatCurrency(v.netOperatingBalance)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* TAB 2: PHYSICAL FIXED ASSETS REGISTER */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Institutional Fixed Capital Register
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete inventory of registered institutional capital assets, acquisitions, and valuations.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/assets")}
                className="text-xs h-8 text-[#556043] border-[#556043]/30 hover:bg-[#556043]/10"
              >
                Manage Assets in Admin
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 dark:bg-slate-800/40">
                    <TableHead className="w-[260px]">Asset Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Initial Valuation</TableHead>
                    <TableHead>Acquisition Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 rounded" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      </TableRow>
                    ))
                  ) : nonVehicleAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                        <Building className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm font-medium">No non-vehicle assets recorded</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    nonVehicleAssets.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableCell className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[11px] font-normal">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.initialPrice > 0 ? formatCurrency(item.initialPrice) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-wider",
                              item.status === "ACTIVE"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            )}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {item.description || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
