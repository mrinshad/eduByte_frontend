"use client"
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  createVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
} from "@/lib/services/vehicle";
import { getStaff, type StaffListItem } from "@/lib/services/staff";
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
import { Loader2 } from "lucide-react";

import { ArrowLeft, Plus, Bus, User, Hash, Pencil, Trash2, AlertCircle, Users, Download } from "lucide-react"
import { exportToCsv, type CsvColumn } from "@/lib/utils/csvExport";
import { formatCurrency } from "@/lib/utils";
import { ReusableFormDialog, type FormField } from "@/components/common/resusable-dialoge-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Skeleton card — mirrors the real vehicle card layout exactly so    */
/*  there's no layout shift once data arrives.                         */
/* ------------------------------------------------------------------ */

function VehicleCardSkeleton() {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-xl
        border
        border-slate-100
        bg-white
        p-3
        shadow-sm
        dark:border-slate-800/80
        dark:bg-slate-900
      "
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800/60" />

        {/* Driver info */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50/50 p-2 dark:bg-slate-800/40">
          <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const router = useRouter()

  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverStaffId, setDriverStaffId] = useState<string>("");
  const [driverName, setDriverName] = useState("");
  const [initialPrice, setInitialPrice] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");

  const [staffList, setStaffList] = useState<StaffListItem[]>([]);

  const handleSaveVehicle = async () => {
    if (!vehicleName.trim()) {
      toast.error("Please enter vehicle name");
      return;
    }

    if (!vehicleNumber.trim()) {
      toast.error("Please enter vehicle number");
      return;
    }

    const selectedStaff = staffList.find((s) => s.id === driverStaffId);
    const resolvedDriverName = selectedStaff?.name || driverName.trim();

    if (!resolvedDriverName) {
      toast.error("Please select a driver from the staff directory");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        vehicleName: vehicleName.trim(),
        vehicleNumber: vehicleNumber.trim(),
        driverName: resolvedDriverName,
        driverStaffId: driverStaffId || undefined,
        initialPrice: initialPrice.trim() !== "" ? parseFloat(initialPrice) : 0,
        purchaseDate: purchaseDate.trim() !== "" ? purchaseDate : undefined,
      };

      if (editingId) {
        await updateVehicle(editingId, payload);

        toast.success("Vehicle updated successfully");
      } else {
        await createVehicle(payload);

        toast.success("Vehicle created successfully");
      }

      setVehicleName("");
      setVehicleNumber("");
      setDriverStaffId("");
      setDriverName("");
      setInitialPrice("");
      setPurchaseDate("");
      setEditingId(null);

      setOpen(false);

      loadVehicles();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : editingId
          ? "Failed to update vehicle"
          : "Failed to create vehicle";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    loadVehicles();
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const res = await getStaff({ limit: 100, status: "ACTIVE" });
      if (res?.data?.items) {
        setStaffList(res.data.items);
      }
    } catch (err) {
      console.error("Failed to load staff for driver dropdown", err);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);

    setVehicleName(vehicle.vehicleName);
    setVehicleNumber(vehicle.vehicleNumber);
    setDriverStaffId(vehicle.driverStaffId || vehicle.driverStaff?.id || "");
    setDriverName(vehicle.driverStaff?.name || vehicle.driverName || "");
    setInitialPrice(
      vehicle.asset?.initialPrice !== undefined && vehicle.asset?.initialPrice !== null && vehicle.asset.initialPrice > 0
        ? String(vehicle.asset.initialPrice)
        : ""
    );
    setPurchaseDate(vehicle.asset?.purchaseDate ? vehicle.asset.purchaseDate.split("T")[0] : "");

    setOpen(true);
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteVehicle(vehicleToDelete.id);
      toast.success("Vehicle deleted successfully");
      setVehicleToDelete(null);
      loadVehicles();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Failed to delete vehicle";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    if (!vehicles.length) {
      toast.info("No vehicles to export.");
      return;
    }

    const columns: CsvColumn<Vehicle>[] = [
      { header: "Vehicle Name", accessor: (v) => v.vehicleName || "" },
      { header: "Vehicle Number", accessor: (v) => v.vehicleNumber || "" },
      { header: "Driver Name", accessor: (v) => v.driverName || "-" },
      { header: "Initial Asset Price", accessor: (v) => (v.asset?.initialPrice ? formatCurrency(v.asset.initialPrice) : "—") },
      { header: "Purchase Date", accessor: (v) => (v.asset?.purchaseDate ? new Date(v.asset.purchaseDate).toLocaleDateString() : "—") },
      { header: "Assigned Students", accessor: (v) => v._count?.assignments ?? 0 },
      { header: "Linked Expenses", accessor: (v) => v._count?.expenses ?? 0 },
      {
        header: "Created Date",
        accessor: (v) => (v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "-"),
      },
    ];

    const success = exportToCsv({
      filename: "transport_vehicles",
      columns,
      data: vehicles,
    });

    if (success) {
      toast.success(`Exported ${vehicles.length} vehicles successfully.`);
    }
  };

  return (
    <section className="px-3 sm:px-6 py-4">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button variant="outline" size="icon" className="text-white shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-950 dark:text-white">Transport</h1>
            <p className="text-xs sm:text-sm leading-6 text-slate-600 dark:text-slate-600">Manage transport vehicles, registration numbers, seating capacities, and drivers.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="w-full sm:w-auto shrink-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            onClick={handleExportCsv}
            disabled={vehicles.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <PermissionGate permission="vehicle.createVehicleButton">
            <Button
              onClick={() => {
                setEditingId(null);
                setVehicleName("");
                setVehicleNumber("");
                setDriverStaffId("");
                setDriverName("");
                setInitialPrice("");
                setPurchaseDate("");
                setOpen(true);
              }}
              className="
                              w-full sm:w-auto shrink-0
                              bg-[#556043]
                              text-white
                              hover:bg-[#4a533b]
                              dark:bg-slate-100
                              dark:text-slate-900
                              dark:hover:bg-slate-200
                            "
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Vehicle
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="flex justify-end">
        <ReusableFormDialog
          open={open}
          onOpenChange={setOpen}
          theme="vehicle"
          title={editingId ? "Edit Vehicle" : "Create Vehicle"}
          description={
            editingId
              ? "Update vehicle information."
              : "Add a new vehicle and assign driver information."
          }
          isEditing={!!editingId}
          isSaving={loading}
          submitLabel="Save"
          editSubmitLabel="Update"
          fields={[
            { type: "text", name: "vehicleName", label: "Vehicle Name", placeholder: "School Bus", required: true },
            { type: "text", name: "vehicleNumber", label: "Vehicle Number", placeholder: "KL 01 AB 1234", required: true },
            {
              type: "select",
              name: "driverStaffId",
              label: "Assigned Driver (Staff Member)",
              placeholder: staffList.length ? "Select driver from staff..." : "Loading staff directory...",
              options: staffList.map((s) => ({
                label: `${s.name} (${s.employeeCode})`,
                value: s.id,
              })),
              required: true,
            },
            { type: "number", name: "initialPrice", label: "Initial Asset Cost (₹, optional)", placeholder: "e.g. 1500000" },
            { type: "date", name: "purchaseDate", label: "Purchase Date (optional)" },
          ]}
          values={{ vehicleName, vehicleNumber, driverStaffId, driverName, initialPrice, purchaseDate }}
          onChange={(name, value) => {
            if (name === "vehicleName") setVehicleName(value)
            if (name === "vehicleNumber") setVehicleNumber(value)
            if (name === "driverStaffId") {
              setDriverStaffId(value)
              const matched = staffList.find((s) => s.id === value)
              if (matched) setDriverName(matched.name)
            }
            if (name === "driverName") setDriverName(value)
            if (name === "initialPrice") setInitialPrice(value)
            if (name === "purchaseDate") setPurchaseDate(value)
          }}
          onSubmit={handleSaveVehicle}
        />
      </div>

      {loadingVehicles ? (
        <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-16 px-4 text-center dark:border-slate-800">
          <Bus className="h-6 w-6 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No vehicles yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Create a vehicle to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="
                        group
                        relative
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-100
                        bg-white
                        p-3
                        shadow-sm
                        transition-all
                        duration-300
                        hover:-translate-y-0.5
                        hover:shadow-md
                        dark:border-slate-800/80
                        dark:bg-slate-900
                      "
            >
              {/* Decorative Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="flex flex-col gap-3">
                {/* Header Content */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Compact Icon Badge */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                      <Bus className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {vehicle.vehicleName}
                      </h3>
                      <p className="truncate text-xs font-medium text-slate-400 dark:text-slate-500">
                        {vehicle.vehicleNumber}
                      </p>
                    </div>
                  </div>

                  {/* Sleek Action Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <PermissionGate permission="vehicle.editVehicleButton">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditClick(vehicle)}
                      className="
                                h-7
                                w-7
                                shrink-0
                                rounded-md
                                text-slate-400
                                hover:bg-slate-50
                                hover:text-orange-600
                                dark:text-slate-500
                                dark:hover:bg-slate-800
                                dark:hover:text-orange-400
                              "
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    </PermissionGate>
                    <PermissionGate permission="vehicle.deleteVehicleButton">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setVehicleToDelete(vehicle)}
                      className="
                                h-7
                                w-7
                                shrink-0
                                rounded-md
                                text-slate-400
                                hover:bg-red-50
                                hover:text-red-600
                                dark:text-slate-500
                                dark:hover:bg-red-950/30
                                dark:hover:text-red-400
                              "
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    </PermissionGate>
                  </div>
                </div>


                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-slate-800/60" />

                {/* Compact Driver & Assignment Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50/50 p-2 dark:bg-slate-800/40">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                        Driver:
                      </span>
                      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {vehicle.driverStaff?.name || vehicle.driverName || "—"}
                      </span>
                      {vehicle.driverStaff?.employeeCode && (
                        <span className="rounded bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300">
                          {vehicle.driverStaff.employeeCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student Assignment Count */}
                  <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Enrollments:
                    </span>
                    {(vehicle._count?.assignments ?? 0) > 0 ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {vehicle._count?.assignments} assigned
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-medium">
                        0 assigned
                      </span>
                    )}
                  </div>

                  {Boolean((vehicle.asset?.initialPrice ?? 0) > 0) && (
                    <div className="flex items-center justify-between gap-2 px-1 text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-400 dark:text-slate-500">Asset Value:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                        {formatCurrency(vehicle.asset?.initialPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AlertDialog
        open={!!vehicleToDelete}
        onOpenChange={(open) => {
          if (!open) setVehicleToDelete(null);
        }}
      >
        <AlertDialogContent className="w-[92vw] sm:max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{vehicleToDelete?.vehicleName}"?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block text-slate-200 dark:text-slate-400">
                This will permanently delete this vehicle. This action cannot be undone.
              </span>

              {Boolean((vehicleToDelete?._count?.assignments ?? 0) > 0) && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Cannot Delete: Student Enrollments Exist</span>
                    <span>
                      {vehicleToDelete?._count?.assignments} student enrollment{vehicleToDelete?._count?.assignments! > 1 ? "s are" : " is"} currently assigned to this vehicle. Please unassign or reassign these students before deleting.
                    </span>
                  </div>
                </div>
              )}

              {Boolean((vehicleToDelete?._count?.expenses ?? 0) > 0) && !(Boolean((vehicleToDelete?._count?.assignments ?? 0) > 0)) && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Cannot Delete: Expense Records Exist</span>
                    <span>
                      {vehicleToDelete?._count?.expenses} expense record(s) are associated with this vehicle.
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting || Boolean((vehicleToDelete?._count?.assignments ?? 0) > 0) || Boolean((vehicleToDelete?._count?.expenses ?? 0) > 0)}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteVehicle();
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>

  )
}