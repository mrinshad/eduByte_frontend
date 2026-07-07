"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, RefreshCw, Pencil, Trash2, ArrowLeft, } from "lucide-react"
import { Badge } from "@/components/ui/badge"; // ✅ Correct
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { freequencyOptions } from "@/lib/constant"
import { getAccountTypes, type accountName } from "@/lib/services/accountTypes"
import {
  createChargeType,
  getChargeTypes,
  updateChargeType,
  type chargeType,
  type ChargeTypes,
} from "@/lib/services/chargeTypes"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
export default function Page() {
  const TABLEHEADERS = [
    "id",
    "Fee Types",
    "Frequency",
    "Account Type",
    "Created At",
    "Actions"
  ]

  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<accountName[]>([])
  useEffect(() => {
    const loadData = async () => {
      try {
        const chargeTypeData = await getChargeTypes()
        setChargeTypes(chargeTypeData)
      } catch (error) {
        console.error(error)
      }
    }

    loadData()
  }, [])
  const loadAccounts = async () => {
    try {
      const data = await getAccountTypes()
      setAccounts(data)
    } catch (error) {
      console.error("Failed to load accounts:", error)
      toast.error("Failed to load accounts")
    }
  }
  const [formData, setFormData] = useState<chargeType>({
    name: "",
    frequency: "",
    incomeAccountId: "",
  })
  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.frequency ||
      !formData.incomeAccountId
    ) {
      toast.warning("Please fill all fields")
      return
    }

    try {
      if (editingId) {
        await updateChargeType(editingId, formData)

        toast.success("Charge Type Updated Successfully")
      } else {
        await createChargeType(formData)

        toast.success("Charge Type Created Successfully")
      }

      await loadChargeTypes()

      setFormData({
        name: "",
        frequency: "",
        incomeAccountId: "",
      })

      setEditingId(null)
      setOpen(false)
    } catch (error) {
      toast.error("Operation failed")
    }
  }
  const [chargeTypes, setChargeTypes] = useState<ChargeTypes[]>([])
  const loadChargeTypes = async () => {
    try {
      const data = await getChargeTypes()
      setChargeTypes(data)
    } catch (error) {
      console.error("Failed to load charge types:", error)
      toast.error("Failed to load charge types")
    }
  }
  useEffect(() => {
    const loadData = async () => {
      try {
        const chargeTypeData = await getChargeTypes()
        console.log(chargeTypeData)
        setChargeTypes(chargeTypeData)
      } catch (error) {
        console.error(error)
      }
    }

    loadData()
  }, [])

  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter();

  const resetForm = () => {
    setFormData({
      name: "",
      frequency: "",
      incomeAccountId: "",
    })

    setEditingId(null)
  }
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
        onClick={async () => { resetForm(); await loadAccounts(); setOpen(true); }}
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
              <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Frequency</TableHead>
              <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Account Type</TableHead>
              <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Created At</TableHead>
              <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chargeTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-500">
                  <p className="text-sm">No charge types found.</p>
                </TableCell>
              </TableRow>
            ) : (
              chargeTypes.map((data, index) => (
                <TableRow key={data.name} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">{index + 1}</TableCell>
                  <TableCell className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">{data.name}</TableCell>
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
                      <Button variant="ghost" size="icon"
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                        onClick={async () => { await loadAccounts(); setEditingId(data.id); setFormData({ name: data.name, frequency: data.frequency, incomeAccountId: data.incomeAccount?.id ?? "" }); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
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
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value)

          if (!value) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Fee Type" : "Create Fee Type"}
            </DialogTitle>
            <DialogDescription>
              Add a new fee type and map it to an account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Fee Type Name</label>
              <input
                className="w-full rounded-md border p-2 mt-1"
                placeholder="Tuition Fee"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Frequency</label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    frequency: value,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-[#5a6548] border-[#788164] text-[#d9dccf]">
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>

                <SelectContent className="bg-white text-black border-[#788164]">
                  {freequencyOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="
                                  text-black
                                  data-[highlighted]:bg-[#8a9770]
                                  data-[highlighted]:text-black
                                  data-[state=checked]:text-black
                                "
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Income Account</label>
              <Select
                value={formData.incomeAccountId}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    incomeAccountId: value,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-[#5a6548] border-[#788164] text-[#d9dccf]">
                  <SelectValue placeholder="Select Income Account" />
                </SelectTrigger>

                <SelectContent className="bg-white border-[#788164] text-black">
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                      className="
                                  !text-black
                                  data-[highlighted]:bg-[#8a9770]
                                  data-[highlighted]:!text-black
                                  data-[state=checked]:!text-black
                                "
                    >
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
            >
              Cancel
            </Button>

            <Button onClick={handleSave}>
              {editingId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
