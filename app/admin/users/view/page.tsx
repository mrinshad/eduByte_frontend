"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

import { toast } from "sonner"
import {
  ArrowLeft,
  Mail,
  User,
  Shield,
  Clock,
  Pencil,
  Trash2,
  Activity,
  MapPin,
  CalendarDays,
  AlertTriangle,
  Copy,
  CheckCircle2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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

import { ReusableFormDialog, type FormField } from "@/components/common/resusable-dialoge-form"

import {
  getUser,
  updateUser,
  deleteUser,
  type User as UserType,
  type UserInput,
} from "@/lib/services/user-service"

import {
  getRoles,
  type Role,
} from "@/lib/services/roles-permissions"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getTimeAgo(dateStr?: string) {
  if (!dateStr) return "—"
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return formatDate(dateStr)
}

// ---------------------------------------------------------------------------
// Copy Button
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all dark:hover:text-amber-300 dark:hover:bg-amber-500/10"
      title="Copy to clipboard"
    >
      {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Detail Row
// ---------------------------------------------------------------------------
function DetailRow({
  icon: Icon,
  label,
  value,
  children,
  copyable,
}: {
  icon: React.ElementType
  label: string
  value?: string
  children?: React.ReactNode
  copyable?: boolean
}) {
  return (
    <div className="flex items-start gap-3.5 py-3.5 group/row">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        {children ? (
          <div className="mt-1">{children}</div>
        ) : (
          <p className="mt-1 text-sm font-medium text-slate-950 dark:text-slate-100 truncate flex items-center gap-1">
            {value}
            {copyable && value && value !== "—" && <CopyButton text={value} />}
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Activity Item
// ---------------------------------------------------------------------------
function ActivityItem({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  accent: string
}) {
  return (
    <div className="flex items-start gap-3.5 group">
      <span className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
        accent
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-slate-950 dark:text-slate-100">{value}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner component (needs Suspense because it uses useSearchParams)
// ---------------------------------------------------------------------------
function UserViewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = searchParams.get("id") ?? ""

  // ----------------------------------------------------------------------
  // Data
  // ----------------------------------------------------------------------
  const [user, setUser] = React.useState<UserType | null>(null)
  const [roles, setRoles] = React.useState<Role[]>([])
  const [loading, setLoading] = React.useState(true)

  async function loadData() {
    if (!userId) {
      toast.error("Missing user id")
      router.push("/admin/users")
      return
    }
    setLoading(true)
    try {
      const [userData, roleData] = await Promise.all([getUser(userId), getRoles()])
      if (!userData || userData.username?.toLowerCase() === "superadmin" || userData.role?.toUpperCase() === "SUPER ADMIN") {
        toast.error("User not found or access restricted")
        router.push("/admin/users")
        return
      }
      setUser(userData)
      setRoles(roleData.filter((r) => r.name?.toUpperCase() !== "SUPER ADMIN"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (userId) void loadData()
  }, [userId])

  const role = React.useMemo(() => {
    if (!user) return null
    return roles.find((r) => r.id === user.roleId)
  }, [user, roles])

  // ----------------------------------------------------------------------
  // Edit Dialog
  // ----------------------------------------------------------------------
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [values, setValues] = React.useState<Partial<UserInput>>({})
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = React.useState(false)

  const editFields: FormField[] = React.useMemo(() => {
    return [
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
        type: "text",
        name: "password",
        label: "New Password",
        placeholder: "Leave blank to keep current",
        required: false,
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
  }, [roles])

  function openEditDialog() {
    if (!user) return
    setValues({
      name: user.name,
      username: user.username,
      email: user.email,
      password: "",
      roleId: user.roleId,
      isActive: user.isActive,
    })
    setErrors({})
    setDialogOpen(true)
  }

  function closeDialog() {
    if (saving) return
    setDialogOpen(false)
    setValues({})
    setErrors({})
  }

  function handleFieldChange(name: string, value: UserInput[keyof UserInput]) {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSave() {
    if (!user) return
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
    if (!roleId) errs.roleId = "Select a role"

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error("Fix the highlighted fields")
      return
    }

    setSaving(true)
    try {
      const updateData: Partial<UserInput> = { name, username, email, roleId, isActive: values.isActive }
      if (password) updateData.password = password
      await updateUser(user.id, updateData)
      toast.success("User updated")
      await loadData()
      closeDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  // ----------------------------------------------------------------------
  // Delete
  // ----------------------------------------------------------------------
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = React.useState(false)

  async function handleDelete() {
    if (!user || !deleteConfirmed) return
    setDeleting(true)
    try {
      await deleteUser(user.id)
      toast.success("User deleted")
      router.push("/admin/users")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
      setDeleteConfirmed(false)
    }
  }

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  if (loading) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        <PageHeader title="User Details" description="Loading user information…" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-black/5 bg-white/80 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="space-y-2.5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
            <Separator className="my-6" />
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white/80 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
            <Skeleton className="h-5 w-32 mb-6" />
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!user) return null

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="User Details"
        description="View and manage user account information"
        actions={
          <div className="flex items-center gap-2.5">
            
            <Button
              size="sm"
              className="rounded-xl gap-2 h-10 bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20 transition-all hover:shadow-md hover:shadow-amber-600/30"
              onClick={openEditDialog}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 h-10 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:hover:bg-red-500/10"
              onClick={() => {
                setDeleteConfirmed(false)
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info Card */}
        <div className="lg:col-span-2 rounded-2xl border border-black/5 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
          {/* Profile Header */}
          <div className="flex items-center gap-4 p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-lg font-bold text-white shadow-lg shadow-amber-600/20">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">
                  {user.name}
                </h2>
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-lg px-2.5 py-0.5 text-xs font-semibold border",
                    user.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  )}
                >
                  <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full inline-block", user.isActive ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-slate-400")} />
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                @{user.username} · {user.email}
              </p>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Details */}
          <div className="px-6">
            <DetailRow icon={User} label="Full Name" value={user.name} />
            <Separator className="opacity-50" />
            <DetailRow icon={Activity} label="Username">
              <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
                <span className="text-slate-400">@</span>
                {user.username}
              </p>
            </DetailRow>
            <Separator className="opacity-50" />
            <DetailRow icon={Mail} label="Email Address" value={user.email} copyable />
            <Separator className="opacity-50" />
            <DetailRow icon={Shield} label="Assigned Role">
              <div className="flex items-center gap-2.5 mt-1">
                <Badge
                  variant="secondary"
                  className="rounded-lg px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20"
                >
                  {role?.name ?? user.role}
                </Badge>
                {role?.defaultPortal && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Portal: <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{role.defaultPortal}</span>
                  </span>
                )}
              </div>
            </DetailRow>
            <Separator className="opacity-50" />
            <DetailRow icon={MapPin} label="Default Portal">
              <Badge
                variant="outline"
                className="rounded-lg text-xs font-semibold capitalize mt-1 border-slate-200 dark:border-slate-700"
              >
                {role?.defaultPortal ?? "workspace"}
              </Badge>
            </DetailRow>
          </div>
        </div>

        {/* Side Card — Activity & Metadata */}
        <div className="rounded-2xl border border-black/5 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
          <div className="p-6">
            <h3 className="text-sm font-bold tracking-tight text-slate-950 dark:text-slate-100">
              Account Activity
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Timeline of account events
            </p>
          </div>

          <Separator className="opacity-50" />

          <div className="px-6 py-5 space-y-5">
            <ActivityItem
              icon={CalendarDays}
              label="Created"
              value={formatDate(user.createdAt)}
              subtext={getTimeAgo(user.createdAt)}
              accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
            />

            <ActivityItem
              icon={Clock}
              label="Last Updated"
              value={formatDate(user.updatedAt)}
              subtext={getTimeAgo(user.updatedAt)}
              accent="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
            />

            <ActivityItem
              icon={Shield}
              label="Role ID"
              value={user.roleId}
              subtext="Unique role identifier"
              accent="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
            />

            <ActivityItem
              icon={User}
              label="User ID"
              value={user.id}
              subtext="Unique user identifier"
              accent="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <ReusableFormDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        title="Edit User"
        description="Update the user account details."
        fields={editFields}
        values={values}
        errors={errors}
        onChange={handleFieldChange}
        onSubmit={handleSave}
        isSaving={saving}
        isEditing={true}
        submitLabel="Save Changes"
        editSubmitLabel="Save Changes"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Delete User?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">{user.name}</span>. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3.5 dark:border-red-500/20 dark:bg-red-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Warning</p>
            </div>
            <p className="mt-1 text-xs text-red-700/80 dark:text-red-400/80 leading-relaxed">
              Deleting this user will immediately revoke all access. Any associated records may be
              affected.
            </p>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="delete-confirm-view"
              checked={deleteConfirmed}
              onChange={(e) => setDeleteConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-400 text-red-600 focus:ring-red-500 dark:border-slate-500"
            />
            <label
              htmlFor="delete-confirm-view"
              className="cursor-pointer text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300"
            >
              I understand that this action is irreversible and will revoke the user&apos;s access immediately.
            </label>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleting} onClick={() => setDeleteConfirmed(false)} className="rounded-xl h-10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || !deleteConfirmed}
              className={cn(
                "rounded-xl h-10 bg-red-600 hover:bg-red-700 focus:ring-red-500",
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

// ---------------------------------------------------------------------------
// Page export — wraps content in Suspense (required for useSearchParams)
// ---------------------------------------------------------------------------
export default function UserViewPage() {
  return (
    <React.Suspense fallback={null}>
      <UserViewContent />
    </React.Suspense>
  )
}