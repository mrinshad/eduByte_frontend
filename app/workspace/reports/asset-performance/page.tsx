"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building,
  Bus,
  Download,
  FileSpreadsheet,
  Layers,
  Loader2,
  Printer,
  RotateCw,
  Search,
  ShieldCheck,
  Wallet,
  Wrench,
  X,
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
import { cn, formatCurrency } from "@/lib/utils";
import { exportToCsv, type CsvColumn } from "@/lib/utils/csvExport";
import {
  getAssetPerformanceReport,
  type AssetPerformanceReport,
  type AssetRegisterRow,
} from "@/lib/services/asset";

const CATEGORY_LABELS: Record<string, string> = {
  VEHICLE: "Transport Vehicle",
  BUILDING: "Campus Building",
  LAND: "Land & Property",
  EQUIPMENT: "Machinery & Equipment",
  FURNITURE: "Fixtures & Furniture",
  IT_INFRASTRUCTURE: "IT Infrastructure",
  OTHER: "General Asset",
};

export default function AssetPerformanceReportPage() {
  const router = useRouter();

  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const [report, setReport] = useState<AssetPerformanceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load report data
  const loadReport = useCallback(async (yearId?: string) => {
    try {
      setLoading(true);
      const params: { academicYearId?: string } = {};
      if (yearId) {
        params.academicYearId = yearId;
      }
      const data = await getAssetPerformanceReport(params);
      setReport(data);
      if (data?.academicYear?.id && !yearId) {
        setSelectedYearId(data.academicYear.id);
      }
    } catch (err: any) {
      console.error("Failed to fetch asset register & maintenance report:", err);
      toast.error(err?.message || "Failed to load asset report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    loadReport(yearId);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const summary = report?.summary ?? {
    totalCapitalOutlay: 0,
    totalAcademicYearMaintenance: 0,
    totalCombinedCost: 0,
    totalAssetsCount: 0,
    activeAssetsCount: 0,
  };

  const rawAssets = report?.assets ?? [];

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return rawAssets.filter((a) => {
      // Category filter
      if (selectedCategory !== "ALL" && a.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "ALL" && a.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (search) {
        const matchName = a.name.toLowerCase().includes(search);
        const matchDesc = a.description?.toLowerCase().includes(search);
        const matchCat = a.category.toLowerCase().includes(search);
        const matchVehicleName = a.vehicle?.vehicleName?.toLowerCase().includes(search);
        const matchVehicleNumber = a.vehicle?.vehicleNumber?.toLowerCase().includes(search);
        const matchDriver = a.vehicle?.driverName?.toLowerCase().includes(search);
        const matchDriverCode = a.vehicle?.driverStaff?.employeeCode?.toLowerCase().includes(search);
        if (
          !matchName &&
          !matchDesc &&
          !matchCat &&
          !matchVehicleName &&
          !matchVehicleNumber &&
          !matchDriver &&
          !matchDriverCode
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rawAssets, selectedCategory, selectedStatus, search]);

  const hasActiveFilters = selectedCategory !== "ALL" || selectedStatus !== "ALL" || search.length > 0;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  const handleExportCsv = () => {
    if (!filteredAssets.length) {
      toast.info("No assets to export.");
      return;
    }

    const columns: CsvColumn<AssetRegisterRow>[] = [
      { header: "Asset Name", accessor: (a) => a.name },
      { header: "Category", accessor: (a) => CATEGORY_LABELS[a.category] || a.category },
      { header: "Capital Outlay (₹)", accessor: (a) => a.initialPrice },
      { header: "AY Maintenance (₹)", accessor: (a) => a.maintenanceExpenses },
      { header: "Total Cost (₹)", accessor: (a) => a.totalCost },
      {
        header: "Acquisition Date",
        accessor: (a) =>
          a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString("en-IN") : "—",
      },
      {
        header: "Linked Vehicle",
        accessor: (a) => (a.vehicle ? `${a.vehicle.vehicleName} (${a.vehicle.vehicleNumber})` : "—"),
      },
      {
        header: "Assigned Driver",
        accessor: (a) => (a.vehicle ? a.vehicle.driverName || "—" : "—"),
      },
      { header: "Status", accessor: (a) => a.status },
    ];

    exportToCsv({
      filename: `fixed_asset_maintenance_${report?.academicYear?.code || "report"}`.toLowerCase(),
      columns,
      data: filteredAssets,
    });
    toast.success(`Exported ${filteredAssets.length} asset records.`);
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
                  Fixed Asset & Maintenance Register
                </h1>
                <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider text-[#556043] border-[#556043]/30 bg-[#556043]/5">
                  Academic Year
                </Badge>
              </div>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                Annual register of capital assets, valuations, and operating maintenance expenses for {report?.academicYear?.name || "the academic year"}.
              </p>
            </div>
          </div>

          {/* Academic Year Selector & Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-full sm:w-56">
              <Select value={selectedYearId} onValueChange={handleYearChange} disabled={loading}>
                <SelectTrigger className="h-10 rounded-lg border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {(report?.academicYears || []).map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name} {y.isActive ? " (Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-slate-300 dark:border-slate-700 shrink-0"
              onClick={() => loadReport(selectedYearId)}
              disabled={loading}
              title="Refresh Report"
            >
              <RotateCw className={cn("h-4 w-4 text-slate-600 dark:text-slate-300", loading && "animate-spin")} />
            </Button>

            <Button
              variant="outline"
              className="h-10 border-slate-300 dark:border-slate-700 shrink-0"
              onClick={handleExportCsv}
              disabled={loading || filteredAssets.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              className="h-10 border-slate-300 dark:border-slate-700 shrink-0"
              onClick={() => window.print()}
              disabled={loading || filteredAssets.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Capital Outlay */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Capital Outlay
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {loading ? "..." : formatCurrency(summary.totalCapitalOutlay)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Initial acquisition cost of all active assets</p>
        </div>

        {/* Card 2: AY Maintenance Spend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AY Maintenance Expenses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {loading ? "..." : formatCurrency(summary.totalAcademicYearMaintenance)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Operating repairs, fuel & service during AY</p>
        </div>

        {/* Card 3: Total Combined Cost */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Combined Cost
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {loading ? "..." : formatCurrency(summary.totalCombinedCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Capital Outlay + AY Maintenance</p>
        </div>

        {/* Card 4: Total Assets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Assets
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {loading ? "..." : summary.totalAssetsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active tracked property & fleet units</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search asset, vehicle number, driver name, category..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700 text-sm focus-visible:border-[#556043]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 rounded-lg border-slate-300 dark:border-slate-700 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.keys(CATEGORY_LABELS).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-10 rounded-lg border-slate-300 dark:border-slate-700 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="DISPOSED">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Asset Register Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-[#556043] text-xs font-semibold uppercase tracking-wider text-white dark:bg-background dark:text-foreground border-none">
              <tr>
                <th className="px-4 py-3">Asset / Identity</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Initial Outlay</th>
                <th className="px-4 py-3 text-right">AY Maintenance</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3">Acquisition</th>
                <th className="px-4 py-3">Assigned Driver / Note</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#556043]" />
                    <span className="mt-2 block text-xs">Loading annual fixed asset register...</span>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Building className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      No matching assets found
                    </p>
                    <p className="text-xs text-slate-400">
                      {hasActiveFilters ? "Try clearing search or filters." : "Create assets in the Asset Register to populate this report."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Asset Name / Vehicle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {asset.category === "VEHICLE" ? <Bus className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {asset.name}
                          </p>
                          {asset.vehicle && (
                            <p className="text-xs text-slate-500">
                              Reg: {asset.vehicle.vehicleNumber}
                            </p>
                          )}
                          {!asset.vehicle && asset.description && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">
                              {asset.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {CATEGORY_LABELS[asset.category] || asset.category}
                      </Badge>
                    </td>

                    {/* Initial Outlay */}
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                      {asset.initialPrice > 0 ? formatCurrency(asset.initialPrice) : "—"}
                    </td>

                    {/* AY Maintenance */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-amber-700 dark:text-amber-400 tabular-nums">
                          {asset.maintenanceExpenses > 0 ? formatCurrency(asset.maintenanceExpenses) : "₹0.00"}
                        </span>
                        {asset.maintenanceCount > 0 && (
                          <span className="text-[10px] text-slate-400">
                            {asset.maintenanceCount} expense record{asset.maintenanceCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Cost */}
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(asset.totalCost)}
                    </td>

                    {/* Acquisition Date */}
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {asset.purchaseDate
                        ? new Date(asset.purchaseDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Driver / Info */}
                    <td className="px-4 py-3 text-xs">
                      {asset.vehicle ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {asset.vehicle.driverName || "—"}
                          </span>
                          {asset.vehicle.driverStaff?.employeeCode && (
                            <span className="rounded bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                              {asset.vehicle.driverStaff.employeeCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider",
                          asset.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                        )}
                      >
                        {asset.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
