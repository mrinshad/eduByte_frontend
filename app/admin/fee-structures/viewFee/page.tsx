"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    ArrowLeft,
    Pencil,
    Calendar,
    GraduationCap,
    Layers,
    Receipt,
    Clock,
    FileText,
} from "lucide-react"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteFeeStructure } from "@/lib/services/feeStructure"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { viewFeeStructure, type FeeStructureView } from "@/lib/services/feeStructure"
import { formatDateOnly } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Shared presentational building blocks (same pattern as the        */
/*  student profile page, reused here for visual consistency)          */
/* ------------------------------------------------------------------ */

function InfoSection({
    icon: Icon,
    eyebrow = "Profile section",
    title,
    children,
}: {
    icon: React.ElementType
    eyebrow?: string
    title: string
    children: React.ReactNode
}) {
    return (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
            <CardHeader className="border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800/60 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#556043]/10 text-[#556043]">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            {eyebrow}
                        </div>
                        <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
                    </div>
                </div>
            </CardHeader>
            {children}
        </Card>
    )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {label}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-950 dark:text-slate-100">{value ?? "—"}</div>
        </div>
    )
}

function statusTone(isActive: boolean) {
    return isActive
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
}

/* ------------------------------------------------------------------ */
/*  Skeleton loading state — mirrors the final layout so there is no   */
/*  layout shift once data arrives. Built with shadcn/ui <Skeleton />  */
/*  The Fee Items block below mirrors the exact InfoSection header     */
/*  (icon badge + eyebrow + title) and a responsive table body.        */
/* ------------------------------------------------------------------ */

function FeeStructureSkeleton() {
    return (
        <div className="mt-6 space-y-6">
            {/* Summary card skeleton */}
            <Card className="border shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-56" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-20 rounded-full" />
                            <Skeleton className="h-9 w-24 rounded-md" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sidebar + info grid skeleton */}
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <CardContent className="p-6 text-center">
                        <Skeleton className="mx-auto h-20 w-20 rounded-full" />
                        <Skeleton className="mx-auto mt-4 h-6 w-40" />
                        <Skeleton className="mx-auto mt-2 h-4 w-28" />
                        <div className="mt-6 divide-y border-t pt-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-3">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                        <CardHeader className="border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800/60 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-2xl" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-4 w-36" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40"
                                    >
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="mt-2 h-4 w-28" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Fee Items card skeleton — exact match to the real InfoSection header */}
            <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 w-full">
                <CardHeader className="border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 shrink-0 rounded-2xl" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Table header skeleton (hidden on very small screens, rows below stack instead) */}
                    <div className="hidden items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 sm:flex dark:border-slate-800/60 dark:bg-slate-950/40">
                        <Skeleton className="h-3 w-6" />
                        <Skeleton className="h-3 w-32 flex-1" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between gap-4 px-5 py-4"
                            >
                                <Skeleton className="h-4 w-6" />
                                <Skeleton className="h-4 flex-1 max-w-[10rem]" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </Card>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Page() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const feeStructureId = searchParams.get("id")

    const [feeStructure, setFeeStructure] = useState<FeeStructureView | null>(null)
    const [loading, setLoading] = useState(true)

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!feeStructure) return;

        try {
            setDeleting(true);

            await deleteFeeStructure(feeStructure.id);

            toast.success("Fee Structure deleted successfully.");

            router.push("/admin/fee-structures");
        } catch (error: any) {
            toast.error(error?.message ?? "Failed to delete Fee Structure.");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    useEffect(() => {
        async function loadData() {
            if (!feeStructureId) {
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                const response = await viewFeeStructure(feeStructureId)
                setFeeStructure(response.data)
            } catch (error) {
                console.error(error)
                setFeeStructure(null)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [feeStructureId])

    const total =
        feeStructure?.items?.reduce((sum, item) => sum + Number(item.amount || 0), 0) ?? 0

    return (
        <section className="w-full px-4 py-4 sm:px-6">
            <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        className="bg-background text-foreground hover:opacity-90 shadow-sm"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 text-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                            View Fee Structure
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                            View fee structures for classes and academic years.
                        </p>
                    </div>
                </div>

                {feeStructure && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className={statusTone(feeStructure.isActive)}
                        >
                            {feeStructure.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>

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

                        <Button
                            variant="destructive"
                            className="gap-2"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {loading && <FeeStructureSkeleton />}

            {!loading && !feeStructure && (
                <div className="mt-6 flex items-center gap-2 text-sm text-red-500">
                    <ArrowLeft className="h-4 w-4" />
                    Fee structure record not found.
                </div>
            )}

            {!loading && feeStructure && (
                <div className="mt-6 space-y-6">
                    <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
                        {/* Sidebar summary card — mirrors the student profile card */}
                        <div className="">
                            <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                <CardContent className="p-6 text-center">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#556043]/10 text-3xl font-bold text-[#556043]">
                                        <Receipt className="h-8 w-8" />
                                    </div>

                                    <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                                        {feeStructure.name}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {feeStructure.description || "No description provided"}
                                    </p>

                                    <div className="mt-6 divide-y border-t pt-2 text-left">
                                        <div className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <GraduationCap className="h-4 w-4" />
                                                <span>Academic year</span>
                                            </div>
                                            <span className="text-sm font-medium text-slate-950 dark:text-slate-100">
                                                {feeStructure.academicYearName}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Layers className="h-4 w-4" />
                                                <span>Class</span>
                                            </div>
                                            <span className="text-sm font-medium text-slate-950 dark:text-slate-100">
                                                {feeStructure.className}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Receipt className="h-4 w-4" />
                                                <span>Total amount</span>
                                            </div>
                                            <span className="text-sm font-medium text-slate-950 dark:text-slate-100">
                                                ₹ {total.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <InfoSection icon={FileText} title="Fee Structure Information">
                                <CardContent className="p-5">
                                    <InfoGrid>
                                        <InfoItem label="Name" value={feeStructure.name} />
                                        <InfoItem label="Academic year" value={feeStructure.academicYearName} />
                                        <InfoItem label="Class" value={feeStructure.className} />
                                        <InfoItem
                                            label="Status"
                                            value={feeStructure.isActive ? "Active" : "Inactive"}
                                        />
                                        <InfoItem label="Created" value={formatDateOnly(feeStructure.createdAt)} />
                                        <InfoItem label="Updated" value={formatDateOnly(feeStructure.updatedAt)} />
                                        <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                                            <div className="flex items-start gap-3">
                                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                                                <div>
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                                        Description
                                                    </div>
                                                    <p className="mt-1 text-sm leading-6 text-slate-950 dark:text-slate-100">
                                                        {feeStructure.description || "No description provided"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </InfoGrid>
                                </CardContent>
                            </InfoSection>

                            {/* Fee items table */}

                        </div>

                    </div>

                    {/* Fee Items — now uses the same "Profile section" theme as InfoSection above */}
                    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 w-full">
                        <CardHeader className="border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800/60 dark:bg-slate-900/50">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#556043]/10 text-[#556043]">
                                        <Receipt className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                            Profile section
                                        </div>
                                        <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                                            Fee Items
                                        </div>
                                    </div>
                                </div>

                                <span className="w-fit rounded-full bg-[#556043]/10 px-3 py-1 text-sm font-semibold text-[#556043]">
                                    {feeStructure.items.length} Items
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table className="w-full min-w-[420px]">
                                    <TableHeader className="bg-slate-50/80 dark:bg-slate-950/40">
                                        <TableRow className="border-slate-100 dark:border-slate-800/60">
                                            <TableHead className="font-semibold text-slate-500 dark:text-slate-400">
                                                #
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-500 dark:text-slate-400">
                                                Charge Type
                                            </TableHead>
                                            <TableHead className="text-right font-semibold text-slate-500 dark:text-slate-400">
                                                Amount
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {feeStructure.items.map((item, index) => (
                                            <TableRow
                                                className="border-slate-100 hover:bg-slate-50/80 dark:border-slate-800/60 dark:hover:bg-slate-950/40"
                                                key={index}
                                            >
                                                <TableCell className="font-medium text-slate-600 dark:text-slate-400">
                                                    {index + 1}
                                                </TableCell>

                                                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {item.chargeTypeName}
                                                </TableCell>

                                                <TableCell className="text-right font-bold text-[#556043]">
                                                    ₹ {Number(item.amount).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>

                        <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800/60 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 sm:text-base">
                                Total Amount
                            </span>

                            <span className="text-lg font-bold text-[#556043] sm:text-xl">
                                ₹ {total.toLocaleString()}
                            </span>
                        </div>
                    </Card>
                </div>
            )}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Fee Structure?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{feeStructure?.name}</strong>?
                            <br />
                            This action cannot be undone. If this Fee Structure has already been
                            assigned to students, the system will prevent deletion.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                void handleDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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