"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getChargeTypes, type ChargeTypes } from "@/lib/services/chargeTypes";
import { getReportConfig } from "@/lib/report-definitions";

export default function FeeTypeReportsIndexPage() {
  const router = useRouter();
  const reportConfig = getReportConfig("reports/fee-type");
  const [chargeTypes, setChargeTypes] = useState<ChargeTypes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const list = await getChargeTypes();
        if (!cancelled) {
          setChargeTypes(list);
          // Auto-navigate to the first fee type report (e.g., Tuition Fee)
          if (list.length > 0) {
            router.replace(`/workspace/reports/fee-type/${list[0].id}`);
          }
        }
      } catch (err) {
        console.error("Failed to load charge types:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="w-full space-y-6 px-4 py-6 max-w-7xl mx-auto font-sans min-h-screen">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Button
            className="bg-background text-foreground hover:opacity-90 shadow-sm"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {reportConfig.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {reportConfig.subtitle}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#556043]" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading fee collection reports...
          </p>
        </div>
      ) : chargeTypes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/20">
          <Layers className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
            No Fee Types Configured
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Fee collection reports are grouped by fee type. Please define fee types in Admin settings to view collection reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chargeTypes.map((ct) => (
            <div
              key={ct.id}
              onClick={() => router.push(`/workspace/reports/fee-type/${ct.id}`)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#556043]/50 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#556043]/10 text-[#556043]">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  {ct.category && (
                    <Badge variant="secondary" className="text-[11px] font-semibold uppercase">
                      {ct.category}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[11px] uppercase">
                    {ct.frequency}
                  </Badge>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-[#556043] dark:text-white">
                {ct.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                View receipts breakdown, cash & bank ledger split for {ct.name}.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-[#556043]">
                <span>Open Collection Report</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
