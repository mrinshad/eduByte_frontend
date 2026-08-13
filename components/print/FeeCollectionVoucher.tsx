"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer, Download } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";

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

    const handleDownloadPdf = async () => {
        try {
            const element = document.getElementById("voucher-content");
            if (!element) return;

            const imgData = await htmlToImage.toPng(element, { pixelRatio: 3 });

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Scaled height based on aspect ratio
            const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Fee_Receipt_${transaction.transactionNumber}.pdf`);
        } catch (error: any) {
            console.error("Error generating PDF:", error);
            toast.error(`Failed to generate PDF: ${error?.message || "Unknown error"}`);
        }
    };

    const charges = transaction.items.filter((i) => i.type === "CHARGE");
    const fines = transaction.items.filter((i) => i.type === "FINE");

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
                            Fee Collection Receipt
                        </h1>
                        <p className="text-xs text-slate-400">{transaction.transactionNumber}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleDownloadPdf}
                        variant="outline"
                        className="h-10 rounded-lg text-sm font-semibold shadow-sm"
                    >
                        <Download className="mr-1.5 h-4 w-4" />
                        Save PDF
                    </Button>
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
            </div>

            {/* Half-A4 (A5) Sheet */}
            <div id="voucher-content" className="mx-auto bg-white shadow-xl print:shadow-none a5-sheet overflow-hidden print:rounded-none">
                <div
                    className="a5-container"
                    style={{
                        width: "148mm",
                        minHeight: "210mm",
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
                    {/* Inner Border Box for traditional receipt look */}
                    <div className="border-2 border-black flex-1 flex flex-col p-4">

                        {/* Header Section */}
                        <div className="text-center mb-4 border-b-2 border-black pb-3.5">
                            <h1 className="text-lg font-bold uppercase tracking-wider">
                                Kids covE School of Excellence
                            </h1>
                            <p className="text-[11px] font-bold mt-1">
                                Run by: KC Ibrahim Haji Memorial Education Board
                            </p>
                            <p className="text-[11px] mt-1 font-medium">
                                Ph: 8113000247 | Email: ozhukurkids@gmail.com
                            </p>
                            <h2 className="text-base font-bold uppercase mt-3 underline underline-offset-4 decoration-2">
                                Fee Collection Receipt
                            </h2>
                        </div>

                        {/* Receipt No / Date */}
                        <div className="flex justify-between text-[12px] mb-4 font-bold">
                            <div>
                                Receipt No: {transaction.transactionNumber}
                            </div>
                            <div>
                                Date: {new Date(transaction.transactionDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })}
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="mb-4 text-[12px] grid grid-cols-2 gap-y-2">
                            <div className="grid grid-cols-[90px_1fr]">
                                <span className="font-bold">Student</span>
                                <span>: {transaction.student.studentName}</span>
                            </div>
                            <div className="grid grid-cols-[90px_1fr]">
                                <span className="font-bold">Adm No</span>
                                <span>: {transaction.student.admissionNumber}</span>
                            </div>
                            <div className="grid grid-cols-[90px_1fr]">
                                <span className="font-bold">Class</span>
                                <span>: {transaction.student.class} - {transaction.student.division}</span>
                            </div>
                            <div className="grid grid-cols-[90px_1fr]">
                                <span className="font-bold">Roll No</span>
                                <span>: {transaction.student.rollNumber}</span>
                            </div>
                        </div>

                        {/* Charges & Fines Unified Table */}
                        <div className="mb-4">
                            <table className="w-full text-left text-[12px] border-collapse border border-black">
                                <thead>
                                    <tr>
                                        <th className="border border-black p-1.5 font-bold">Particulars</th>
                                        <th className="border border-black p-1.5 w-24 font-bold">Period</th>
                                        <th className="border border-black p-1.5 w-24 text-right font-bold">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Map through Regular Fee Charges */}
                                    {charges.length > 0 && charges.map((item, idx) => (
                                        <tr key={`charge-${idx}`}>
                                            <td className="border border-black p-1.5">
                                                {item.name}
                                                {item.description && (
                                                    <span className="block text-[10px] text-slate-600 mt-0.5 font-medium">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-black p-1.5">{formatPeriod(item.period)}</td>
                                            <td className="border border-black p-1.5 text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Map through Fines */}
                                    {fines.length > 0 && fines.map((item, idx) => (
                                        <tr key={`fine-${idx}`}>
                                            <td className="border border-black p-1.5">
                                                {item.name} (Fine)
                                                {item.description && (
                                                    <span className="block text-[10px] text-slate-600 mt-0.5 font-medium">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-black p-1.5">—</td>
                                            <td className="border border-black p-1.5 text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colSpan={2} className="border border-black p-1.5 text-right font-bold uppercase">Total Paid</th>
                                        <th className="border border-black p-1.5 text-right font-bold text-sm">
                                            {formatCurrency(transaction.totalAmount)}
                                        </th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Payment method split */}
                        <div className="mb-4">
                            <span className="font-bold text-[12px] uppercase underline underline-offset-2">Payment Details</span>
                            <div className="mt-1.5 space-y-1 text-[12px] font-medium">
                                {transaction.payments.map((p, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <span className="w-20">Paid via {p.account}</span>
                                        <span>: {formatCurrency(p.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Spacer pushes signature lines to the bottom */}
                        <div className="flex-1" />

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-6 pt-12 text-[12px] font-bold text-center mt-auto">
                            <div>
                                <div className="border-t border-black w-3/4 mx-auto pt-1.5">Parent / Guardian</div>
                            </div>
                            <div>
                                <div className="border-t border-black w-3/4 mx-auto pt-1.5">Received By</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Print-specific sizing */}
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
                        page-break-inside: avoid;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}