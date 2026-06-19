"use client"
 
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X, Search, Loader2, Eye, CreditCard } from "lucide-react"
 
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
} from "@/components/ui/table";
 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
 
import { createFineTypes, updateFineType, getFineTypes, type FineType } from "@/lib/services/fineTypes"
import { getStudentFines, type StudentFine } from "@/lib/services/fineTypes"
 
export default function Page() {
  const router = useRouter()
 
  const [fineTypesOpen, setFineTypesOpen] = useState(false)
  const [fineTypes, setFineTypes] = useState<FineType[]>([])
  const [loading, setLoading] = useState(false)
 
 
  const [editingFineType, setEditingFineType] = useState<FineType | null>(null)
 
  const [createOpen, setCreateOpen] = useState(false)
  const [names, setNames] = useState<string[]>([""])
  const [submitting, setSubmitting] = useState(false)
 
  // ---- Student fines table state ----
  const [fines, setFines] = useState<StudentFine[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
 
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  // Filled in only if the API ever returns pagination meta. Until then we
  // paginate client-side off of `fines.length`.
  const [serverTotal, setServerTotal] = useState<number | null>(null)
  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null)
 
  // Debounce search input -> search term, and reset to page 1 on new search
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
 
  // If backend already paginates (meta present), `fines` is just the current
  // page. Otherwise treat `fines` as the full filtered list and slice here.
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
 
  // Clamp page if it goes out of range (e.g. after search shrinks results)
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page])
 
  async function loadFineTypes(searchTerm?: string) {
    setLoading(true)
    try {
      const data = await getFineTypes({ search: searchTerm })
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
            item.id === editingFineType.id
              ? { ...item, name: cleaned[0] }
              : item
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
 
 
  return (
    <section className="w-full px-6 py-4 space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            className="bg-background text-foreground hover:opacity-90 shadow-sm"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Student Fines
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Manage and view all student fines.
            </p>
          </div>
        </div>
        <Button
          className="shrink-0 gap-1.5 bg-background text-foreground hover:opacity-90 shadow-sm"
          size="sm"
          onClick={() => setFineTypesOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 text-foreground" />
          Fine Types
        </Button>
      </div>
 
      {/* Fine Types Dialog */}
      <Dialog open={fineTypesOpen} onOpenChange={setFineTypesOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-2xl text-slate-950 dark:text-slate-50">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-semibold text-white">Fine Types</DialogTitle>
                <DialogDescription>View and manage all fine types.</DialogDescription>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </DialogHeader>
 
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {loading && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading...</p>
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
                    "flex items-center justify-between rounded-2xl border p-2 transition-colors",
                    "border-black/5 bg-white dark:border-white/10 dark:bg-white/5",
                  )}
                >
                  <>
                    <h3 className="font-semibold text-slate-950 dark:text-slate-100 ">
                      {fineType.name}
                    </h3>
 
                    <Button
                      className="text-red"
                      size="icon-sm"
                      onClick={() => openEdit(fineType)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                </div>
              ))}
          </div>
 
          <DialogFooter>
            <Button variant="outline" onClick={() => setFineTypesOpen(false)} className="text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Create Fine Type Dialog */}
      <Dialog open={createOpen} onOpenChange={(next) => (next ? setCreateOpen(next) : resetAndCloseCreate())}>
        <DialogContent className="sm:max-w-lg text-slate-950 dark:text-slate-50" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {editingFineType ? "Edit Fine Type" : "Create Fine Type"}
            </DialogTitle>
            <DialogDescription>Create a new fine type, or add several at once.</DialogDescription>
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
                    className="flex-1"
                  />
 
                </div>
              </div>
            ))}
 
 
          </div>
 
          <DialogFooter>
            <Button className="text-white" variant="outline" onClick={resetAndCloseCreate}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={submitting}>
              {submitting
                ? editingFineType
                  ? "Updating..."
                  : "Creating..."
                : editingFineType
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div>
        <div className="flex flex-col  sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
          {/* Enhanced High-Visibility Search Bar */}
          <div className="relative w-full sm:w-80 shadow-sm rounded-xl ">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search by name, ID, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[oklch(0.46_0.04_125)] focus-visible:border-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <Button
            className="shrink-0 gap-2 bg-[oklch(0.46_0.04_125)] text-[oklch(0.98_0.01_95)] hover:opacity-90 shadow-sm font-semibold tracking-tight h-10 px-4 rounded-xl"
            onClick={() => router.push('/workspace/fine-management/student-fines/create-fines')}
          >
            <Plus className="h-4 w-4 text-[oklch(0.98_0.01_95)]" />
            New Fine
          </Button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)] border-none">
                  <TableHead className="px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap">
                    Admission No
                  </TableHead>
                  <TableHead className="px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap">
                    Name
                  </TableHead>
                  <TableHead className="px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap">
                    Fine
                  </TableHead>
                  <TableHead className="px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap">
                    Amount
                  </TableHead>
                  <TableHead className="px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap">
                    PaidAmount
                  </TableHead>
                  <TableHead className="px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
 
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="h-7 w-7 animate-spin text-[oklch(0.46_0.04_125)]" />
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
                      <TableCell className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {row.admissionNumber}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {row.student}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {row.fine}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {row.amount}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {row.paidAmount}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                            row.status === "PAID"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : row.status === "PARTIAL"
                                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
                                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                          )}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
                            title="View Fine"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
 
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
                            title="Edit Fine"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
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
 
          {/* Pagination footer — matches "Showing X to Y of Z entries" style */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-6 py-3 dark:border-slate-800/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
 
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Rows per page:</span>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    setLimit(Number(value))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] rounded-lg">
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
 
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
 
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Page {page}
              </span>
 
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1"
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
    </section>
  )
}