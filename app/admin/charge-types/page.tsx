"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { freequencyOptions, categoryOptions } from "@/lib/constant"
import { getNonPayment, type accountName } from "@/lib/services/accountTypes"
import {
  createChargeType, getChargeTypes, updateChargeType, deleteChargeType,
  type chargeType, type ChargeTypes,
} from "@/lib/services/chargeTypes"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// 👇 the reusable component
import { ReusableFormDialog, type FormField } from "@/components/common/resusable-dialoge-form"

export default function Page() {
  const router = useRouter()


  const [chargeTypeToDelete, setChargeTypeToDelete] = useState<ChargeTypes | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)


  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<accountName[]>([])
  const [chargeTypes, setChargeTypes] = useState<ChargeTypes[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // ← added loading state
  const [formData, setFormData] = useState<chargeType>({
    name: "",
    category: "",
    frequency: "",
    incomeAccountId: "",
  })

  useEffect(() => {
    loadChargeTypes()
  }, [])

  const loadChargeTypes = async () => {
    try {
      setIsLoading(true) // ← start loading
      const data = await getChargeTypes()
      setChargeTypes(data)
    } catch (error) {
      console.error("Failed to load charge types:", error)
      toast.error("Failed to load charge types")
    } finally {
      setIsLoading(false) // ← stop loading
    }
  }

  const loadAccounts = async () => {
    try {
      const data = await getNonPayment()
      setAccounts(data)
    } catch (error) {
      console.error("Failed to load accounts:", error)
      toast.error("Failed to load accounts")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", category: "", frequency: "", incomeAccountId: "" })
    setEditingId(null)
  }
  const handleDelete = async () => {
    if (!chargeTypeToDelete) return
    try {
      setIsDeleting(true)
      const result = (await deleteChargeType(chargeTypeToDelete.id)) as { success: boolean; message?: string }
      if (result?.success === false) throw new Error(result.message || "Failed to delete charge type")
      await loadChargeTypes()
      toast.success("Charge Type Deleted Successfully")
      setChargeTypeToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete charge type")
    } finally {
      setIsDeleting(false)
    }
  }
  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.frequency || !formData.incomeAccountId) {
      toast.warning("Please fill all fields")
      return
    }
    try {
      setIsSaving(true)
      if (editingId) {
        await updateChargeType(editingId, formData)
        toast.success("Charge Type Updated Successfully")
      } else {
        await createChargeType(formData)
        toast.success("Charge Type Created Successfully")
      }
      await loadChargeTypes()
      resetForm()
      setOpen(false)
    } catch (error) {
      toast.error("Operation failed")
    } finally {
      setIsSaving(false)
    }
  }

  // 👇 form shape described once — swap in `accounts` once it's loaded
  const chargeTypeFields: FormField[] = [
    { type: "text", name: "name", label: "Fee Type Name", placeholder: "Tuition Fee" },
    {
      type: "select",
      name: "category",
      label: "Category",
      placeholder: "Select Category",
      options: categoryOptions,
    },
    {
      type: "select",
      name: "frequency",
      label: "Frequency",
      placeholder: "Select Frequency",
      options: freequencyOptions.map((o) => ({ label: o.label, value: o.value })),
    },
    {
      type: "select",
      name: "incomeAccountId",
      label: "Income Account",
      placeholder: "Select Income Account",
      options: accounts.map((a) => ({ label: a.name, value: a.id })),
    },
  ]

  return (
    <section className="w-full px-6 py-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button size="icon" className="bg-background text-foreground hover:opacity-90 shadow-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Charge Types</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage charge types and account mappings.</p>
          </div>
        </div>
        <Button
          className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          onClick={async () => { resetForm(); await loadAccounts(); setOpen(true) }}
        >
          <Plus className="h-4 w-4 mr-2 text-white dark:text-slate-900" />
          Create Fee Type
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background border-none">
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">ID</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Fee Type</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Category</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Frequency</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Account Type</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Created At</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Loading charge types...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : chargeTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <p className="text-sm">No charge types found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                chargeTypes.map((data, index) => (
                  <TableRow key={data.name} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">{data.name}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {data.category ? data.category.charAt(0) + data.category.slice(1).toLowerCase() : "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{data.frequency}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium">
                        {data.incomeAccount?.name ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(data.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                          onClick={async () => {
                            await loadAccounts()
                            setEditingId(data.id)
                            setFormData({
                              name: data.name,
                              category: data.category ?? "",
                              frequency: data.frequency,
                              incomeAccountId: data.incomeAccount?.id ?? "",
                            })
                            setOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => setChargeTypeToDelete(data)}
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

      {/* 👇 same component as the Accounts page, different field config */}
      <ReusableFormDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value)
          if (!value) resetForm()
        }}
        title={editingId ? "Edit Fee Type" : "Create Fee Type"}
        description="Add a new fee type and map it to an account."
        fields={chargeTypeFields}
        values={formData}
        onChange={(name, value) => setFormData((prev) => ({ ...prev, [name]: value }))}
        onSubmit={handleSave}
        isSaving={isSaving}
        isEditing={!!editingId}
      />
      <AlertDialog open={!!chargeTypeToDelete} onOpenChange={(open) => { if (!open) setChargeTypeToDelete(null) }}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete "{chargeTypeToDelete?.name}"?</AlertDialogTitle>
      <AlertDialogDescription>
       Warning: Deleting "{chargeTypeToDelete?.name}" will permanently remove it from fee structures and related records.

If fees using this charge type are already assigned to student admissions, the deletion will fail. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={isDeleting}
        onClick={(event) => {
          event.preventDefault()
          void handleDelete()
        }}
        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
      >
        {isDeleting ? (<><Loader2 className="h-4 w-4 animate-spin" />Deleting...</>) : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </section>
  )
}