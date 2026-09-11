"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Loader2, Building2, Pencil, Trash2, ArrowLeftRight, AlertCircle, Calendar as CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { PermissionGate } from "@/components/auth/PermissionGate";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/services/accounts"
import { parseApiError } from "@/lib/api-error"
import { cn, formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
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
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"


import {
    getAllAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    transferFunds,
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
    "Balance",
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

    // Internal Transfer Modal state
    const [transferModalOpen, setTransferModalOpen] = useState(false)
    const [transferDateOpen, setTransferDateOpen] = useState(false)
    const [isTransferring, setIsTransferring] = useState(false)
    const [transferForm, setTransferForm] = useState({
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
    })

    const paymentAccounts = useMemo(() => {
        return accounts.filter((a) => a.type === "PAYMENT_METHOD" && a.isActive)
    }, [accounts])

    const selectedFromAccount = useMemo(() => {
        return paymentAccounts.find((a) => a.id === transferForm.fromAccountId)
    }, [paymentAccounts, transferForm.fromAccountId])

    const selectedToAccount = useMemo(() => {
        return paymentAccounts.find((a) => a.id === transferForm.toAccountId)
    }, [paymentAccounts, transferForm.toAccountId])

    const transferAmountNumber = parseFloat(transferForm.amount) || 0

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

    async function handleTransferSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault()
        if (!transferForm.fromAccountId) {
            toast.error("Please select a source account")
            return
        }
        if (!transferForm.toAccountId) {
            toast.error("Please select a destination account")
            return
        }
        if (transferForm.fromAccountId === transferForm.toAccountId) {
            toast.error("Source and destination accounts must be different")
            return
        }
        if (!transferForm.amount || isNaN(transferAmountNumber) || transferAmountNumber <= 0) {
            toast.error("Please enter a valid transfer amount greater than 0")
            return
        }

        try {
            setIsTransferring(true)
            await transferFunds({
                fromAccountId: transferForm.fromAccountId,
                toAccountId: transferForm.toAccountId,
                amount: transferAmountNumber,
                date: transferForm.date || undefined,
                notes: transferForm.notes.trim() || undefined,
            })
            toast.success("Funds transferred successfully")
            setTransferModalOpen(false)
            setTransferForm({
                fromAccountId: "",
                toAccountId: "",
                amount: "",
                date: new Date().toISOString().split("T")[0],
                notes: "",
            })
            await loadAccounts()
        } catch (err) {
            console.error(err)
            const parsed = parseApiError(err, "Failed to transfer funds")
            toast.error(parsed.message)
            if (parsed.isAuthError) {
                router.push("/login")
            }
        } finally {
            setIsTransferring(false)
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
        <section className="w-full px-3 sm:px-6 py-4 space-y-6">
            {/* Header */}
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
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            Accounts
                        </h1>
                        <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Manage financial accounts, payment methods, and ledger categories.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    <PermissionGate permission="accounts.transferFundsButton">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto shrink-0 border-slate-300 text-slate-700  dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 shadow-sm"
                            onClick={() => setTransferModalOpen(true)}
                        >
                            <ArrowLeftRight className="h-4 w-4 mr-1.5" />
                            Transfer Funds
                        </Button>
                    </PermissionGate>
                    <PermissionGate permission="accounts.createAccountButton">
                        <Button
                            className="w-full sm:w-auto shrink-0 bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm"
                            onClick={openCreate}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Account
                        </Button>
                    </PermissionGate>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="w-full overflow-x-auto [scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]">
                    <Table className="w-full min-w-[760px]">
                        <TableHeader>
                            <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                {tableHeaders.map((header) => (
                                    <TableHead
                                        key={header}
                                        className={`px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap ${header === "Actions" ? "text-right" : ""}`}
                                    >
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={tableHeaders.length} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                            <p className="text-sm">Loading accounts...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={tableHeaders.length} className="h-40 text-center">
                                        <p className="text-sm font-medium text-red-500">{error}</p>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={tableHeaders.length} className="h-40 text-center">
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
                                        <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-500">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100 max-w-[160px] truncate">
                                            {account.name}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            {/* ✅ Same type = same color */}
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getBadgeColorForType(account.type)}`}>
                                                {account.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-[220px] truncate">
                                            {account.description || "—"}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            {account.type === "PAYMENT_METHOD" ? (
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-sm font-semibold tabular-nums",
                                                        (account.balance ?? 0) < 0
                                                            ? "text-red-600 dark:text-red-400"
                                                            : "text-slate-900 dark:text-slate-100"
                                                    )}>
                                                        {formatCurrency(account.balance ?? 0)}
                                                    </span>
                                                    {(account.balance ?? 0) < 0 && (
                                                        <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">
                                                            Overdrawn
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 dark:text-slate-500 tabular-nums">
                                                    {account.balance !== undefined && account.balance !== 0 ? formatCurrency(account.balance) : "—"}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${account.isActive
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                                    : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
                                                    }`}
                                            >
                                                {account.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <PermissionGate permission="accounts.editAccountsButton">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                                                        title="Edit"
                                                        onClick={() => openEdit(account)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </PermissionGate>
                                                <PermissionGate permission="accounts.deleteAccountsButton">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        title="Delete"
                                                        onClick={() => setAccountToDelete(account)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </PermissionGate>
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
                <AlertDialogContent className="w-[92vw] sm:max-w-lg rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{accountToDelete?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this account. This can't be undone, and it will
                            fail if there are transactions or ledger entries linked to it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                        <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            onClick={(event) => {
                                event.preventDefault()
                                void handleDeleteAccount()
                            }}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600"
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

            {/* Transfer Funds Dialog */}
            <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
                <DialogContent className="w-[92vw] sm:max-w-md max-h-[90vh] flex flex-col p-0 rounded-2xl border border-[#6a7459] dark:border-slate-800 bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100 shadow-2xl overflow-hidden">
                    <div className="p-6 pb-2 shrink-0">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-lg sm:text-xl font-semibold text-white dark:text-white flex items-center gap-2">
                                <ArrowLeftRight className="h-5 w-5 text-white/90 dark:text-[#9ea98a]" />
                                Internal Fund Transfer
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm text-slate-200 dark:text-slate-400 mt-1">
                                Transfer money between payment methods (e.g. Bank to Revolving Cash Fund).
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="space-y-4 px-6 py-2 flex-1 overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-white dark:text-slate-200">
                                Source Account (From) <span className="text-red-500 ml-0.5">*</span>
                            </Label>
                            <Select
                                value={transferForm.fromAccountId}
                                onValueChange={(val) => setTransferForm((prev) => ({ ...prev, fromAccountId: val }))}
                            >
                                <SelectTrigger className="w-full h-10 text-xs sm:text-sm rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40 [&_svg]:text-white/80 dark:[&_svg]:text-slate-300">
                                    <SelectValue placeholder="Select source account" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-[#6a7459] dark:border-slate-800 bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100">
                                    {paymentAccounts.map((acc) => (
                                        <SelectItem
                                            key={acc.id}
                                            value={acc.id}
                                            className="text-white dark:text-slate-100 focus:bg-[#556043] focus:text-white dark:focus:bg-slate-800 cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span>{acc.name}</span>
                                                <span className="text-xs text-slate-200/80 dark:text-slate-400 tabular-nums font-mono">
                                                    ({formatCurrency(acc.balance ?? 0)})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-white dark:text-slate-200">
                                Destination Account (To) <span className="text-red-500 ml-0.5">*</span>
                            </Label>
                            <Select
                                value={transferForm.toAccountId}
                                onValueChange={(val) => setTransferForm((prev) => ({ ...prev, toAccountId: val }))}
                            >
                                <SelectTrigger className="w-full h-10 text-xs sm:text-sm rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40 [&_svg]:text-white/80 dark:[&_svg]:text-slate-300">
                                    <SelectValue placeholder="Select destination account" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-[#6a7459] dark:border-slate-800 bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100">
                                    {paymentAccounts
                                        .filter((acc) => acc.id !== transferForm.fromAccountId)
                                        .map((acc) => (
                                            <SelectItem
                                                key={acc.id}
                                                value={acc.id}
                                                className="text-white dark:text-slate-100 focus:bg-[#556043] focus:text-white dark:focus:bg-slate-800 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between w-full gap-2">
                                                    <span>{acc.name}</span>
                                                    <span className="text-xs text-slate-200/80 dark:text-slate-400 tabular-nums font-mono">
                                                        ({formatCurrency(acc.balance ?? 0)})
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="transfer-amount" className="text-sm font-medium text-white dark:text-slate-200">
                                    Amount (₹) <span className="text-red-500 ml-0.5">*</span>
                                </Label>
                                <Input
                                    id="transfer-amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={transferForm.amount}
                                    onChange={(e) => setTransferForm((prev) => ({ ...prev, amount: e.target.value }))}
                                    className="h-10 text-xs sm:text-sm rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-white dark:text-slate-200">
                                    Transfer Date
                                </Label>
                                <Popover open={transferDateOpen} onOpenChange={setTransferDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                "w-full h-10 justify-start text-left font-normal text-xs sm:text-sm rounded-xl bg-[#667155] border-[#8b9478] text-white hover:bg-[#586249] hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700 px-3 focus-visible:ring-1 focus-visible:ring-white/40 shadow-none",
                                                !transferForm.date && "text-slate-300 dark:text-slate-400"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-white/80 dark:text-slate-400 shrink-0" />
                                            <span className="truncate">
                                                {transferForm.date ? format(new Date(`${transferForm.date}T00:00:00`), "dd MMM yyyy") : "Select date"}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={transferForm.date ? new Date(`${transferForm.date}T00:00:00`) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setTransferForm((prev) => ({ ...prev, date: format(date, "yyyy-MM-dd") }))
                                                    setTransferDateOpen(false)
                                                }
                                            }}
                                            defaultMonth={transferForm.date ? new Date(`${transferForm.date}T00:00:00`) : new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="transfer-notes" className="text-sm font-medium text-white dark:text-slate-200">
                                Purpose / Notes (Optional)
                            </Label>
                            <Input
                                id="transfer-notes"
                                type="text"
                                placeholder="e.g., Replenish cash fund for expenses"
                                value={transferForm.notes}
                                onChange={(e) => setTransferForm((prev) => ({ ...prev, notes: e.target.value }))}
                                className="h-10 text-xs sm:text-sm rounded-xl bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-white/40"
                            />
                        </div>

                        {/* Live preview */}
                        {selectedFromAccount && selectedToAccount && transferAmountNumber > 0 && (
                            <div className="rounded-xl border border-[#8b9478]/40 dark:border-slate-800 bg-[#556043]/30 dark:bg-slate-950/40 p-3.5 space-y-2.5">
                                <div className="text-[11px] font-semibold text-slate-200 dark:text-slate-400 uppercase tracking-wider">
                                    Balance Preview
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                    <div className="p-3 rounded-xl bg-[#667155]/60 dark:bg-slate-800 border border-[#8b9478]/40 dark:border-slate-700 space-y-1">
                                        <div className="font-semibold text-white dark:text-slate-100 truncate">
                                            {selectedFromAccount.name}
                                        </div>
                                        <div className="flex items-center justify-between text-slate-200 dark:text-slate-400 text-[11px]">
                                            <span>Current:</span>
                                            <span className="tabular-nums font-mono text-white dark:text-slate-200">{formatCurrency(selectedFromAccount.balance ?? 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-semibold text-[11px]">
                                            <span className="text-slate-200 dark:text-slate-300">After:</span>
                                            <span className={cn(
                                                "tabular-nums font-mono",
                                                (selectedFromAccount.balance ?? 0) - transferAmountNumber < 0
                                                    ? "text-red-300 dark:text-red-400 font-bold"
                                                    : "text-white dark:text-slate-100"
                                            )}>
                                                {formatCurrency((selectedFromAccount.balance ?? 0) - transferAmountNumber)}
                                            </span>
                                        </div>
                                        {(selectedFromAccount.balance ?? 0) - transferAmountNumber < 0 && (
                                            <p className="text-[10px] text-amber-300 dark:text-amber-400 flex items-center gap-1 pt-0.5 font-medium">
                                                <AlertCircle className="h-3 w-3 shrink-0" />
                                                Source will be overdrawn
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-3 rounded-xl bg-[#667155]/60 dark:bg-slate-800 border border-[#8b9478]/40 dark:border-slate-700 space-y-1">
                                        <div className="font-semibold text-white dark:text-slate-100 truncate">
                                            {selectedToAccount.name}
                                        </div>
                                        <div className="flex items-center justify-between text-slate-200 dark:text-slate-400 text-[11px]">
                                            <span>Current:</span>
                                            <span className="tabular-nums font-mono text-white dark:text-slate-200">{formatCurrency(selectedToAccount.balance ?? 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-semibold text-[11px]">
                                            <span className="text-slate-200 dark:text-slate-300">After:</span>
                                            <span className="tabular-nums font-mono text-emerald-300 dark:text-emerald-400 font-bold">
                                                {formatCurrency((selectedToAccount.balance ?? 0) + transferAmountNumber)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="bg-[#6a7459] dark:bg-slate-950 border-t border-[#8b9478]/40 dark:border-slate-800 p-4 sm:p-5 flex-col-reverse sm:flex-row gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTransferModalOpen(false)}
                            disabled={isTransferring}
                            className="w-full sm:w-auto rounded-full border-[#8b9478] bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleTransferSubmit}
                            disabled={isTransferring}
                            className="w-full sm:w-auto rounded-full bg-white text-[#556043] hover:bg-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-medium"
                        >
                            {isTransferring ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    Transferring...
                                </>
                            ) : (
                                "Complete Transfer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}