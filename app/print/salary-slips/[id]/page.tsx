"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, FileWarning } from "lucide-react";

import SalarySlipVoucher from "@/components/print/SalarySlipVoucher";
import {
    getSalarySlipPrint,
    type SalarySlipPrintData,
} from "@/lib/services/salarySlip";

const SAGE = "#556043";

export default function Page() {
    const { id } = useParams();

    const [slip, setSlip] = useState<SalarySlipPrintData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSlip = async () => {
            try {
                const data = await getSalarySlipPrint(id as string);
                setSlip(data);
            } catch (error) {
                console.error("Error loading salary slip voucher:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadSlip();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: SAGE }} />
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading salary slip voucher...</p>
            </div>
        );
    }

    if (!slip) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                    <FileWarning className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Salary slip not found</p>
                    <p className="mt-1 text-xs text-slate-400">
                        This voucher may have been deleted or the link is incorrect.
                    </p>
                </div>
            </div>
        );
    }

    return <SalarySlipVoucher slip={slip} />;
}
