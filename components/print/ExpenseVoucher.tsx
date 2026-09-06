import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const SAGE = "#6D755F";

type ExpenseVoucherProps = {
    expense: any;
};

export default function ExpenseVoucher({ expense }: ExpenseVoucherProps) {
    const router = useRouter();
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const dismissToasts = () => toast.dismiss();
        window.addEventListener("beforeprint", dismissToasts);
        return () => window.removeEventListener("beforeprint", dismissToasts);
    }, []);

    const handleDownloadPdf = async () => {
        try {
            setIsExporting(true);
            const element = document.getElementById("voucher-content");
            if (!element) return;

            const [htmlToImage, { jsPDF }] = await Promise.all([
                import("html-to-image"),
                import("jspdf"),
            ]);

            const imgData = await htmlToImage.toPng(element, {
                pixelRatio: 2,
                backgroundColor: "#ffffff",
                style: {
                    boxShadow: "none",
                    margin: "0",
                },
            });

            const elementWidth = element.offsetWidth || 794;
            const elementHeight = element.offsetHeight || 600;
            const pdfWidth = 210;
            const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [pdfWidth, pdfHeight],
            });

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
            pdf.save(`Expense_Voucher_${expense.expenseNumber}.pdf`);
        } catch (error: any) {
            console.error("Error generating PDF:", error);
            toast.error(`Failed to generate PDF: ${error?.message || "Unknown error"}`);
        } finally {
            setIsExporting(false);
        }
    };

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
                                Expense Voucher
                            </h1>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Voucher #{expense.expenseNumber}
                            </p>
                        </div>
                    </div>

                    {/* Right End */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isExporting}
                            className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-xs sm:text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white disabled:opacity-60"
                        >
                            {isExporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-700 dark:text-slate-300" />
                            ) : (
                                <Download className="mr-2 h-4 w-4 text-slate-700 dark:text-slate-300" />
                            )}
                            {isExporting ? "Generating PDF..." : "Save PDF"}
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
                            Print Voucher
                        </Button>
                    </div>
                </div>
            </header>

            {/* Compact Natural-Height Expense Voucher Sheet */}
            <div className="px-4">
                <div
                    id="voucher-content"
                    className="mx-auto bg-white shadow-xl print:shadow-none bill-sheet overflow-hidden print:rounded-none"
                    style={{ width: "210mm", maxWidth: "100%" }}
                >
                    <div
                        className="bill-container"
                        style={{
                            width: "100%",
                            padding: "10mm 12mm",
                            margin: "0 auto",
                            boxSizing: "border-box",
                            fontFamily: "Arial, Helvetica, sans-serif",
                            color: "#000",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#fff",
                        }}
                    >
                        {/* Inner Border Box */}
                        <div className="border-2 border-black flex-1 flex flex-col p-5">
                            {/* Header */}
                            <div className="text-center mb-4 border-b-2 border-black pb-3.5">
                                <h1 className="text-xl font-bold uppercase leading-tight tracking-wide">
                                    Kids covE 
                                </h1>
                                <h2 className="text-base font-bold uppercase tracking-widest text-slate-900">
                                    School of Excellence
                                </h2>
                                <p className="text-[12px] mt-1 font-bold uppercase">
                                    Run by: KC Ibrahim Haji Memorial Education Board
                                </p>
                                <p className="text-[12px] mt-0.5 font-medium text-slate-700">
                                    Ph: 8113000247 &nbsp;|&nbsp; Email: ozhukurkids@gmail.com
                                </p>
                                <h3 className="text-lg font-bold uppercase mt-3 underline underline-offset-4 decoration-2">
                                    Expense Voucher
                                </h3>
                            </div>

                            {/* Voucher Info */}
                            <div className="flex justify-between text-[13px] mb-4 font-bold border-b border-black/20 pb-2">
                                <div>
                                    Voucher No: {expense.expenseNumber}
                                </div>
                                <div>
                                    Date: {new Date(expense.expenseDate).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>

                            {/* Basic Details */}
                            <div className="mb-4 text-[13px] grid grid-cols-2 gap-x-8 gap-y-2">
                                <div className="grid grid-cols-[110px_1fr]">
                                    <span className="font-bold">Category</span>
                                    <span>: {expense.category?.name || expense.category}</span>
                                </div>
                                <div className="grid grid-cols-[110px_1fr]">
                                    <span className="font-bold">Sub Category</span>
                                    <span>: {expense.subCategory?.name || expense.subCategory}</span>
                                </div>
                                {expense.staff && (
                                    <div className="grid grid-cols-[110px_1fr]">
                                        <span className="font-bold">Staff / Payee</span>
                                        <span>
                                            : {expense.staff.name} ({expense.staff.employeeCode})
                                        </span>
                                    </div>
                                )}
                                {expense.vehicle && (
                                    <div className="grid grid-cols-[110px_1fr]">
                                        <span className="font-bold">Vehicle</span>
                                        <span>
                                            : {expense.vehicle.vehicleName} ({expense.vehicle.vehicleNumber})
                                        </span>
                                    </div>
                                )}
                                {expense.ccaActivity && (
                                    <div className="grid grid-cols-[110px_1fr]">
                                        <span className="font-bold">CCA Activity</span>
                                        <span>
                                            : {expense.ccaActivity.name} {expense.ccaActivity.code ? `(${expense.ccaActivity.code})` : ""}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Accounts Table */}
                            <div className="mb-4">
                                <table className="w-full text-left text-[13px] border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="border border-black p-2 w-12 text-center font-bold uppercase text-xs">Sl</th>
                                            <th className="border border-black p-2 font-bold uppercase text-xs">Particulars / Account</th>
                                            <th className="border border-black p-2 w-36 text-right font-bold uppercase text-xs">Amount (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expense.payments?.map((payment: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="border border-black p-2 text-center text-xs">{idx + 1}</td>
                                                <td className="border border-black p-2 font-semibold">{payment.account}</td>
                                                <td className="border border-black p-2 text-right font-medium">
                                                    {Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50">
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

                            {/* Signatures */}
                            <div className="grid grid-cols-3 gap-6 pt-10 text-[13px] font-bold text-center">
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
            </div>
        </div>
    );
}