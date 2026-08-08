"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Key,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  ChevronDown,
  ShieldAlert,
  Layers,
  Clock,
  ArrowUpDown,
  Filter,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import PageHeader from "@/components/common/pageHeader"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ReusableFormDialog, type FormField } from "@/components/common/resusable-dialoge-form"

import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  batchDeletePermissions,
  type Permission,
  type PermissionInput,
} from "@/lib/services/roles-permissions"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SortKey = "name" | "description" | "createdAt"
type SortDir = "asc" | "desc"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function getCategoryFromName(name: string) {
  const parts = name.split(".")
  return parts[0] || "general"
}

// ---------------------------------------------------------------------------
// Permission form field config (used by ReusableFormDialog)
// ---------------------------------------------------------------------------
const permissionFields: FormField[] = [
  {
    type: "text",
    name: "name",
    label: "Permission Name",
    placeholder: "e.g. students.exportCSV",
    required: true,
  },
  {
    type: "text",
    name: "description",
    label: "Description",
    placeholder: "e.g. Enable exporting students list to CSV",
    required: true,
  },
]

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white/80 px-5 py-4 dark:border-white/10 dark:bg-white/5">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          accent
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-950 dark:text-slate-100">{value}</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table Skeleton
// ---------------------------------------------------------------------------
function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-black/5 dark:border-white/5"
        >
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function PermissionsPage() {
  // ----------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------
  const [permissions, setPermissions] = React.useState<Permission[]>([])
  const [loading, setLoading] = React.useState(true)

  async function loadPermissions() {
    setLoading(true)
    try {
      const data = await getPermissions()
      setPermissions(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load permissions")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void loadPermissions()
  }, [])

  // ----------------------------------------------------------------------
  // Search & Filter
  // ---------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")

  const categories = React.useMemo(() => {
    const set = new Set(permissions.map((p) => getCategoryFromName(p.name)))
    return Array.from(set).sort()
  }, [permissions])

  const filteredPermissions = React.useMemo(() => {
    let result = [...permissions]

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description ? p.description.toLowerCase().includes(query) : false)
      )
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => getCategoryFromName(p.name) === categoryFilter)
    }

    return result
  }, [permissions, searchQuery, categoryFilter])

  // ----------------------------------------------------------------------
  // Sort
  // ---------------------------------------------------------------------
  const [sortKey, setSortKey] = React.useState<SortKey>("name")
  const [sortDir, setSortDir] = React.useState<SortDir>("asc")

  const sortedPermissions = React.useMemo(() => {
    const sorted = [...filteredPermissions]
    sorted.sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else if (sortKey === "description")
        cmp = (a.description || "").localeCompare(b.description || "")
      else if (sortKey === "createdAt")
        cmp = (a.createdAt || "").localeCompare(b.createdAt || "")
      return sortDir === "asc" ? cmp : -cmp
    })
    return sorted
  }, [filteredPermissions, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  // ----------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const allVisibleSelected =
    sortedPermissions.length > 0 && sortedPermissions.every((p) => selectedIds.includes(p.id))

  function toggleSelectAll() {
    const visibleIds = sortedPermissions.map((p) => p.id)
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function clearSelection() {
    setSelectedIds([])
  }

  // ----------------------------------------------------------------------
  // Create / Edit Dialog (now driven by ReusableFormDialog)
  // ---------------------------------------------------------------------
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"add" | "edit">("add")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [values, setValues] = React.useState<PermissionInput>({ name: "", description: "" })
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = React.useState(false)

  function openDialog(mode: "add" | "edit", permission?: Permission) {
    setDialogMode(mode)
    setEditingId(mode === "edit" ? permission?.id ?? null : null)
    setValues({
      name: mode === "edit" ? permission?.name ?? "" : "",
      description: mode === "edit" ? permission?.description ?? "" : "",
    })
    setErrors({})
    setDialogOpen(true)
  }

  function closeDialog() {
    if (saving) return
    setDialogOpen(false)
    setEditingId(null)
    setValues({ name: "", description: "" })
    setErrors({})
  }

  function handleFieldChange(name: string, value: PermissionInput[keyof PermissionInput]) {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSave() {
    const name = (values.name ?? "").trim()
    const description = (values.description ?? "").trim()

    const errs: Record<string, string | undefined> = {}
    if (!name) errs.name = "Enter a permission name"
    if (!description) errs.description = "Enter a description"
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error(errs.name ?? errs.description ?? "Fix the highlighted fields")
      return
    }

    setSaving(true)
    try {
      if (dialogMode === "add") {
        await createPermission({ name, description })
        toast.success("Permission created")
      } else if (editingId) {
        await updatePermission(editingId, { name, description })
        toast.success("Permission updated")
      }
      await loadPermissions()
      closeDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save permission")
    } finally {
      setSaving(false)
    }
  }

  // ----------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------
  type DeleteTarget =
    | { type: "single"; id: string; name: string }
    | { type: "batch"; ids: string[] }
    | null

  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = React.useState(false)

  function requestDelete(permission: Permission) {
    setDeleteConfirmed(false)
    setDeleteTarget({ type: "single", id: permission.id, name: permission.name })
  }

  function requestBatchDelete() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one permission")
      return
    }
    setDeleteConfirmed(false)
    setDeleteTarget({ type: "batch", ids: selectedIds })
  }

  function closeDeleteDialog() {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteConfirmed(false)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !deleteConfirmed) return
    setDeleting(true)
    try {
      if (deleteTarget.type === "single") {
        await deletePermission(deleteTarget.id)
        toast.success("Permission deleted")
      } else {
        await batchDeletePermissions(deleteTarget.ids)
        toast.success(`${deleteTarget.ids.length} permission${deleteTarget.ids.length === 1 ? "" : "s"} deleted`)
        setSelectedIds([])
      }
      await loadPermissions()
      setDeleteTarget(null)
      setDeleteConfirmed(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  // ----------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------
  const totalCount = permissions.length
  const recentCount = permissions.filter((p) => {
    if (!p.createdAt) return false
    const days = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return days <= 7
  }).length
  const categoryCount = categories.length

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <section className="px-4 sm:px-6 py-4">
      <PageHeader title="Permissions" description="Manage system permission definitions" />

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Layers}
          label="Total Permissions"
          value={totalCount}
          accent="bg-amber-500/10 text-amber-700 dark:text-amber-300"
        />
        <StatCard
          icon={Clock}
          label="Added This Week"
          value={recentCount}
          accent="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        />
        <StatCard
          icon={ShieldAlert}
          label="Categories"
          value={categoryCount}
          accent="bg-sky-500/10 text-sky-700 dark:text-sky-300"
        />
      </div>

      {/* Main Card */}
      <div className="mt-6 rounded-2xl border border-black/5 bg-white/80 shadow-sm dark:border-white/10 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search permissions…"
                className="rounded-xl pl-9 h-10"
              />
            </div>

            {categories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 h-10 text-white">
                    <Filter className="h-3.5 w-3.5" />
                    {categoryFilter === "all" ? "All Categories" : categoryFilter}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl">
                  <DropdownMenuItem
                    className="rounded-lg"
                    onClick={() => setCategoryFilter("all")}
                  >
                    <span className={cn(categoryFilter === "all" && "font-medium")}>All Categories</span>
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      className="rounded-lg capitalize"
                      onClick={() => setCategoryFilter(cat)}
                    >
                      <span className={cn(categoryFilter === cat && "font-medium")}>{cat}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Button
            className="rounded-xl gap-2 h-10 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => openDialog("add")}
          >
            <Plus className="h-4 w-4" />
            Add Permission
          </Button>
        </div>

        <Separator />

        {/* Batch Action Bar */}
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-black/5 bg-amber-50/80 px-5 py-2.5 transition-all dark:border-white/5 dark:bg-amber-400/10",
            selectedIds.length > 0 ? "opacity-100" : "opacity-0 h-0 py-0 overflow-hidden border-none"
          )}
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
              {selectedIds.length}
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              onClick={clearSelection}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              onClick={requestBatchDelete}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Table Header */}
        <div className="flex items-center gap-4 border-b border-black/5 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-slate-400">
          <div className="flex h-4 w-4 items-center justify-center">
            <button
              onClick={toggleSelectAll}
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                allVisibleSelected
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-slate-300 hover:border-amber-500 dark:border-slate-600"
              )}
            >
              {allVisibleSelected && <Check className="h-3 w-3" />}
            </button>
          </div>
          <div className="w-10" />
          <button
            className="flex-1 text-left flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300"
            onClick={() => toggleSort("name")}
          >
            Name
            {sortKey === "name" && (
              <ArrowUpDown className={cn("h-3 w-3", sortDir === "desc" && "rotate-180")} />
            )}
          </button>
          <button
            className="hidden flex-1 text-left items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 md:flex"
            onClick={() => toggleSort("description")}
          >
            Description
            {sortKey === "description" && (
              <ArrowUpDown className={cn("h-3 w-3", sortDir === "desc" && "rotate-180")} />
            )}
          </button>
          <button
            className="hidden w-28 text-left items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 lg:flex"
            onClick={() => toggleSort("createdAt")}
          >
            Created
            {sortKey === "createdAt" && (
              <ArrowUpDown className={cn("h-3 w-3", sortDir === "desc" && "rotate-180")} />
            )}
          </button>
          <div className="w-10" />
        </div>

        {/* Table Body */}
        <div className="max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-700 dark:hover:scrollbar-thumb-slate-600">
          {loading ? (
            <TableSkeleton />
          ) : sortedPermissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                <Key className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                {searchQuery || categoryFilter !== "all"
                  ? "No permissions match your filters"
                  : "No permissions yet"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your search or category filter."
                  : "Create permission definitions before assigning them to roles."}
              </p>
              {!searchQuery && categoryFilter === "all" && (
                <Button
                  className="mt-4 rounded-xl gap-2"
                  onClick={() => openDialog("add")}
                >
                  <Plus className="h-4 w-4" />
                  Create Permission
                </Button>
              )}
            </div>
          ) : (
            sortedPermissions.map((permission) => {
              const isSelected = selectedIds.includes(permission.id)
              const category = getCategoryFromName(permission.name)

              return (
                <div
                  key={permission.id}
                  className={cn(
                    "group flex items-center gap-4 border-b border-black/5 px-4 py-3 transition-colors last:border-b-0 dark:border-white/5",
                    isSelected
                      ? "bg-amber-50/60 dark:bg-amber-400/5"
                      : "hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                  )}
                >
                  {/* Checkbox */}
                  <div className="flex h-4 w-4 items-center justify-center">
                    <button
                      onClick={() => toggleSelection(permission.id)}
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-slate-300 hover:border-amber-500 dark:border-slate-600"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                    {getInitials(permission.name)}
                  </div>

                  {/* Name + Category */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-950 dark:text-slate-100">
                        {permission.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="hidden rounded-md px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide sm:inline-flex bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {category}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 md:hidden">
                      {permission.description || "No description"}
                    </p>
                  </div>

                  {/* Description (desktop) */}
                  <div className="hidden flex-1 truncate text-sm text-slate-600 dark:text-slate-300 md:block">
                    {permission.description || (
                      <span className="italic text-slate-400 dark:text-slate-500">No description</span>
                    )}
                  </div>

                  {/* Created Date (desktop) */}
                  <div className="hidden w-28 text-sm text-slate-500 dark:text-slate-400 lg:block">
                    {formatDate(permission.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-300 dark:hover:bg-amber-500/10"
                      onClick={() => openDialog("edit", permission)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                      onClick={() => requestDelete(permission)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {!loading && sortedPermissions.length > 0 && (
          <div className="flex items-center justify-between border-t border-black/5 px-5 py-3 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
            <span>
              Showing {sortedPermissions.length} of {permissions.length} permission
              {permissions.length !== 1 ? "s" : ""}
            </span>
            {selectedIds.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {selectedIds.length} selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit Dialog — now the shared ReusableFormDialog        */}
      {/* ------------------------------------------------------------- */}
      <ReusableFormDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        title={dialogMode === "add" ? "Add Permission" : "Edit Permission"}
        description={
          dialogMode === "add"
            ? "Create a new system permission definition."
            : "Update the selected permission definition."
        }
        fields={permissionFields}
        values={values}
        errors={errors}
        onChange={handleFieldChange}
        onSubmit={handleSave}
        isSaving={saving}
        isEditing={dialogMode === "edit"}
        submitLabel="Add Permission"
        editSubmitLabel="Save Changes"
      />

      {/* ------------------------------------------------------------- */}
      {/* Delete Confirmation Dialog                                   */}
      {/* ------------------------------------------------------------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "batch" ? "Delete Permissions?" : "Delete Permission?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "batch" ? (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.ids.length} permission{deleteTarget.ids.length === 1 ? "" : "s"}
                  </span>
                  . This action cannot be undone.
                </>
              ) : deleteTarget?.type === "single" ? (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">{deleteTarget.name}</span>. This
                  action cannot be undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Permission is denied
            </p>
            <p className="mt-1 text-xs text-red-700/80 dark:text-red-400/80">
              Deleting a permission may break existing role assignments and user access.
              Please confirm you understand the consequences before proceeding.
            </p>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <Checkbox
              id="delete-confirm"
              checked={deleteConfirmed}
              onCheckedChange={(checked) => setDeleteConfirmed(checked === true)}
              className="mt-0.5 border-slate-400 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 data-[state=checked]:text-white dark:border-slate-500"
            />
            <label
              htmlFor="delete-confirm"
              className="cursor-pointer text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300"
            >
              I understand that this action is irreversible and may affect active role assignments.
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting || !deleteConfirmed}
              className={cn(
                "bg-red-600 hover:bg-red-700 focus:ring-red-500",
                !deleteConfirmed && "opacity-50 cursor-not-allowed"
              )}
            >
              {deleting ? "Processing…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}