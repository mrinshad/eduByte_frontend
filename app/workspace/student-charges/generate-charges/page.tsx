"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Lock,
  Clock,
  Check,
  Zap,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  generateCatchUpFeeCharges,
} from "@/lib/services/studentCharges";
import {
  type CCAChargePreviewData,
  type CCAChargeGenerateResult,
  previewCcaCharges,
  generateCcaCharges,
} from "@/lib/services/cca";

function formatCurrency(value?: number | null) {
  const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
  return `₹${safeValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export default function FeeGenerationPage() {
  const router = useRouter();

  const [preview, setPreview] = useState<FeeGenerationPreviewData | null>(null);
  const [activeAcademicYearId, setActiveAcademicYearId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingCatchUp, setIsGeneratingCatchUp] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastGenerationResult, setLastGenerationResult] = useState<FeeGenerationResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // CCA Generation State
  const [ccaPreview, setCcaPreview] = useState<CCAChargePreviewData | null>(null);
  const [isLoadingCcaPreview, setIsLoadingCcaPreview] = useState(false);
  const [isGeneratingCca, setIsGeneratingCca] = useState(false);
  const [ccaConfirmOpen, setCcaConfirmOpen] = useState(false);

  const generateLockRef = useRef(false);

  const monthLabel = useMemo(() => {
    if (!preview) return "";
    return (
      preview.targetPeriod ||
      `${getMonthName(preview.targetCalendarMonth)} ${preview.targetCalendarYear}`
    );
  }, [preview]);

  const warningItems = useMemo(() => {
    if (!preview?.warnings || !Array.isArray(preview.warnings)) return [];
    return preview.warnings.filter((item): item is string => typeof item === "string");
  }, [preview?.warnings]);

  const generationLocked = preview?.validation?.generationWindowAllowed === false;
  const generationWindowAllowed = !generationLocked;
  const readyToGenerate = Boolean(preview?.validation?.readyToGenerate);
  const hasPendingGeneration = Boolean(
    preview && generationWindowAllowed && readyToGenerate
  );

  const catchUpCount = preview?.summary?.catchUpChargesCount ?? preview?.catchUpCharges?.length ?? 0;

  const estimatedByType = useMemo(() => {
    if (!preview?.financialSummary?.byChargeType) return [];

    return Object.entries(preview.financialSummary.byChargeType).filter(
      ([, amount]) => typeof amount === "number" && amount > 0
    );
  }, [preview?.financialSummary?.byChargeType]);

  const groupedCatchUpStudents = useMemo(() => {
    if (!preview?.catchUpCharges || !Array.isArray(preview.catchUpCharges)) return [];

    const map = new Map<
      string,
      {
        studentName: string;
        admissionNumber: string;
        periodName: string;
        chargeTypes: string[];
        totalAmount: number;
      }
    >();

    for (const item of preview.catchUpCharges) {
      const key = `${item.admissionNumber || item.studentName}-${item.periodName}`;
      if (!map.has(key)) {
        map.set(key, {
          studentName: item.studentName || "Student",
          admissionNumber: item.admissionNumber || "—",
          periodName: item.periodName || monthLabel,
          chargeTypes: [],
          totalAmount: 0,
        });
      }
      const student = map.get(key)!;
      if (item.chargeType && !student.chargeTypes.includes(item.chargeType)) {
        student.chargeTypes.push(item.chargeType);
      }
      student.totalAmount += item.amount || 0;
    }

    return Array.from(map.values());
  }, [preview?.catchUpCharges, monthLabel]);

  // Timeline computation (either from backend or fallback derived from preview)
  const timelineMonths = useMemo(() => {
    if (preview?.academicYearTimeline && preview.academicYearTimeline.length > 0) {
      return preview.academicYearTimeline;
    }

    if (!preview) return [];

    const total = preview.monthStatus?.totalAcademicMonths ?? 12;
    const lastGen = preview.monthStatus?.lastGeneratedMonthNumber ?? 0;
    const targetMonth = preview.targetAcademicMonth;

    return Array.from({ length: total }, (_, i) => {
      const mNum = i + 1;
      let status: "COMPLETED" | "CURRENT_TARGET" | "LOCKED" | "UPCOMING" = "UPCOMING";
      if (mNum <= lastGen) {
        status = "COMPLETED";
      } else if (mNum === targetMonth) {
        status = preview.validation?.generationWindowAllowed ? "CURRENT_TARGET" : "LOCKED";
      }

      return {
        academicMonthNumber: mNum,
        periodName: mNum === targetMonth ? monthLabel : `Month ${mNum}`,
        monthShort: `M${mNum}`,
        status,
        isCurrentTarget: mNum === targetMonth,
        isCompleted: mNum <= lastGen,
        isLocked: status === "LOCKED" || status === "UPCOMING",
        calendarMonth: mNum,
        calendarYear: preview.targetCalendarYear,
      };
    });
  }, [preview, monthLabel]);

  const completedMonthsCount = useMemo(() => {
    return timelineMonths.filter((m) => m.isCompleted).length;
  }, [timelineMonths]);

  async function loadPreviewForAcademicYear(academicYearId: string) {
    const payload = await previewFeeGeneration(academicYearId);
    if (!payload) {
      throw new Error("Preview data not found");
    }
    setPreview(payload);
  }

  async function loadCcaPreview(academicYearId: string) {
    try {
      setIsLoadingCcaPreview(true);
      const data = await previewCcaCharges(academicYearId);
      setCcaPreview(data);
    } catch {
      setCcaPreview(null);
    } finally {
      setIsLoadingCcaPreview(false);
    }
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
        resolvedAcademicYearId =
          matchedByName?.id ?? allAcademicYears.find((item) => item.isActive)?.id ?? null;
      }

      if (!resolvedAcademicYearId) {
        throw new Error("Default Academic Year Not Found");
      }

      setActiveAcademicYearId(resolvedAcademicYearId);
      await loadPreviewForAcademicYear(resolvedAcademicYearId);
      await loadCcaPreview(resolvedAcademicYearId);
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
      await loadCcaPreview(activeAcademicYearId);
    } catch (error) {
      const message = getErrorMessage(error);
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function handleGenerateCharges() {
    if (!activeAcademicYearId) {
      toast.error("Active Academic Year is missing.");
      return;
    }

    if (!hasPendingGeneration) {
      if (!generationWindowAllowed) {
        toast.warning("Generation is currently locked to this month and next month only.");
      } else {
        toast.warning("Generation is not ready for this target month.");
      }
      return;
    }

    if (generateLockRef.current || isGenerating) {
      return;
    }

    generateLockRef.current = true;
    setIsGenerating(true);

    try {
      const result = await generateFeeCharges(activeAcademicYearId);
      if (result) {
        setLastGenerationResult(result);
        if (result.chargesGenerated > 0) {
          toast.success(
            `Generated ${result.chargesGenerated} charge(s) for ${result.studentsProcessed} student(s)!`
          );
        } else {
          toast.success(
            `Completed ${monthLabel} with 0 charges. Advanced to the next academic month!`
          );
        }
      }

      setConfirmOpen(false);
      await loadPreviewForAcademicYear(activeAcademicYearId);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsGenerating(false);
      generateLockRef.current = false;
    }
  }

  async function handleGenerateCatchUpCharges() {
    if (!activeAcademicYearId) return;
    try {
      setIsGeneratingCatchUp(true);
      const res = await generateCatchUpFeeCharges(activeAcademicYearId);
      if (res) {
        toast.success(`Generated ${res.catchUpChargesGenerated} catch-up charge(s) for newly enrolled students!`);
      }
      await loadPreviewForAcademicYear(activeAcademicYearId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsGeneratingCatchUp(false);
    }
  }

  function openGenerateDialog() {
    if (!preview) {
      toast.warning("Preview is not loaded yet.");
      return;
    }

    if (!generationWindowAllowed) {
      toast.warning("Generation is currently locked to this month and next month only.");
      return;
    }

    setConfirmOpen(true);
  }

  async function handleGenerateCcaCharges() {
    if (!activeAcademicYearId) return;
    setIsGeneratingCca(true);
    try {
      const result = await generateCcaCharges(activeAcademicYearId);
      if (result) {
        toast.success(`Generated ${result.chargesGenerated} CCA charge(s) successfully!`);
      }
      setCcaConfirmOpen(false);
      await loadCcaPreview(activeAcademicYearId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsGeneratingCca(false);
    }
  }

  return (
    <section className="w-full px-3 py-4 sm:px-6 sm:py-6 space-y-5 max-w-7xl mx-auto font-sans min-h-screen">
      {/* ── Header & Action Bar ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="bg-background text-foreground hover:opacity-90 shadow-sm"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Generate Fees
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Academic year timeline and batch fee generation run for your school.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PermissionGate permission="feegeneration.refreshFeeGenerationButton">
              <Button
                onClick={handleRefreshPreview}
                disabled={isLoadingPreview || isGenerating}
                className="bg-[#556043]/10 text-[#556043] hover:bg-[#556043]/20 border border-[#556043]/30 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-semibold text-xs h-9 shadow-sm"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 text-[#556043] dark:text-slate-200 ${isLoadingPreview ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </PermissionGate>
            <PermissionGate permission="feegeneration.generateChargesButton">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold text-xs h-9 shadow-sm"
                onClick={openGenerateDialog}
                disabled={!preview || isLoadingPreview || isGenerating || !generationWindowAllowed}
              >
                {isGenerating ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-white dark:text-slate-900" />
                ) : (
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                )}
                {preview && preview.summary.chargesToGenerate > 0
                  ? `Generate Charges for ${monthLabel}`
                  : `Advance Month (${monthLabel})`}
              </Button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoadingPreview && !preview ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50">
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#556043]" />
            <p className="text-sm font-medium">Calculating fee generation preview...</p>
          </div>
        </div>
      ) : null}

      {/* Error state */}
      {!isLoadingPreview && loadError && !preview ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-800/60 dark:bg-red-950/20 dark:text-red-300">
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

      {/* Main Preview Content */}
      {preview ? (
        <>
          {/* ── Executive Summary Bar (3 Cards) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Target Month */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#556043] dark:text-slate-300" />
                  Target Billing Month
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    generationLocked
                      ? "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300"
                      : preview.summary.chargesToGenerate > 0
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300"
                      : "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300"
                  }`}
                >
                  {generationLocked
                    ? "LOCKED"
                    : preview.summary.chargesToGenerate > 0
                    ? "READY TO GENERATE"
                    : "READY TO ADVANCE (0 CHARGES)"}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-950 dark:text-white pt-0.5">{monthLabel}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Academic Month {preview.targetAcademicMonth} of {preview.monthStatus?.totalAcademicMonths ?? 12} ({preview.academicYearName})
              </p>
            </div>

            {/* Card 2: Student & Charge Count */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#556043] dark:text-slate-300" />
                  Students & Charges
                </span>
                <span className="text-[10px] font-semibold bg-[#556043]/10 text-[#556043] dark:bg-slate-800 dark:text-slate-300 border border-[#556043]/20 dark:border-slate-700 px-2 py-0.5 rounded">
                  {preview.summary.activeStudents} Active Students
                </span>
              </div>
              <p className="text-xl font-bold text-slate-950 dark:text-white pt-0.5">
                {preview.summary.chargesToGenerate} Charge{preview.summary.chargesToGenerate !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {preview.summary.chargesToGenerate === 0
                  ? "No charges due for this month (fees start in a later month or no fees due)"
                  : catchUpCount > 0
                  ? `Includes ${catchUpCount} mid-year catch-up charge(s)`
                  : "Standard monthly billing run"}
              </p>
            </div>

            {/* Card 3: Total Estimated Amount */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  Total Estimated Billing
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded">
                  SUM
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-950 dark:text-emerald-100 pt-0.5 truncate">
                {formatCurrency(preview.financialSummary.total)}
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                Total estimated revenue to be billed
              </p>
            </div>
          </div>

          {/* ── 1. ACADEMIC YEAR BILLING TIMELINE (MONTH-BY-MONTH PROGRESSION) ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#556043]" />
                  Academic Year Fee Generation Timeline ({preview.academicYearName})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sequential billing progression across all {timelineMonths.length} academic months.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold bg-slate-50 dark:bg-slate-800">
                  {completedMonthsCount} of {timelineMonths.length} Months Billed
                </Badge>
              </div>
            </div>

            {/* Visual Month Sequence */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
              {timelineMonths.map((m) => {
                const isCurrent = m.isCurrentTarget;
                const isCompleted = m.isCompleted;

                return (
                  <div
                    key={m.academicMonthNumber}
                    className={`rounded-xl p-3 border transition-all flex flex-col justify-between min-h-[90px] relative ${
                      isCurrent
                        ? "bg-[#556043]/10 border-[#556043] ring-2 ring-[#556043]/20 shadow-xs dark:bg-slate-800/80 dark:border-slate-600"
                        : isCompleted
                        ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                        : "bg-slate-50/50 border-slate-200/80 opacity-60 dark:bg-slate-900/40 dark:border-slate-800"
                    }`}
                  >
                    {/* Top Row: Month # and Status Icon */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Month {m.academicMonthNumber}
                      </span>
                      {isCompleted ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : isCurrent ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#556043] text-white animate-pulse">
                          <Clock className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <Lock className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Middle: Month Name */}
                    <div className="my-1.5">
                      <p className={`text-xs sm:text-sm font-bold truncate ${
                        isCurrent
                          ? "text-slate-950 dark:text-white"
                          : isCompleted
                          ? "text-emerald-950 dark:text-emerald-100"
                          : "text-slate-600 dark:text-slate-400"
                      }`}>
                        {m.periodName}
                      </p>
                    </div>

                    {/* Bottom: Status Tag */}
                    <div>
                      {isCompleted ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Generated
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-[#556043] dark:text-slate-200 uppercase">
                          {generationLocked
                            ? "Locked"
                            : preview?.summary?.chargesToGenerate > 0
                            ? "● Target Month"
                            : "● Target (0 Charges)"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium text-slate-400">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fee Category Breakdown for Target Month */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Month Fee Structure Breakdown ({monthLabel})
              </h3>
              {estimatedByType.length > 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                          Fee Category
                        </th>
                        <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                          Billing Frequency
                        </th>
                        <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                          Students Evaluated
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                          Estimated Subtotal (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {estimatedByType.map(([name, amount]) => {
                        const count = preview.chargesBreakdown[name] ?? 0;
                        const freq = preview.frequencyBreakdown[name] || "MONTHLY";
                        return (
                          <tr key={name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                              {name}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <Badge variant="outline" className="text-[10px] font-semibold bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                                {freq}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                              {count}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-950 dark:text-slate-100">
                              {formatCurrency(amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-2">
                  No standard fee categories scheduled for this target month.
                </p>
              )}
            </div>
          </div>

          {/* ── 2. CATCH-UP FEES ONLY SECTION (THE ONLY STUDENT LIST DISPLAYED) ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Mid-Year Catch-Up Fees
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Historical dues for newly enrolled or mid-year admitted students who joined after academic month 1.
                </p>
              </div>

              {groupedCatchUpStudents.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleGenerateCatchUpCharges}
                  disabled={isGeneratingCatchUp || isGenerating || isLoadingPreview}
                  className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-xs font-semibold h-9 shadow-sm"
                >
                  {isGeneratingCatchUp ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Generate Catch-Up Fees ({groupedCatchUpStudents.length})
                </Button>
              )}
            </div>

            {groupedCatchUpStudents.length > 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-amber-500/10 border-b border-amber-500/20">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-800 dark:text-amber-200">
                        Student Name
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-800 dark:text-amber-200">
                        Admission No
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-800 dark:text-amber-200">
                        Pending Historical Fee Types
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-800 dark:text-amber-200">
                        Historical Period
                      </th>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-800 dark:text-amber-200">
                        Catch-Up Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10 font-medium">
                    {groupedCatchUpStudents.map((item) => (
                      <tr key={`${item.admissionNumber}-${item.periodName}`} className="hover:bg-amber-500/10">
                        <td className="px-4 py-3 font-semibold text-slate-950 dark:text-slate-100">
                          {item.studentName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                          {item.admissionNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          <div className="flex flex-wrap gap-1">
                            {item.chargeTypes.map((type) => (
                              <Badge key={type} variant="outline" className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">
                          {item.periodName}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-800 dark:text-amber-300">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/30">
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    All Enrolled Students Are Up to Date
                  </p>
                  <p className="text-xs">
                    No newly admitted or mid-year transfer students require historical catch-up fee generation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. CCA FEE GENERATION SECTION ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  CCA Fee Generation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate co-curricular activity fees for all assigned students up to the last generated academic month.
                </p>
              </div>

              {ccaPreview && (ccaPreview.summary?.chargesToGenerate ?? 0) > 0 && (
                <Button
                  size="sm"
                  onClick={() => setCcaConfirmOpen(true)}
                  disabled={isGeneratingCca || isLoadingCcaPreview}
                  className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:text-white dark:hover:bg-violet-400 text-xs font-semibold h-9 shadow-sm"
                >
                  {isGeneratingCca ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trophy className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Generate CCA Fees ({ccaPreview.summary.chargesToGenerate})
                </Button>
              )}
            </div>

            {isLoadingCcaPreview ? (
              <div className="flex items-center justify-center py-6 gap-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                <span className="text-xs font-medium">Loading CCA preview...</span>
              </div>
            ) : ccaPreview?.message ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/30">
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <p className="text-xs font-medium">{ccaPreview.message}</p>
                </div>
              </div>
            ) : ccaPreview && (ccaPreview.summary?.chargesToGenerate ?? 0) > 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-violet-50/80 dark:bg-violet-950/20 border-b border-violet-200/50 dark:border-violet-800/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                        CCA Activity
                      </th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                        Charges to Generate
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                        Estimated Total (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {Object.entries(ccaPreview.byActivity).map(([name, count]) => (
                      <tr key={name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                          {name}
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-700 dark:text-slate-300 font-semibold">
                          {count}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-950 dark:text-slate-100">
                          {formatCurrency(ccaPreview.financialByActivity[name] ?? 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-violet-50/60 dark:bg-violet-950/20">
                      <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">Total</td>
                      <td className="px-4 py-2.5 text-center font-bold text-slate-900 dark:text-slate-100">
                        {ccaPreview.summary.chargesToGenerate}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-violet-700 dark:text-violet-300">
                        {formatCurrency(ccaPreview.summary.totalEstimatedAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/30">
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    CCA Fees Are Up to Date
                  </p>
                  <p className="text-xs">
                    {ccaPreview?.activeAssignmentCount === 0
                      ? "No active CCA assignments found."
                      : "All CCA charges have been generated for the current academic months."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Collapsible How Fee Generation Works Instructions ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowHowItWorks((prev) => !prev)}
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#556043]" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  How Recurring Fee Generation Works
                </span>
              </div>
              {showHowItWorks ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </div>

            {showHowItWorks && (
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <p>
                  • <strong>Sequential Advancing</strong>: Fee generation proceeds strictly month by month (Month 1, then Month 2, etc.) to guarantee zero skipped or duplicate billings.
                </p>
                <p>
                  • <strong>Billing Window Guard</strong>: To prevent accidental future billings, generation is permitted only for the current calendar month and one month in advance.
                </p>
                <p>
                  • <strong>Mid-Year Catch-Up Fees</strong>: When a new student is admitted mid-session, click &quot;Generate Catch-Up Fees&quot; to back-generate charges for the past academic months they were enrolled in.
                </p>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {preview && preview.summary.chargesToGenerate > 0
                ? `Confirm Fee Generation for ${monthLabel}`
                : `Confirm Month Advancement for ${monthLabel}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {preview && preview.summary.chargesToGenerate > 0
                ? "This will create student charges in the system and advance the academic month counter."
                : "No charges are scheduled for this month (e.g. students admitted in later months or no fees due). Proceeding will complete this month with 0 charges and advance to the next academic month."}
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900/60 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Month:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{monthLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Charges to Create:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{preview.summary.chargesToGenerate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Students:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{preview.summary.activeStudents}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Total Billing:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(preview.financialSummary.total)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={isGenerating}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateCharges}
              disabled={isGenerating}
              className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-xs font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {preview?.summary?.chargesToGenerate === 0 ? "Advancing..." : "Generating..."}
                </>
              ) : preview?.summary?.chargesToGenerate === 0 ? (
                "Confirm & Advance Month"
              ) : (
                "Confirm & Run Generation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CCA Generation Confirmation Modal */}
      <Dialog open={ccaConfirmOpen} onOpenChange={setCcaConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Confirm CCA Fee Generation
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              This will generate CCA charges for all active CCA students up to the last generated academic month.
            </DialogDescription>
          </DialogHeader>

          {ccaPreview && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900/60 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Active CCA Assignments:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{ccaPreview.activeAssignmentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Charges to Create:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{ccaPreview.summary.chargesToGenerate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Generated (Skipped):</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{ccaPreview.summary.alreadyGenerated}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Total Estimated:</span>
                <span className="font-bold text-violet-600 dark:text-violet-400 text-sm">
                  {formatCurrency(ccaPreview.summary.totalEstimatedAmount)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCcaConfirmOpen(false)}
              disabled={isGeneratingCca}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateCcaCharges}
              disabled={isGeneratingCca}
              className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:text-white dark:hover:bg-violet-400 text-xs font-semibold"
            >
              {isGeneratingCca ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Confirm & Generate CCA Fees"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
