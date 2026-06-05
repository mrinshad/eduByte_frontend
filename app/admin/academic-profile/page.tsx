"use client"

import * as React from "react"
import {
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Check,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  AcademicYearSummary,
  createAcademicYear,
  getAcademicYearById,
  getAcademicYears,
  getDefaultAcademicYear,
  setDefaultAcademicYear,
  updateAcademicYear,
} from "@/lib/services/academicYear"
import { refreshCurrentAcademicYear } from "@/lib/academic-year-store"
import {
  createClass,
  getClasses,
  type SchoolClass,
  updateClass,
} from "@/lib/services/class"
import {
  createDivisions,
  getDivisions,
  type Division,
  updateDivision,
} from "@/lib/services/division"

const titleTextClass = "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-100"
const supportingTextClass = "text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-300"
const subtleTextClass = "text-white/85 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-400"
const editIconClass = "rounded-xl text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] hover:text-white dark:text-slate-300 dark:hover:text-amber-300"
const inputTextClass = "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] placeholder:text-white/85"

function AddAction({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={onAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export default function Page() {
  const [academicYears, setAcademicYears] = React.useState<AcademicYearSummary[]>([])
  const [defaultAcademicYearName, setDefaultAcademicYearName] = React.useState("")

  const [yearDialogOpen, setYearDialogOpen] = React.useState(false)
  const [createYearOpen, setCreateYearOpen] = React.useState(false)
  const [yearNameDraft, setYearNameDraft] = React.useState("")
  const [fromDate, setFromDate] = React.useState<Date>()
  const [fromOpen, setFromOpen] = React.useState(false)
  const [toDate, setToDate] = React.useState<Date>()
  const [toOpen, setToOpen] = React.useState(false)

  const [classes, setClasses] = React.useState<SchoolClass[]>([])
  const [divisionsByClassId, setDivisionsByClassId] = React.useState<Record<string, Division[]>>({})
  const [selectedClassId, setSelectedClassId] = React.useState("")
  const [selectedDivisionId, setSelectedDivisionId] = React.useState("")
  const [classDialogOpen, setClassDialogOpen] = React.useState(false)
  const [classDialogMode, setClassDialogMode] = React.useState<"add" | "edit">("add")
  const [divisionDialogOpen, setDivisionDialogOpen] = React.useState(false)
  const [divisionDialogMode, setDivisionDialogMode] = React.useState<"add" | "edit">("add")
  const [classNameDraft, setClassNameDraft] = React.useState("")
  const [divisionNameDraft, setDivisionNameDraft] = React.useState("")

  const selectedClass = React.useMemo(
    () => classes.find((entry) => entry.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  )

  const selectedDivision = React.useMemo(
    () => (divisionsByClassId[selectedClassId] ?? []).find((entry) => entry.id === selectedDivisionId) ?? null,
    [divisionsByClassId, selectedClassId, selectedDivisionId],
  )

  const selectedDivisions = divisionsByClassId[selectedClassId] ?? []

  const currentAcademicYear = academicYears.find((year) => year.isActive)?.name || defaultAcademicYearName || "Academic Year"

  const [editingYearId, setEditingYearId] = React.useState<string | null>(null)
  const [editingYearNameDraft, setEditingYearNameDraft] = React.useState("")
  const [editingYearStartDate, setEditingYearStartDate] = React.useState<Date>()
  const [editingYearEndDate, setEditingYearEndDate] = React.useState<Date>()

  async function openYearEdit(year: AcademicYearSummary) {
    setEditingYearId(year.id)

    try {
      const details = await getAcademicYearById(year.id)

      if (details) {
        setEditingYearNameDraft(details.name)
        setEditingYearStartDate(new Date(details.startDate))
        setEditingYearEndDate(new Date(details.endDate))
        return
      }
    } catch {
      // fall back to the summary data already available in the row
    }

    setEditingYearNameDraft(year.name)
    setEditingYearStartDate(undefined)
    setEditingYearEndDate(undefined)
  }

  function closeYearEdit() {
    setEditingYearId(null)
    setEditingYearNameDraft("")
    setEditingYearStartDate(undefined)
    setEditingYearEndDate(undefined)
  }

  React.useEffect(() => {
    async function loadInitialData() {
      try {
        const [yearList, defaultYear, classList] = await Promise.all([
          getAcademicYears(),
          getDefaultAcademicYear(),
          getClasses(),
        ])

        setAcademicYears(yearList)
        setDefaultAcademicYearName(defaultYear?.name ?? "")
        setClasses(classList)

        if (classList.length > 0) {
          setSelectedClassId((current) => current || classList[0].id)
        }

        const divisionEntries = await Promise.all(
          classList.map(async (schoolClass) => [schoolClass.id, await getDivisions(schoolClass.id)] as const),
        )
        setDivisionsByClassId(Object.fromEntries(divisionEntries))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load data")
      }
    }

    void loadInitialData()
  }, [])

  React.useEffect(() => {
    const currentDivisions = divisionsByClassId[selectedClassId] ?? []
    setSelectedDivisionId(currentDivisions[0]?.id ?? "")
  }, [divisionsByClassId, selectedClassId])

  React.useEffect(() => {
    if (yearDialogOpen) {
      void (async () => {
        try {
          setAcademicYears(await getAcademicYears())
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to load academic years")
        }
      })()
    }
  }, [yearDialogOpen])

  function openClassDialog(mode: "add" | "edit") {
    setClassDialogMode(mode)
    setClassNameDraft(mode === "edit" ? selectedClass?.name ?? "" : "")
    setClassDialogOpen(true)
  }

  function openDivisionDialog(mode: "add" | "edit") {
    setDivisionDialogMode(mode)
    setDivisionNameDraft(mode === "edit" ? selectedDivision?.name ?? "" : "")
    setDivisionDialogOpen(true)
  }

  function closeClassDialog() {
    setClassDialogOpen(false)
    setClassNameDraft("")
  }

  function closeDivisionDialog() {
    setDivisionDialogOpen(false)
    setDivisionNameDraft("")
  }

  return (
    <TooltipProvider>
      <section className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Academic Profile</h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Manage academic years and related settings.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-black/5 dark:border-white/10">
              <div>
                <CardDescription className={`text-xs uppercase tracking-[0.28em] ${subtleTextClass}`}>
                  Current Academic Year
                </CardDescription>
                <CardTitle className={`mt-2 text-2xl font-semibold ${titleTextClass}`}>
                  {currentAcademicYear}
                </CardTitle>
                <CardDescription className={`mt-1 ${supportingTextClass}`}>
                  Use the switch button to change the active academic year.
                </CardDescription>
              </div>

              <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-xl">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch Academic Year</p>
                  </TooltipContent>
                </Tooltip>

                <DialogContent showCloseButton={false} className="sm:max-w-2xl text-slate-950 dark:text-slate-50">
                  <DialogHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <DialogTitle className={`text-xl font-semibold ${titleTextClass}`}>Academic Year</DialogTitle>
                        <DialogDescription className={supportingTextClass}>
                          Select the year you want to work in or create a new one.
                        </DialogDescription>
                      </div>

                      <Button size="sm" onClick={() => setCreateYearOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </DialogHeader>

                  <div className="space-y-3 py-2">
                    {academicYears.map((year) => (
                      <div
                        key={year.id}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border p-4 transition-colors",
                          year.isActive
                            ? "border-amber-500/50 bg-amber-500/[0.08] shadow-sm"
                            : "border-black/5 bg-white dark:border-white/10 dark:bg-white/5",
                        )}
                      >
                        {editingYearId === year.id ? (
                          <div className="w-full">
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Academic Name</label>
                                <Input className="mt-2" value={editingYearNameDraft} onChange={(e) => setEditingYearNameDraft(e.target.value)} />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">From</label>
                                  <DatePicker
                                    value={editingYearStartDate}
                                    onChange={setEditingYearStartDate}
                                    placeholder="Select date"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">To</label>
                                  <DatePicker
                                    value={editingYearEndDate}
                                    onChange={setEditingYearEndDate}
                                    placeholder="Select date"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => { closeYearEdit(); toast.message("Cancelled"); }}>
                                  <X className="h-4 w-4" />
                                </Button>

                                <Button size="icon" onClick={() => {
                                  void (async () => {
                                    try {
                                      await updateAcademicYear(String(year.id), {
                                        name: editingYearNameDraft,
                                        startDate: (editingYearStartDate || new Date()).toISOString(),
                                        endDate: (editingYearEndDate || new Date()).toISOString(),
                                      })

                                      setAcademicYears((prev) => prev.map((item) => item.id === year.id ? { ...item, name: editingYearNameDraft || item.name } : item))
                                        await refreshCurrentAcademicYear()
                                      closeYearEdit()
                                      toast.success("Saved")
                                    } catch (error) {
                                      toast.error(error instanceof Error ? error.message : "Failed to save academic year")
                                    }
                                  })()
                                }}>
                                  <Check className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <h3 className={cn("font-semibold", year.isActive ? "text-slate-950 dark:text-slate-50" : "text-slate-950 dark:text-slate-100")}>{year.name}</h3>
                              <p className={cn("mt-1 text-xs", year.isActive ? "font-medium text-slate-700 dark:text-slate-200" : "text-slate-600 dark:text-slate-400")}>
                                {year.isActive ? "Current active year" : "Archived year"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon-sm" className={cn(editIconClass, "border-white/30 bg-white/10 hover:bg-white/20")} onClick={() => { void openYearEdit(year) }}>
                                <Pencil className="h-4 w-4" />
                              </Button>

                              {year.isActive ? (
                                <Button variant="secondary" disabled>
                                  Default
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => {
                                    void (async () => {
                                      try {
                                        await setDefaultAcademicYear(year.id)
                                        setAcademicYears((prev) => prev.map((item) => ({ ...item, isActive: item.id === year.id })))
                                        setDefaultAcademicYearName(year.name)
                                        await refreshCurrentAcademicYear()
                                        toast.success("Default academic year updated")
                                      } catch (error) {
                                        toast.error(error instanceof Error ? error.message : "Failed to set default academic year")
                                      }
                                    })()
                                  }}
                                >
                                  Set Default
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setYearDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={createYearOpen} onOpenChange={setCreateYearOpen}>
                <DialogContent className="sm:max-w-xl text-slate-950 dark:text-slate-50">
                  <DialogHeader>
                    <DialogTitle className={titleTextClass}>Create Academic Year</DialogTitle>
                    <DialogDescription className={supportingTextClass}>
                      Create a new academic year.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Academic Name</label>
                      <Input placeholder="2026 - 2027" className="mt-2" value={yearNameDraft} onChange={(event) => setYearNameDraft(event.target.value)} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">From</label>
                                  <DatePicker value={fromDate} onChange={setFromDate} placeholder="Select date" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">To</label>
                        <DatePicker value={toDate} onChange={setToDate} placeholder="Select date" />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateYearOpen(false)}>
                      Cancel
                    </Button>

                    <Button
                      onClick={() => {
                        void (async () => {
                          try {
                            await createAcademicYear({
                              name: yearNameDraft,
                              startDate: (fromDate || new Date()).toISOString(),
                              endDate: (toDate || new Date()).toISOString(),
                            })
                            await refreshCurrentAcademicYear()
                            setYearDialogOpen(false)
                            setCreateYearOpen(false)
                            setYearNameDraft("")
                            setFromDate(undefined)
                            setToDate(undefined)
                            setAcademicYears(await getAcademicYears())
                            toast.success("Academic year created")
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Failed to create academic year")
                          }
                        })()
                      }}
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <CardTitle className={`text-2xl font-semibold ${titleTextClass}`}>Class</CardTitle>
                  <CardDescription className={`mt-1 ${supportingTextClass}`}>
                    Select a class to see its divisions.
                  </CardDescription>
                </div>

                <AddAction onAdd={() => openClassDialog("add")} />
              </CardHeader>

              <CardContent className="space-y-2 pt-4">
                {classes.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-amber-500/30 bg-amber-50/80 px-5 py-6 text-center dark:border-amber-400/25 dark:bg-amber-400/10">
                    <p className={`text-sm font-medium ${titleTextClass}`}>No classes yet</p>
                    <p className={`mt-1 text-sm ${supportingTextClass}`}>
                      Click here to add classes before creating divisions.
                    </p>
                    <Button className="mt-4 rounded-xl" onClick={() => openClassDialog("add")}>
                      Click here to add classes
                    </Button>
                  </div>
                ) : (
                  classes.map((schoolClass) => {
                  const isActive = schoolClass.id === selectedClassId

                  return (
                    <div
                      key={schoolClass.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedClassId(schoolClass.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setSelectedClassId(schoolClass.id)
                        }
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer",
                        isActive
                          ? "border-amber-500/40 bg-amber-100/90 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10"
                          : "border-black/5 bg-white/80 hover:border-black/10 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                        <Layers3 className={cn("h-4 w-4", isActive ? "text-amber-700 dark:text-amber-300" : "text-slate-400")} />
                        <span className="font-medium text-slate-950 dark:text-slate-100">{schoolClass.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-black/5 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                          {schoolClass.divisionCount} divisions
                        </span>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={editIconClass}
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedClassId(schoolClass.id)
                            openClassDialog("edit")
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                  })
                )}
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <CardTitle className={`text-2xl font-semibold ${titleTextClass}`}>Division</CardTitle>
                  <CardDescription className={`mt-1 ${supportingTextClass}`}>
                    {!selectedClass
                      ? "Select a class to see its divisions."
                      : selectedDivisions.length === 0
                        ? "No divisions yet."
                        : `${selectedClass.name} divisions are shown here.`}
                  </CardDescription>
                </div>

                <AddAction onAdd={() => openDivisionDialog("add")} />
              </CardHeader>

              <CardContent className="space-y-3 pt-4">
                {!selectedClass ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                    <p className={`text-sm font-medium ${titleTextClass}`}>No class selected</p>
                    <Button className="mt-4 rounded-xl" onClick={() => openClassDialog("add")}>
                      Add class
                    </Button>
                  </div>
                ) : selectedDivisions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                    <p className={`text-sm font-medium ${titleTextClass}`}>No divisions yet</p>
                    <Button className="mt-4 rounded-xl" onClick={() => openDivisionDialog("add")}>
                      Add division
                    </Button>
                  </div>
                ) : (
                  selectedDivisions.map((division) => {
                    const isActive = division.id === selectedDivisionId

                    return (
                      <div
                        key={`${selectedClass?.id}-${division.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDivisionId(division.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setSelectedDivisionId(division.id)
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer",
                          isActive
                            ? "border-amber-500/40 bg-amber-100/90 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10"
                            : "border-black/5 bg-white/80 dark:border-white/10 dark:bg-white/5",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <span className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
                            isActive ? "bg-amber-600 text-white dark:bg-amber-300 dark:text-slate-950" : "bg-slate-950 text-white dark:bg-white dark:text-slate-950",
                          )}>
                            {division.name}
                          </span>

                          <div className="min-w-0">
                            <p className="font-medium text-slate-950 dark:text-slate-100">Division {division.name}</p>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                              {selectedClass?.name} - Division {division.name}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={editIconClass}
                          onClick={(event) => {
                            event.stopPropagation()
                            openDivisionDialog("edit")
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })
                )}

              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
          <DialogContent className="sm:max-w-xl text-slate-950 dark:text-slate-50">
            <DialogHeader>
              <DialogTitle className={titleTextClass}>
                {classDialogMode === "add" ? "Add Class" : "Edit Class"}
              </DialogTitle>
              <DialogDescription className={supportingTextClass}>
                {classDialogMode === "add"
                  ? "Create a new class and keep the same styling language."
                  : "Update the selected class details."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-3">
                <label className={cn("text-sm font-medium", supportingTextClass)}>Class Name</label>
                <Input
                  className={cn(inputTextClass, "mt-2")}
                  value={classNameDraft}
                  onChange={(event) => setClassNameDraft(event.target.value)}
                  placeholder="Example: Grade 5 - Morning Session"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeClassDialog}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  void (async () => {
                    try {
                      if (classDialogMode === "add") {
                        await createClass(classNameDraft)
                      } else if (selectedClassId) {
                        await updateClass(selectedClassId, classNameDraft)
                      }

                      setClasses(await getClasses())
                      if (selectedClassId) {
                        toast.success(classDialogMode === "add" ? "Class created" : "Class updated")
                      }
                      closeClassDialog()
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to save class")
                    }
                  })()
                }}
              >
                {classDialogMode === "add" ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={divisionDialogOpen} onOpenChange={setDivisionDialogOpen}>
          <DialogContent className="sm:max-w-xl text-slate-950 dark:text-slate-50">
            <DialogHeader>
              <DialogTitle className={titleTextClass}>
                {divisionDialogMode === "add" ? "Add Division" : "Edit Division"}
              </DialogTitle>
              <DialogDescription className={supportingTextClass}>
                {divisionDialogMode === "add"
                  ? `Create a division under ${selectedClass?.name || "the selected class"}.`
                  : "Update the selected division details."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-3">
                <label className={cn("text-sm font-medium", supportingTextClass)}>Division Name</label>
                <Input
                  className={cn(inputTextClass, "mt-2")}
                  value={divisionNameDraft}
                  onChange={(event) => setDivisionNameDraft(event.target.value)}
                  placeholder="Example: Division A - Primary Block"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDivisionDialog}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  void (async () => {
                    try {
                      if (!selectedClassId) {
                        throw new Error("Select a class first")
                      }

                      if (divisionDialogMode === "add") {
                        await createDivisions(selectedClassId, [divisionNameDraft])
                      } else if (selectedDivisionId) {
                        await updateDivision(selectedDivisionId, divisionNameDraft)
                      }

                      const updatedClasses = await getClasses()
                      const updatedDivisions = await getDivisions(selectedClassId)

                      setClasses(updatedClasses)
                      setDivisionsByClassId((current) => ({
                        ...current,
                        [selectedClassId]: updatedDivisions,
                      }))
                      toast.success(divisionDialogMode === "add" ? "Division created" : "Division updated")
                      closeDivisionDialog()
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to save division")
                    }
                  })()
                }}
              >
                {divisionDialogMode === "add" ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </TooltipProvider>
  )
}