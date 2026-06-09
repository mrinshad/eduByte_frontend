"use client"
import { useState } from "react"
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
export default function Page() {
  const TABLEHEADERS = [
    "id",
    "Fee Types",
    "Frequency",
    "Account Type",
    "Created At",
    "Actions"
  ]
  const TABLEDATA = [
    {
      name: "tution fee",
      frequency: "3 Monthly",
      accountType: "income",
      createdAt: "2024-06-01"
    }, {
      name: "library fee",
      frequency: "monthly",
      accountType: "income",
      createdAt: "2024-06-01"
    },
    {
      name: "sports fee",
      frequency: "monthly",
      accountType: "income",
      createdAt: "2024-06-01"
    },
    {
      name: "lab fee",
      frequency: "monthly",
      accountType: "income",
      createdAt: "2024-06-01"
    }
  ]
  const [open, setOpen] = useState(false)
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

          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
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
              {TABLEDATA.map((data, index) => (
                <TableRow
                  key={data.name}
                  className=" transition-colors"
                >
                  <TableCell className="font-medium text-white dark:text-slate-50 pl-4">
                    {index + 1}
                  </TableCell>

                  <TableCell className="font-medium text-white dark:text-slate-50">
                    {data.name}
                  </TableCell>

                  <TableCell className="text-white dark:text-slate-50">
                    {data.frequency}
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {data.accountType}
                    </span>
                  </TableCell>

                  <TableCell className="text-white dark:text-slate-50">
                    {data.createdAt}
                  </TableCell>
                  <TableCell className="flex justify-end pr-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Fee Type</DialogTitle>
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
              />
            </div>

            <div>
              <label className="text-sm font-medium">Frequency</label>
              <Select>
                <SelectTrigger className="w-full bg-[#5a6548] border-[#788164] text-[#d9dccf]">
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>

                <SelectContent className="bg-[#5a6548] border-[#788164]">
                  {freequencyOptions.map((option) => (
                    <SelectItem
                    
                    key={option}
    value={option}
                    className="text-black focus:bg-[#6b7656] focus:text-black"
                  >
                    {option}
                  </SelectItem>
                  ))}
                  
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Income Account</label>
              <Select>
                <SelectTrigger className="w-full bg-[#5a6548] border-[#788164] text-[#d9dccf]">
                  <SelectValue placeholder="Select Income Account" />
                </SelectTrigger>

                <SelectContent className="bg-[#5a6548] border-[#788164] text-black [&_svg]:text-black">
                  
                  <SelectItem
                    value="tuition"
                    className="text-black focus:bg-[#6b7656] focus:text-black"
                  >
                    Tuition Fee Income
                  </SelectItem>

                  <SelectItem
                    value="transport"
                    className="text-black focus:bg-[#6b7656] focus:text-black"
                  >
                    Transport Fee Income
                  </SelectItem>

                  <SelectItem
                    value="library"
                    className="text-black focus:bg-[#6b7656] focus:text-black"
                  >
                    Library Fee Income
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
