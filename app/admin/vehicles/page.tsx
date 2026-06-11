"use client"
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createVehicle, getVehicles, type Vehicle } from "@/lib/services/vehicle";

import { ArrowLeft, Plus, Bus, User, Hash, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter()

  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");

  const handleCreateVehicle = async () => {
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
    setLoading(true)
    try {
      const payload = {
        vehicleName,
        vehicleNumber,
        driverName,
      };

      console.log("Payload:", payload);

      const response = await createVehicle(payload);

      console.log("API Response:", response);

      toast.success("Vehicle created successfully");

      // Reset form
      setVehicleName("");
      setVehicleNumber("");
      setDriverName("");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create vehicle");
    } finally {
      setLoading(false)
    }
  };

  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error(error);
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
              className="
                      bg-[#556043]
                      text-white
                      hover:bg-[#4a533b]
                      dark:bg-slate-100
                      dark:text-slate-900
                      dark:hover:bg-slate-200
                    "
            >
              <Plus className="h-4 w-4 mr-2" />
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
                  Create Vehicle
                </DialogTitle>

                <DialogDescription className="text-slate-200">
                  Add a new vehicle and assign driver information.
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
                onClick={handleCreateVehicle}
                disabled={loading}
                className="rounded-full bg-white text-[#556043]"
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="
                        group
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        dark:bg-slate-900
                        dark:border-slate-800
                        shadow-sm
                        transition-all
                        duration-300
                        hover:-translate-y-1
                        hover:shadow-lg
                      "
          >
            {/* Header */}
            <div
              className="
                          px-4 py-3
                          border-b
                          bg-gradient-to-r
                          from-[#556043]
                          to-[#687556]
                          dark:from-slate-900
                          dark:to-slate-800
                          dark:border-slate-800
                        "
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
                    <Bus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">
                      {vehicle.vehicleName}
                    </h3>

                    <p className="truncate text-xs text-slate-200 dark:text-slate-400">
                      {vehicle.vehicleNumber}
                    </p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="
                              h-8 w-8
                              rounded-lg
                              text-white
                              hover:bg-white/20
                              hover:text-white
                              dark:hover:bg-slate-700
                            "
                >
                  <Pencil className="h-4 w-4 text-red" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-3 p-4">
              {/* Driver */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-500/10">
                  <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Driver
                  </p>

                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {vehicle.driverName}
                  </p>
                </div>
              </div>

              {/* Vehicle Number */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Vehicle Number
                </p>

                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {vehicle.vehicleNumber}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

  )
}
