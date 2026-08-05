"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
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
  const [isLoading, setIsLoading] = useState(true)
  const [frequencyFilter, setFrequencyFilter] = useState<string>("ALL") // ← new
  const [formData, setFormData] = useState<chargeType>({
    name: "",
    category: "",
    frequency: "",
    incomeAccountId: "",
  })

  useEffect(() => {
    loadChargeTypes(frequencyFilter)
  }, [frequencyFilter])

  const loadChargeTypes = async (frequency?: string) => {
    try {
      setIsLoading(true)
      const data = await getChargeTypes(
        frequency && frequency !== "ALL" ? frequency : undefined
      )
      setChargeTypes(data)
    } catch (error) {
      console.error("Failed to load charge types:", error)
      toast.error("Failed to load charge types")
    } finally {
      setIsLoading(false)
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
  const fieldLabels: Record<keyof chargeType, string> = {
    name: "Fee Type Name",
    category: "Category",
    frequency: "Frequency",
    incomeAccountId: "Income Account",
  }

  const handleSave = async () => {
    const missingFields = (Object.keys(fieldLabels) as (keyof chargeType)[])
      .filter((key) => !formData[key])
      .map((key) => fieldLabels[key])

    if (missingFields.length > 0) {
      toast.warning(`Please fill: ${missingFields.join(", ")}`)
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
    <section className="w-full px-3 sm:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button
            size="icon"
            className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Charge Types
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage charge types and account mappings.
            </p>
          </div>
        </div>

        {/* Filter + Create — stacked full-width on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger
              className="w-full sm:w-[180px] border-[#556043]/30 text-[#556043] font-medium
               focus:ring-[#556043] focus:border-[#556043]
               dark:border-slate-700 dark:text-slate-100"
            >
              <SelectValue placeholder="Filter by Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="ALL"
                className="focus:bg-[#556043]/10 focus:text-[#556043]"
              >
                All Frequencies
              </SelectItem>
              {freequencyOptions.map((o) => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                  className="focus:bg-[#556043]/10 focus:text-[#556043]"
                >
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="w-full sm:w-auto shrink-0 bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={async () => { resetForm(); await loadAccounts(); setOpen(true) }}
          >
            <Plus className="h-4 w-4 mr-2 text-white dark:text-slate-900" />
            Create Fee Type
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="w-full overflow-x-auto [scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]">
          <Table className="w-full min-w-[860px]">
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background border-none">
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">ID</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Fee Type</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Category</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Frequency</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Account Type</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Created At</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">Actions</TableHead>
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
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100 max-w-[160px] truncate">{data.name}</TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {data.category ? data.category.charAt(0) + data.category.slice(1).toLowerCase() : "—"}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{data.frequency}</TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium">
                        {data.incomeAccount?.name ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(data.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
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

      <ReusableFormDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value)
          if (!value) resetForm()
        }}
        theme="vehicle"
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
        <AlertDialogContent className="w-[92vw] sm:max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{chargeTypeToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Warning: Deleting "{chargeTypeToDelete?.name}" will permanently remove it from fee structures and related records.

              If fees using this charge type are already assigned to student admissions, the deletion will fail. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (<><Loader2 className="h-4 w-4 animate-spin" />Deleting...</>) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}