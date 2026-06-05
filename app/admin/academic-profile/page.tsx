"use client";
import { ArrowLeft, X, Plus, Eye, Car, RefreshCw, Pencil, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


export default function Page() {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [fromOpen, setFromOpen] = useState(false);
  const [toDate, setToDate] = useState<Date>();
  const [toOpen, setToOpen] = useState(false);
  const academicYears = [
    {
      id: 1,
      year: "2025 - 2026",
      isDefault: true,
    },
    {
      id: 2,
      year: "2024 - 2025",
      isDefault: false,
    },
    {
      id: 3,
      year: "2023 - 2024",
      isDefault: false,
    },
  ];
  return (
    <section className="px-6 py-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Academic Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage academic years and related settings.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <Card className="w-full">
          <CardHeader className="flex  items-center justify-between">
            <CardTitle className="text-2xl font-semibold">Academic Years</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="icon">
                        <RefreshCw className="h-6 w-6" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>

                  <TooltipContent >
                    <p>Switch Academic Year</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent className="[&>button]:hidden">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-semibold">
                      Academic Year
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                      <Button size="sm"
                        onClick={() => setCreateOpen(true)}
                      >
                        <Plus className=" h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  {academicYears.map((year) => (
                    <div
                      key={year.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <h3 className="font-medium">{year.year}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {year.isDefault ? (
                          <Button
                            variant="secondary"
                            disabled
                          >
                            Default
                          </Button>
                        ) : (
                          <Button>
                            Set Default
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogContent className="[&>button]:hidden">
                <DialogHeader>
                  <DialogTitle>Create Academic Year</DialogTitle>
                  <DialogDescription>
                    Create a new academic year.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">
                      Academic Name
                    </label>

                    <Input
                      placeholder="2026 - 2027"
                      className="mt-2"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        From
                      </label>

                      <Popover open={fromOpen} onOpenChange={setFromOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fromDate ? format(fromDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={(date) => {
                              setFromDate(date);
                              setFromOpen(false); // closes calendar
                            }}

                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        To
                      </label>

                      <Popover open={toOpen} onOpenChange={setToOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {toDate ? format(toDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={(Date) =>{
                              setToDate(Date);
                              setToOpen(false); // closes calendar
                            }}

                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>
      </div>
    </section>

  )
}
