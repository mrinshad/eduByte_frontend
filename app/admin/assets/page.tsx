"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Download,
  Search,
  Building,
  Bus,
  Laptop,
  Armchair,
  Wrench,
  LandPlot,
  Box,
  Layers,
  Calendar as CalendarIcon,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  ASSET_CATEGORIES,
  type Asset,
  type AssetCategory,
  type AssetInput,
} from "@/lib/services/asset";
import { formatCurrency, cn } from "@/lib/utils";
import { exportToCsv, type CsvColumn } from "@/lib/utils/csvExport";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  VEHICLE: Bus,
  BUILDING: Building,
  LAND: LandPlot,
  EQUIPMENT: Wrench,
  FURNITURE: Armchair,
  IT_INFRASTRUCTURE: Laptop,
  OTHER: Box,
};

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All Assets",
  VEHICLE: "Vehicles",
  BUILDING: "Buildings",
  LAND: "Land & Property",
  EQUIPMENT: "Equipment & Machinery",
  FURNITURE: "Furniture & Fixtures",
  IT_INFRASTRUCTURE: "IT & Computing",
  OTHER: "Other Assets",
};

export default function AssetsPage() {
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalInitialValuation: 0,
    categoryCounts: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modal form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<AssetCategory>("EQUIPMENT");
  const [formInitialPrice, setFormInitialPrice] = useState("");
  const [formPurchaseDate, setFormPurchaseDate] = useState("");
  const [purchaseDateOpen, setPurchaseDateOpen] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");

  // Deletion modal
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAssets({
        category: selectedCategory,
        search: searchQuery.trim() || undefined,
      });
      setAssets(data.assets || []);
      setSummary(
        data.summary || {
          totalCount: 0,
          totalInitialValuation: 0,
          categoryCounts: {},
        }
      );
    } catch (error) {
      console.error("Failed to load assets:", error);
      toast.error("Failed to fetch asset register.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(
      () => {
        if (!ignore) {
          void fetchAssets();
        }
      },
      searchQuery ? 300 : 0
    );

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [fetchAssets, searchQuery]);

  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormName("");
    setFormCategory("EQUIPMENT");
    setFormInitialPrice("");
    setFormPurchaseDate("");
    setPurchaseDateOpen(false);
    setFormDescription("");
    setFormStatus("ACTIVE");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormInitialPrice(asset.initialPrice > 0 ? String(asset.initialPrice) : "");
    setFormPurchaseDate(
      asset.purchaseDate ? asset.purchaseDate.split("T")[0] : ""
    );
    setPurchaseDateOpen(false);
    setFormDescription(asset.description || "");
    setFormStatus(asset.status || "ACTIVE");
    setIsDialogOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Asset name is required.");
      return;
    }

    try {
      setIsSaving(true);
      const payload: AssetInput = {
        name: formName.trim(),
        category: formCategory,
        initialPrice: formInitialPrice.trim() !== "" ? parseFloat(formInitialPrice) : 0,
        purchaseDate: formPurchaseDate ? formPurchaseDate : undefined,
        description: formDescription.trim() || undefined,
        status: formStatus,
      };

      if (editingAsset) {
        await updateAsset(editingAsset.id, payload);
        toast.success("Asset updated successfully.");
      } else {
        await createAsset(payload);
        toast.success("Asset registered successfully.");
      }

      setIsDialogOpen(false);
      fetchAssets();
    } catch (error: unknown) {
      console.error("Save asset error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save asset.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    try {
      setIsDeleting(true);
      await deleteAsset(assetToDelete.id);
      toast.success("Asset deleted successfully.");
      setAssetToDelete(null);
      fetchAssets();
    } catch (error: unknown) {
      console.error("Delete asset error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete asset.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    if (!assets.length) {
      toast.info("No assets to export.");
      return;
    }

    const columns: CsvColumn<Asset>[] = [
      { header: "Asset Name", accessor: (a) => a.name },
      { header: "Category", accessor: (a) => a.category },
      {
        header: "Initial Valuation",
        accessor: (a) =>
          a.initialPrice > 0 ? formatCurrency(a.initialPrice) : "—",
      },
      {
        header: "Purchase Date",
        accessor: (a) =>
          a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : "—",
      },
      { header: "Status", accessor: (a) => a.status },
      {
        header: "Linked Vehicle",
        accessor: (a) =>
          a.vehicle
            ? `${a.vehicle.vehicleName} (${a.vehicle.vehicleNumber})`
            : "—",
      },
      { header: "Description", accessor: (a) => a.description || "—" },
    ];

    exportToCsv({
      filename: `fixed_asset_register_${new Date().toISOString().split("T")[0]}`,
      columns,
      data: assets,
    });
    toast.success(`Exported ${assets.length} assets successfully.`);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const vehicleValuation = assets
      .filter((a) => a.category === "VEHICLE")
      .reduce((sum, a) => sum + (Number(a.initialPrice) || 0), 0);
    const nonVehicleValuation =
      (summary.totalInitialValuation || 0) - vehicleValuation;

    return {
      totalValuation: summary.totalInitialValuation || 0,
      totalCount: summary.totalCount || 0,
      vehicleCount: summary.categoryCounts["VEHICLE"] || 0,
      vehicleValuation,
      infraCount:
        (summary.totalCount || 0) - (summary.categoryCounts["VEHICLE"] || 0),
      infraValuation: nonVehicleValuation > 0 ? nonVehicleValuation : 0,
    };
  }, [assets, summary]);

  return (
    <div className="space-y-6 px-3 sm:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button
            size="icon"
            className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-950 dark:text-white">
              Fixed Asset Register
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Track capital equipment, transport vehicles, campus facilities, and initial purchase valuations.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={assets.length === 0}
            className="w-full sm:w-auto border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <PermissionGate permission="assets.createAssetButton">
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="w-full sm:w-auto bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Capital Outlay
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-mono">
              {formatCurrency(stats.totalValuation)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {stats.totalCount} registered institutional asset{stats.totalCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Transport Fleet Assets
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Bus className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-mono">
              {formatCurrency(stats.vehicleValuation)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {stats.vehicleCount} vehicle{stats.vehicleCount === 1 ? "" : "s"} synced automatically
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Campus Infrastructure
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-mono">
              {formatCurrency(stats.infraValuation)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {stats.infraCount} physical property, furniture & IT asset{stats.infraCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", ...ASSET_CATEGORIES].map((cat) => {
            const isSelected = selectedCategory === cat;
            const Icon = cat === "ALL" ? Layers : CATEGORY_ICONS[cat] || Box;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-[#556043] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/80"
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{CATEGORY_LABELS[cat] || cat}</span>
                {cat !== "ALL" && summary.categoryCounts[cat] !== undefined && (
                  <span
                    className={cn(
                      "ml-0.5 rounded px-1 text-[10px] tabular-nums",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    )}
                  >
                    {summary.categoryCounts[cat]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9 rounded-lg"
          />
        </div>
      </div>

      {/* Asset Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 dark:bg-slate-800/40">
              <TableHead className="w-[280px]">Asset Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Initial Valuation</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Linked Vehicle</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-7 w-14 ml-auto rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  <Box className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-medium">No assets registered yet</p>
                  <p className="text-xs text-slate-400">
                    Click &quot;Add Asset&quot; or create a vehicle to populate the register.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => {
                const Icon = CATEGORY_ICONS[asset.category] || Box;
                return (
                  <TableRow key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell>
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mt-0.5">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {asset.name}
                          </p>
                          {asset.description && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
                              {asset.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-normal border-slate-200 dark:border-slate-700"
                      >
                        {CATEGORY_LABELS[asset.category] || asset.category}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {asset.initialPrice > 0 ? (
                        formatCurrency(asset.initialPrice)
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {asset.purchaseDate ? (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-slate-400" />
                          {new Date(asset.purchaseDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium uppercase tracking-wider",
                          asset.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : asset.status === "DISPOSED"
                            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                        )}
                      >
                        {asset.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {asset.vehicle ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Bus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">
                            {asset.vehicle.vehicleName} ({asset.vehicle.vehicleNumber})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <PermissionGate permission="assets.editAssetButton">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(asset)}
                            className="h-7 w-7 text-slate-400 hover:text-[#556043] dark:hover:text-slate-200"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </PermissionGate>

                        {/* If linked to vehicle, deletion should preferably happen through Transport management */}
                        <PermissionGate permission="assets.deleteAssetButton">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setAssetToDelete(asset)}
                            className="h-7 w-7 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[92vw] sm:max-w-lg max-h-[90vh] flex flex-col p-0 rounded-2xl border border-[#6a7459] dark:border-slate-800 bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100 shadow-2xl overflow-hidden [&>button:last-child]:text-white/80 hover:[&>button:last-child]:text-white hover:[&>button:last-child]:bg-white/10">
          <div className="p-6 pb-2 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
                {editingAsset ? "Edit Asset" : "Add New Asset"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-200 dark:text-slate-400 mt-1">
                {editingAsset
                  ? "Update capital asset details and valuation."
                  : "Register a standalone capital asset into the institutional register."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveAsset} className="flex flex-col flex-1 min-h-0">
            <div className="space-y-4 px-6 py-2 flex-1 overflow-y-auto">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-white dark:text-slate-200">
                  Asset Name <span className="text-red-400 ml-0.5">*</span>
                </Label>
                <Input
                  placeholder="e.g. Physics Lab Microscope, Main Block AC"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-white dark:text-slate-200">
                    Category <span className="text-red-400 ml-0.5">*</span>
                  </Label>
                  <Select
                    value={formCategory}
                    onValueChange={(val) => setFormCategory(val as AssetCategory)}
                    disabled={Boolean(editingAsset?.vehicleId)}
                  >
                    <SelectTrigger className="w-full rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40 [&_svg]:text-white/80 dark:[&_svg]:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-[#6a7459] dark:border-slate-800 bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100">
                      {ASSET_CATEGORIES.filter((cat) => editingAsset?.vehicleId || cat !== "VEHICLE").map((cat) => (
                        <SelectItem
                          key={cat}
                          value={cat}
                          className="text-white dark:text-slate-100 focus:bg-[#556043] focus:text-white dark:focus:bg-slate-800 cursor-pointer"
                        >
                          {CATEGORY_LABELS[cat] || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editingAsset?.vehicleId && (
                    <p className="text-[10px] text-amber-300 dark:text-amber-400">
                      Category is locked because asset is synced with a vehicle.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-white dark:text-slate-200">Initial Cost (₹, optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 50000"
                    value={formInitialPrice}
                    onChange={(e) => setFormInitialPrice(e.target.value)}
                    className="rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-white dark:text-slate-200">
                    Purchase Date (optional)
                  </Label>
                  <Popover open={purchaseDateOpen} onOpenChange={setPurchaseDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full h-8 justify-start text-left font-normal text-xs sm:text-sm rounded-xl bg-[#667155] border-[#8b9478] text-white hover:bg-[#586249] hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700 px-2.5 focus-visible:ring-1 focus-visible:ring-white/40 shadow-none",
                          !formPurchaseDate && "text-slate-300 dark:text-slate-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-white/80 dark:text-slate-400 shrink-0" />
                        <span className="truncate flex-1">
                          {formPurchaseDate
                            ? format(new Date(`${formPurchaseDate}T00:00:00`), "dd MMM yyyy")
                            : "Select purchase date"}
                        </span>
                        {formPurchaseDate && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormPurchaseDate("");
                            }}
                            className="ml-1 hover:text-rose-300 p-0.5 rounded cursor-pointer shrink-0"
                            title="Clear date"
                          >
                            <X className="h-3.5 w-3.5 opacity-70 hover:opacity-100" />
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          formPurchaseDate
                            ? new Date(`${formPurchaseDate}T00:00:00`)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setFormPurchaseDate(format(date, "yyyy-MM-dd"));
                            setPurchaseDateOpen(false);
                          } else {
                            setFormPurchaseDate("");
                          }
                        }}
                        defaultMonth={
                          formPurchaseDate
                            ? new Date(`${formPurchaseDate}T00:00:00`)
                            : new Date()
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-white dark:text-slate-200">
                    Status <span className="text-red-400 ml-0.5">*</span>
                  </Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="w-full rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40 [&_svg]:text-white/80 dark:[&_svg]:text-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-[#6a7459] dark:border-slate-800 bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100">
                      <SelectItem value="ACTIVE" className="text-white dark:text-slate-100 focus:bg-[#556043] focus:text-white dark:focus:bg-slate-800 cursor-pointer">ACTIVE</SelectItem>
                      <SelectItem value="MAINTENANCE" className="text-white dark:text-slate-100 focus:bg-[#556043] focus:text-white dark:focus:bg-slate-800 cursor-pointer">MAINTENANCE</SelectItem>
                      <SelectItem value="RETIRED" className="text-white dark:text-slate-100 focus:bg-[#556043] focus:text-white dark:focus:bg-slate-800 cursor-pointer">RETIRED</SelectItem>
                      <SelectItem value="DISPOSED" className="text-white dark:text-slate-100 focus:bg-[#556043] focus:text-white dark:focus:bg-slate-800 cursor-pointer">DISPOSED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-white dark:text-slate-200">Description / Specs (optional)</Label>
                <Input
                  placeholder="Serial number, warranty details, location..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40"
                />
              </div>
            </div>

            <DialogFooter className="bg-[#6a7459] dark:bg-slate-950 border-t border-[#8b9478]/40 dark:border-slate-800 p-4 sm:p-5 mt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                className="w-full sm:w-auto rounded-full border-[#8b9478] bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto rounded-full bg-white text-[#556043] hover:bg-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-medium"
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : editingAsset ? (
                  "Update Asset"
                ) : (
                  "Register Asset"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={!!assetToDelete}
        onOpenChange={(open) => !open && setAssetToDelete(null)}
      >
        <AlertDialogContent className="w-[92vw] sm:max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Asset &quot;{assetToDelete?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block text-slate-600 dark:text-slate-400">
                This will remove the asset from the fixed asset register.
              </span>

              {assetToDelete?.vehicleId && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">
                      Note: Linked Transport Vehicle
                    </span>
                    <span>
                      This asset is linked to vehicle &quot;{assetToDelete.vehicle?.vehicleName}&quot;.
                      Deleting this asset will unbind its valuation while keeping the vehicle record intact.
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
