"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useEffect, useState } from "react";
import {
  getFeeStructures,
  type FeeStructureSummary,
} from "@/lib/services/feeStructure";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, RefreshCw, Pencil, Trash2, View } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
const feeStructureId = searchParams.get("id");
  const [feeStructures, setFeeStructures] = useState<
    FeeStructureSummary[]
  >([]);
  const tableheadings = [
    "Id",
    "Academic Year",
    "Class",
    "Name",
    "Description",
    "Status",
    "Actions",
  ]
  useEffect(() => {
    loadFeeStructures();
  }, []);

  const loadFeeStructures = async () => {
    try {
      const data = await getFeeStructures();
      setFeeStructures(data);
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <section className="px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Fee Structures</h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-600">View, manage, and organize fee structures for classes and academic years.</p>
      </div>
      <Card className="mt-6 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <h2 className="text-lg font-semibold text-white dark:text-slate-50">
              Fee
            </h2>
          </div>

          <Button
            size="sm"
            className="gap-2"
            onClick={() => router.push("/admin/fee-structures/createFee")}
          >
            <Plus className="h-4 w-4" />
            Create Fee Structure
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                {tableheadings.map((header) => (
                  <TableHead
                    key={header}
                    className={
                      header === "Actions"
                        ? "pr-4 text-right font-semibold text-slate-700"
                        : header === "Id"
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
              {feeStructures.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No Fee Structures Found
                  </TableCell>
                </TableRow>
              ) : (
                feeStructures.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-4">
                      {index + 1}
                    </TableCell>

                    <TableCell>
                      {item.academicYear}
                    </TableCell>

                    <TableCell>
                      {item.className}
                    </TableCell>

                    <TableCell className="font-medium">
                      {item.name}
                    </TableCell>

                    <TableCell>
                      {item.description ?? "-"}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${item.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {item.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </TableCell>

                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            router.push(`/admin/fee-structures/viewFee?id=${item.id}`)
                          }
                        >
                          <View className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
