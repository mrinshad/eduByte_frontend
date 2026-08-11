"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Users,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  ChevronDown,
  ShieldAlert,
  UserCheck,
  Clock,
  ArrowUpDown,
  Filter,
  Eye,
  Mail,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  type User as UserType,
  type UserInput,
} from "@/lib/services/user-service"

import {
  getRoles,
  type Role,
} from "@/lib/services/roles-permissions"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SortKey = "name" | "username" | "email" | "createdAt"
type SortDir = "asc" | "desc"
type StatusFilter = "all" | "active" | "inactive"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

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
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function UsersPage() {
  // ----------------------------------------------------------------------
  // Data
  // ----------------------------------------------------------------------
  const [users, setUsers] = React.useState<UserType[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [loading, setLoading] = React.useState(true)

  async function loadUsers() {
    setLoading(true)
    try {
      const [userData, roleData] = await Promise.all([getUsers(), getRoles()])
      setUsers(userData)
      setRoles(roleData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void loadUsers()
  }, [])

  // ----------------------------------------------------------------------
  // Search & Filter
  // ----------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  const filteredUsers = React.useMemo(() => {
    let result = [...users]

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      )
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.roleId === roleFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter((u) => (statusFilter === "active" ? u.isActive : !u.isActive))
    }

    return result
  }, [users, searchQuery, roleFilter, statusFilter])

  // ----------------------------------------------------------------------
  // Sort
  // ----------------------------------------------------------------------
  const [sortKey, setSortKey] = React.useState<SortKey>("name")
  const [sortDir, setSortDir] = React.useState<SortDir>("asc")

  const sortedUsers = React.useMemo(() => {
    const sorted = [...filteredUsers]
    sorted.sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else if (sortKey === "username") cmp = a.username.localeCompare(b.username)
      else if (sortKey === "email") cmp = a.email.localeCompare(b.email)
      else if (sortKey === "createdAt")
        cmp = (a.createdAt || "").localeCompare(b.createdAt || "")
      return sortDir === "asc" ? cmp : -cmp
    })
    return sorted
  }, [filteredUsers, sortKey, sortDir])

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
  // ----------------------------------------------------------------------
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const allVisibleSelected =
    sortedUsers.length > 0 && sortedUsers.every((u) => selectedIds.includes(u.id))

  function toggleSelectAll() {
    const visibleIds = sortedUsers.map((u) => u.id)
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
  // Create / Edit Dialog
  // ----------------------------------------------------------------------
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"add" | "edit">("add")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [values, setValues] = React.useState<UserInput>({
    name: "",
    username: "",
    email: "",
    password: "",
    roleId: "",
    isActive: true,
  })
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = React.useState(false)

  const userFields: FormField[] = React.useMemo(() => {
    const base: FormField[] = [
      {
        type: "text",
        name: "name",
        label: "Full Name",
        placeholder: "e.g. John Doe",
        required: true,
      },
      {
        type: "text",
        name: "username",
        label: "Username",
        placeholder: "e.g. johndoe",
        required: true,
      },
      {
        type: "text",
        name: "email",
        label: "Email",
        placeholder: "e.g. john@example.com",
        required: true,
      },
      {
        type: "select",
        name: "roleId",
        label: "Role",
        placeholder: "Select a role",
        required: true,
        options: roles.map((r) => ({ label: r.name, value: r.id })),
      },
      {
        type: "checkbox",
        name: "isActive",
        label: "Active Account",
      },
    ]

    if (dialogMode === "add") {
      base.splice(3, 0, {
        type: "text",
        name: "password",
        label: "Password",
        placeholder: "••••••••",
        required: true,
      })
    }

    return base
  }, [roles, dialogMode])

  function openDialog(mode: "add" | "edit", user?: UserType) {
    setDialogMode(mode)
    setEditingId(mode === "edit" ? user?.id ?? null : null)
    setValues({
      name: mode === "edit" ? user?.name ?? "" : "",
      username: mode === "edit" ? user?.username ?? "" : "",
      email: mode === "edit" ? user?.email ?? "" : "",
      password: "",
      roleId: mode === "edit" ? user?.roleId ?? "" : "",
      isActive: mode === "edit" ? user?.isActive ?? true : true,
    })
    setErrors({})
    setDialogOpen(true)
  }

  function closeDialog() {
    if (saving) return
    setDialogOpen(false)
    setEditingId(null)
    setValues({ name: "", username: "", email: "", password: "", roleId: "", isActive: true })
    setErrors({})
  }

  function handleFieldChange(name: string, value: UserInput[keyof UserInput]) {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSave() {
    const name = (values.name ?? "").trim()
    const username = (values.username ?? "").trim()
    const email = (values.email ?? "").trim()
    const password = (values.password ?? "").trim()
    const roleId = values.roleId ?? ""

    const errs: Record<string, string | undefined> = {}
    if (!name) errs.name = "Enter a full name"
    if (!username) errs.username = "Enter a username"
    if (!email) errs.email = "Enter an email"
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email"
    if (dialogMode === "add" && !password) errs.password = "Enter a password"
    if (!roleId) errs.roleId = "Select a role"

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error("Fix the highlighted fields")
      return
    }

    setSaving(true)
    try {
      if (dialogMode === "add") {
        await createUser({ name, username, email, password, roleId, isActive: values.isActive })
        toast.success("User created")
      } else if (editingId) {
        const updateData: Partial<UserInput> = { name, username, email, roleId, isActive: values.isActive }
        if (password) updateData.password = password
        await updateUser(editingId, updateData)
        toast.success("User updated")
      }
      await loadUsers()
      closeDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save user")
    } finally {
      setSaving(false)
    }
  }

  // ----------------------------------------------------------------------
  // Delete
  // ----------------------------------------------------------------------
  type DeleteTarget =
    | { type: "single"; id: string; name: string }
    | { type: "batch"; ids: string[] }
    | null

  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = React.useState(false)

  function requestDelete(user: UserType) {
    setDeleteConfirmed(false)
    setDeleteTarget({ type: "single", id: user.id, name: user.name })
  }

  function requestBatchDelete() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one user")
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
        await deleteUser(deleteTarget.id)
        toast.success("User deleted")
      } else {
        await batchDeleteUsers(deleteTarget.ids)
        toast.success(`${deleteTarget.ids.length} user${deleteTarget.ids.length === 1 ? "" : "s"} deleted`)
        setSelectedIds([])
      }
      await loadUsers()
      setDeleteTarget(null)
      setDeleteConfirmed(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  const hasActiveFilters = React.useMemo(
    () => roleFilter !== "all" || statusFilter !== "all" || searchQuery.trim().length > 0,
    [roleFilter, statusFilter, searchQuery]
  )

  const clearAllFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setStatusFilter("all")
  }

  const totalCount = users.length
  const activeCount = users.filter((u) => u.isActive).length
  const roleCount = roles.length

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <section className="w-full px-6 py-4 space-y-6">
      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Users
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Manage system user accounts and role assignments
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {roles.length > 0 && (
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-10 w-[140px] rounded-lg border-slate-300 shrink-0">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)}>
            <SelectTrigger className="h-10 w-[140px] rounded-lg border-slate-300 shrink-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/30 shrink-0"
              onClick={clearAllFilters}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}

          <Button
            className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={() => openDialog("add")}
          >
            <Plus className="h-4 w-4 mr-2 text-white dark:text-slate-900" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalCount}
          accent="bg-amber-500/10 text-amber-700 dark:text-amber-300"
        />
        <StatCard
          icon={UserCheck}
          label="Active Users"
          value={activeCount}
          accent="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        />
        <StatCard
          icon={ShieldAlert}
          label="Roles"
          value={roleCount}
          accent="bg-sky-500/10 text-sky-700 dark:text-sky-300"
        />
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-black/5 bg-white/80 shadow-sm dark:border-white/10 dark:bg-slate-900">

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
            <span className="text-slate-700 dark:text-slate-300">selected</span>
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
            className="hidden flex-1 text-left items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 sm:flex"
            onClick={() => toggleSort("username")}
          >
            Username
            {sortKey === "username" && (
              <ArrowUpDown className={cn("h-3 w-3", sortDir === "desc" && "rotate-180")} />
            )}
          </button>
          <button
            className="hidden flex-1 text-left items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 md:flex"
            onClick={() => toggleSort("email")}
          >
            Email
            {sortKey === "email" && (
              <ArrowUpDown className={cn("h-3 w-3", sortDir === "desc" && "rotate-180")} />
            )}
          </button>
          <div className="hidden w-24 text-left lg:block">Role</div>
          <div className="hidden w-20 text-left lg:block">Status</div>
          <button
            className="hidden w-28 text-left items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 xl:flex"
            onClick={() => toggleSort("createdAt")}
          >
            Created
            {sortKey === "createdAt" && (
              <ArrowUpDown className={cn("h-3 w-3", sortDir === "desc" && "rotate-180")} />
            )}
          </button>
          <div className="w-24" />
        </div>

        {/* Table Body */}
        <div className="max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-700 dark:hover:scrollbar-thumb-slate-600">
          {loading ? (
            <TableSkeleton />
          ) : sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                <Users className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "No users match your filters"
                  : "No users yet"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Create user accounts and assign them to roles."}
              </p>
              {!searchQuery && roleFilter === "all" && statusFilter === "all" && (
                <Button className="mt-4 rounded-xl gap-2" onClick={() => openDialog("add")}>
                  <Plus className="h-4 w-4" />
                  Create User
                </Button>
              )}
            </div>
          ) : (
            sortedUsers.map((user) => {
              const isSelected = selectedIds.includes(user.id)
              const role = roles.find((r) => r.id === user.roleId)

              return (
                <div
                  key={user.id}
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
                      onClick={() => toggleSelection(user.id)}
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
                    {getInitials(user.name)}
                  </div>

                  {/* Name + Username */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-950 dark:text-slate-100">
                        {user.name}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                      @{user.username}
                    </p>
                  </div>

                  {/* Username (desktop sm+) */}
                  <div className="hidden flex-1 truncate text-sm text-slate-600 dark:text-slate-300 sm:block">
                    <span className="text-slate-400">@</span>
                    {user.username}
                  </div>

                  {/* Email (desktop md+) */}
                  <div className="hidden flex-1 truncate text-sm text-slate-600 dark:text-slate-300 md:flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                    {user.email}
                  </div>

                  {/* Role (desktop lg+) */}
                  <div className="hidden w-24 lg:block">
                    <Badge
                      variant="secondary"
                      className="rounded-md px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {role?.name ?? user.role}
                    </Badge>
                  </div>

                  {/* Status (desktop lg+) */}
                  <div className="hidden w-20 lg:block">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        user.isActive
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          user.isActive ? "bg-emerald-500" : "bg-slate-400"
                        )}
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Created (desktop xl+) */}
                  <div className="hidden w-28 text-sm text-slate-500 dark:text-slate-400 xl:block">
                    {formatDate(user.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1   transition-opacity w-24 justify-end">
                    <Link href={`/admin/users/view?id=${user.id}`}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:text-slate-400 dark:hover:text-sky-300 dark:hover:bg-sky-500/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-300 dark:hover:bg-amber-500/10"
                      onClick={() => openDialog("edit", user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                      onClick={() => requestDelete(user)}
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
        {!loading && sortedUsers.length > 0 && (
          <div className="flex items-center justify-between border-t border-black/5 px-5 py-3 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
            <span>
              Showing {sortedUsers.length} of {users.length} user
              {users.length !== 1 ? "s" : ""}
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
      {/* Create / Edit Dialog                                           */}
      {/* ------------------------------------------------------------- */}
      <ReusableFormDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        title={dialogMode === "add" ? "Add User" : "Edit User"}
        description={
          dialogMode === "add"
            ? "Create a new user account and assign a role."
            : "Update the selected user account."
        }
        fields={userFields}
        values={values}
        errors={errors}
        onChange={handleFieldChange}
        onSubmit={handleSave}
        isSaving={saving}
        isEditing={dialogMode === "edit"}
        submitLabel="Add User"
        editSubmitLabel="Save Changes"
      />

      {/* ------------------------------------------------------------- */}
      {/* Delete Confirmation Dialog                                     */}
      {/* ------------------------------------------------------------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "batch" ? "Delete Users?" : "Delete User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "batch" ? (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.ids.length} user{deleteTarget.ids.length === 1 ? "" : "s"}
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
              Warning
            </p>
            <p className="mt-1 text-xs text-red-700/80 dark:text-red-400/80">
              Deleting a user will revoke all access immediately. Any associated data may be affected.
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
              I understand that this action is irreversible and will revoke the user&apos;s access immediately.
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