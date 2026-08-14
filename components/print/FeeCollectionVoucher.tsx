"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer, Download } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";

import { Button } from "@/components/ui/button";
import type { FeeCollectionPrintResponse } from "@/lib/services/feeCollection";

const SAGE = "#556043";

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

            const imgData = await htmlToImage.toPng(element, {
                pixelRatio: 3,
                backgroundColor: "#ffffff",
                style: {
                    boxShadow: "none",
                    margin: "0",
                },
            });

            const elementWidth = element.offsetWidth || 794;
            const elementHeight = element.offsetHeight || 1123;
            const pdfWidth = 210;
            const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [pdfWidth, pdfHeight],
            });

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
            pdf.save(`Fee_Receipt_${transaction.transactionNumber}.pdf`);
        } catch (error: any) {
            console.error("Error generating PDF:", error);
            toast.error(`Failed to generate PDF: ${error?.message || "Unknown error"}`);
        }
    };

    const charges = transaction.items.filter((i) => i.type === "CHARGE");
    const fines = transaction.items.filter((i) => i.type === "FINE");

    return (
        <div className="min-h-screen bg-slate-100/60 pb-12 print:pb-0 print:bg-white dark:bg-slate-950">
            {/* Top Navigation Bar - Spanning full width with elements on both far ends */}
            <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur shadow-xs dark:border-slate-800 dark:bg-slate-900/95 print:hidden mb-8">
                <div className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between">
                    {/* Left End */}
                    <div className="flex items-center gap-3.5">
                        <Button
                            type="button"
                            onClick={() => router.back()}
                            className="h-10 w-10 shrink-0 rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4 text-slate-800 dark:text-slate-100" />
                        </Button>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                                Fee Collection Receipt
                            </h1>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Receipt #{transaction.transactionNumber}
                            </p>
                        </div>
                    </div>

                    {/* Right End */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-xs sm:text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                            <Download className="mr-2 h-4 w-4 text-slate-700 dark:text-slate-300" />
                            Save PDF
                        </Button>
                        <Button
                            onClick={() => {
                                toast.dismiss();
                                window.print();
                            }}
                            className="h-10 rounded-xl px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:opacity-95 transition-opacity"
                            style={{ backgroundColor: SAGE }}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                        </Button>
                    </div>
                </div>
            </header>

            {/* Spacious Wide Receipt Sheet */}
            <div className="px-4">
                <div id="voucher-content" className="mx-auto bg-white shadow-xl print:shadow-none bill-sheet overflow-hidden print:rounded-none" style={{ width: "210mm", maxWidth: "100%" }}>
                    <div
                        className="bill-container"
                        style={{
                            width: "100%",
                            minHeight: "210mm",
                            padding: "12mm 14mm",
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
                        <div className="border-2 border-black flex-1 flex flex-col p-5">

                            {/* Header Section */}
                            <div className="text-center mb-5 border-b-2 border-black pb-4">
                                <h1 className="text-xl font-bold uppercase tracking-wider">
                                    Kids covE School of Excellence
                                </h1>
                                <p className="text-[12px] font-bold mt-1">
                                    Run by: KC Ibrahim Haji Memorial Education Board
                                </p>
                                <p className="text-[12px] mt-1 font-medium text-slate-700">
                                    Ph: 8113000247 &nbsp;|&nbsp; Email: ozhukurkids@gmail.com
                                </p>
                                <h2 className="text-lg font-bold uppercase mt-3.5 underline underline-offset-4 decoration-2">
                                    Fee Collection Receipt
                                </h2>
                            </div>

                            {/* Receipt No / Date */}
                            <div className="flex justify-between text-[13px] mb-4 font-bold border-b border-black/20 pb-2">
                                <div>
                                    Receipt No: {transaction.transactionNumber}
                                </div>
                                <div>
                                    Date: {new Date(transaction.transactionDate).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>

                            {/* Student Info */}
                            <div className="mb-5 text-[13px] grid grid-cols-2 gap-x-8 gap-y-2">
                                <div className="grid grid-cols-[100px_1fr]">
                                    <span className="font-bold">Student Name</span>
                                    <span>: {transaction.student.studentName}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr]">
                                    <span className="font-bold">Admission No</span>
                                    <span>: {transaction.student.admissionNumber}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr]">
                                    <span className="font-bold">Class & Div</span>
                                    <span>: {transaction.student.class} - {transaction.student.division}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr]">
                                    <span className="font-bold">Roll Number</span>
                                    <span>: {transaction.student.rollNumber || "—"}</span>
                                </div>
                            </div>

                            {/* Charges & Fines Unified Table */}
                            <div className="mb-5">
                                <table className="w-full text-left text-[13px] border-collapse border border-black">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="border border-black p-2 font-bold uppercase text-xs">Particulars</th>
                                        <th className="border border-black p-2 w-36 font-bold uppercase text-xs">Period</th>
                                        <th className="border border-black p-2 w-36 text-right font-bold uppercase text-xs">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Map through Regular Fee Charges */}
                                    {charges.length > 0 && charges.map((item, idx) => (
                                        <tr key={`charge-${idx}`}>
                                            <td className="border border-black p-2">
                                                <span className="font-semibold">{item.name}</span>
                                                {item.description && (
                                                    <span className="block text-[11px] text-slate-600 mt-0.5 font-normal">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-black p-2">{formatPeriod(item.period)}</td>
                                            <td className="border border-black p-2 text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Map through Fines */}
                                    {fines.length > 0 && fines.map((item, idx) => (
                                        <tr key={`fine-${idx}`}>
                                            <td className="border border-black p-2">
                                                <span className="font-semibold">{item.name} (Fine)</span>
                                                {item.description && (
                                                    <span className="block text-[11px] text-slate-600 mt-0.5 font-normal">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-black p-2">—</td>
                                            <td className="border border-black p-2 text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50">
                                        <th colSpan={2} className="border border-black p-2 text-right font-bold uppercase">Total Amount Paid</th>
                                        <th className="border border-black p-2 text-right font-bold text-sm">
                                            {formatCurrency(transaction.totalAmount)}
                                        </th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Payment method split */}
                        <div className="mb-5">
                            <span className="font-bold text-[12px] uppercase underline underline-offset-2">Payment Details</span>
                            <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-[13px] font-medium">
                                {transaction.payments.map((p, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="font-semibold">{p.account}:</span>
                                        <span>{formatCurrency(p.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Spacer pushes signature lines to the bottom */}
                        <div className="flex-1" />

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-12 pt-14 text-[13px] font-bold text-center mt-auto">
                            <div>
                                <div className="border-t border-black w-3/5 mx-auto pt-1.5">Parent / Guardian</div>
                            </div>
                            <div>
                                <div className="border-t border-black w-3/5 mx-auto pt-1.5">Received By</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            </div>

            {/* Print-specific sizing */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    html,
                    body {
                        width: 210mm;
                        background: white !important;
                    }
                    .bill-sheet {
                        box-shadow: none !important;
                    }
                    .bill-container {
                        width: 210mm !important;
                        page-break-inside: avoid;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}