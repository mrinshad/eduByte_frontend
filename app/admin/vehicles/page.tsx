"use client"
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  createVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
} from "@/lib/services/vehicle";

import { ArrowLeft, Plus, Bus, User, Hash, Pencil, Trash2 } from "lucide-react"
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
  const [driverName, setDriverName] = useState("");

  const handleSaveVehicle = async () => {
    if (!vehicleName.trim()) {
      toast.error("Please enter vehicle name");
      return;
    }

    if (!vehicleNumber.trim()) {
      toast.error("Please enter vehicle number");
      return;
    }

    if (!driverName.trim()) {
      toast.error("Please enter driver name");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        vehicleName,
        vehicleNumber,
        driverName,
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
      setDriverName("");
      setEditingId(null);

      setOpen(false);

      loadVehicles();
    } catch (error) {
      console.error(error);

      toast.error(
        editingId
          ? "Failed to update vehicle"
          : "Failed to create vehicle"
      );
    } finally {
      setLoading(false);
    }
  };
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loadingVehicles, setLoadingVehicles] = useState(true);


  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

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

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);

    setVehicleName(vehicle.vehicleName);
    setVehicleNumber(vehicle.vehicleNumber);
    setDriverName(vehicle.driverName);

    setOpen(true);
  };
  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      setIsDeleting(true);
      await deleteVehicle(vehicleToDelete.id);
      toast.success("Vehicle deleted successfully");
      setVehicleToDelete(null);
      loadVehicles();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete vehicle");
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <section className="px-6 py-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Vehicles</h1>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-600">Manage vehicle records, assignments, routes, and transport-related information.</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setVehicleName("");
                setVehicleNumber("");
                setDriverName("");
              }}
              className="
                          bg-[#556043]
                          text-white
                          hover:bg-[#4a533b]
                          dark:bg-slate-100
                          dark:text-slate-900
                          dark:hover:bg-slate-200
                        "
            >
              <Plus className="h-4 w-4 mr-2 dark:text-slate-900" />
              Create Vehicle
            </Button>
          </DialogTrigger>

          <DialogContent
            className="
                          w-[95vw]
                          max-w-md
                          sm:max-w-lg
                          bg-[#5f694d]
                          dark:bg-slate-900
                          text-white
                          dark:text-slate-100
                          border
                          border-[#6a7459]
                          dark:border-slate-800
                          rounded-2xl
                          p-0
                          overflow-hidden
                        "
          >
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-white">
                  {editingId ? "Edit Vehicle" : "Create Vehicle"}
                </DialogTitle>

                <DialogDescription className="text-slate-200">
                  {editingId
                    ? "Update vehicle information."
                    : "Add a new vehicle and assign driver information."}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-white">Vehicle Name</Label>
                  <Input
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    placeholder="School Bus"
                    className="
                                bg-[#667155]
                                border-[#8b9478]
                                text-white
                                dark:bg-slate-800
                                dark:border-slate-700
                                dark:text-slate-100
                              "
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Vehicle Number</Label>
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="KL 01 AB 1234"
                    className="
                                bg-[#667155]
                                border-[#8b9478]
                                text-white
                                dark:bg-slate-800
                                dark:border-slate-700
                                dark:text-slate-100
                              "
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Driver Name</Label>
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="John Mathew"
                    className="
                                bg-[#667155]
                                border-[#8b9478]
                                text-white
                                dark:bg-slate-800
                                dark:border-slate-700
                                dark:text-slate-100
                              "
                  />
                </div>
              </div>
            </div>

            <DialogFooter
              className="
                            bg-[#6a7459]
                            dark:bg-slate-950
                            border-t
                            dark:border-slate-800
                            p-6
                            flex-row
                            justify-end
                            gap-3
                          "
            >
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-full border-[#8b9478] bg-transparent text-white"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSaveVehicle}
                disabled={loading}
                className="rounded-full bg-white text-[#556043]"
              >
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Update"
                    : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loadingVehicles ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
          <Bus className="h-6 w-6 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No vehicles yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Create a vehicle to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
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
                  <div>
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
          hover:bg-slate-50
          hover:text-red-600
          dark:text-slate-500
          dark:hover:bg-slate-800
          dark:hover:text-red-400
        "
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>


                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-slate-800/60" />

                {/* Compact Driver Info */}
                <div className="flex items-center gap-2 rounded-lg bg-slate-50/50 p-2 dark:bg-slate-800/40">
                  <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      Driver:
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {vehicle.driverName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AlertDialog open={!!vehicleToDelete} onOpenChange={(open) => { if (!open) setVehicleToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{vehicleToDelete?.vehicleName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this vehicle ({vehicleToDelete?.vehicleNumber}). This can't be undone, and it may fail if the vehicle is linked to routes or students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteVehicle()
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>

  )
}