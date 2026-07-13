"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import ExpenseVoucher from "@/components/print/ExpenseVoucher";
import {
    getExpensePrint,
    type ExpensePrintResponse
} from "@/lib/services/expense";

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
        return <div>Loading...</div>;
    }

    if (!expense) {
        return <div>Expense not found.</div>;
    }
    
    return <ExpenseVoucher expense={expense} />;

}