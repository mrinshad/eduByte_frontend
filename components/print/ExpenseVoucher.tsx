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
            {/* Header - Hidden on Print */}
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
                    className="h-10 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: SAGE }}
                >
                    <Printer className="mr-1.5 h-4 w-4" />
                    Print
                </Button>
            </div>

            {/* Half-A4 (A5) Receipt */}
            <div className="mx-auto bg-white shadow-xl print:shadow-none a5-sheet overflow-hidden print:rounded-none">
                <div
                    className="a5-container"
                    style={{
                        width: "148mm",
                        height: "210mm",
                        padding: "10mm",
                        margin: "0 auto",
                        boxSizing: "border-box",
                        fontFamily: "Arial, Helvetica, sans-serif",
                        color: "#000",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#fff",
                    }}
                >
                    {/* Inner Border Box for traditional voucher look */}
                    <div className="border-2 border-black flex-1 flex flex-col p-4">
                        
                        {/* Header */}
                        <div className="text-center mb-4 border-b-2 border-black pb-4">
                            <h1 className="text-2xl font-bold uppercase leading-tight tracking-wide">
                                Kids covE 
                            </h1>
                            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-900">
                                School of Excellence
                            </h2>
                            <p className="text-[11px] mt-1.5 font-bold uppercase">
                                Run by: KC Ibrahim Haji Memorial Education Board
                            </p>
                            <p className="text-[11px] mt-1 font-medium">
                                Ph: 8113000247 | Email: ozhukurkids@gmail.com
                            </p>
                            <h3 className="text-lg font-bold uppercase mt-3 underline underline-offset-4 decoration-2">
                                Expense Voucher
                            </h3>
                        </div>

                        {/* Voucher Info */}
                        <div className="flex justify-between text-[13px] mb-5 font-bold">
                            <div>
                                Voucher No: {expense.expenseNumber}
                            </div>
                            <div>
                                Date: {new Date(expense.expenseDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })}
                            </div>
                        </div>

                        {/* Basic Details */}
                        <div className="mb-5 text-[13px]">
                            <div className="grid grid-cols-[110px_1fr] mb-1.5">
                                <span className="font-bold">Category</span>
                                <span>: {expense.category}</span>
                            </div>
                            <div className="grid grid-cols-[110px_1fr] mb-1.5">
                                <span className="font-bold">Sub Category</span>
                                <span>: {expense.subCategory}</span>
                            </div>
                            {expense.vehicle && (
                                <div className="grid grid-cols-[110px_1fr] mb-1.5">
                                    <span className="font-bold">Vehicle</span>
                                    <span>
                                        : {expense.vehicle.vehicleName} ({expense.vehicle.vehicleNumber})
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Accounts Table - REMOVED EMPTY ROWS */}
                        <div className="mb-5">
                            <table className="w-full text-left text-[13px] border-collapse border border-black">
                                <thead>
                                    <tr>
                                        <th className="border border-black p-2 w-10 text-center font-bold">Sl</th>
                                        <th className="border border-black p-2 font-bold">Particulars / Account</th>
                                        <th className="border border-black p-2 w-32 text-right font-bold">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expense.payments?.map((payment: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border border-black p-2 text-center">{idx + 1}</td>
                                            <td className="border border-black p-2">{payment.account}</td>
                                            <td className="border border-black p-2 text-right font-medium">
                                                {Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colSpan={2} className="border border-black p-2 text-right font-bold uppercase">Total Amount</th>
                                        <th className="border border-black p-2 text-right font-bold text-sm">
                                            ₹ {Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Notes */}
                        {expense.notes && (
                            <div className="text-[13px] mb-4">
                                <span className="font-bold">Remarks: </span>
                                <span>{expense.notes}</span>
                            </div>
                        )}

                        {/* Spacer to push signatures to bottom */}
                        <div className="flex-1" />

                        {/* Signatures */}
                        <div className="grid grid-cols-3 gap-4 pt-16 text-[13px] font-bold text-center mt-auto">
                            <div>
                                <div className="border-t border-black w-3/4 mx-auto pt-2">Prepared By</div>
                            </div>
                            <div>
                                <div className="border-t border-black w-3/4 mx-auto pt-2">Approved By</div>
                            </div>
                            <div>
                                <div className="border-t border-black w-3/4 mx-auto pt-2">Receiver's Sign</div>
                            </div>
                        </div>

                    </div>
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
                        background: white !important;
                    }
                    .a5-sheet {
                        box-shadow: none !important;
                    }
                    .a5-container {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}