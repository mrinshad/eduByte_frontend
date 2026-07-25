"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FeeCollectionPrintResponse } from "@/lib/services/feeCollection";

const SAGE = "#6D755F";

const formatCurrency = (n: number) =>
    `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const formatPeriod = (period: { month: number; year: number } | null) => {
    if (!period) return "—";
    const date = new Date(period.year, period.month - 1, 1);
    return date.toLocaleString("default", { month: "short", year: "numeric" });
};

type FeeCollectionVoucherProps = {
    transaction: FeeCollectionPrintResponse;
};

export default function FeeCollectionVoucher({ transaction }: FeeCollectionVoucherProps) {
    const router = useRouter();

    useEffect(() => {
        const dismissToasts = () => toast.dismiss();
        window.addEventListener("beforeprint", dismissToasts);
        return () => window.removeEventListener("beforeprint", dismissToasts);
    }, []);

    const charges = transaction.items.filter((i) => i.type === "CHARGE");
    const fines = transaction.items.filter((i) => i.type === "FINE");

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 print:py-0 print:px-0 print:bg-white dark:bg-slate-950">
            {/* Header - Hidden on Print */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-9 w-9 shrink-0 rounded-lg border-slate-200 dark:border-slate-700"
                    >
                        <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </Button>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                            Fee Collection Receipt
                        </h1>
                        <p className="text-xs text-slate-400">{transaction.transactionNumber}</p>
                    </div>
                </div>

                <Button
                    onClick={() => {
                        toast.dismiss();
                        window.print();
                    }}
                    className="h-10 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90"
                    style={{ backgroundColor: SAGE }}
                >
                    <Printer className="mr-1.5 h-4 w-4" />
                    Print
                </Button>
            </div>

            {/* A4 Sheet */}
            <div className="mx-auto bg-white shadow-xl print:shadow-none a4-sheet rounded-xl overflow-hidden print:rounded-none">
                <div
                    className="a4-container"
                    style={{
                        width: "210mm",
                        minHeight: "297mm",
                        padding: "16mm 18mm",
                        margin: "0 auto",
                        boxSizing: "border-box",
                        fontFamily: "Arial, Helvetica, sans-serif",
                        color: "#1f2937",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold tracking-wide uppercase">
                            Your School Name
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            123 School Road, City, State — 000000
                        </p>
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-400">
                            <p className="text-sm font-semibold tracking-widest uppercase">
                                Fee Collection Receipt
                            </p>
                        </div>
                    </div>

                    {/* Receipt No / Date */}
                    <div className="flex justify-between text-[12.5px] mb-4">
                        <span className="text-slate-600">
                            Receipt No:{" "}
                            <span className="font-semibold text-slate-900">
                                {transaction.transactionNumber}
                            </span>
                        </span>
                        <span className="text-slate-600">
                            Date:{" "}
                            <span className="font-semibold text-slate-900">
                                {new Date(transaction.transactionDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </span>
                    </div>

                    <div className="border-t border-dashed border-slate-400 mb-4" />

                    {/* Student info */}
                    <div className="grid grid-cols-2 gap-y-2 text-[12.5px] mb-4">
                        <div className="flex justify-between pr-4">
                            <span className="text-slate-500">Student</span>
                            <span className="font-medium text-right">{transaction.student.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Admission No</span>
                            <span className="font-medium text-right">{transaction.student.admissionNumber}</span>
                        </div>
                        <div className="flex justify-between pr-4">
                            <span className="text-slate-500">Class & Div</span>
                            <span className="font-medium text-right">
                                {transaction.student.class} - {transaction.student.division}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Roll No</span>
                            <span className="font-medium text-right">{transaction.student.rollNumber}</span>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-slate-400 mb-4" />

                    {/* Charges table */}
                    {charges.length > 0 && (
                        <div className="mb-5">
                            <p className="text-[10.5px] text-slate-500 uppercase tracking-wide mb-2">
                                Fee Charges
                            </p>
                            <table className="w-full text-[12.5px]">
                                <thead>
                                    <tr className="border-b border-slate-300 text-left text-slate-500">
                                        <th className="py-1.5 font-medium">Charge</th>
                                        <th className="py-1.5 font-medium">Period</th>
                                        <th className="py-1.5 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {charges.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100">
                                            <td className="py-1.5">
                                                {item.name}
                                                {item.description && (
                                                    <span className="block text-[10.5px] text-slate-400">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-1.5 text-slate-600">{formatPeriod(item.period)}</td>
                                            <td className="py-1.5 text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Fines table */}
                    {fines.length > 0 && (
                        <div className="mb-5">
                            <p className="text-[10.5px] text-slate-500 uppercase tracking-wide mb-2">
                                Fines
                            </p>
                            <table className="w-full text-[12.5px]">
                                <thead>
                                    <tr className="border-b border-slate-300 text-left text-slate-500">
                                        <th className="py-1.5 font-medium">Fine</th>
                                        <th className="py-1.5 font-medium">Reason</th>
                                        <th className="py-1.5 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fines.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100">
                                            <td className="py-1.5">{item.name}</td>
                                            <td className="py-1.5 text-slate-600">{item.description || "—"}</td>
                                            <td className="py-1.5 text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="border-t border-dashed border-slate-400 mb-4" />

                    {/* Payment method split */}
                    <div className="mb-4">
                        <p className="text-[10.5px] text-slate-500 uppercase tracking-wide mb-2">
                            Paid Via
                        </p>
                        <div className="space-y-1.5 text-[12.5px]">
                            {transaction.payments.map((p, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{p.account}</span>
                                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-slate-400 my-4" />

                    {/* Total */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold uppercase tracking-wide">
                            Total Paid
                        </span>
                        <span className="text-2xl font-bold">
                            {formatCurrency(transaction.totalAmount)}
                        </span>
                    </div>

                    <div className="border-t border-dashed border-slate-400 mb-4" />

                    {/* Spacer pushes signature to bottom */}
                    <div className="flex-1" />

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-10 pt-4 text-[12px]">
                        <div className="border-t border-slate-400 pt-1.5 text-center">
                            <p className="font-medium">Received By</p>
                        </div>
                        <div className="border-t border-slate-400 pt-1.5 text-center">
                            <p className="font-medium">Parent / Guardian</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print-specific sizing */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    html,
                    body {
                        width: 210mm;
                    }
                    .a4-sheet {
                        box-shadow: none !important;
                    }
                    .a4-container {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}