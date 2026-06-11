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
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react"
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

  const resetForm = () => {
    setFormData({
      name: "",
      frequency: "",
      incomeAccountId: "",
    })

    setEditingId(null)
  }
  return (
    <section className="px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Charge Types</h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-600">Manage charge types and related settings.</p>
      </div>
      <Card className="mt-6 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <h2 className="text-lg font-semibold text-white dark:text-slate-50">
              Fee Types
            </h2>
            <p className="text-sm text-slate-400">
              Manage fee types and account mappings.
            </p>
          </div>

          <Button
            size="sm"
            className="gap-2"
            onClick={async () => {
              resetForm()
              await loadAccounts()
              setOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Create Fee Type
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 ">
                {TABLEHEADERS.map((header) => (
                  <TableHead
                    key={header}
                    className={
                      header === "Actions"
                        ? "pr-4 text-right font-semibold text-slate-700"
                        : header === "id"
                          ? "pl-4 font-semibold text-slate-700"
                          : "font-semibold text-slate-700"
                    }
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {chargeTypes.map((data, index) => (
                <TableRow
                  key={data.name}
                  className=" transition-colors"
                >
                  <TableCell className="font-medium text-white dark:text-slate-50 pl-4">
                    {index + 1}
                  </TableCell>

                  <TableCell className="font-medium text-white">
                    {data.name}
                  </TableCell>

                  <TableCell className="text-white">
                    {data.frequency}
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {data.incomeAccount?.name ?? "-"}
                    </span>
                  </TableCell>

                  <TableCell className="text-white">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex justify-end pr-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async () => {
                          await loadAccounts()

                          setEditingId(data.id)

                          setFormData({
                            name: data.name,
                            frequency: data.frequency,
                            incomeAccountId: data.incomeAccount?.id ?? "",
                          })

                          setOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
