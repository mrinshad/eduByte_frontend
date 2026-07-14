"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, FileWarning } from "lucide-react";

import ExpenseVoucher from "@/components/print/ExpenseVoucher";
import {
    getExpensePrint,
    type ExpensePrintResponse,
} from "@/lib/services/expense";

const SAGE = "#6D755F";

export default function Page() {
    const { id } = useParams();

    const [expense, setExpense] =
        useState<ExpensePrintResponse["data"] | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadExpense = async () => {
            try {
                const response = await getExpensePrint(id as string);
                setExpense(response.data);
            } finally {
                setLoading(false);
            }
        };

        loadExpense();
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: SAGE }} />
                <p className="text-sm text-slate-400">Loading voucher...</p>
            </div>
        );
    }

    if (!expense) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <FileWarning className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700">Expense not found</p>
                    <p className="mt-1 text-xs text-slate-400">
                        This voucher may have been deleted or the link is incorrect.
                    </p>
                </div>
            </div>
        );
    }

    return <ExpenseVoucher expense={expense} />;
}