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
} from "lucide-react";
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
  generateCatchUpFeeCharges,
} from "@/lib/services/studentCharges";

function formatCurrency(value?: number | null) {
  const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
  return `\u20b9${safeValue.toLocaleString("en-IN")}`;
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
  const [activeTab, setActiveTab] = useState<"students" | "categories">("students");

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
    preview && generationWindowAllowed && preview.summary.chargesToGenerate > 0 && readyToGenerate
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
        resolvedAcademicYearId =
          matchedByName?.id ?? allAcademicYears.find((item) => item.isActive)?.id ?? null;
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
    if (!activeAcademicYearId) {
      toast.error("Active Academic Year is missing.");
      return;
    }

    if (!hasPendingGeneration) {
      toast.warning("No pending charges available to generate for this target month.");
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
        toast.success(
          `Generated ${result.chargesGenerated} charge(s) for ${result.studentsProcessed} student(s)!`
        );
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

    if (!hasPendingGeneration) {
      if (!generationWindowAllowed) {
        toast.warning("Generation is currently locked to this month and next month only.");
      } else {
        toast.warning("No pending charges to generate for this month.");
      }
      return;
    }

    setConfirmOpen(true);
  }

  return (
    <section className="w-full px-6 py-4 space-y-5 max-w-7xl mx-auto">
      {/* ── Header & Action Bar ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
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
                Preview and run recurring batch fee generation for your school.
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
                Refresh Preview
              </Button>
            </PermissionGate>
            <PermissionGate permission="feegeneration.generateChargesButton">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold text-xs h-9 shadow-sm"
                onClick={openGenerateDialog}
                disabled={!preview || isLoadingPreview || isGenerating || !generationWindowAllowed}
              >
                {isGenerating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-white dark:text-slate-900" /> : null}
                Generate Charges for {monthLabel}
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
          {/* ── Concise Executive Summary Bar (3 Cards) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Target Month */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#556043] dark:text-slate-300" />
                  Target Billing Month
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    hasPendingGeneration
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300"
                      : generationLocked
                      ? "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {hasPendingGeneration ? "READY TO GENERATE" : generationLocked ? "LOCKED" : "COMPLETED"}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-950 dark:text-white pt-0.5">{monthLabel}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Academic Month {preview.targetAcademicMonth} of {preview.monthStatus?.totalAcademicMonths ?? 12} ({preview.academicYearName})
              </p>
            </div>

            {/* Card 2: Student & Charge Count */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-1">
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
                {catchUpCount > 0 ? `Includes ${catchUpCount} mid-year catch-up charge(s)` : "Standard monthly billing run"}
              </p>
            </div>

            {/* Card 3: Total Estimated Amount */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/20 space-y-1">
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

          {/* ── Mid-Year Catch-Up Section (If Newly Enrolled Students Exist) ── */}
          {groupedCatchUpStudents.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/30 dark:bg-amber-950/10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-sm font-semibold text-slate-950 dark:text-amber-100">
                    Mid-Year Enrolled Students Catch-Up Fees ({groupedCatchUpStudents.length} Student{groupedCatchUpStudents.length > 1 ? "s" : ""})
                  </h2>
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerateCatchUpCharges}
                  disabled={isGeneratingCatchUp || isGenerating || isLoadingPreview}
                  className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-xs font-semibold h-8"
                >
                  {isGeneratingCatchUp ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Generate Catch-Up Fees
                </Button>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-white dark:bg-slate-900/80 overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-amber-500/10 border-b border-amber-500/20">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-800 dark:text-amber-200">
                        Student Name
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-800 dark:text-amber-200">
                        Admission No
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-800 dark:text-amber-200">
                        Pending Fee Types
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-800 dark:text-amber-200">
                        Target Period
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-800 dark:text-amber-200">
                        Total Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {groupedCatchUpStudents.map((item) => (
                      <tr key={`${item.admissionNumber}-${item.periodName}`}>
                        <td className="px-4 py-2.5 font-medium text-slate-950 dark:text-slate-100">
                          {item.studentName}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-mono">
                          {item.admissionNumber || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                          <div className="flex flex-wrap gap-1">
                            {item.chargeTypes.map((type) => (
                              <span key={type} className="rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300/40 dark:border-amber-800 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-200">
                                {type}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                          {item.periodName}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-950 dark:text-slate-100">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Main Preview Data Section with View Tabs ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  Preview Charges ({monthLabel})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review student-wise charges before generating batch fees.
                </p>
              </div>

              {/* View Mode Toggle Tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("students")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "students"
                      ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  By Student ({preview.targetMonthStudents?.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("categories")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "categories"
                      ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  By Fee Category ({estimatedByType.length})
                </button>
              </div>
            </div>

            {/* TAB 1: By Student (Clean 1 Row Per Student Table) */}
            {activeTab === "students" && (
              <>
                {preview.targetMonthStudents && preview.targetMonthStudents.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200">
                            Student Name
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200">
                            Admission No
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200">
                            Fee Items
                          </th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                            Total Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {preview.targetMonthStudents.map((s) => (
                          <tr key={s.enrollmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                              {s.studentName}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">
                              {s.admissionNumber || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                              <div className="flex flex-wrap gap-1">
                                {s.chargeTypes.map((t) => (
                                  <span
                                    key={t}
                                    className="rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-950 dark:text-slate-100">
                              {formatCurrency(s.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No charges due to be generated for {monthLabel}.
                  </p>
                )}
              </>
            )}

            {/* TAB 2: By Fee Category */}
            {activeTab === "categories" && (
              <>
                {estimatedByType.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200">
                            Fee Category
                          </th>
                          <th className="px-4 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-200">
                            Frequency
                          </th>
                          <th className="px-4 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-200">
                            Total Students
                          </th>
                          <th className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                            Total Estimated Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {estimatedByType.map(([name, amount]) => {
                          const count = preview.chargesBreakdown[name] ?? 0;
                          const freq = preview.frequencyBreakdown[name] || "MONTHLY";
                          return (
                            <tr key={name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                {name}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                  {freq}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                {count}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-950 dark:text-slate-100">
                                {formatCurrency(amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No fee category breakdown available.
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Collapsible How Fee Generation Works Instructions ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="h-4 w-4 text-[#556043] dark:text-slate-300 shrink-0" />
                <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                  How Fee Generation Works (Click to View Guide)
                </h2>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-700 dark:text-slate-300">
                {showHowItWorks ? (
                  <>
                    Hide <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Show Guide <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>

            {showHowItWorks && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Calendar className="h-4 w-4 text-[#556043] dark:text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">
                      1. Automatic Monthly Order
                    </strong>
                    Fees are created month-by-month in order (June → July → August...). You don't need to select months manually.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Users className="h-4 w-4 text-[#556043] dark:text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">
                      2. Fair Billing for New Students
                    </strong>
                    When a student joins mid-year (e.g. in September), fees start from their join month. They are never billed for months before they joined.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Sparkles className="h-4 w-4 text-[#556043] dark:text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">
                      3. Automatic Catch-Up Fees
                    </strong>
                    If a new student joins after a month was already generated, their missing fee for that month is automatically added to this preview to generate now.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Alerts */}
          {warningItems.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/20 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                System Alerts
              </h2>
              {warningItems.map((warning) => (
                <div
                  key={warning}
                  className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Last Generation Results */}
          {lastGenerationResult && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/10 space-y-3">
              <h2 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                Latest Generation Result
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-xl border border-emerald-500/20 bg-white p-3 dark:bg-slate-900">
                  <p className="text-slate-500 dark:text-slate-400">Generated Charges</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {lastGenerationResult.chargesGenerated}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-white p-3 dark:bg-slate-900">
                  <p className="text-slate-500 dark:text-slate-400">Students Processed</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {lastGenerationResult.studentsProcessed}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-white p-3 dark:bg-slate-900">
                  <p className="text-slate-500 dark:text-slate-400">Skipped (Zero/Already)</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {lastGenerationResult.chargesSkipped}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-white p-3 dark:bg-slate-900">
                  <p className="text-slate-500 dark:text-slate-400">Current Academic Month</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    Month {lastGenerationResult.lastGeneratedAcademicMonth}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Fee Generation</DialogTitle>
            <DialogDescription>
              Generate student charges for <span className="font-semibold text-slate-900 dark:text-white">{monthLabel}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2 dark:border-slate-800 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Academic Year:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{preview?.academicYearName ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Target Period:</span>
              <span className="font-semibold text-slate-950 dark:text-white">{monthLabel || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Charges To Generate:</span>
              <span className="font-semibold text-slate-950 dark:text-white">{preview?.summary.chargesToGenerate ?? 0}</span>
            </div>
            {catchUpCount > 0 && (
              <div className="flex justify-between text-amber-700 dark:text-amber-300">
                <span>Catch-Up Student Charges:</span>
                <span className="font-semibold">{catchUpCount}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-base font-bold text-slate-950 dark:text-white">
              <span>Estimated Total:</span>
              <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(preview?.financialSummary.total ?? 0)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-medium"
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
