"use client"

import * as React from "react"
import { useState } from "react"
import { format } from "date-fns"
import {
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Check,
  X,
  Loader2,
  Trash2,
  CalendarIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
  deleteAcademicYear,
} from "@/lib/services/academicYear"
import { refreshCurrentAcademicYear } from "@/lib/academic-year-store"
import {
  createClass,
  getClasses,
  type SchoolClass,
  updateClass,
  deleteClass,
} from "@/lib/services/class"
import {
  createDivisions,
  getDivisions,
  type Division,
  updateDivision,
  deleteDivision,
} from "@/lib/services/division"

import { ReusableFormDialog, type FormField } from "@/components/common/resusable-dialoge-form"


const titleTextClass = "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-100"
const supportingTextClass = "text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-300"
const subtleTextClass = "text-white/85 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-400"
const editIconClass = "rounded-xl text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] hover:text-white dark:text-slate-300 dark:hover:text-amber-300"
const deleteIconClass = "rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
const inputTextClass = "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] placeholder:text-white/85"

const minCalendarDate = new Date(2020, 0, 1)
const maxCalendarDate = new Date(2050, 11, 31)

function AddAction({ onAdd, disabled }: { onAdd: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={onAdd} disabled={disabled}>
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

function RowSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="h-14 w-full animate-pulse rounded-2xl border border-black/5 bg-slate-200/70 dark:border-white/10 dark:bg-white/5"
        />
      ))}
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
  const [classFormErrors, setClassFormErrors] = React.useState<Record<string, string | undefined>>({})
  const [divisionFormErrors, setDivisionFormErrors] = React.useState<Record<string, string | undefined>>({})
  const [editingClassId, setEditingClassId] = React.useState("")
  const [editingDivisionId, setEditingDivisionId] = React.useState("")

  const [isInitialLoading, setIsInitialLoading] = React.useState(true)

  const [isCreatingYear, setIsCreatingYear] = React.useState(false)
  const [savingYearId, setSavingYearId] = React.useState<string | null>(null)
  const [settingDefaultYearId, setSettingDefaultYearId] = React.useState<string | null>(null)
  const [isSavingClass, setIsSavingClass] = React.useState(false)
  const [isSavingDivision, setIsSavingDivision] = React.useState(false)

  const [classToDelete, setClassToDelete] = React.useState<SchoolClass | null>(null)
  const [divisionToDelete, setDivisionToDelete] = React.useState<Division | null>(null)
  const [isDeletingClass, setIsDeletingClass] = React.useState(false)
  const [isDeletingDivision, setIsDeletingDivision] = React.useState(false)

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
  const [editFromOpen, setEditFromOpen] = React.useState(false)
  const [editToOpen, setEditToOpen] = React.useState(false)

  const [yearToDelete, setYearToDelete] = useState<AcademicYearSummary | null>(null)
  const [isDeletingYear, setIsDeletingYear] = useState(false)

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
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't load full details for this academic year — dates may be inaccurate until you re-select them."
      )
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
      setIsInitialLoading(true)
      try {
        const [yearList, defaultYear, classList] = await Promise.all([
          getAcademicYears(),
          getDefaultAcademicYear(),
          getClasses(),
        ])

        setAcademicYears(yearList)
        setDefaultAcademicYearName(defaultYear?.name ?? "")
        setClasses(classList)

        const divisionEntries = await Promise.all(
          classList.map(async (schoolClass) => [schoolClass.id, await getDivisions(schoolClass.id)] as const),
        )
        setDivisionsByClassId(Object.fromEntries(divisionEntries))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setIsInitialLoading(false)
      }
    }

    void loadInitialData()
  }, [])

  React.useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId("")
      return
    }
    setSelectedClassId((current) =>
      current && classes.some((entry) => entry.id === current) ? current : classes[0].id,
    )
  }, [classes])

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

  function openClassDialog(mode: "add" | "edit", target?: SchoolClass) {
    const classToEdit = target ?? selectedClass ?? undefined
    setClassDialogMode(mode)
    setEditingClassId(mode === "edit" ? classToEdit?.id ?? "" : "")
    setClassNameDraft(mode === "edit" ? classToEdit?.name ?? "" : "")
    setClassFormErrors({})
    setClassDialogOpen(true)
  }

  function openDivisionDialog(mode: "add" | "edit", target?: Division) {
    const divisionToEdit = target ?? selectedDivision ?? undefined
    setDivisionDialogMode(mode)
    setEditingDivisionId(mode === "edit" ? divisionToEdit?.id ?? "" : "")
    setDivisionNameDraft(mode === "edit" ? divisionToEdit?.name ?? "" : "")
    setDivisionFormErrors({})
    setDivisionDialogOpen(true)
  }

  function closeClassDialog() {
    setClassDialogOpen(false)
    setClassNameDraft("")
    setEditingClassId("")
    setClassFormErrors({})
  }

  function closeDivisionDialog() {
    setDivisionDialogOpen(false)
    setDivisionNameDraft("")
    setEditingDivisionId("")
    setDivisionFormErrors({})
  }

  async function handleSaveClass() {
    if (!classNameDraft.trim()) {
      setClassFormErrors({ name: "Class name is required" })
      return
    }

    setIsSavingClass(true)
    try {
      const classIdToUpdate = editingClassId || selectedClassId

      if (classDialogMode === "add") {
        await createClass(classNameDraft)
      } else if (classIdToUpdate) {
        await updateClass(classIdToUpdate, classNameDraft)
      }

      setClasses(await getClasses())
      if (classIdToUpdate) {
        toast.success(classDialogMode === "add" ? "A New Class created" : "Class updated")
      }
      closeClassDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save class")
    } finally {
      setIsSavingClass(false)
    }
  }

  async function handleSaveDivision() {
    if (!divisionNameDraft.trim()) {
      setDivisionFormErrors({ name: "Division name is required" })
      return
    }

    setIsSavingDivision(true)
    try {
      if (!selectedClassId) {
        throw new Error("Select a class first")
      }

      const divisionIdToUpdate = editingDivisionId || selectedDivisionId

      if (divisionDialogMode === "add") {
        await createDivisions(selectedClassId, [divisionNameDraft])
      } else if (divisionIdToUpdate) {
        await updateDivision(divisionIdToUpdate, divisionNameDraft)
      }

      const updatedClasses = await getClasses()
      const updatedDivisions = await getDivisions(selectedClassId)

      setClasses(updatedClasses)
      setDivisionsByClassId((current) => ({
        ...current,
        [selectedClassId]: updatedDivisions,
      }))
      toast.success(divisionDialogMode === "add" ? "A New Division created" : "Division updated")
      closeDivisionDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save division")
    } finally {
      setIsSavingDivision(false)
    }
  }

  async function handleDeleteClass() {
    if (!classToDelete) return
    setIsDeletingClass(true)
    try {
      await deleteClass(classToDelete.id)

      const updatedClasses = await getClasses()
      setClasses(updatedClasses)

      if (selectedClassId === classToDelete.id) {
        const nextClassId = updatedClasses[0]?.id ?? ""
        setSelectedClassId(nextClassId)
        setDivisionsByClassId((current) => {
          const next = { ...current }
          delete next[classToDelete.id]
          return next
        })
      }

      toast.success("Class deleted successfully")
      setClassToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete class")
    } finally {
      setIsDeletingClass(false)
    }
  }
  const handleDeleteYear = async () => {
    if (!yearToDelete) return
    if (yearToDelete.isActive) {
      toast.error("Can't delete the current default academic year")
      setYearToDelete(null)
      return
    }
    setIsDeletingYear(true)
    try {
      const result = await deleteAcademicYear(yearToDelete.id)
      if (!result.success) throw new Error(result.message || "Failed to delete academic year")
      setAcademicYears(await getAcademicYears())
      toast.success("Academic year deleted")
      setYearToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete academic year")
    } finally {
      setIsDeletingYear(false)
    }
  }
  async function handleDeleteDivision() {
    if (!divisionToDelete || !selectedClassId) return
    setIsDeletingDivision(true)
    try {
      await deleteDivision(divisionToDelete.id)

      const updatedClasses = await getClasses()
      const updatedDivisions = await getDivisions(selectedClassId)

      setClasses(updatedClasses)
      setDivisionsByClassId((current) => ({
        ...current,
        [selectedClassId]: updatedDivisions,
      }))

      toast.success("Division deleted successfully")
      setDivisionToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete division")
    } finally {
      setIsDeletingDivision(false)
    }
  }

  const calendarTriggerClass = cn(
    "h-10 w-full justify-start rounded-xl border border-slate-300 bg-white px-3 text-left text-sm font-normal shadow-sm outline-none transition",
    "hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40",
    "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
  )

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
          <Card className="w-full dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-black/5  dark:border-white/10">
              <div>
                <CardDescription className={`text-xs uppercase tracking-[0.28em] ${subtleTextClass}`}>
                  Current Academic Year
                </CardDescription>
                <CardTitle className={`mt-2 text-2xl font-semibold ${titleTextClass}`}>
                  {isInitialLoading ? (
                    <span className="inline-block h-7 w-40 animate-pulse rounded-lg bg-white/20" />
                  ) : (
                    currentAcademicYear
                  )}
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

                <DialogContent showCloseButton={false} className="sm:max-w-2xl text-slate-950 dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
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
                    {isInitialLoading && academicYears.length === 0 ? (
                      <RowSkeleton />
                    ) : (
                      academicYears.map((year) => (
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
                                  <Input className="mt-2" value={editingYearNameDraft} onChange={(e) => setEditingYearNameDraft(e.target.value)} disabled={savingYearId === year.id} />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">From</label>
                                    <Popover open={editFromOpen} onOpenChange={setEditFromOpen}>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          disabled={savingYearId === year.id}
                                          className={calendarTriggerClass}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                          <span>
                                            {editingYearStartDate ? format(editingYearStartDate, "PPP") : "Select date"}
                                          </span>
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={editingYearStartDate}
                                          onSelect={(date) => {
                                            setEditingYearStartDate(date ?? undefined)
                                            setEditFromOpen(false)
                                          }}
                                          defaultMonth={editingYearStartDate}
                                          disabled={(date) => date < minCalendarDate || date > maxCalendarDate}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">To</label>
                                    <Popover open={editToOpen} onOpenChange={setEditToOpen}>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          disabled={savingYearId === year.id}
                                          className={calendarTriggerClass}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                          <span>
                                            {editingYearEndDate ? format(editingYearEndDate, "PPP") : "Select date"}
                                          </span>
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={editingYearEndDate}
                                          onSelect={(date) => {
                                            setEditingYearEndDate(date ?? undefined)
                                            setEditToOpen(false)
                                          }}
                                          defaultMonth={editingYearEndDate}
                                          disabled={(date) => date < minCalendarDate || date > maxCalendarDate}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="icon" disabled={savingYearId === year.id} onClick={() => { closeYearEdit(); toast.message("Cancelled"); }}>
                                    <X className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    size="icon"
                                    disabled={savingYearId === year.id}
                                    onClick={() => {
                                      void (async () => {
                                        setSavingYearId(year.id)
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
                                        } finally {
                                          setSavingYearId(null)
                                        }
                                      })()
                                    }}
                                  >
                                    {savingYearId === year.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
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
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  className="rounded-xl border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/30 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20 dark:hover:text-amber-300"
                                  disabled={settingDefaultYearId === year.id}
                                  onClick={() => { void openYearEdit(year) }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className={deleteIconClass}
                                        disabled={year.isActive}
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setYearToDelete(year)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {year.isActive && (
                                    <TooltipContent>
                                      <p>Can't delete the current default academic year</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>

                                {year.isActive ? (
                                  <Button variant="secondary" disabled>
                                    Default
                                  </Button>
                                ) : (
                                  <Button
                                    disabled={settingDefaultYearId === year.id}
                                    onClick={() => {
                                      void (async () => {
                                        setSettingDefaultYearId(year.id)
                                        try {
                                          await setDefaultAcademicYear(year.id)
                                          setAcademicYears((prev) => prev.map((item) => ({ ...item, isActive: item.id === year.id })))
                                          setDefaultAcademicYearName(year.name)
                                          await refreshCurrentAcademicYear()
                                          toast.success("Default academic year updated")
                                        } catch (error) {
                                          toast.error(error instanceof Error ? error.message : "Failed to set default academic year")
                                        } finally {
                                          setSettingDefaultYearId(null)
                                        }
                                      })()
                                    }}
                                  >
                                    {settingDefaultYearId === year.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Setting...
                                      </>
                                    ) : (
                                      "Set Default"
                                    )}
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" className='text-white' onClick={() => setYearDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={createYearOpen} onOpenChange={setCreateYearOpen}>
                <DialogContent className="sm:max-w-xl text-slate-950 dark:bg-slate-900 dark:text-slate-50 [&>button:last-child]:hidden">
                  <DialogHeader>
                    <DialogTitle className={titleTextClass}>Create Academic Year</DialogTitle>
                    <DialogDescription className={supportingTextClass}>
                      Create a new academic year.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div>
                      <label className="text-sm font-medium text-slate-100 dark:text-slate-200">Academic Name</label>
                      <Input placeholder="2026 - 2027" className="mt-2" value={yearNameDraft} onChange={(event) => setYearNameDraft(event.target.value)} disabled={isCreatingYear} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-100 dark:text-slate-200">From</label>
                        <Popover open={fromOpen} onOpenChange={setFromOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={isCreatingYear}
                              className={calendarTriggerClass}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                              <span>{fromDate ? format(fromDate, "PPP") : "Select date"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800" align="start">
                            <Calendar
                              mode="single"
                              selected={fromDate}
                              onSelect={(date) => {
                                setFromDate(date ?? undefined)
                                setFromOpen(false)
                              }}
                              defaultMonth={fromDate}
                              disabled={(date) => date < minCalendarDate || date > maxCalendarDate}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-100 dark:text-slate-200">To</label>
                        <Popover open={toOpen} onOpenChange={setToOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={isCreatingYear}
                              className={calendarTriggerClass}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                              <span>{toDate ? format(toDate, "PPP") : "Select date"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800" align="start">
                            <Calendar
                              mode="single"
                              selected={toDate}
                              onSelect={(date) => {
                                setToDate(date ?? undefined)
                                setToOpen(false)
                              }}
                              defaultMonth={toDate}
                              disabled={(date) => date < minCalendarDate || date > maxCalendarDate}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" className="text-white" disabled={isCreatingYear} onClick={() => setCreateYearOpen(false)}>
                      Cancel
                    </Button>

                    <Button
                      disabled={isCreatingYear}
                      onClick={() => {
                        void (async () => {
                          setIsCreatingYear(true)
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
                          } finally {
                            setIsCreatingYear(false)
                          }
                        })()
                      }}
                    >
                      {isCreatingYear ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="w-full dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <CardTitle className={`text-2xl font-semibold ${titleTextClass}`}>Class</CardTitle>
                  <CardDescription className={`mt-1 ${supportingTextClass}`}>
                    Select a class to see its divisions.
                  </CardDescription>
                </div>

                <AddAction onAdd={() => openClassDialog("add")} disabled={isInitialLoading} />
              </CardHeader>

              <CardContent
                className="
                space-y-2 pt-4 max-h-[200px] overflow-y-auto
                scrollbar-thin
                scrollbar-thumb-slate-300
                scrollbar-track-transparent
                hover:scrollbar-thumb-slate-400
                dark:scrollbar-thumb-slate-700
                dark:hover:scrollbar-thumb-slate-600
              "
              >
                {isInitialLoading ? (
                  <RowSkeleton />
                ) : classes.length === 0 ? (
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
                              openClassDialog("edit", schoolClass)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className={deleteIconClass}
                                  disabled={schoolClass.divisionCount > 0}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setClassToDelete(schoolClass)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {schoolClass.divisionCount > 0 && (
                              <TooltipContent>
                                <p>
                                  Can't delete — {schoolClass.divisionCount} division{schoolClass.divisionCount === 1 ? "" : "s"} under this class
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card className="w-full dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <CardTitle className={`text-2xl font-semibold ${titleTextClass}`}>Division</CardTitle>
                  <CardDescription className={`mt-1 ${supportingTextClass}`}>
                    {isInitialLoading
                      ? "Loading divisions..."
                      : !selectedClass
                        ? "Select a class to see its divisions."
                        : selectedDivisions.length === 0
                          ? "No divisions yet."
                          : `${selectedClass.name} divisions are shown here.`}
                  </CardDescription>
                </div>

                <AddAction onAdd={() => openDivisionDialog("add")} disabled={isInitialLoading} />
              </CardHeader>

              <CardContent
                className="
                space-y-2 pt-4 max-h-[200px] overflow-y-auto
                scrollbar-thin
                scrollbar-thumb-slate-300
                scrollbar-track-transparent
                hover:scrollbar-thumb-slate-400
                dark:scrollbar-thumb-slate-700
                dark:hover:scrollbar-thumb-slate-600
              "
              >
                {isInitialLoading ? (
                  <RowSkeleton />
                ) : !selectedClass ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                    <p className={`text-sm font-medium ${titleTextClass}`}>No class selected</p>
                    <p className={`mt-1 text-sm ${supportingTextClass}`}>
                      {classes.length === 0 ? "Add a class to get started." : "Select a class from the left to see its divisions."}
                    </p>
                    {classes.length === 0 && (
                      <Button className="mt-4 rounded-xl" onClick={() => openClassDialog("add")}>
                        Add class
                      </Button>
                    )}
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

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={editIconClass}
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedDivisionId(division.id)
                              openDivisionDialog("edit", division)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={deleteIconClass}
                            onClick={(event) => {
                              event.stopPropagation()
                              setDivisionToDelete(division)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}

              </CardContent>
            </Card>
          </div>
        </div>

        <ReusableFormDialog
          open={classDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeClassDialog()
          }}
        theme="vehicle"
          title={classDialogMode === "add" ? "Add Class" : "Edit Class"}
          description={
            classDialogMode === "add"
              ? "Create a new class and keep the same styling language."
              : "Update the selected class details."
          }
          fields={[
            {
              type: "text",
              name: "name",
              label: "Class Name",
              placeholder: "Example: Grade 5 - Morning Session",
              required: true,
            },
          ]}
          values={{ name: classNameDraft }}
          errors={classFormErrors}
          onChange={(_, value) => {
            setClassNameDraft(value)
            setClassFormErrors({})
          }}
          onSubmit={handleSaveClass}
          isSaving={isSavingClass}
          isEditing={classDialogMode === "edit"}
          submitLabel="Add"
          editSubmitLabel="Save"
        />

        <ReusableFormDialog
          open={divisionDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeDivisionDialog()
          }}
          title={divisionDialogMode === "add" ? "Add Division" : "Edit Division"}
          theme="vehicle"
          description={
            divisionDialogMode === "add"
              ? `Create a division under ${selectedClass?.name || "the selected class"}.`
              : "Update the selected division details."
          }
          fields={[
            {
              type: "text",
              name: "name",
              label: "Division Name",
              placeholder: "Example: Division A - Primary Block",
              required: true,
            },
          ]}
          values={{ name: divisionNameDraft }}
          errors={divisionFormErrors}
          onChange={(_, value) => {
            setDivisionNameDraft(value)
            setDivisionFormErrors({})
          }}
          onSubmit={handleSaveDivision}
          isSaving={isSavingDivision}
          isEditing={divisionDialogMode === "edit"}
          submitLabel="Add"
          editSubmitLabel="Save"
        />

        <AlertDialog
          open={!!classToDelete}
          onOpenChange={(open) => {
            if (!open) setClassToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{classToDelete?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this class
                {classToDelete?.divisionCount ? ` and its ${classToDelete.divisionCount} division(s)` : ""}.
                This can't be undone, and it will fail if students are enrolled under it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingClass}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeletingClass}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDeleteClass()
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeletingClass ? (
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

        <AlertDialog
          open={!!divisionToDelete}
          onOpenChange={(open) => {
            if (!open) setDivisionToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Division "{divisionToDelete?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this division. This can't be undone, and it will
                fail if students are enrolled under it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingDivision}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeletingDivision}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDeleteDivision()
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeletingDivision ? (
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

        <AlertDialog open={!!yearToDelete} onOpenChange={(open) => { if (!open) setYearToDelete(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{yearToDelete?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Warning: Deleting "{yearToDelete?.name}" will permanently remove all student admission data linked to this academic year.

                Terms, enrollments, and other related records will also be deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingYear}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeletingYear}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDeleteYear()
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeletingYear ? (<><Loader2 className="h-4 w-4 animate-spin" />Deleting...</>) : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </TooltipProvider>
  )
}