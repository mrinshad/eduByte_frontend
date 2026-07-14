"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

const SAGE = "#6D755F";

type ExpenseVoucherProps = {
    expense: any;
};

export default function ExpenseVoucher({ expense }: ExpenseVoucherProps) {
    const router = useRouter();

    useEffect(() => {
        const dismissToasts = () => toast.dismiss();
        window.addEventListener("beforeprint", dismissToasts);
        return () => window.removeEventListener("beforeprint", dismissToasts);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 print:py-0 print:px-0 print:bg-white dark:bg-slate-950">
            {/* Header - Hidden on Print, matches app's page-header convention */}
            <div className="max-w-md mx-auto mb-6 flex items-center justify-between print:hidden">
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
                            Expense Voucher
                        </h1>
                        <p className="text-xs text-slate-400">{expense.expenseNumber}</p>
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

            {/* Half-A4 (A5) Receipt */}
            <div className="mx-auto bg-white shadow-xl print:shadow-none a5-sheet rounded-xl overflow-hidden print:rounded-none">
                <div
                    className="a5-container"
                    style={{
                        width: "148mm",
                        height: "210mm",
                        padding: "12mm 14mm",
                        margin: "0 auto",
                        boxSizing: "border-box",
                        fontFamily: "Arial, Helvetica, sans-serif",
                        color: "#1f2937",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Header */}
                    <div className="text-center mb-5">
                        <h1 className="text-xl font-bold tracking-wide uppercase">
                            Your School Name
                        </h1>
                        <p className="text-[11px] text-slate-500 mt-1">
                            123 School Road, City, State — 000000
                        </p>
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-400">
                            <p className="text-sm font-semibold tracking-widest uppercase">
                                Expense Voucher
                            </p>
                        </div>
                    </div>

                    {/* Voucher No / Date - receipt-style row */}
                    <div className="flex justify-between text-[12px] mb-4">
                        <span className="text-slate-600">
                            Voucher No:{" "}
                            <span className="font-semibold text-slate-900">
                                {expense.expenseNumber}
                            </span>
                        </span>
                        <span className="text-slate-600">
                            Date:{" "}
                            <span className="font-semibold text-slate-900">
                                {new Date(expense.expenseDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </span>
                    </div>

                    <div className="border-t border-dashed border-slate-400 mb-4" />

                    {/* Key details - plain rows, no boxes */}
                    <div className="space-y-2 text-[12.5px] mb-4">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Category</span>
                            <span className="font-medium text-right">{expense.category}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Sub Category</span>
                            <span className="font-medium text-right">{expense.subCategory}</span>
                        </div>
                        {expense.vehicle && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Vehicle</span>
                                <span className="font-medium text-right">
                                    {expense.vehicle.vehicleName} ({expense.vehicle.vehicleNumber})
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-dashed border-slate-400 mb-4" />

                    {/* Payment Details - receipt line items, no table borders */}
                    <div className="mb-2">
                        <div className="flex justify-between text-[10.5px] text-slate-500 uppercase tracking-wide mb-2">
                            <span>Account</span>
                            <span>Amount</span>
                        </div>
                        <div className="space-y-1.5 text-[12.5px]">
                            {expense.payments?.map((payment: any, idx: number) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{payment.account}</span>
                                    <span className="font-medium">
                                        ₹ {Number(payment.amount).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-slate-400 my-4" />

                    {/* Total - the one emphasized line, like a receipt total */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold uppercase tracking-wide">
                            Total
                        </span>
                        <span className="text-2xl font-bold">
                            ₹ {Number(expense.amount).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="border-t border-dashed border-slate-400 mb-4" />

                    {/* Notes - plain, no box */}
                    {expense.notes && (
                        <div className="mb-4 text-[12px]">
                            <p className="text-slate-500 mb-1">Notes</p>
                            <p className="leading-snug max-h-[24mm] overflow-hidden">
                                {expense.notes}
                            </p>
                        </div>
                    )}

                    {/* Spacer pushes signatures + footer to the bottom */}
                    <div className="flex-1" />

                    {/* Signatures */}
                    {/* <div className="grid grid-cols-2 gap-10 pt-4 text-[12px]">
                        <div className="border-t border-slate-400 pt-1.5 text-center">
                            <p className="font-medium">Prepared By</p>
                        </div>
                        <div className="border-t border-slate-400 pt-1.5 text-center">
                            <p className="font-medium">Approved By</p>
                        </div>
                    </div> */}

                    {/* Footer */}
                    {/* <div className="text-center text-[9px] text-slate-400 mt-4 pt-3 border-t border-dashed border-slate-300">
                        Computer Generated Document • {new Date().getFullYear()}
                    </div> */}
                </div>
            </div>

            {/* Print-specific sizing so the sheet prints as a single half-A4 page */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: 148mm 210mm;
                        margin: 0;
                    }
                    html,
                    body {
                        width: 148mm;
                        height: 210mm;
                    }
                    .a5-sheet {
                        box-shadow: none !important;
                    }
                    .a5-container {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}