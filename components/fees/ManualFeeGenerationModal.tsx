"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getStudentFeeGenerationPreview,
  generateStudentFeesManual,
  type SingleStudentGenerationPlan,
} from "@/lib/services/studentCharges";
import { cn, formatDateOnly } from "@/lib/utils";

interface ManualFeeGenerationModalProps {
  enrollmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function formatCurrency(amount?: number | null) {
  const val = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ManualFeeGenerationModal({
  enrollmentId,
  isOpen,
  onClose,
  onSuccess,
}: ManualFeeGenerationModalProps) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<SingleStudentGenerationPlan | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [showGeneratedAccordion, setShowGeneratedAccordion] = useState(false);
  const [syncPending, setSyncPending] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen || !enrollmentId) return;

    let isMounted = true;
    async function loadPlan() {
      try {
        setLoading(true);
        const data = await getStudentFeeGenerationPreview(enrollmentId);
        if (!isMounted) return;
        setPlan(data);

        // Pre-select all ungenerated charges that are within the allowed window
        if (data?.items) {
          const defaultSelected = new Set<string>();
          for (const item of data.items) {
            if (!item.isGenerated && item.isAllowedWindow) {
              defaultSelected.add(item.key);
            }
          }
          setSelectedKeys(defaultSelected);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch student fee generation preview:", err);
        const message = err instanceof Error ? err.message : "Failed to load fee generation preview";
        toast.error(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPlan();
    return () => {
      isMounted = false;
    };
  }, [isOpen, enrollmentId]);

  const ungeneratedItems = useMemo(() => {
    if (!plan?.items) return [];
    return plan.items.filter((item) => !item.isGenerated);
  }, [plan]);

  const alreadyGeneratedItems = useMemo(() => {
    if (!plan?.items) return [];
    return plan.items.filter((item) => item.isGenerated);
  }, [plan]);

  const displayedUngenerated = useMemo(() => {
    if (showAllMonths) return ungeneratedItems;
    // By default, show ungenerated charges that are within the allowed window
    return ungeneratedItems.filter((item) => item.isAllowedWindow);
  }, [ungeneratedItems, showAllMonths]);

  const ungeneratedInView = displayedUngenerated;

  const selectedChargesTotal = useMemo(() => {
    if (!plan?.items) return 0;
    let sum = 0;
    for (const item of plan.items) {
      if (!item.isGenerated && selectedKeys.has(item.key)) {
        sum += item.finalAmount;
      }
    }
    return sum;
  }, [plan, selectedKeys]);

  const allEligibleSelected = useMemo(() => {
    if (ungeneratedInView.length === 0) return false;
    return ungeneratedInView.every((i) => selectedKeys.has(i.key));
  }, [ungeneratedInView, selectedKeys]);

  const handleToggleSelectAll = () => {
    const next = new Set(selectedKeys);
    if (allEligibleSelected) {
      for (const i of ungeneratedInView) {
        next.delete(i.key);
      }
    } else {
      for (const i of ungeneratedInView) {
        next.add(i.key);
      }
    }
    setSelectedKeys(next);
  };

  const handleToggleItem = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
  };

  const handleGenerate = async () => {
    if (selectedKeys.size === 0 && !syncPending) {
      toast.warning("Please select at least one fee charge to generate.");
      return;
    }

    try {
      setIsGenerating(true);
      const result = await generateStudentFeesManual(enrollmentId, {
        chargeKeys: Array.from(selectedKeys),
        syncPendingAmounts: syncPending,
      });

      toast.success(
        `Generated ${result?.createdCount || 0} charges successfully!${
          result && result.updatedCount > 0 ? ` (${result.updatedCount} pending updated)` : ""
        }`
      );
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to generate student fees:", err);
      const message = err instanceof Error ? err.message : "Failed to generate student fees";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-[#6a7459] dark:border-slate-800 shadow-2xl bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100 [&>button:last-child]:text-white/80 hover:[&>button:last-child]:text-white hover:[&>button:last-child]:bg-white/10">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#8b9478]/40 dark:border-slate-800 bg-[#6a7459]/50 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 dark:bg-slate-800 text-white dark:text-[#9ea98a] flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-semibold text-white dark:text-white">
                  Generate Fees Manually
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-200 dark:text-slate-400 mt-0.5">
                  Generate individual monthly charges, admission, and activity fees for this student.
                </DialogDescription>
              </div>
            </div>
            {plan?.student && (
              <div className="text-right">
                <div className="text-sm font-semibold text-white dark:text-white">
                  {plan.student.studentName}
                </div>
                <div className="text-xs text-slate-200 dark:text-slate-400">
                  {plan.student.admissionNumber} • {plan.enrollment.className} - {plan.enrollment.divisionName}
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 rounded-xl bg-white/10 dark:bg-slate-800" />
              <Skeleton className="h-16 rounded-xl bg-white/10 dark:bg-slate-800" />
              <Skeleton className="h-16 rounded-xl bg-white/10 dark:bg-slate-800" />
            </div>
            <Skeleton className="h-48 rounded-xl bg-white/10 dark:bg-slate-800" />
          </div>
        ) : !plan ? (
          <div className="p-8 text-center text-sm text-rose-300 dark:text-rose-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Unable to load fee generation plan for this student.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-[#8b9478]/40 bg-[#667155]/40 dark:border-slate-700/60 dark:bg-slate-800/60 shadow-xs">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-200 dark:text-slate-400">
                  Pending To Generate
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-bold text-white dark:text-white" style={{ fontFeatureSettings: '"tnum"' }}>
                    {formatCurrency(selectedChargesTotal)}
                  </span>
                  <Badge variant="secondary" className="text-[11px] font-medium bg-white/20 text-white hover:bg-white/25 border-transparent">
                    {selectedKeys.size} selected
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#8b9478]/40 bg-[#667155]/40 dark:border-slate-700/60 dark:bg-slate-800/60 shadow-xs">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-200 dark:text-slate-400">
                  Already Generated
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-semibold text-white dark:text-white" style={{ fontFeatureSettings: '"tnum"' }}>
                    {plan.summary.alreadyGeneratedCount} charges
                  </span>
                  <Badge variant="outline" className="text-[11px] font-medium text-emerald-300 dark:text-emerald-400 border-emerald-400/30 bg-emerald-500/10">
                    Active
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#8b9478]/40 bg-[#667155]/40 dark:border-slate-700/60 dark:bg-slate-800/60 shadow-xs">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-200 dark:text-slate-400">
                  Academic Year
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-white dark:text-white">
                    {plan.enrollment.academicYearName}
                  </span>
                  <span className="text-xs text-slate-200 dark:text-slate-400">
                    {plan.enrollment.totalAcademicMonths} mos
                  </span>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full border-[#8b9478] bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800 text-xs font-medium disabled:opacity-50"
                  onClick={handleToggleSelectAll}
                  disabled={ungeneratedInView.length === 0}
                >
                  {allEligibleSelected ? "Deselect All" : "Select All Due"}
                </Button>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showAllMonths"
                    checked={showAllMonths}
                    onCheckedChange={(c) => setShowAllMonths(Boolean(c))}
                    className="border-[#8b9478] data-[state=checked]:bg-white data-[state=checked]:text-[#556043] dark:border-slate-600"
                  />
                  <label htmlFor="showAllMonths" className="text-xs text-slate-200 dark:text-slate-300 cursor-pointer select-none">
                    Show full year ({ungeneratedItems.length} ungenerated)
                  </label>
                </div>
              </div>

              {plan.items.some((i) => i.canSyncAmount) && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="syncPending"
                    checked={syncPending}
                    onCheckedChange={(c) => setSyncPending(Boolean(c))}
                    className="border-[#8b9478] data-[state=checked]:bg-white data-[state=checked]:text-[#556043] dark:border-slate-600"
                  />
                  <label htmlFor="syncPending" className="text-xs font-medium text-amber-300 dark:text-amber-400 cursor-pointer select-none">
                    Update pending uncollected charges to match latest fee changes
                  </label>
                </div>
              )}
            </div>

            {/* Ungenerated Charges Table */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 dark:text-slate-400">
                  Fees Ready To Generate
                </span>
                <span className="text-[11px] text-slate-300/80">
                  {displayedUngenerated.length} charge{displayedUngenerated.length === 1 ? "" : "s"} available
                </span>
              </div>
              <div className="rounded-xl border border-[#8b9478]/40 dark:border-slate-800 overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#6a7459] hover:bg-[#6a7459] dark:bg-slate-950/80 dark:hover:bg-slate-950/80 border-none">
                      <TableHead className="w-10 text-center">
                        <span className="sr-only">Select</span>
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-white dark:text-slate-200">Fee Item</TableHead>
                      <TableHead className="text-xs font-semibold text-white dark:text-slate-200">Period</TableHead>
                      <TableHead className="text-xs font-semibold text-white dark:text-slate-200">Due Date</TableHead>
                      <TableHead className="text-xs font-semibold text-right text-white dark:text-slate-200">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-center text-white dark:text-slate-200">Window</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedUngenerated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-sm text-slate-200 dark:text-slate-400">
                          {ungeneratedItems.length > 0 ? (
                            <div className="space-y-1">
                              <p className="font-medium text-white">All fees in the current window have already been generated.</p>
                              <p className="text-xs text-slate-300">
                                Check &quot;Show full year&quot; above to view and generate advance fees for upcoming months.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="font-medium text-white">All fees for this student have been generated.</p>
                              <p className="text-xs text-slate-300">No additional ungenerated fees remain for this academic year.</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedUngenerated.map((item) => {
                        const isSelected = selectedKeys.has(item.key);
                        return (
                          <TableRow
                            key={item.key}
                            className="border-b border-[#8b9478]/30 dark:border-slate-800 hover:bg-white/5 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <TableCell className="text-center py-2.5">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleItem(item.key)}
                                aria-label={`Select ${item.chargeTypeName} for ${item.periodLabel}`}
                                className="border-[#8b9478] data-[state=checked]:bg-white data-[state=checked]:text-[#556043] dark:border-slate-600"
                              />
                            </TableCell>

                            <TableCell className="py-2.5">
                              <div className="font-medium text-sm text-white dark:text-slate-100">
                                {item.chargeTypeName}
                              </div>
                              <div className="text-[11px] text-slate-200/80 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase font-normal border-[#8b9478]/50 text-slate-200 dark:text-slate-300">
                                  {item.frequency}
                                </Badge>
                                {item.canSyncAmount && (
                                  <span className="text-amber-300 dark:text-amber-400 font-medium">
                                    Template amount changed to {formatCurrency(item.templateFinalAmount)}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="py-2.5 text-xs text-slate-200 dark:text-slate-300">
                              <div className="space-y-0.5">
                                <div>{item.periodLabel}</div>
                                {item.academicMonth === 9 && item.chargeTypeName.toLowerCase().includes("tuition") && (
                                  <span className="inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                                    Final 9th Installment
                                  </span>
                                )}
                                {item.frequency === "QUARTERLY" && (
                                  <span className="inline-block rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-200">
                                    Term {Math.ceil(item.academicMonth / 3)}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="py-2.5 text-xs text-slate-200/80 dark:text-slate-400">
                              {item.dueDate ? formatDateOnly(item.dueDate) : "—"}
                            </TableCell>

                            <TableCell
                              className="py-2.5 text-right font-medium text-sm text-white dark:text-slate-100"
                              style={{ fontFeatureSettings: '"tnum"' }}
                            >
                              {formatCurrency(item.finalAmount)}
                            </TableCell>

                            <TableCell className="py-2.5 text-center">
                              {item.isAllowedWindow ? (
                                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/25 border-transparent">
                                  Ready
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-300/70 border-[#8b9478]/40 dark:border-slate-800">
                                  Future
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Already Generated Fees Accordion */}
            {alreadyGeneratedItems.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowGeneratedAccordion((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#8b9478]/40 bg-[#6a7459]/30 hover:bg-[#6a7459]/50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-200 transition-transform duration-200",
                        showGeneratedAccordion && "rotate-180"
                      )}
                    />
                    <span className="text-xs font-semibold text-white dark:text-slate-200">
                      Already Generated Fees
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4.5 px-2 text-emerald-300 border-emerald-400/30 bg-emerald-500/10">
                      {alreadyGeneratedItems.length} generated
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-200/80 dark:text-slate-400">
                    {showGeneratedAccordion ? "Click to collapse" : "Click to view"}
                  </span>
                </button>

                {showGeneratedAccordion && (
                  <div className="mt-2 rounded-xl border border-[#8b9478]/40 dark:border-slate-800 overflow-hidden shadow-xs">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#6a7459] hover:bg-[#6a7459] dark:bg-slate-950/80 dark:hover:bg-slate-950/80 border-none">
                          <TableHead className="text-xs font-semibold text-white dark:text-slate-200">Fee Item</TableHead>
                          <TableHead className="text-xs font-semibold text-white dark:text-slate-200">Period</TableHead>
                          <TableHead className="text-xs font-semibold text-white dark:text-slate-200">Due Date</TableHead>
                          <TableHead className="text-xs font-semibold text-right text-white dark:text-slate-200">Amount</TableHead>
                          <TableHead className="text-xs font-semibold text-right text-white dark:text-slate-200">Paid</TableHead>
                          <TableHead className="text-xs font-semibold text-center text-white dark:text-slate-200">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alreadyGeneratedItems.map((item) => (
                          <TableRow
                            key={item.key}
                            className="border-b border-[#8b9478]/30 dark:border-slate-800 bg-[#556043]/30 dark:bg-slate-900/40 hover:bg-white/5 transition-colors"
                          >
                            <TableCell className="py-2.5">
                              <div className="font-medium text-sm text-white dark:text-slate-100">{item.chargeTypeName}</div>
                              <div className="text-[11px] text-slate-200/80 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase font-normal border-[#8b9478]/50 text-slate-200 dark:text-slate-300">
                                  {item.frequency}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5 text-xs text-slate-200 dark:text-slate-300">{item.periodLabel}</TableCell>
                            <TableCell className="py-2.5 text-xs text-slate-200/80 dark:text-slate-400">
                              {item.dueDate ? formatDateOnly(item.dueDate) : "—"}
                            </TableCell>
                            <TableCell
                              className="py-2.5 text-right font-medium text-sm text-white dark:text-slate-100"
                              style={{ fontFeatureSettings: '"tnum"' }}
                            >
                              {formatCurrency(item.finalAmount)}
                            </TableCell>
                            <TableCell
                              className="py-2.5 text-right font-medium text-sm text-emerald-300 dark:text-emerald-400"
                              style={{ fontFeatureSettings: '"tnum"' }}
                            >
                              {formatCurrency(item.paidAmount)}
                            </TableCell>
                            <TableCell className="py-2.5 text-center">
                              <Badge
                                variant="outline"
                                className={
                                  item.status === "PAID"
                                    ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50"
                                    : item.status === "OVERDUE"
                                    ? "bg-rose-500/20 text-rose-200 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700/50"
                                    : "bg-sky-500/20 text-sky-200 border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700/50"
                                }
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="m-0 px-6 py-3.5 border-t border-[#8b9478]/40 dark:border-slate-800 bg-[#6a7459] dark:bg-slate-950 flex items-center justify-between sm:justify-between shrink-0">
          <div className="text-xs text-slate-200 dark:text-slate-400">
            {selectedKeys.size > 0 ? (
              <span>
                Ready to generate <strong>{selectedKeys.size}</strong> charge{selectedKeys.size > 1 ? "s" : ""} totaling{" "}
                <strong className="text-white font-semibold">{formatCurrency(selectedChargesTotal)}</strong>
              </span>
            ) : (
              <span>Select charges from the table above</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-full px-5 h-9 text-xs sm:text-sm font-medium border-[#8b9478] bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full px-5 h-9 text-xs sm:text-sm font-semibold bg-white text-[#556043] hover:bg-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              onClick={handleGenerate}
              disabled={loading || (selectedKeys.size === 0 && !syncPending) || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate {selectedKeys.size > 0 ? `${selectedKeys.size} Charges` : "Fees"}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
