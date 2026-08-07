"use client"

import * as React from "react"
import { toast } from "sonner"
import { Shield, Key, Pencil, Plus, Trash2, Link2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import PageHeader from "@/components/common/pageHeader"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ReusableFormDialog, type FormField } from "@/components/common/resusable-dialoge-form"
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
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission,
  addPermissionsToRole,
  removePermissionsFromRole,
  type Role,
  type Permission,
} from "@/lib/services/roles-permissions"

// Same color language as the Academic Profile page (amber accent + soft
// text-shadow on colored headers so it stays legible over any background).
const titleTextClass =
  "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-100"
const supportingTextClass =
  "text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-300"
const editIconClass =
  "rounded-xl text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] hover:text-white dark:text-slate-300 dark:hover:text-amber-300"

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
  // Shared lookup data
  // ---------------------------------------------------------------------
  const [roles, setRoles] = React.useState<Role[]>([])
  const [allPermissions, setAllPermissions] = React.useState<Permission[]>([])

  const [rolesLoading, setRolesLoading] = React.useState(true)
  const [permissionsLoading, setPermissionsLoading] = React.useState(true)

  const [selectedRoleId, setSelectedRoleId] = React.useState("")

  const selectedRole = React.useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  )

  const selectedRolePermissions = React.useMemo(
    () => selectedRole?.permissions ?? [],
    [selectedRole]
  )

  async function loadRoles() {
    setRolesLoading(true)
    try {
      const data = await getRoles()
      setRoles(data)
      if (data.length > 0) {
        setSelectedRoleId((current) => current || data[0].id)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load roles")
    } finally {
      setRolesLoading(false)
    }
  }

  async function loadPermissions() {
    setPermissionsLoading(true)
    try {
      const data = await getPermissions()
      setAllPermissions(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load permissions")
    } finally {
      setPermissionsLoading(false)
    }
  }

  React.useEffect(() => {
    void loadRoles()
    void loadPermissions()
  }, [])

  // ---------------------------------------------------------------------
  // Role — add/edit dialog (via ReusableFormDialog)
  // ---------------------------------------------------------------------
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false)
  const [roleDialogMode, setRoleDialogMode] = React.useState<"add" | "edit">("add")
  const [roleValues, setRoleValues] = React.useState<{ name: string; description: string }>({
    name: "",
    description: "",
  })
  const [roleErrors, setRoleErrors] = React.useState<Record<string, string | undefined>>({})
  const [roleSaving, setRoleSaving] = React.useState(false)

  const roleFields: FormField[] = [
    { type: "text", name: "name", label: "Role Name", placeholder: "e.g. SUPERVISOR", required: true },
    { type: "text", name: "description", label: "Description", placeholder: "e.g. Supervisor with limited access" },
  ]

  function openRoleDialog(mode: "add" | "edit") {
    setRoleDialogMode(mode)
    setRoleValues({
      name: mode === "edit" ? selectedRole?.name ?? "" : "",
      description: mode === "edit" ? selectedRole?.description ?? "" : "",
    })
    setRoleErrors({})
    setRoleDialogOpen(true)
  }

  function closeRoleDialog() {
    setRoleDialogOpen(false)
    setRoleValues({ name: "", description: "" })
    setRoleErrors({})
  }

  function handleRoleFieldChange(name: string, value: string) {
    setRoleValues((prev) => ({ ...prev, [name]: value }))
    if (roleErrors[name]) {
      setRoleErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSaveRole() {
    const name = roleValues.name.trim()
    const description = roleValues.description.trim()

    if (!name) {
      setRoleErrors({ name: "Enter a role name" })
      toast.error("Enter a role name")
      return
    }

    setRoleSaving(true)
    try {
      if (roleDialogMode === "add") {
        await createRole({ name, description })
        toast.success("Role created")
      } else if (selectedRoleId) {
        await updateRole(selectedRoleId, { name, description })
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
  // Permission — add/edit dialog (via ReusableFormDialog)
  // When adding from a role context, the permission is auto-assigned.
  // ---------------------------------------------------------------------
  const [permissionDialogOpen, setPermissionDialogOpen] = React.useState(false)
  const [permissionDialogMode, setPermissionDialogMode] = React.useState<"add" | "edit">("add")
  const [editingPermissionId, setEditingPermissionId] = React.useState<string | null>(null)
  const [permissionValues, setPermissionValues] = React.useState<{ name: string; description: string }>({
    name: "",
    description: "",
  })
  const [permissionErrors, setPermissionErrors] = React.useState<Record<string, string | undefined>>({})
  const [permissionSaving, setPermissionSaving] = React.useState(false)

  const permissionFields: FormField[] = [
    { type: "text", name: "name", label: "Permission Name", placeholder: "e.g. students.exportCSV", required: true },
    { type: "text", name: "description", label: "Description", placeholder: "e.g. Enable exporting students list to CSV" },
  ]

  function openPermissionDialog(mode: "add" | "edit", permission?: Permission) {
    setPermissionDialogMode(mode)
    setEditingPermissionId(mode === "edit" ? permission?.id ?? null : null)
    setPermissionValues({
      name: mode === "edit" ? permission?.name ?? "" : "",
      description: mode === "edit" ? permission?.description ?? "" : "",
    })
    setPermissionErrors({})
    setPermissionDialogOpen(true)
  }

  function closePermissionDialog() {
    setPermissionDialogOpen(false)
    setEditingPermissionId(null)
    setPermissionValues({ name: "", description: "" })
    setPermissionErrors({})
  }

  function handlePermissionFieldChange(name: string, value: string) {
    setPermissionValues((prev) => ({ ...prev, [name]: value }))
    if (permissionErrors[name]) {
      setPermissionErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSavePermission() {
    const name = permissionValues.name.trim()
    const description = permissionValues.description.trim()

    if (!name) {
      setPermissionErrors({ name: "Enter a permission name" })
      toast.error("Enter a permission name")
      return
    }

    setPermissionSaving(true)
    try {
      if (permissionDialogMode === "add") {
        // Create the permission globally
        const created = (await createPermission({ name, description })) as {
          success: boolean
          data?: { id: string }
        }

        // Auto-assign to the currently selected role
        if (created?.data?.id && selectedRoleId) {
          await addPermissionsToRole(selectedRoleId, [created.data.id])
        }

        toast.success("Permission created and assigned")
      } else if (editingPermissionId) {
        await updatePermission(editingPermissionId, { name, description })
        toast.success("Permission updated")
      }

      await Promise.all([loadRoles(), loadPermissions()])
      closePermissionDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save permission")
    } finally {
      setPermissionSaving(false)
    }
  }

  // ---------------------------------------------------------------------
  // Assign existing permissions to role dialog
  // ---------------------------------------------------------------------
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false)
  const [assignSelectedIds, setAssignSelectedIds] = React.useState<string[]>([])
  const [assignSaving, setAssignSaving] = React.useState(false)

  const availablePermissions = React.useMemo(() => {
    const assignedIds = new Set(selectedRolePermissions.map((p) => p.id))
    return allPermissions.filter((p) => !assignedIds.has(p.id))
  }, [allPermissions, selectedRolePermissions])

  function openAssignDialog() {
    setAssignSelectedIds([])
    setAssignDialogOpen(true)
  }

  function closeAssignDialog() {
    setAssignDialogOpen(false)
    setAssignSelectedIds([])
  }

  function toggleAssignSelection(permissionId: string) {
    setAssignSelectedIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    )
  }

  async function handleAssignPermissions() {
    if (!selectedRoleId || assignSelectedIds.length === 0) {
      toast.error("Select at least one permission")
      return
    }

    setAssignSaving(true)
    try {
      await addPermissionsToRole(selectedRoleId, assignSelectedIds)
      toast.success("Permissions assigned to role")
      await loadRoles()
      closeAssignDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign permissions")
    } finally {
      setAssignSaving(false)
    }
  }

  // ---------------------------------------------------------------------
  // Delete / Unassign confirmation (shared for role + permission)
  // ---------------------------------------------------------------------
  type DeleteTarget =
    | { type: "role"; id: string; name: string; userCount: number }
    | { type: "permission"; id: string; name: string; action: "delete" | "unassign" }
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

  function requestDeletePermission(permission: Permission) {
    setDeleteTarget({ type: "permission", id: permission.id, name: permission.name, action: "delete" })
  }

  function requestUnassignPermission(permission: Permission) {
    setDeleteTarget({ type: "permission", id: permission.id, name: permission.name, action: "unassign" })
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
      } else if (deleteTarget.action === "delete") {
        await deletePermission(deleteTarget.id)
        toast.success("Permission deleted")
        await Promise.all([loadRoles(), loadPermissions()])
      } else if (deleteTarget.action === "unassign" && selectedRoleId) {
        await removePermissionsFromRole(selectedRoleId, [deleteTarget.id])
        toast.success("Permission removed from role")
        await loadRoles()
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
      <section className="px-4 sm:px-6 py-4">
        <PageHeader title="Roles & Permissions" description="Manage system roles and their permissions" />

       
          {/* Header card */}
          

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* --------------------------------------------------------- */}
            {/* Roles — click a row to scope the permission card on the   */}
            {/* right.                                                    */}
            {/* --------------------------------------------------------- */}
            <Card className="w-full dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
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
                space-y-2 pt-4 max-h-[420px] overflow-y-auto
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

                          <div className="min-w-0">
                            <span className="font-medium truncate block text-slate-950 dark:text-slate-100">
                              {role.name}
                            </span>
                            {role.description ? (
                              <span className="text-xs truncate block text-slate-500 dark:text-slate-400">
                                {role.description}
                              </span>
                            ) : null}
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
                              setSelectedRoleId(role.id)
                              openRoleDialog("edit")
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
            
            <Card className="w-full dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-amber-500/10">
                    <Key className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className={`text-2xl font-semibold truncate ${titleTextClass}`}>
                      Permissions
                    </CardTitle>
                    <CardDescription className={`mt-1 ${supportingTextClass}`}>
                      {rolesLoading || permissionsLoading
                        ? "Loading permissions…"
                        : !selectedRole
                          ? "Select a role to see its permissions."
                          : selectedRolePermissions.length === 0
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
                  <AddAction onAdd={() => openPermissionDialog("add")} disabled={!selectedRoleId} />
                </div>
              </CardHeader>

              <CardContent
                className="
                space-y-2 pt-4 max-h-[420px] overflow-y-auto
                scrollbar-thin
                scrollbar-thumb-slate-300
                scrollbar-track-transparent
                hover:scrollbar-thumb-slate-400
                dark:scrollbar-thumb-slate-700
                dark:hover:scrollbar-thumb-slate-600
              "
              >
                {rolesLoading || permissionsLoading ? (
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
                ) : selectedRolePermissions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                    <p className={`text-sm font-medium ${titleTextClass}`}>No permissions yet</p>
                    <Button className="mt-4 rounded-xl" onClick={() => openPermissionDialog("add")}>
                      Add permission
                    </Button>
                  </div>
                ) : (
                  selectedRolePermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/80 px-4 py-3 transition-all dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                          {permission.name.slice(0, 2).toUpperCase()}
                        </span>

                        <div className="min-w-0">
                          <p className="font-medium text-slate-950 dark:text-slate-100 truncate">
                            {permission.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                            {permission.description ? permission.description : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={editIconClass}
                          onClick={() => openPermissionDialog("edit", permission)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <UnassignAction onUnassign={() => requestUnassignPermission(permission)} />

                        <DeleteAction onDelete={() => requestDeletePermission(permission)} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        

        {/* ------------------------------------------------------------- */}
        {/* Create / Edit Role Dialog */}
        {/* ------------------------------------------------------------- */}
        <ReusableFormDialog
          open={roleDialogOpen}
          onOpenChange={(open) => (open ? setRoleDialogOpen(true) : closeRoleDialog())}
          theme="vehicle"
          title={roleDialogMode === "add" ? "Add Role" : "Edit Role"}
          description={
            roleDialogMode === "add"
              ? "Create a new system role."
              : "Update the selected role."
          }
          fields={roleFields}
          values={roleValues}
          errors={roleErrors}
          onChange={handleRoleFieldChange}
          onSubmit={handleSaveRole}
          isSaving={roleSaving}
          isEditing={roleDialogMode === "edit"}
          submitLabel="Add"
          editSubmitLabel="Save"
        />

        {/* ------------------------------------------------------------- */}
        {/* Create / Edit Permission Dialog */}
        {/* ------------------------------------------------------------- */}
        <ReusableFormDialog
          open={permissionDialogOpen}
          onOpenChange={(open) => (open ? setPermissionDialogOpen(true) : closePermissionDialog())}
          theme="vehicle"
          title={permissionDialogMode === "add" ? "Add Permission" : "Edit Permission"}
          description={
            permissionDialogMode === "add"
              ? `Create a new permission under ${selectedRole?.name || "the selected role"}.`
              : "Update the selected permission."
          }
          fields={permissionFields}
          values={permissionValues}
          errors={permissionErrors}
          onChange={handlePermissionFieldChange}
          onSubmit={handleSavePermission}
          isSaving={permissionSaving}
          isEditing={permissionDialogMode === "edit"}
          submitLabel="Add"
          editSubmitLabel="Save"
        />

        {/* ------------------------------------------------------------- */}
        {/* Assign Existing Permissions Dialog */}
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

            <div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
              {availablePermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All available permissions are already assigned.
                </p>
              ) : (
                availablePermissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 px-3 py-2.5 cursor-pointer hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                  >
                    <Checkbox
                      checked={assignSelectedIds.includes(permission.id)}
                      onCheckedChange={() => toggleAssignSelection(permission.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-950 dark:text-slate-100 truncate">
                        {permission.name}
                      </p>
                      {permission.description ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {permission.description}
                        </p>
                      ) : null}
                    </div>
                  </label>
                ))
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
                {assignSaving ? "Assigning…" : "Assign Selected"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ------------------------------------------------------------- */}
        {/* Delete / Unassign Confirmation Dialog */}
        {/* ------------------------------------------------------------- */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && closeDeleteDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteTarget?.type === "role"
                  ? "Delete Role?"
                  : deleteTarget?.action === "unassign"
                    ? "Remove Permission?"
                    : "Delete Permission?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.type === "role" ? (
                  <>
                    This will permanently delete{" "}
                    <span className="font-medium text-foreground">{deleteTarget.name}</span>. This
                    action cannot be undone.
                  </>
                ) : deleteTarget?.action === "unassign" ? (
                  <>
                    Remove{" "}
                    <span className="font-medium text-foreground">{deleteTarget.name}</span> from{" "}
                    <span className="font-medium text-foreground">{selectedRole?.name}</span>? The
                    permission will remain available for other roles.
                  </>
                ) : (
                  <>
                    This will permanently delete{" "}
                    <span className="font-medium text-foreground">{deleteTarget?.name}</span> and
                    remove it from all roles. This action cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className={
                  deleteTarget?.type === "permission" && deleteTarget.action === "unassign"
                    ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                    : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                }
              >
                {deleting
                  ? "Processing…"
                  : deleteTarget?.type === "permission" && deleteTarget.action === "unassign"
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