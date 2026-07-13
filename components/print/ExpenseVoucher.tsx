"use client";
import { useRouter } from "next/navigation";

type ExpenseVoucherProps = {
    expense: any;
};

export default function ExpenseVoucher({ expense }: ExpenseVoucherProps) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 print:py-0 print:px-0">
            {/* Navigation - Hidden on Print */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-5 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
                >
                    ← Back
                </button>

                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition"
                >
                    🖨️ Print Voucher
                </button>
            </div>

            {/* A4 Paper */}
            <div className="mx-auto bg-white shadow-xl print:shadow-none">
                <div
                    className="a4-container mx-auto"
                    style={{
                        width: "210mm",
                        minHeight: "297mm",
                        padding: "15mm 18mm",
                        margin: "0 auto",
                        boxSizing: "border-box",
                        fontFamily: "Arial, Helvetica, sans-serif",
                        color: "#1f2937",
                    }}
                >
                    {/* Header */}
                    <div className="text-center border-b border-slate-800 pb-6 mb-8">
                        <h1 className="text-3xl font-bold">YOUR SCHOOL NAME</h1>
                        <p className="text-xl mt-2 text-slate-600">Expense Voucher</p>
                        <p className="text-sm text-slate-500 mt-1">{expense.expenseNumber}</p>
                    </div>

                    {/* Main Details */}
                    <div className="space-y-6 mb-10">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">EXPENSE DATE</p>
                                <p className="font-semibold text-lg">
                                    {new Date(expense.expenseDate).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">CATEGORY</p>
                                <p className="font-semibold text-lg">{expense.category}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">SUB CATEGORY</p>
                                <p className="font-semibold text-lg">{expense.subCategory}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">VEHICLE</p>
                                <p className="font-semibold text-lg">
                                    {expense.vehicle
                                        ? `${expense.vehicle.vehicleName} (${expense.vehicle.vehicleNumber})`
                                        : "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="border border-slate-800 rounded p-6 mb-10 bg-slate-50">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium">Total Amount</span>
                            <span className="text-4xl font-bold">
                                ₹ {Number(expense.amount).toLocaleString("en-IN")}
                            </span>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-10">
                        <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                        <table className="w-full border border-slate-300">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="px-5 py-3 text-left border border-slate-300">Account</th>
                                    <th className="px-5 py-3 text-right border border-slate-300">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expense.payments?.map((payment: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-200">
                                        <td className="px-5 py-3 border border-slate-300">{payment.account}</td>
                                        <td className="px-5 py-3 text-right border border-slate-300 font-medium">
                                            ₹ {Number(payment.amount).toLocaleString("en-IN")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Notes */}
                    {expense.notes && (
                        <div className="mb-12">
                            <h2 className="text-lg font-semibold mb-3">Notes</h2>
                            <div className="border border-slate-300 p-5 rounded leading-relaxed text-[15px]">
                                {expense.notes}
                            </div>
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-20 pt-16">
                        <div>
                            <div className="border-t border-slate-700 pt-3 text-center">
                                <p className="font-medium">Prepared By</p>
                                <p className="text-xs text-slate-500 mt-1">Signature &amp; Name</p>
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-slate-700 pt-3 text-center">
                                <p className="font-medium">Approved By</p>
                                <p className="text-xs text-slate-500 mt-1">Signature &amp; Name</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-[10px] text-slate-400 mt-16 print:block">
                        Computer Generated Document • {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </div>
    );
}