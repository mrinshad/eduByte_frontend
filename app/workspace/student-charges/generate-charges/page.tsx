"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, AlertTriangle, CircleCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAcademicYears, getDefaultAcademicYear } from "@/lib/services/academicYear";
import {
  type FeeGenerationPreviewData,
  type FeeGenerationResult,
  previewFeeGeneration,
  generateFeeCharges,
} from "@/lib/services/studentCharges";

function formatCurrency(value: number) {
  return `\u20b9${value.toLocaleString("en-IN")}`;
}

function getMonthName(month: number) {
  if (month < 1 || month > 12) return "-";

  return new Date(2026, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800/50">
        <h2 className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function FeeGenerationPage() {
  const router = useRouter();

  const [preview, setPreview] = useState<FeeGenerationPreviewData | null>(null);
  const [activeAcademicYearId, setActiveAcademicYearId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastGenerationResult, setLastGenerationResult] = useState<FeeGenerationResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const generateLockRef = useRef(false);

  const monthLabel = useMemo(() => {
    if (!preview) return "";
    return `${getMonthName(preview.targetCalendarMonth)} ${preview.targetCalendarYear}`;
  }, [preview]);

  const warningItems = useMemo(() => {
    if (!preview?.warnings || !Array.isArray(preview.warnings)) return [];
    return preview.warnings.filter((item): item is string => typeof item === "string");
  }, [preview?.warnings]);

  const readyToGenerate = Boolean(preview?.validation?.readyToGenerate);
  const hasPendingGeneration = Boolean(preview && preview.summary.chargesToGenerate > 0 && readyToGenerate);

  const estimatedByType = useMemo(() => {
    if (!preview) return [];

    return Object.entries(preview.financialSummary.byChargeType)
      .sort((a, b) => b[1] - a[1]);
  }, [preview]);

  const tuitionEstimate = useMemo(() => {
    if (!preview) return 0;

    return Object.entries(preview.financialSummary.byChargeType).reduce((total, [name, amount]) => {
      return name.toLowerCase().includes("tuition") ? total + amount : total;
    }, 0);
  }, [preview]);

  async function loadPreviewForAcademicYear(academicYearId: string) {
    const payload = await previewFeeGeneration(academicYearId);

    if (!payload) {
      throw new Error("Preview data not found");
    }

    setPreview(payload);
  }

  async function initializePage() {
    try {
      setIsLoadingPreview(true);
      setLoadError(null);

      const activeAcademicYear = await getDefaultAcademicYear();

      let resolvedAcademicYearId = activeAcademicYear?.id ?? null;

      if (!resolvedAcademicYearId && activeAcademicYear) {
        const allAcademicYears = await getAcademicYears();
        const matchedByName = allAcademicYears.find((item) => item.name === activeAcademicYear.name);

        resolvedAcademicYearId = matchedByName?.id ?? allAcademicYears.find((item) => item.isActive)?.id ?? null;
      }

      if (!resolvedAcademicYearId) {
        throw new Error("Default Academic Year Not Found");
      }

      setActiveAcademicYearId(resolvedAcademicYearId);
      await loadPreviewForAcademicYear(resolvedAcademicYearId);
    } catch (error) {
      const message = getErrorMessage(error);
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  useEffect(() => {
    initializePage();
  }, []);

  async function handleRefreshPreview() {
    if (!activeAcademicYearId) return;

    try {
      setIsLoadingPreview(true);
      setLoadError(null);
      await loadPreviewForAcademicYear(activeAcademicYearId);
    } catch (error) {
      const message = getErrorMessage(error);
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function handleGenerateCharges() {
    if (!activeAcademicYearId) return;

    if (generateLockRef.current) {
      toast.warning("Fee generation is already in progress. Please wait.");
      return;
    }

    try {
      generateLockRef.current = true;
      setIsGenerating(true);

      // Always re-check latest preview state before generating to avoid stale duplicate submissions.
      const latestPreview = await previewFeeGeneration(activeAcademicYearId);

      if (!latestPreview) {
        throw new Error("Preview data not found");
      }

      setPreview(latestPreview);

      const latestReadyToGenerate = Boolean(latestPreview.validation?.readyToGenerate);
      const latestHasPendingGeneration =
        latestReadyToGenerate && latestPreview.summary.chargesToGenerate > 0;

      if (!latestHasPendingGeneration) {
        toast.warning("No new charges to generate for this month. Please refresh preview.");
        setConfirmOpen(false);
        return;
      }

      const result = await generateFeeCharges(activeAcademicYearId);

      if (!result) {
        throw new Error("Generation response not found");
      }

      setLastGenerationResult(result);
      toast.success("Student charges generated successfully");

      await loadPreviewForAcademicYear(activeAcademicYearId);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      generateLockRef.current = false;
      setIsGenerating(false);
    }
  }

  function openGenerateDialog() {
    if (!preview) {
      toast.warning("Preview is not loaded yet.");
      return;
    }

    if (!hasPendingGeneration) {
      toast.warning("No pending charges to generate for this month.");
      return;
    }

    setConfirmOpen(true);
  }

  return (
    <section className="w-full px-6 py-4 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Fee Generation</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Quick monthly preview with only actionable generation data.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleRefreshPreview} disabled={isLoadingPreview || isGenerating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPreview ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={openGenerateDialog}
              disabled={!preview || isLoadingPreview || isGenerating}
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Charges
            </Button>
          </div>
        </div>
      </div>

      {isLoadingPreview && !preview ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50">
          <div className="h-52 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#556043]" />
            <p className="text-sm">Loading preview...</p>
          </div>
        </div>
      ) : null}

      {!isLoadingPreview && loadError && !preview ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-800/60 dark:bg-red-950/20 dark:text-red-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="text-sm font-semibold">Unable to load fee generation preview</p>
                <p className="text-sm">{loadError}</p>
              </div>
            </div>
            <Button variant="outline" onClick={initializePage}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {preview ? (
        <>
          <div
            className={`rounded-xl p-4 border ${
              hasPendingGeneration
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:text-emerald-300"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-300"
            }`}
          >
            <div className="flex items-start gap-3">
              {hasPendingGeneration ? <CircleCheck className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
              <div>
                <p className="text-sm font-semibold">
                  {hasPendingGeneration
                    ? `Ready to generate for ${monthLabel}`
                    : `No pending generation for ${monthLabel}`}
                </p>
                <p className="mt-1 text-sm">
                  {hasPendingGeneration
                    ? `Estimated new charges across all active students: ${preview.summary.chargesToGenerate}. Estimated monthly total: ${formatCurrency(preview.financialSummary.total)}.`
                    : "This month appears already generated or has no due charges from active enrollment charges."}
                </p>
              </div>
            </div>
          </div>

          <Section title="Most Important Data">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Academic Year</p>
                <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{preview.academicYearName}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Month</p>
                <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{monthLabel}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Students</p>
                <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{preview.summary.activeStudents}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Charges To Generate</p>
                <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{preview.summary.chargesToGenerate}</p>
              </div>
            </div>
          </Section>

          <Section title="Financial Estimate (This Month)">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
              <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Estimated Amount To Be Generated (All Active Students)</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(preview.financialSummary.total)}
              </p>
              <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-300/90">
                Backend-calculated monthly estimate for every due charge in the target month.
              </p>
            </div>

            {hasPendingGeneration && estimatedByType.length > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Estimated Tuition Total (All Students)</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(tuitionEstimate)}</p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800/60">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">Charge Type</th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">Estimated Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimatedByType.map(([name, amount]) => (
                          <tr key={name} className="border-t border-slate-100 dark:border-slate-800/70">
                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{name}</td>
                            <td className="px-4 py-2 text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </Section>

          {warningItems.length > 0 ? (
            <Section title="Warnings">
              <div className="space-y-2">
                {warningItems.map((warning) => (
                  <div
                    key={warning}
                    className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-300"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {hasPendingGeneration && preview.sampleCharges.length > 0 ? (
            <Section title="Sample Charges">
              <div className="space-y-2">
                {preview.sampleCharges.slice(0, 5).map((item, index) => (
                  <div
                    key={`${item.enrollmentId}-${item.chargeType}-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.chargeType}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enrollment: {item.enrollmentId} | Amount: {formatCurrency(item.amount)} | Due: {new Date(item.dueDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {lastGenerationResult ? (
            <Section title="Latest Generation Result">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Charges Generated</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">{lastGenerationResult.chargesGenerated}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Charges Skipped</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">{lastGenerationResult.chargesSkipped}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Students Processed</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">{lastGenerationResult.studentsProcessed}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Last Generated Academic Month</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">{lastGenerationResult.lastGeneratedAcademicMonth}</p>
                </div>
              </div>
            </Section>
          ) : null}
        </>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Generate student charges for {monthLabel || "the target month"}?</DialogTitle>
            <DialogDescription>
              This will create charges for the displayed month and advance academic month generation progress.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
            <p>
              Academic Year: <span className="font-semibold text-slate-900 dark:text-slate-100">{preview?.academicYearName ?? "-"}</span>
            </p>
            <p className="mt-1">
              Target Month: <span className="font-semibold text-slate-900 dark:text-slate-100">{monthLabel || "-"}</span>
            </p>
            <p className="mt-1">
              Charges To Generate: <span className="font-semibold text-slate-900 dark:text-slate-100">{preview?.summary.chargesToGenerate ?? 0}</span>
            </p>
            <p className="mt-1">
              Estimated Amount: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(preview?.financialSummary.total ?? 0)}</span>
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={handleGenerateCharges}
              disabled={isGenerating || !hasPendingGeneration}
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
