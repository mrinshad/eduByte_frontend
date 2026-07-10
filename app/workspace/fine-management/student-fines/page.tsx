"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
  Loader2,
  Eye,
  CreditCard,
  Settings2
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  createFineTypes,
  updateFineType,
  getFineTypes,
  getStudentFines,
  getStudentAdmissionAndNameWithEnrollment,
  createStudentFine,
  updateStudentFine,
  type FineType,
  type StudentFine,
  type StudentAdmissionAndNameWithEnrollment,
} from "@/lib/services/fineTypes"

type StudentEnrollmentOption = Omit<StudentAdmissionAndNameWithEnrollment, "enrollmentId"> & {
  enrollmentId: string
}

export default function Page() {
  const router = useRouter()

  // ---------------------------------------------------------------------
  // Fine Types (list + create/edit dialog)
  // ---------------------------------------------------------------------
  const [fineTypesOpen, setFineTypesOpen] = useState(false)
  const [fineTypes, setFineTypes] = useState<FineType[]>([])
  const [loading, setLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editingFineType, setEditingFineType] = useState<FineType | null>(null)
  const [names, setNames] = useState<string[]>([""])
  const [submitting, setSubmitting] = useState(false)

  async function loadFineTypes() {
    setLoading(true)
    try {
      const data = await getFineTypes()
      setFineTypes(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load fine types")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fineTypesOpen) {
      void loadFineTypes()
    } else {
      setEditingFineType(null)
    }
  }, [fineTypesOpen])

  function openEdit(fineType: FineType) {
    setEditingFineType(fineType)
    setNames([fineType.name])
    setCreateOpen(true)
  }

  function resetAndCloseCreate() {
    setNames([""])
    setEditingFineType(null)
    setCreateOpen(false)
  }

  function updateNameAt(index: number, value: string) {
    setNames((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  async function handleCreate() {
    const cleaned = names.map((n) => n.trim()).filter(Boolean)

    if (cleaned.length === 0) {
      toast.error("Enter at least one fine type name")
      return
    }

    setSubmitting(true)

    try {
      if (editingFineType) {
        await updateFineType(editingFineType.id, {
          name: cleaned[0],
        })

        setFineTypes((prev) =>
          prev.map((item) =>
            item.id === editingFineType.id ? { ...item, name: cleaned[0] } : item
          )
        )

        toast.success("Fine Type Updated")
      } else {
        await createFineTypes({
          names: cleaned,
        })

        toast.success("Created Fine Type")

        await loadFineTypes()
      }

      resetAndCloseCreate()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingFineType
            ? "Failed to update fine type"
            : "Failed to create fine type"
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------
  // Student Fines table (search, pagination, fetch)
  // ---------------------------------------------------------------------
  const [fines, setFines] = useState<StudentFine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)

  const [serverTotal, setServerTotal] = useState<number | null>(null)
  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(handle)
  }, [searchInput])

  async function loadFines() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getStudentFines({ search: search || undefined, page, limit })
      setFines(result.data)
      if (result.meta) {
        setServerTotal(result.meta.total)
        setServerTotalPages(result.meta.totalPages)
      } else {
        setServerTotal(null)
        setServerTotalPages(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load student fines")
      toast.error(err instanceof Error ? err.message : "Failed to load student fines")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadFines()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, limit])

  const usingServerPagination = serverTotal !== null && serverTotalPages !== null

  const total = usingServerPagination ? serverTotal! : fines.length
  const totalPages = usingServerPagination
    ? Math.max(serverTotalPages!, 1)
    : Math.max(Math.ceil(fines.length / limit), 1)

  const visibleFines = usingServerPagination
    ? fines
    : fines.slice((page - 1) * limit, (page - 1) * limit + limit)

  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1
  const endEntry = usingServerPagination
    ? Math.min(page * limit, total)
    : Math.min((page - 1) * limit + visibleFines.length, total)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page])

  // ---------------------------------------------------------------------
  // New Fine dialog (student picker, fine type, amount, reason)
  // ---------------------------------------------------------------------
  const [editingFineId, setEditingFineId] = useState<string | null>(null)
  const [newFineOpen, setNewFineOpen] = useState(false)
  const [students, setStudents] = useState<StudentEnrollmentOption[]>([])

  const [fineForm, setFineForm] = useState({
    studentId: "",
    fineTypeId: "",
    amount: "",
    reason: "",
  })

  const resetFineForm = () => {
    setEditingFineId(null)
    setFineForm({
      studentId: "",
      fineTypeId: "",
      amount: "",
      reason: "",
    })
  }

  async function loadStudents() {
    try {
      const data = await getStudentAdmissionAndNameWithEnrollment()
      setStudents(
        data.filter((student): student is StudentEnrollmentOption => Boolean(student.enrollmentId))
      )
    } catch (error) {
      toast.error("Failed to load students")
    }
  }

  useEffect(() => {
    if (newFineOpen) {
      void loadStudents()
      void loadFineTypes()
    }
  }, [newFineOpen])

  const handleSaveFine = async () => {
    try {
      const payload = {
        enrollmentId: fineForm.studentId,
        fineTypeId: fineForm.fineTypeId,
        amount: Number(fineForm.amount),
        reason: fineForm.reason,
      }

      if (editingFineId) {
        await updateStudentFine(editingFineId, payload)
        toast.success("Updated Student Fine")
      } else {
        await createStudentFine(payload)
        toast.success("Created Student Fine")
      }

      resetFineForm()
      setEditingFineId(null)
      setNewFineOpen(false)
      await loadFines()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save student fine"
      )
    }
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6 max-w-7xl mx-auto">

      {/* Header Panel — title/description on left, search + button on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button
            className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Student Fines
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFineTypesOpen(true)}
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Settings2 className="size-6 sm:size-6 text-[#556043]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    Fine Types
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage and view all student fines.
            </p>
          </div>
        </div>

        {/* Search + Add Button — stacked on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
          <div className="relative w-full sm:w-56 lg:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search by name, ID, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[oklch(0.46_0.04_125)] focus-visible:border-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <Button
            className="shrink-0 gap-1.5 bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm font-medium tracking-tight h-10 sm:h-9 px-4 rounded-xl text-xs w-full sm:w-auto"
            onClick={() => setNewFineOpen(true)}
          >
            <Plus className="h-4 w-4 text-white dark:text-slate-900" />
            New Fine
          </Button>
        </div>
      </div>

      {/* Fine Types Management Dialog */}
      <Dialog open={fineTypesOpen} onOpenChange={setFineTypesOpen}>
        <DialogContent showCloseButton={false} className="w-[92vw] sm:max-w-2xl text-slate-950 dark:text-slate-50 rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-semibold text-white">Fine Types</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">View and manage all fine types.</DialogDescription>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="h-9">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1">
            {loading && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading...
              </p>
            )}

            {!loading && fineTypes.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No fine types yet. Add one to get started.
              </p>
            )}

            {!loading &&
              fineTypes.map((fineType) => (
                <div
                  key={fineType.id}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-3 transition-colors gap-2",
                    "border-black/5 bg-white dark:border-white/10 dark:bg-white/5"
                  )}
                >
                  <h3 className="font-semibold text-sm sm:text-base text-slate-950 dark:text-slate-100 truncate">
                    {fineType.name}
                  </h3>
                  <Button className="text-red shrink-0" size="icon" variant="ghost" onClick={() => openEdit(fineType)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>

          <DialogFooter className="mt-4 flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setFineTypesOpen(false)} className="text-white w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Fine Type Inline Form Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(next) => (next ? setCreateOpen(next) : resetAndCloseCreate())}
      >
        <DialogContent className="w-[90vw] sm:max-w-lg text-slate-950 dark:text-slate-50 rounded-2xl p-4 sm:p-6" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
              {editingFineType ? "Edit Fine Type" : "Create Fine Type"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Create a new fine type, or add several at once.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {names.map((name, index) => (
              <div key={index} className="space-y-2">
                {index === 0 && (
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Fine Type Name
                  </label>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => updateNameAt(index, e.target.value)}
                    placeholder="e.g. Library Fine"
                    className="flex-1 rounded-xl"
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button className="text-white w-full sm:w-auto" variant="outline" onClick={resetAndCloseCreate}>
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={submitting} className="w-full sm:w-auto">
              {submitting
                ? editingFineType ? "Updating..." : "Creating..."
                : editingFineType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="w-full overflow-x-auto [scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap w-[15%]">
                  Admission No
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[20%]">
                  Name
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[15%]">
                  Fine
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[12%]">
                  Amount
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[12%]">
                  Paid Amount
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[11%]">
                  Status
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap text-center w-[15%]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Fetching student fines...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </TableCell>
                </TableRow>
              ) : visibleFines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                visibleFines.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                  >
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.admissionNumber}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                      {row.student}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                      {row.fine}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.amount}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.paidAmount}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          row.status === "PAID"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : row.status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              : row.status === "REVERSED"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                        )}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/workspace/fine-management/student-fines/view-student-fines?id=${row.id}`)
                          }
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                          title="View Fine"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingFineId(row.id)
                            setFineForm({
                              studentId: row.enrollmentId ?? "",
                              fineTypeId: row.fineId ?? "",
                              amount: row.amount ?? "",
                              reason: row.reason ?? "",
                            })
                            setNewFineOpen(true)
                          }}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                          title="Edit Fine"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                          title="Pay Fine"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete Fine"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-t border-slate-200 px-4 sm:px-6 py-4 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center lg:text-left order-2 lg:order-1">
            {total === 0 ? (
              "No entries"
            ) : (
              <>
                Showing <span className="font-medium text-slate-700 dark:text-slate-200">{startEntry}</span> to{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{endEntry}</span> of{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span> entries
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 order-1 lg:order-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 justify-center w-full sm:w-auto">
              <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Rows per page:</span>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[70px] rounded-lg bg-white dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 h-9 disabled:opacity-40 rounded-lg px-3 flex-1 sm:flex-none"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap px-2">
                Page {page} of {totalPages}
              </span>

              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 h-9 disabled:opacity-40 rounded-lg px-3 flex-1 sm:flex-none"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New / Edit Fine Primary Form Dialog */}
      <Dialog
        open={newFineOpen}
        onOpenChange={(value) => {
          setNewFineOpen(value)
          if (!value) {
            resetFineForm()
          }
        }}
      >
        <DialogContent className="w-[92vw] sm:max-w-[500px] rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingFineId ? "Edit Student Fine" : "Create Student Fine"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Create a fine and assign it to a student.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Student Dropdown */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Student</label>
              <select
                value={fineForm.studentId}
                onChange={(e) =>
                  setFineForm((prev) => ({ ...prev, studentId: e.target.value }))
                }
                className="h-8 w-full min-w-0 rounded-xl border border-input bg-transparent px-2.5 py-1 text-sm text-slate-950 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-slate-50"
              >
                <option value="" disabled>
                  Select Student
                </option>
                {students.length === 0 ? (
                  <option value="" disabled>
                    No students found
                  </option>
                ) : (
                  students.map((student) => (
                    <option key={student.id} value={student.enrollmentId}>
                      {student.admissionNumber} - {student.studentName}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Fine Type Dropdown */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fine Type</label>
              <Select
                value={fineForm.fineTypeId}
                onValueChange={(value) =>
                  setFineForm((prev) => ({ ...prev, fineTypeId: value }))
                }
              >
                <SelectTrigger className="w-full min-w-0 overflow-hidden rounded-xl">
                  <SelectValue placeholder="Select Fine Type" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {fineTypes.map((fine) => (
                    <SelectItem key={fine.id} value={fine.id}>
                      {fine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
              <Input
                type="number"
                className="appearance-none rounded-xl"
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Enter Amount"
                value={fineForm.amount}
                onChange={(e) =>
                  setFineForm((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
              <Input
                placeholder="Enter Reason"
                value={fineForm.reason}
                onChange={(e) =>
                  setFineForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl"
              onClick={() => {
                resetFineForm()
                setNewFineOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFine} className="w-full sm:w-auto rounded-xl">
              {editingFineId ? "Update Fine" : "Create Fine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}