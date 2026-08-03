"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Loader2, Building2, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { ACCOUNT_TYPES, type AccountType } from "@/lib/services/accounts"
import { parseApiError } from "@/lib/api-error"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"


import {
    getAllAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    type Account,
    type AccountInput,
} from "@/lib/services/accounts"

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
// 👇 the reusable component
import { ReusableFormDialog, type FormField } from "@/components/common/resusable-dialoge-form"

const ACCOUNT_DUPLICATE_MAP = {
    name: { field: "name", message: "An account with this name already exists" },
}
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
    type: "INCOME",
    description: "",
    isActive: true,
}

// ── Field-level validators (same pattern as the Create Staff form) ──

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9\s.,'()/-]+$/;

function validateAccountName(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return "Account name is required";
    if (trimmed.length < 2) return "Must be at least 2 characters";
    if (trimmed.length > 100) return "Must be under 100 characters";
    if (!ACCOUNT_NAME_PATTERN.test(trimmed)) return "Only letters, numbers, spaces and . , ' ( ) - / are allowed";
    return undefined;
}

function validateAccountType(value: string): string | undefined {
    if (!value.trim()) return "Please select an account type";
    if (!ACCOUNT_TYPES.includes(value as AccountType)) return "Select a valid account type";
    return undefined;
}

function validateAccountDescription(value: string): string | undefined {
    const trimmed = value.trim();
    if (trimmed.length > 300) return "Must be under 300 characters";
    return undefined;
}

type AccountFieldErrors = {
    name?: string;
    type?: string;
    description?: string;
};


export default function Page() {
    const badgeColors = [
        "bg-red-50 text-red-700 border-red-200",
        "bg-blue-50 text-blue-700 border-blue-200",
        "bg-green-50 text-green-700 border-green-200",
        "bg-yellow-50 text-yellow-700 border-yellow-200",
        "bg-purple-50 text-purple-700 border-purple-200",
        "bg-pink-50 text-pink-700 border-pink-200",
    ]

    const router = useRouter()

    const [accounts, setAccounts] = useState<Account[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [formOpen, setFormOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<AccountInput>({ ...EMPTY_FORM })

    // Field-level errors, populated on submit and cleared the moment the
    // user edits that field — same pattern as the Create Staff form.
    const [fieldErrors, setFieldErrors] = useState<AccountFieldErrors>({})

    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // ✅ Deterministic color map: same Account Type = same color every time
    const typeColorMap = useMemo(() => {
        const map = new Map<string, string>()
        ACCOUNT_TYPES.forEach((type, index) => {
            map.set(type, badgeColors[index % badgeColors.length])
        })
        return map
    }, [])

    const getBadgeColorForType = (type: string): string => {
        return typeColorMap.get(type) ?? "bg-slate-50 text-slate-700 border-slate-200"
    }

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

    function resetForm() {
        setFormData({ ...EMPTY_FORM })
        setEditingId(null)
        setFieldErrors({})
    }

    function openCreate() {
        resetForm()
        setFormOpen(true)
    }

    function openEdit(account: Account) {
        setEditingId(account.id)
        setFormData({
            name: account.name,
            type: account.type,
            description: account.description ?? "",
            isActive: account.isActive ?? true,
        })
        setFieldErrors({})
        setFormOpen(true)
    }

    function handleFieldChange(name: string, value: unknown) {
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (name in fieldErrors) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
        }
    }

    async function handleSave() {
        const nextFieldErrors: AccountFieldErrors = {
            name: validateAccountName(formData.name),
            type: validateAccountType(formData.type),
            description: validateAccountDescription(formData.description),
        }
        setFieldErrors(nextFieldErrors)

        const firstFieldError = Object.values(nextFieldErrors).find(Boolean)
        if (firstFieldError) {
            toast.error(firstFieldError)
            return
        }

        try {
            setIsSaving(true)
            const payload: AccountInput = {
                ...formData,
                name: formData.name.trim(),
                description: formData.description.trim(),
            }
            if (editingId) {
                await updateAccount(editingId, payload)
                toast.success("Account updated successfully")
            } else {
                await createAccount(payload)
                toast.success("Account created successfully")
            }
            setFormOpen(false)
            resetForm()
            await loadAccounts()
        } catch (err) {
            console.error(err)
            const fallback = editingId ? "Failed to update account" : "Failed to create account"
            const parsed = parseApiError(err, fallback, ACCOUNT_DUPLICATE_MAP)

            if (parsed.field && parsed.field in nextFieldErrors) {
                setFieldErrors((prev) => ({ ...prev, [parsed.field as keyof AccountFieldErrors]: parsed.message }))
            }
            toast.error(parsed.message)

            if (parsed.isAuthError) {
                router.push("/login")
            }
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteAccount() {
        if (!accountToDelete) return
        setIsDeleting(true)
        try {
            await deleteAccount(accountToDelete.id)
            toast.success("Account deleted successfully")
            setAccountToDelete(null)
            await loadAccounts()
        } catch (err) {
            console.error(err)
            const parsed = parseApiError(err, "Failed to delete account")
            toast.error(parsed.message)

            if (parsed.isAuthError) {
                router.push("/login")
            }
        } finally {
            setIsDeleting(false)
        }
    }
    // 👇 this is the only "new" piece — describe the form once, declaratively
    const accountFields: FormField[] = [
        {
            type: "text",
            name: "name",
            label: "Account Name",
            placeholder: "Enter account name",
        },
        {
            type: "select",
            name: "type",
            label: "Account Type",
            placeholder: "Select type",
            options: [
                ...ACCOUNT_TYPES,
                ...(formData.type && !ACCOUNT_TYPES.includes(formData.type as typeof ACCOUNT_TYPES[number])
                    ? [formData.type]
                    : []),
            ].map((t) => ({ label: t, value: t })),
        },
        {
            type: "text",
            name: "description",
            label: "Description",
            placeholder: "Enter description",
        },
        { type: "checkbox", name: "isActive", label: "Active" },
    ]

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
                            Manage Accounts details and records.
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
                                        className={`px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap ${header === "Actions" ? "text-right" : ""}`}
                                    >
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                            <p className="text-sm">Loading accounts...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <p className="text-sm font-medium text-red-500">{error}</p>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                                            <Building2 className="h-6 w-6 text-slate-300" />
                                            <p className="text-sm">No accounts found. Create one to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account, index) => (
                                    <TableRow
                                        key={account.id}
                                        className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                    >
                                        <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                            {account.name}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            {/* ✅ Same type = same color */}
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getBadgeColorForType(account.type)}`}>
                                                {account.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {account.description || "—"}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${account.isActive
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                                    : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
                                                    }`}
                                            >
                                                {account.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                                                    title="Edit"
                                                    onClick={() => openEdit(account)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    title="Delete"
                                                    onClick={() => setAccountToDelete(account)}
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

            {/* 👇 the entire dialog is now one component call */}
            <ReusableFormDialog
                open={formOpen}
                onOpenChange={(value) => {
                    setFormOpen(value)
                    if (!value) resetForm()
                }}
                theme="vehicle"
                title={editingId ? "Edit Account" : "Create Account"}
                description={
                    editingId
                        ? "Update the details of this account."
                        : "Add a new account by filling in the details below."
                }
                fields={accountFields}
                values={formData}
                onChange={handleFieldChange}
                onSubmit={handleSave}
                isSaving={isSaving}
                isEditing={!!editingId}
                submitLabel="Save Account"
                editSubmitLabel="Update Account"
            />
            <AlertDialog
                open={!!accountToDelete}
                onOpenChange={(open) => {
                    if (!open) setAccountToDelete(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{accountToDelete?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this account. This can't be undone, and it will
                            fail if there are transactions or ledger entries linked to it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            onClick={(event) => {
                                event.preventDefault()
                                void handleDeleteAccount()
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? (
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
        </section>
    )
}