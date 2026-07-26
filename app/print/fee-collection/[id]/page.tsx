"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, FileWarning } from "lucide-react";

import FeeCollectionVoucher from "@/components/print/FeeCollectionVoucher";
import {
    getFeeCollectionPrint,
    type FeeCollectionPrintResponse,
} from "@/lib/services/feeCollection";

const SAGE = "#6D755F";

export default function Page() {
    const { id } = useParams();

    const [transaction, setTransaction] =
        useState<FeeCollectionPrintResponse | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTransaction = async () => {
            try {
                const data = await getFeeCollectionPrint(id as string);
                setTransaction(data);
            } finally {
                setLoading(false);
            }
        };

        loadTransaction();
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: SAGE }} />
                <p className="text-sm text-slate-400">Loading receipt...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <FileWarning className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700">Transaction not found</p>
                    <p className="mt-1 text-xs text-slate-400">
                        This receipt may have been deleted or the link is incorrect.
                    </p>
                </div>
            </div>
        );
    }

    return <FeeCollectionVoucher transaction={transaction} />;
}