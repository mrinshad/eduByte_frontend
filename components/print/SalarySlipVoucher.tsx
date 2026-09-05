import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SalarySlipPrintData } from "@/lib/services/salarySlip";

const SAGE = "#556043";

type SalarySlipVoucherProps = {
    slip: SalarySlipPrintData;
};

export default function SalarySlipVoucher({ slip }: SalarySlipVoucherProps) {
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
            const elementHeight = element.offsetHeight || 650;
            const pdfWidth = 210;
            const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [pdfWidth, pdfHeight],
            });

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
            pdf.save(`Salary_Slip_${slip.slipNumber}.pdf`);
        } catch (error: unknown) {
            console.error("Error generating PDF:", error);
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to generate PDF: ${message}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100/60 pb-12 print:pb-0 print:bg-white dark:bg-slate-950">
            {/* Top Navigation Bar - Matching Expense and Fee Collection Vouchers */}
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
                                Salary Slip Voucher
                            </h1>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Voucher #{slip.slipNumber}
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

            {/* Standard 210mm Width A4 Portrait Voucher Sheet */}
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
                        {/* Double/Solid Border Box */}
                        <div className="border-2 border-black flex-1 flex flex-col p-5">
                            {/* School Brand Header */}
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
                                    Staff Salary Voucher
                                </h3>
                            </div>

                            {/* Voucher Details Row */}
                            <div className="flex justify-between text-[13px] mb-4 font-bold border-b border-black/20 pb-2">
                                <div>
                                    Slip No: {slip.slipNumber}
                                </div>
                                <div>
                                    Salary Month: {slip.salaryMonth}
                                </div>
                                <div>
                                    Disbursement Date: {new Date(slip.disbursementDate).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>

                            {/* Employee Information Grid */}
                            <div className="mb-4 text-[13px] grid grid-cols-2 gap-x-8 gap-y-2">
                                <div className="grid grid-cols-[130px_1fr]">
                                    <span className="font-bold">Employee Name</span>
                                    <span>: {slip.employee.name}</span>
                                </div>
                                <div className="grid grid-cols-[130px_1fr]">
                                    <span className="font-bold">Employee Code</span>
                                    <span>: {slip.employee.code}</span>
                                </div>
                                <div className="grid grid-cols-[130px_1fr]">
                                    <span className="font-bold">Role / Designation</span>
                                    <span>: {slip.employee.role || "Staff Member"}</span>
                                </div>
                                <div className="grid grid-cols-[130px_1fr]">
                                    <span className="font-bold">Payment Method</span>
                                    <span>: {slip.paymentMethod}</span>
                                </div>
                                <div className="grid grid-cols-[130px_1fr]">
                                    <span className="font-bold">Casual Leaves</span>
                                    <span>: {slip.casualLeaves} day(s)</span>
                                </div>
                                {slip.expenseNumber && (
                                    <div className="grid grid-cols-[130px_1fr]">
                                        <span className="font-bold">Expense Record</span>
                                        <span>: {slip.expenseNumber}</span>
                                    </div>
                                )}
                            </div>

                            {/* Two-Column Side-by-Side Earnings & Deductions Tables */}
                            {(() => {
                                const activeEarnings = (slip.earnings || []).filter((e) => Number(e.amount) > 0);
                                const activeDeductions = (slip.deductions || []).filter((d) => Number(d.amount) > 0);

                                return (
                                    <div className="mb-4 grid grid-cols-2 gap-4">
                                        {/* Earnings Table */}
                                        <div>
                                            <table className="w-full text-left text-[12px] border-collapse border border-black">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        <th className="border border-black p-2 w-8 text-center font-bold uppercase text-[11px]">Sl</th>
                                                        <th className="border border-black p-2 font-bold uppercase text-[11px]">Earnings & Allowances</th>
                                                        <th className="border border-black p-2 w-28 text-right font-bold uppercase text-[11px]">Amount (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeEarnings.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="border border-black p-3 text-center text-slate-500 italic text-xs">
                                                                Nil / No allowances
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        activeEarnings.map((earn, idx) => (
                                                            <tr key={idx}>
                                                                <td className="border border-black p-2 text-center text-xs">{idx + 1}</td>
                                                                <td className="border border-black p-2 font-medium">{earn.name}</td>
                                                                <td className="border border-black p-2 text-right font-medium">
                                                                    {earn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-slate-50">
                                                        <th colSpan={2} className="border border-black p-2 text-right font-bold uppercase">Total Earnings</th>
                                                        <th className="border border-black p-2 text-right font-bold text-xs">
                                                            ₹ {slip.totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                        </th>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Deductions Table */}
                                        <div>
                                            <table className="w-full text-left text-[12px] border-collapse border border-black">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        <th className="border border-black p-2 w-8 text-center font-bold uppercase text-[11px]">Sl</th>
                                                        <th className="border border-black p-2 font-bold uppercase text-[11px]">Deductions & Recoveries</th>
                                                        <th className="border border-black p-2 w-28 text-right font-bold uppercase text-[11px]">Amount (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeDeductions.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="border border-black p-3 text-center text-slate-500 italic text-xs">
                                                                Nil / No deductions
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        activeDeductions.map((ded, idx) => (
                                                            <tr key={idx}>
                                                                <td className="border border-black p-2 text-center text-xs">{idx + 1}</td>
                                                                <td className="border border-black p-2 font-medium">{ded.name}</td>
                                                                <td className="border border-black p-2 text-right font-medium">
                                                                    {ded.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-slate-50">
                                                        <th colSpan={2} className="border border-black p-2 text-right font-bold uppercase">Total Deductions</th>
                                                        <th className="border border-black p-2 text-right font-bold text-xs">
                                                            ₹ {slip.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                        </th>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Net Salary Payable Card */}
                            <div className="mb-4 border border-black p-3 bg-slate-50 text-[13px]">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span>NET SALARY PAYABLE:</span>
                                    <span className="text-base font-bold">
                                        ₹ {slip.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mt-1 text-xs text-slate-700 italic">
                                    Amount in Words: <strong>{slip.netSalaryWords}</strong>
                                </div>
                            </div>

                            {/* Remarks */}
                            {slip.remarks && (
                                <div className="text-[13px] mb-4">
                                    <span className="font-bold">Remarks: </span>
                                    <span>{slip.remarks}</span>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="grid grid-cols-3 gap-6 pt-10 text-[13px] font-bold text-center mt-auto">
                                <div>
                                    <div className="border-t border-black w-3/4 mx-auto pt-2">Prepared By</div>
                                </div>
                                <div>
                                    <div className="border-t border-black w-3/4 mx-auto pt-2">Accountant / Cashier</div>
                                </div>
                                <div>
                                    <div className="border-t border-black w-3/4 mx-auto pt-2">Employee Signature</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
