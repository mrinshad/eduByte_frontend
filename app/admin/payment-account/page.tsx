"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Loader2, Building2, Pencil, Trash2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    ACCOUNT_TYPES,
    type AccountType,
    type AccountDetail,
} from "@/lib/services/accounts"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
    getAllAccounts,
    createAccount,
    updateAccount,
    getAccountById,
    type Account,
    type AccountInput,
} from "@/lib/services/accounts"

const tableHeaders = ["Id", "Account Name", "Account Type", "Actions"]

const EMPTY_FORM: AccountInput = {
    name: "",
    type: "Asset",
    description: "",
    active: true,
}

export default function Page() {
    const router = useRouter()

    // ── Data state ──────────────────────────────────────────────────────────────
    const [accounts, setAccounts] = useState<Account[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ── Create / Edit dialog ────────────────────────────────────────────────────
    const [formOpen, setFormOpen] = useState(false)
    const [isFormLoading, setIsFormLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<AccountInput>({ ...EMPTY_FORM })

    // ── View dialog ─────────────────────────────────────────────────────────────
    const [viewOpen, setViewOpen] = useState(false)
    const [viewData, setViewData] = useState<AccountDetail | null>(null)
    const [isViewLoading, setIsViewLoading] = useState(false)

    // ── Load accounts ─────────────────────────────────────────────────────────
    useEffect(() => {
        loadAccounts()
    }, [])

    async function loadAccounts() {
        try {
            setIsLoading(true)
            setError(null)
            const data = await getAllAccounts()
            setAccounts(data)
        } catch (err) {
            console.error(err)
            setError("Could not load accounts. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // ── Form helpers ──────────────────────────────────────────────────────────
    function resetForm() {
        setFormData({ ...EMPTY_FORM })
        setEditingId(null)
    }

    function openCreate() {
        resetForm()
        setFormOpen(true)
    }

    // Fetch full detail so description & active are always populated
    async function openEdit(id: string) {
        resetForm()
        setEditingId(id)
        setFormOpen(true)
        try {
            setIsFormLoading(true)
            const detail = await getAccountById(id)
            if (detail) {
                setFormData({
                    name: detail.name,
                    type: detail.type,
                    description: detail.description ?? "",
                    active: detail.isActive ?? true,
                })
            }
        } catch (err) {
            console.error(err)
            toast.error("Failed to load account details")
            setFormOpen(false)
            resetForm()
        } finally {
            setIsFormLoading(false)
        }
    }

    async function handleSave() {
        if (!formData.name.trim() || !formData.type.trim()) {
            toast.warning("Please fill all required fields")
            return
        }
        try {
            setIsSaving(true)
            if (editingId) {
                await updateAccount(editingId, formData)
                toast.success("Account updated successfully")
            } else {
                await createAccount(formData)
                toast.success("Account created successfully")
            }
            setFormOpen(false)
            resetForm()
            await loadAccounts()
        } catch (err) {
            console.error(err)
            toast.error(editingId ? "Failed to update account" : "Failed to create account")
        } finally {
            setIsSaving(false)
        }
    }

    // ── View helpers ──────────────────────────────────────────────────────────
    async function openView(id: string) {
        setViewData(null)
        setViewOpen(true)
        try {
            setIsViewLoading(true)
            const data = await getAccountById(id)
            setViewData(data)
        } catch (err) {
            console.error(err)
            toast.error("Failed to load account details")
            setViewOpen(false)
        } finally {
            setIsViewLoading(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="w-full px-6 py-4 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
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
                            Accounts
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                            Manage and view all accounts.
                        </p>
                    </div>
                </div>

                <Button
                    className="shrink-0 gap-2 bg-[oklch(0.46_0.04_125)] text-[oklch(0.98_0.01_95)] hover:opacity-90 shadow-sm font-semibold tracking-tight h-9 px-4 rounded-xl"
                    onClick={openCreate}
                >
                    <Plus className="h-4 w-4" />
                    Create Account
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="table-fixed w-full">
                        <TableHeader>
                            <TableRow className="bg-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)] border-none">
                                {tableHeaders.map((header) => (
                                    <TableHead
                                        key={header}
                                        className={`px-8 py-4 text-sm font-semibold tracking-wide text-[oklch(0.98_0.01_95)] whitespace-nowrap ${header === "Actions" ? "text-right" : ""
                                            } ${header === "Id" ? "w-20" : ""}`}
                                    >
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <Loader2 className="h-7 w-7 animate-spin text-[oklch(0.46_0.04_125)]" />
                                            <p className="text-sm">Loading accounts...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center text-red-500">
                                        <p className="text-sm font-medium">{error}</p>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Building2 className="h-8 w-8 text-slate-300" />
                                            <p className="text-sm">No accounts found. Create one to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account, index) => (
                                    <TableRow
                                        key={account.id}
                                        className="h-16 border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40"
                                    >
                                        <TableCell className="px-8 py-4 text-sm font-medium text-slate-500">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="px-8 py-4 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                                            {account.name}
                                        </TableCell>

                                        <TableCell className="px-8 py-4">
                                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                {account.type}
                                            </span>
                                        </TableCell>

                                        <TableCell className="px-8 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
                                                    title="Edit Account"
                                                    onClick={() => openEdit(account.id)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-slate-500 hover:text-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]/10 dark:text-slate-400"
                                                    title="View Account"
                                                    onClick={() => openView(account.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    title="Delete Account"
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
            </div>

            {/* ── Create / Edit Dialog ── */}
            <Dialog
                open={formOpen}
                onOpenChange={(value) => {
                    setFormOpen(value)
                    if (!value) resetForm()
                }}
            >
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Account" : "Create Account"}</DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Update the details of this account."
                                : "Add a new account by filling in the details below."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Show spinner while fetching full detail for edit */}
                    {isFormLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
                            <Loader2 className="h-7 w-7 animate-spin text-[oklch(0.46_0.04_125)]" />
                            <p className="text-sm">Loading account details...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">

                            {/* Account Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Account Name</label>
                                <Input
                                    placeholder="Enter account name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                />
                            </div>

                            {/* Account Type */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Account Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            type: e.target.value as AccountType,
                                        }))
                                    }
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {ACCOUNT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    placeholder="Enter description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                />
                            </div>

                            {/* Active */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={formData.active}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, active: checked === true }))
                                    }
                                />
                                <label className="text-sm font-medium">Active</label>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetForm()
                                setFormOpen(false)
                            }}
                            disabled={isSaving || isFormLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-[oklch(0.46_0.04_125)] text-[oklch(0.98_0.01_95)] hover:opacity-90"
                            onClick={handleSave}
                            disabled={isSaving || isFormLoading}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {editingId ? "Updating..." : "Saving..."}
                                </>
                            ) : editingId ? (
                                "Update Account"
                            ) : (
                                "Save Account"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── View Dialog ── */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>Account Details</DialogTitle>
                        <DialogDescription>Full details for this account.</DialogDescription>
                    </DialogHeader>

                    {isViewLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
                            <Loader2 className="h-7 w-7 animate-spin text-[oklch(0.46_0.04_125)]" />
                            <p className="text-sm">Loading details...</p>
                        </div>
                    ) : viewData ? (
                        <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">

                            <div className="flex justify-between py-3">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Account Name</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{viewData.name}</span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Account Type</span>
                                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400">
                                    {viewData.type}
                                </span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Description</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300 text-right max-w-[60%]">
                                    {viewData.description || "—"}
                                </span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium border ${viewData.isActive
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400"
                                        : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                        }`}
                                >
                                    {viewData.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Created At</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {new Date(viewData.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Updated At</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {new Date(viewData.updatedAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>

                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </section>
    )
}