"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { viewFeeStructure, type FeeStructureView } from "@/lib/services/feeStructure"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDateOnly } from "@/lib/utils"
export default function Page() {
    const router = useRouter()
    const [feeStructure, setFeeStructure] =
        useState<FeeStructureView | null>(null);

    const searchParams = useSearchParams()
    const feeStructureId = searchParams.get("id")
    useEffect(() => {
        if (feeStructureId) {
            loadData();
        }
    }, [feeStructureId]);

    const loadData = async () => {
        try {
            console.log("id:", feeStructureId);

            const response = await viewFeeStructure(
                feeStructureId!
            );

            console.log("response:", response);
            console.log("data:", response.data);

            setFeeStructure(response.data);
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <section className="px-6 py-4">
            <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-950 dark:text-white">View Fee Structures</h1>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-600">View fee structures for classes and academic years.</p>
                </div>
            </div>
            {feeStructure && (
                <div className="mt-6 space-y-6">
                    {/* Summary Card */}
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {feeStructure.name}
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {feeStructure.description || "No description provided"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${feeStructure.isActive
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {feeStructure.isActive ? "Active" : "Inactive"}
                                    </span>

                                    <Button
                                        onClick={() =>
                                            router.push(
                                                `/admin/fee-structures/createFee?id=${feeStructure.id}`
                                            )
                                        }
                                        className="gap-2"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Information Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">
                                    Academic Year
                                </p>

                                <p className="mt-2 text-lg font-semibold">
                                    {feeStructure.academicYearName}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">
                                    Class
                                </p>

                                <p className="mt-2 text-lg font-semibold">
                                    {feeStructure.className}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">
                                    Created
                                </p>

                                <p className="mt-2 text-lg font-semibold">
                                    {formatDateOnly(feeStructure.createdAt)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">
                                    Updated
                                </p>

                                <p className="mt-2 text-lg font-semibold">
                                    {formatDateOnly(feeStructure.updatedAt)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Fee Items */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Fee Items
                                </h3>

                                <span className="text-sm text-muted-foreground">
                                    {feeStructure.items.length} Items
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">
                                            #
                                        </TableHead>

                                        <TableHead>
                                            Charge Type
                                        </TableHead>

                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {feeStructure.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {index + 1}
                                            </TableCell>

                                            <TableCell className="font-medium">
                                                {item.chargeTypeName}
                                            </TableCell>

                                            <TableCell className="text-right font-semibold">
                                                ₹ {Number(item.amount).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Total */}

                </div>
            )}
        </section>
    )
}
