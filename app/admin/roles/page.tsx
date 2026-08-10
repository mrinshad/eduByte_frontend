"use client"

import * as React from "react"
import { toast } from "sonner"
import { Shield, Key, Pencil, Plus, Trash2, Link2, X, ListChecks, Search, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation";
import { canAccessPortalArea, getPermissionPortal, getMissingNavbarPermissionFor, isNavbarPermission, hasOrphanedActionPermissions } from "@/lib/portal";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/common/pageHeader"

function PortalTag({ permName }: { permName: string }) {
  const portal = getPermissionPortal(permName)
  const styles = {
    ADMIN: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    WORKSPACE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    STUDENT: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    GLOBAL: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
  }

  return (
    <Badge variant="outline" className={cn("rounded-md px-1.5 py-0 text-[9px] font-bold tracking-wider uppercase border shrink-0", styles[portal])}>
      {portal}
    </Badge>
  )
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

import {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
  getRolePermissions,
  getPermissions,
  updateRolePermissions,
  type Role,
  type Permission,
  type DefaultPortal,
} from "@/lib/services/roles-permissions"

// Same color language as the Academic Profile page (amber accent + soft
// text-shadow on colored headers so it stays legible over any background).
const titleTextClass =
  "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-100"
const supportingTextClass =
  "text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-300"
const editIconClass =
  "rounded-xl text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] hover:text-white dark:text-slate-300 dark:hover:text-amber-300"
const whiteCheckboxClass =
  "border-white data-[state=checked]:bg-white data-[state=checked]:text-slate-900 data-[state=checked]:border-white"
const assignCheckboxClass = `${whiteCheckboxClass} hover:border-black`

const PORTAL_OPTIONS: { value: DefaultPortal; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "workspace", label: "Workspace" },
  { value: "student", label: "Student" },
]

function AddAction({ onAdd, disabled }: { onAdd: () => void; disabled?: boolean }) {
  return (
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
  )
}

function DeleteAction({
  onDelete,
  disabled,
  disabledReason,
}: {
  onDelete: (e: React.MouseEvent) => void
  disabled?: boolean
  disabledReason?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:text-slate-400 disabled:hover:bg-transparent dark:disabled:text-slate-600"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(e)
            }}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{disabled && disabledReason ? disabledReason : "Delete"}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function UnassignAction({ onUnassign }: { onUnassign: (e: React.MouseEvent) => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-500/10"
          onClick={(e) => {
            e.stopPropagation()
            onUnassign(e)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Remove from role</p>
      </TooltipContent>
    </Tooltip>
  )
}

// ---------------------------------------------------------------------------
// Skeleton row — mimics the shape of a role / permission row
// ---------------------------------------------------------------------------
function RowSkeleton({ withBadge = false }: { withBadge?: boolean }) {
  return (
    <div className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {withBadge && <Skeleton className="h-5 w-14 rounded-full" />}
        <Skeleton className="h-7 w-7 rounded-xl" />
        <Skeleton className="h-7 w-7 rounded-xl" />
      </div>
    </div>
  )
}

export default function Page() {
  // ---------------------------------------------------------------------
  // Roles
  // ---------------------------------------------------------------------
  const router = useRouter();
  const [roles, setRoles] = React.useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = React.useState(true)
  const [selectedRoleId, setSelectedRoleId] = React.useState("")

  const selectedRole = React.useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  )

  const [rolePermissionMap, setRolePermissionMap] = React.useState<Record<string, string[]>>({})

  async function loadRoles() {
    setRolesLoading(true)
    try {
      const data = await getRoles()
      setRoles(data)
      if (data.length > 0) {
        setSelectedRoleId((current) => current || data[0].id)
      }
      const map: Record<string, string[]> = {}
      await Promise.all(
        data.map(async (r) => {
          try {
            const perms = await getRolePermissions(r.id)
            map[r.id] = perms.map((p) => p.name)
          } catch {
            map[r.id] = []
          }
        })
      )
      setRolePermissionMap(map)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load roles")
    } finally {
      setRolesLoading(false)
    }
  }

  // ---------------------------------------------------------------------
  // Permissions currently assigned to the selected role
  // ---------------------------------------------------------------------
  const [rolePermissions, setRolePermissions] = React.useState<Permission[]>([])
  const [rolePermissionsLoading, setRolePermissionsLoading] = React.useState(true)

  async function loadRolePermissions(roleId: string) {
    if (!roleId) {
      setRolePermissions([])
      return
    }
    setRolePermissionsLoading(true)
    try {
      const data = await getRolePermissions(roleId)
      setRolePermissions(data)
      setRolePermissionMap((prev) => ({
        ...prev,
        [roleId]: data.map((p) => p.name),
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load role permissions")
    } finally {
      setRolePermissionsLoading(false)
    }
  }

  const missingNavbarPermissionsForRole = React.useMemo(() => {
    if (!rolePermissions || rolePermissions.length === 0) return new Set<string>()

    const rolePermNames = rolePermissions.map((p) => p.name)
    if (rolePermNames.includes("*")) return new Set<string>()

    const missingSet = new Set<string>()

    for (const permName of rolePermNames) {
      const missing = getMissingNavbarPermissionFor(permName, rolePermNames)
      if (missing) {
        missingSet.add(missing.toLowerCase())
      }
    }

    return missingSet
  }, [rolePermissions])

  // ---------------------------------------------------------------------
  // Full permission catalog, used to populate the "assign" dialog
  // ---------------------------------------------------------------------
  const [allPermissions, setAllPermissions] = React.useState<Permission[]>([])
  const [allPermissionsLoading, setAllPermissionsLoading] = React.useState(true)

  async function loadAllPermissions() {
    setAllPermissionsLoading(true)
    try {
      const data = await getPermissions()
      setAllPermissions(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load permissions")
    } finally {
      setAllPermissionsLoading(false)
    }
  }

  React.useEffect(() => {
    void loadRoles()
    void loadAllPermissions()
  }, [])

  React.useEffect(() => {
    void loadRolePermissions(selectedRoleId)
    setPermissionSelectMode(false)
    setSelectedPermissionIds([])
    setPermissionSearchQuery("")
  }, [selectedRoleId])

  // ---------------------------------------------------------------------
  // Search / filter within the selected role's assigned permissions
  // ---------------------------------------------------------------------
  const [permissionSearchQuery, setPermissionSearchQuery] = React.useState("")

  const filteredRolePermissions = React.useMemo(() => {
    const query = permissionSearchQuery.trim().toLowerCase()
    if (!query) return rolePermissions
    return rolePermissions.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description ? p.description.toLowerCase().includes(query) : false)
    )
  }, [rolePermissions, permissionSearchQuery])

  // ---------------------------------------------------------------------
  // Role — add/edit dialog
  // ---------------------------------------------------------------------
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false)
  const [roleDialogMode, setRoleDialogMode] = React.useState<"add" | "edit">("add")
  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null)
  const [roleValues, setRoleValues] = React.useState<{ name: string; defaultPortal: DefaultPortal | "" }>({
    name: "",
    defaultPortal: "",
  })
  const [roleErrors, setRoleErrors] = React.useState<Record<string, string | undefined>>({})
  const [roleSaving, setRoleSaving] = React.useState(false)

  function openRoleDialog(mode: "add" | "edit", role?: Role) {
    setRoleDialogMode(mode)
    setEditingRoleId(mode === "edit" ? role?.id ?? null : null)
    setRoleValues({
      name: mode === "edit" ? role?.name ?? "" : "",
      defaultPortal: mode === "edit" ? role?.defaultPortal ?? "" : "",
    })
    setRoleErrors({})
    setRoleDialogOpen(true)
  }

  function closeRoleDialog() {
    if (roleSaving) return
    setRoleDialogOpen(false)
    setEditingRoleId(null)
    setRoleValues({ name: "", defaultPortal: "" })
    setRoleErrors({})
  }

  async function handleSaveRole() {
    const name = roleValues.name.trim()
    const defaultPortal = roleValues.defaultPortal

    const errors: Record<string, string | undefined> = {}
    if (!name) errors.name = "Enter a role name"
    if (!defaultPortal) errors.defaultPortal = "Select a default portal"
    if (Object.keys(errors).length > 0) {
      setRoleErrors(errors)
      toast.error(errors.name ?? errors.defaultPortal ?? "Fix the highlighted fields")
      return
    }

    setRoleSaving(true)
    try {
      if (roleDialogMode === "add") {
        await createRole({ name, defaultPortal: defaultPortal as DefaultPortal })
        toast.success("Role created")
      } else if (editingRoleId) {
        await updateRole(editingRoleId, { name, defaultPortal: defaultPortal as DefaultPortal })
        toast.success("Role updated")
      }

      await loadRoles()
      closeRoleDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save role")
    } finally {
      setRoleSaving(false)
    }
  }

  // ---------------------------------------------------------------------
  // Assign existing permissions to the selected role (bulk, multi-select).
  // The API is a full-replacement PUT, so we send current + newly picked.
  // ---------------------------------------------------------------------
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false)
  const [assignSelectedIds, setAssignSelectedIds] = React.useState<string[]>([])
  const [assignSaving, setAssignSaving] = React.useState(false)
  const [assignSearchQuery, setAssignSearchQuery] = React.useState("")

  const availablePermissions = React.useMemo(() => {
    const assignedIds = new Set(rolePermissions.map((p) => p.id))
    return allPermissions.filter((p) => !assignedIds.has(p.id))
  }, [allPermissions, rolePermissions])

  const filteredAvailablePermissions = React.useMemo(() => {
    const query = assignSearchQuery.trim().toLowerCase()
    if (!query) return availablePermissions
    return availablePermissions.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description ? p.description.toLowerCase().includes(query) : false)
    )
  }, [availablePermissions, assignSearchQuery])

  const recommendedAvailablePermissions = React.useMemo(() => {
    return filteredAvailablePermissions.filter((p) =>
      missingNavbarPermissionsForRole.has(p.name.toLowerCase())
    )
  }, [filteredAvailablePermissions, missingNavbarPermissionsForRole])

  const otherAvailablePermissions = React.useMemo(() => {
    return filteredAvailablePermissions.filter(
      (p) => !missingNavbarPermissionsForRole.has(p.name.toLowerCase())
    )
  }, [filteredAvailablePermissions, missingNavbarPermissionsForRole])

  function openAssignDialog() {
    setAssignSelectedIds([])
    setAssignSearchQuery("")
    setAssignDialogOpen(true)
  }

  function closeAssignDialog() {
    if (assignSaving) return
    setAssignDialogOpen(false)
    setAssignSelectedIds([])
    setAssignSearchQuery("")
  }

  function toggleAssignSelection(permissionId: string) {
    setAssignSelectedIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    )
  }

  function toggleSelectAllAvailable() {
    const visibleIds = filteredAvailablePermissions.map((p) => p.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => assignSelectedIds.includes(id))
    setAssignSelectedIds((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    )
  }

  async function handleAssignPermissions() {
    if (!selectedRoleId || assignSelectedIds.length === 0) {
      toast.error("Select at least one permission")
      return
    }

    setAssignSaving(true)
    try {
      const nextIds = [...rolePermissions.map((p) => p.id), ...assignSelectedIds]
      await updateRolePermissions(selectedRoleId, nextIds)
      toast.success("Permissions assigned to role")
      await loadRolePermissions(selectedRoleId)
      closeAssignDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign permissions")
    } finally {
      setAssignSaving(false)
    }
  }

  // ---------------------------------------------------------------------
  // Bulk-select mode for removing several assigned permissions at once.
  // Same full-replacement PUT as everything else — we just filter out
  // every selected id and resend what's left.
  // ---------------------------------------------------------------------
  const [permissionSelectMode, setPermissionSelectMode] = React.useState(false)
  const [selectedPermissionIds, setSelectedPermissionIds] = React.useState<string[]>([])

  function togglePermissionSelectMode() {
    setPermissionSelectMode((prev) => !prev)
    setSelectedPermissionIds([])
  }

  function togglePermissionSelection(permissionId: string) {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    )
  }

  function toggleSelectAllRolePermissions() {
    const visibleIds = filteredRolePermissions.map((p) => p.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPermissionIds.includes(id))
    setSelectedPermissionIds((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    )
  }

  // ---------------------------------------------------------------------
  // Delete role / unassign one or many permissions from the selected role
  // ---------------------------------------------------------------------
  type DeleteTarget =
    | { type: "role"; id: string; name: string; userCount: number }
    | { type: "permission-unassign"; id: string; name: string }
    | { type: "permission-bulk-unassign"; ids: string[] }
    | null

  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null)
  const [deleting, setDeleting] = React.useState(false)

  function requestDeleteRole(role: Role) {
    if (role.userCount > 0) {
      toast.error("Remove all users from this role first")
      return
    }
    setDeleteTarget({ type: "role", id: role.id, name: role.name, userCount: role.userCount })
  }

  function requestUnassignPermission(permission: Permission) {
    setDeleteTarget({ type: "permission-unassign", id: permission.id, name: permission.name })
  }

  function requestBulkUnassignPermissions() {
    if (selectedPermissionIds.length === 0) {
      toast.error("Select at least one permission")
      return
    }
    setDeleteTarget({ type: "permission-bulk-unassign", ids: selectedPermissionIds })
  }

  function closeDeleteDialog() {
    if (deleting) return
    setDeleteTarget(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      if (deleteTarget.type === "role") {
        await deleteRole(deleteTarget.id)
        toast.success("Role deleted")
        if (selectedRoleId === deleteTarget.id) {
          setSelectedRoleId("")
        }
        await loadRoles()
      } else if (deleteTarget.type === "permission-bulk-unassign" && selectedRoleId) {
        const removeIds = new Set(deleteTarget.ids)
        const nextIds = rolePermissions.filter((p) => !removeIds.has(p.id)).map((p) => p.id)
        await updateRolePermissions(selectedRoleId, nextIds)
        toast.success(
          `${deleteTarget.ids.length} permission${deleteTarget.ids.length === 1 ? "" : "s"} removed from role`
        )
        await loadRolePermissions(selectedRoleId)
        setPermissionSelectMode(false)
        setSelectedPermissionIds([])
      } else if (deleteTarget.type === "permission-unassign" && selectedRoleId) {
        const nextIds = rolePermissions
          .filter((p) => p.id !== deleteTarget.id)
          .map((p) => p.id)
        await updateRolePermissions(selectedRoleId, nextIds)
        toast.success("Permission removed from role")
        await loadRolePermissions(selectedRoleId)
      }
      setDeleteTarget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <TooltipProvider>
      <section className="px-4 sm:px-6 py-2 flex flex-col h-[calc(100vh-8rem)] max-h-[78vh] overflow-hidden">
        <PageHeader title="Roles & Permissions" description="Manage system roles and their permissions" actions={
          <Button
            className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={() => router.push("/admin/permissions")}

          >
            <Plus className="h-4 w-4" />
            Create Permission
          </Button>

        } />

        <div className="mt-3 grid gap-5 lg:grid-cols-2 flex-1 min-h-0 overflow-hidden">
          {/* --------------------------------------------------------- */}
          {/* Roles — click a row to scope the permission card on the   */}
          {/* right.                                                    */}
          {/* --------------------------------------------------------- */}
          <Card className="flex flex-col h-full min-h-0 overflow-hidden dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
            <CardHeader className="shrink-0 flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-amber-500/10">
                  <Shield className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
                </span>
                <div>
                  <CardTitle className={`text-2xl font-semibold ${titleTextClass}`}>Roles</CardTitle>
                  <CardDescription className={`mt-1 ${supportingTextClass}`}>
                    Select a role to manage its permissions.
                  </CardDescription>
                </div>
              </div>

              <AddAction onAdd={() => openRoleDialog("add")} />
            </CardHeader>

            <CardContent
              className="
              flex-1 min-h-0 space-y-2 pt-4 overflow-y-auto
              scrollbar-thin
              scrollbar-thumb-slate-300
              scrollbar-track-transparent
              hover:scrollbar-thumb-slate-400
              dark:scrollbar-thumb-slate-700
              dark:hover:scrollbar-thumb-slate-600
            "
            >
              {rolesLoading ? (
                <>
                  <RowSkeleton withBadge />
                  <RowSkeleton withBadge />
                  <RowSkeleton withBadge />
                  <RowSkeleton withBadge />
                </>
              ) : roles.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-amber-500/30 bg-amber-50/80 px-5 py-6 text-center dark:border-amber-400/25 dark:bg-amber-400/10">
                  <p className={`text-sm font-medium ${titleTextClass}`}>No roles yet</p>
                  <p className={`mt-1 text-sm ${supportingTextClass}`}>
                    Create roles before assigning permissions.
                  </p>
                  <Button className="mt-4 rounded-xl" onClick={() => openRoleDialog("add")}>
                    Create role
                  </Button>
                </div>
              ) : (
                roles.map((role) => {
                  const isActive = role.id === selectedRoleId
                  const portalLabel =
                    PORTAL_OPTIONS.find((o) => o.value === role.defaultPortal)?.label ?? role.defaultPortal

                  return (
                    <div
                      key={role.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRoleId(role.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setSelectedRoleId(role.id)
                        }
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer",
                        isActive
                          ? "border-amber-500/40 bg-amber-100/90 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10"
                          : "border-black/5 bg-white/80 hover:border-black/10 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                        <Shield
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-amber-700 dark:text-amber-300" : "text-slate-400"
                          )}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate block text-slate-950 dark:text-slate-100">
                              {role.name}
                            </span>
                            {hasOrphanedActionPermissions(
                              role.defaultPortal,
                              rolePermissionMap[role.id] ?? (isActive ? rolePermissions.map((p) => p.name) : []),
                              role.name
                            ) && (
                                <span title="Missing navbar permission for default portal" className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                                  ⚠️ Missing Entry
                                </span>
                              )}
                          </div>
                          <span className="text-xs truncate block text-slate-500 dark:text-slate-400">
                            {portalLabel} portal
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full border border-black/5 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                          {role.userCount} user{role.userCount === 1 ? "" : "s"}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={editIconClass}
                          onClick={(event) => {
                            event.stopPropagation()
                            openRoleDialog("edit", role)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <DeleteAction
                          onDelete={() => requestDeleteRole(role)}
                          disabled={role.userCount > 0}
                          disabledReason={
                            role.userCount > 0
                              ? `${role.userCount} user${role.userCount === 1 ? "" : "s"} assigned`
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* --------------------------------------------------------- */}
          {/* Permissions — scoped to the selected role.                */}
          {/* --------------------------------------------------------- */}
          <Card className="flex flex-col h-full min-h-0 overflow-hidden dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
            <CardHeader className="shrink-0 flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-amber-500/10">
                  <Key className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
                </span>
                <div className="min-w-0">
                  <CardTitle className={`text-2xl font-semibold truncate ${titleTextClass}`}>
                    Permissions
                  </CardTitle>
                  <CardDescription className={`mt-1 ${supportingTextClass}`}>
                    {rolesLoading || rolePermissionsLoading
                      ? "Loading permissions…"
                      : !selectedRole
                        ? "Select a role to see its permissions."
                        : rolePermissions.length === 0
                          ? "No permissions yet."
                          : `${selectedRole.name} permissions are shown here.`}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      onClick={openAssignDialog}
                      disabled={!selectedRoleId || availablePermissions.length === 0}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assign existing</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={permissionSelectMode ? "secondary" : "outline"}
                      size="icon"
                      className="rounded-xl"
                      onClick={togglePermissionSelectMode}
                      disabled={!selectedRoleId || rolePermissions.length === 0}
                    >
                      {permissionSelectMode ? <X className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{permissionSelectMode ? "Cancel selection" : "Select multiple"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>

            {selectedRole && rolePermissions.length > 0 && hasOrphanedActionPermissions(selectedRole.defaultPortal, rolePermissions.map(p => p.name), selectedRole.name) && (
              <div className="shrink-0 mx-4 mt-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-slate-300 dark:text-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-white dark:text-amber-400" />
                  <span>
                    Missing navigation permission for <strong>{selectedRole.defaultPortal.toUpperCase()}</strong> portal (requires e.g. <code className="font-bold">{selectedRole.defaultPortal === "admin" ? "academics.listOnNavbar" : "feecollection.listOnNavbar"}</code> or <code className="font-bold">*</code>).
                  </span>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[11px] font-medium rounded-lg border-amber-500/40 text-slate-300 dark:text-amber-200 hover:bg-amber-500/20 shrink-0" onClick={openAssignDialog}>
                  Assign
                </Button>
              </div>
            )}

            {selectedRole && rolePermissions.length > 0 && (
              <div className="shrink-0 border-b border-black/5 px-4 py-2.5 dark:border-white/10">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={permissionSearchQuery}
                    onChange={(e) => setPermissionSearchQuery(e.target.value)}
                    placeholder="Search permissions…"
                    className="rounded-xl pl-9"
                  />
                </div>
              </div>
            )}

            {permissionSelectMode && rolePermissions.length > 0 && (
              <div className="shrink-0 flex items-center justify-between gap-3 border-b border-black/5 px-4 py-2.5 dark:border-white/10">
                <label className="flex items-center gap-2 text-sm text-slate-100 dark:text-slate-300 cursor-pointer">
                  <Checkbox
                    className={whiteCheckboxClass}
                    checked={
                      filteredRolePermissions.length > 0 &&
                      filteredRolePermissions.every((p) => selectedPermissionIds.includes(p.id))
                    }
                    onCheckedChange={toggleSelectAllRolePermissions}
                  />
                  Select all ({selectedPermissionIds.length} selected)
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  onClick={requestBulkUnassignPermissions}
                  disabled={selectedPermissionIds.length === 0}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Remove Selected
                </Button>
              </div>
            )}

            <CardContent
              className="
              flex-1 min-h-0 space-y-2 pt-4 overflow-y-auto
              scrollbar-thin
              scrollbar-thumb-slate-300
              scrollbar-track-transparent
              hover:scrollbar-thumb-slate-400
              dark:scrollbar-thumb-slate-700
              dark:hover:scrollbar-thumb-slate-600
            "
            >
              {rolesLoading || rolePermissionsLoading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : !selectedRole ? (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                  <p className={`text-sm font-medium ${titleTextClass}`}>No role selected</p>
                  <Button className="mt-4 rounded-xl" onClick={() => openRoleDialog("add")}>
                    Add role
                  </Button>
                </div>
              ) : rolePermissions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    No permissions assigned to {selectedRole.name} yet.
                  </p>
                  <Button
                    className="mt-3 rounded-xl font-medium"
                    onClick={openAssignDialog}
                    disabled={availablePermissions.length === 0}
                  >
                    Assign permissions
                  </Button>
                </div>
              ) : filteredRolePermissions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                  <p className={`text-sm font-medium ${titleTextClass}`}>No permissions match your search</p>
                </div>
              ) : (
                filteredRolePermissions.map((permission) => {
                  const isSelected = selectedPermissionIds.includes(permission.id)
                  const missingNavbarPerm = getMissingNavbarPermissionFor(
                    permission.name,
                    rolePermissions.map((p) => p.name)
                  )

                  return (
                    <div
                      key={permission.id}
                      role={permissionSelectMode ? "button" : undefined}
                      onClick={
                        permissionSelectMode ? () => togglePermissionSelection(permission.id) : undefined
                      }
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 transition-all",
                        permissionSelectMode ? "cursor-pointer" : "",
                        isSelected
                          ? "border-amber-500/40 bg-amber-100/90 dark:border-amber-400/30 dark:bg-amber-400/10"
                          : "border-black/5 bg-white/80 dark:border-white/10 dark:bg-white/5"
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        {permissionSelectMode && (
                          <Checkbox
                            className={whiteCheckboxClass}
                            checked={isSelected}
                            onCheckedChange={() => togglePermissionSelection(permission.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                          {permission.name.slice(0, 2).toUpperCase()}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-950 dark:text-slate-100 truncate">
                              {permission.name}
                            </p>
                            <PortalTag permName={permission.name} />
                          </div>
                          {missingNavbarPerm && (
                            <div className="mt-1">
                              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0 inline-block">
                                ⚠️ Needs {missingNavbarPerm}
                              </span>
                            </div>
                          )}
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                            {permission.description ? permission.description : ""}
                          </p>
                        </div>
                      </div>

                      {!permissionSelectMode && (
                        <div className="flex items-center gap-1 shrink-0">
                          <UnassignAction onUnassign={() => requestUnassignPermission(permission)} />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Create / Edit Role Dialog                                    */}
        {/* ------------------------------------------------------------- */}
        <Dialog open={roleDialogOpen} onOpenChange={(open) => !open && closeRoleDialog()}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{roleDialogMode === "add" ? "Add Role" : "Edit Role"}</DialogTitle>
              <DialogDescription>
                {roleDialogMode === "add" ? "Create a new system role." : "Update the selected role."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  placeholder="e.g. SUPERVISOR"
                  value={roleValues.name}
                  onChange={(e) => {
                    setRoleValues((prev) => ({ ...prev, name: e.target.value }))
                    if (roleErrors.name) setRoleErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                />
                {roleErrors.name && <p className="text-xs text-red-500">{roleErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role-portal">Default Portal</Label>
                <Select
                  value={roleValues.defaultPortal || undefined}
                  onValueChange={(value) => {
                    setRoleValues((prev) => ({ ...prev, defaultPortal: value as DefaultPortal }))
                    if (roleErrors.defaultPortal)
                      setRoleErrors((prev) => ({ ...prev, defaultPortal: undefined }))
                  }}
                >
                  <SelectTrigger id="role-portal">
                    <SelectValue placeholder="Select a portal" />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTAL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roleErrors.defaultPortal && (
                  <p className="text-xs text-red-500">{roleErrors.defaultPortal}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeRoleDialog} disabled={roleSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole} disabled={roleSaving}>
                {roleSaving ? "Saving…" : roleDialogMode === "add" ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ------------------------------------------------------------- */}
        {/* Assign Existing Permissions Dialog (bulk multi-select)        */}
        {/* ------------------------------------------------------------- */}
        <Dialog open={assignDialogOpen} onOpenChange={(open) => !open && closeAssignDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Permissions</DialogTitle>
              <DialogDescription>
                Select existing permissions to assign to{" "}
                <span className="font-medium">{selectedRole?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="relative px-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={assignSearchQuery}
                onChange={(e) => setAssignSearchQuery(e.target.value)}
                placeholder="Search permissions…"
                className="rounded-xl pl-9"
              />
            </div>

            {availablePermissions.length > 0 && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-sm text-slate-100 dark:text-slate-300 cursor-pointer">
                  <Checkbox
                    className={assignCheckboxClass}
                    checked={
                      filteredAvailablePermissions.length > 0 &&
                      filteredAvailablePermissions.every((p) => assignSelectedIds.includes(p.id))
                    }
                    onCheckedChange={toggleSelectAllAvailable}
                  />
                  Select all
                </label>
                <span className="text-xs text-slate-100 dark:text-slate-400">
                  {assignSelectedIds.length} selected
                </span>
              </div>
            )}

            <div className="max-h-[340px] overflow-y-auto space-y-3 py-2">
              {allPermissionsLoading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : availablePermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All available permissions are already assigned.
                </p>
              ) : filteredAvailablePermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No permissions match your search.
                </p>
              ) : (
                <>
                  {recommendedAvailablePermissions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-white dark:text-amber-300 px-1">
                        ⭐ Recommended Navigation Access
                      </p>
                      <div className="space-y-1.5">
                        {recommendedAvailablePermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 px-3 py-2.5 cursor-pointer hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                          >
                            <Checkbox
                              className={assignCheckboxClass}
                              checked={assignSelectedIds.includes(permission.id)}
                              onCheckedChange={() => toggleAssignSelection(permission.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-950 dark:text-slate-100 truncate">
                                  {permission.name}
                                </p>
                                <PortalTag permName={permission.name} />
                              </div>
                              <div className="mt-1">
                                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0 inline-block">
                                  ⭐ Recommended for navbar entry
                                </span>
                              </div>
                              {permission.description ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {permission.description}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {otherAvailablePermissions.length > 0 && (
                    <div className="space-y-1.5">
                      {recommendedAvailablePermissions.length > 0 && (
                        <p className="text-xs font-semibold text-white dark:text-slate-400 px-1 pt-2">
                          Other Available Permissions
                        </p>
                      )}
                      <div className="space-y-1.5">
                        {otherAvailablePermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 px-3 py-2.5 cursor-pointer hover:bg-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                          >
                            <Checkbox
                              className={assignCheckboxClass}
                              checked={assignSelectedIds.includes(permission.id)}
                              onCheckedChange={() => toggleAssignSelection(permission.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-950 dark:text-slate-100 truncate">
                                  {permission.name}
                                </p>
                                <PortalTag permName={permission.name} />
                              </div>
                              {isNavbarPermission(permission.name) && (
                                <div className="mt-1">
                                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0 inline-block">
                                    Required for navbar entry
                                  </span>
                                </div>
                              )}
                              {permission.description ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {permission.description}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeAssignDialog} disabled={assignSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignPermissions}
                disabled={assignSaving || assignSelectedIds.length === 0}
              >
                {assignSaving ? "Assigning…" : `Assign Selected${assignSelectedIds.length ? ` (${assignSelectedIds.length})` : ""}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ------------------------------------------------------------- */}
        {/* Delete Role / Remove Permission Confirmation Dialog           */}
        {/* ------------------------------------------------------------- */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && closeDeleteDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteTarget?.type === "role"
                  ? "Delete Role?"
                  : deleteTarget?.type === "permission-bulk-unassign"
                    ? "Remove Permissions?"
                    : "Remove Permission?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.type === "role" ? (
                  <>
                    This will permanently delete{" "}
                    <span className="font-medium text-foreground">{deleteTarget.name}</span>. This
                    action cannot be undone.
                  </>
                ) : deleteTarget?.type === "permission-bulk-unassign" ? (
                  <>
                    Remove{" "}
                    <span className="font-medium text-foreground">
                      {deleteTarget.ids.length} permission{deleteTarget.ids.length === 1 ? "" : "s"}
                    </span>{" "}
                    from <span className="font-medium text-foreground">{selectedRole?.name}</span>? They
                    will remain available for other roles.
                  </>
                ) : deleteTarget?.type === "permission-unassign" ? (
                  <>
                    Remove{" "}
                    <span className="font-medium text-foreground">{deleteTarget.name}</span> from{" "}
                    <span className="font-medium text-foreground">{selectedRole?.name}</span>? The
                    permission will remain available for other roles.
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className={
                  deleteTarget?.type === "permission-unassign" ||
                    deleteTarget?.type === "permission-bulk-unassign"
                    ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                    : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                }
              >
                {deleting
                  ? "Processing…"
                  : deleteTarget?.type === "permission-unassign" ||
                    deleteTarget?.type === "permission-bulk-unassign"
                    ? "Remove"
                    : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </TooltipProvider>
  )
}