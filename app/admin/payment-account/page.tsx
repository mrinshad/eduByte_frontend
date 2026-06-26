"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Loader2, Building2, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    ACCOUNT_TYPES,
    type AccountType,
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
    type Account,
    type AccountInput,
} from "@/lib/services/accounts"

const tableHeaders = [
    "Id",
    "Account Name",
    "Account Type",
    "Description",
    "Status",
    "Actions",
]

const EMPTY_FORM: AccountInput = {
    name: "",
    type: "Asset",
    description: "",
    isActive: true,
}

export default function Page() {
    const router = useRouter()

    const [accounts, setAccounts] = useState<Account[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [formOpen, setFormOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<AccountInput>({ ...EMPTY_FORM })

    useEffect(() => { loadAccounts() }, [])

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

    function resetForm() {
        setFormData({ ...EMPTY_FORM })
        setEditingId(null)
    }

    function openCreate() {
        resetForm()
        setFormOpen(true)
    }

    // Pre-fill directly from the list row — no extra API call needed
    // since GET /api/accounts already returns description & isActive
    function openEdit(account: Account) {
        setEditingId(account.id)
        setFormData({
            name: account.name,
            type: account.type,
            description: account.description ?? "",
            isActive: account.isActive ?? true,
        })
        setFormOpen(true)
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
                    className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    onClick={openCreate}
                >
                    <Plus className="h-4 w-4" />
                    Create Account
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                {tableHeaders.map((header) => (
                                    <TableHead
                                        key={header}
                                        className={`px-4 h-10 text-xs font-semibold uppercase tracking-wider text-white dark:text-foreground whitespace-nowrap ${
                                            header === "Actions" ? "text-right w-24" : ""
                                        } ${header === "Id" ? "w-12" : ""}`}
                                    >
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                            <p className="text-xs">Loading accounts...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <p className="text-xs font-medium text-red-500">{error}</p>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                            <Building2 className="h-6 w-6 text-slate-300" />
                                            <p className="text-xs text-slate-400">No accounts found. Create one to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account, index) => (
                                    <TableRow
                                        key={account.id}
                                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                                    >
                                        <TableCell className="px-4 py-2.5 w-12 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                                            {index + 1}
                                        </TableCell>

                                        <TableCell className="px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100">
                                            {account.name}
                                        </TableCell>

                                        <TableCell className="px-4 py-2.5">
                                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                {account.type}
                                            </span>
                                        </TableCell>

                                        <TableCell className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                                            {account.description || "—"}
                                        </TableCell>

                                        <TableCell className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                                account.isActive
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                                    : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
                                            }`}>
                                                {account.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>

                                        <TableCell className="px-4 py-2.5 w-24 text-right">
                                            <div className="flex items-center justify-end gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md text-slate-400  hover:text-[#556043] hover:bg-[#556043]/10"
                                                    title="Edit"
                                                    onClick={() => openEdit(account)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
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

                    <div className="space-y-4 py-2">

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
                                {/* Include the current type even if it's not in the preset list */}
                                {[
                                    ...ACCOUNT_TYPES,
                                    ...(formData.type && !ACCOUNT_TYPES.includes(formData.type as typeof ACCOUNT_TYPES[number])
                                        ? [formData.type]
                                        : []),
                                ].map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

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

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={formData.isActive}
                                onCheckedChange={(checked) =>
                                    // ✅ fixed: was updating `active`, now correctly updates `isActive`
                                    setFormData((prev) => ({ ...prev, isActive: checked === true }))
                                }
                            />
                            <label className="text-sm font-medium">Active</label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => { resetForm(); setFormOpen(false) }}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-[#556043] text-white hover:bg-[#4a533b]"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {editingId ? "Updating..." : "Saving..."}
                                </>
                            ) : editingId ? "Update Account" : "Save Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </section>
    )
}