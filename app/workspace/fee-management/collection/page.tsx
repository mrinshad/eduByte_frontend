"use client";
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function FeeCollectionPage() {
  const tableHeader = [
    "Admission No",
    "Name",
    "Class",
    "Vehicle",
    "Total Due",
    "Last Payment",
    "Status",
    "Action"
  ]
  const router = useRouter();
  return (
    <section className="w-full px-6 py-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            className="bg-background text-foreground hover:opacity-90 shadow-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">fee collection</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">View and manage student fee collection.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search students..."
              className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <Button
            className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4 mr-1 text-white dark:text-slate-900" />
            Collect Fee
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                {tableHeader.map((header)=> (
                  <TableHead 
                  key={header}
                   className={`px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap ${
                    header === "Action" ? "text-right" : "text-left"}`
                   }>
                    {header}
                   </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
      </div>

    </section>
  )
}