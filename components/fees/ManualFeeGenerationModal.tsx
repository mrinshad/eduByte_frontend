"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
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
  type SingleStudentChargeItem,
} from "@/lib/services/studentCharges";
import { formatDateOnly } from "@/lib/utils";

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
      } catch (err: any) {
        console.error("Failed to fetch student fee generation preview:", err);
        toast.error(err?.message || "Failed to load fee generation preview");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPlan();
    return () => {
      isMounted = false;
    };
  }, [isOpen, enrollmentId]);

  const displayedItems = useMemo(() => {
    if (!plan?.items) return [];
    if (showAllMonths) return plan.items;
    // By default, show charges that are either ungenerated in the current window or already generated
    return plan.items.filter((item) => item.isAllowedWindow || item.isGenerated);
  }, [plan, showAllMonths]);

  const ungeneratedInView = useMemo(() => {
    return displayedItems.filter((i) => !i.isGenerated);
  }, [displayedItems]);

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
    } catch (err: any) {
      console.error("Failed to generate student fees:", err);
      toast.error(err?.message || "Failed to generate student fees");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[88vh] flex flex-col p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-950 dark:text-slate-100">
                  Generate Fees Manually
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate individual monthly charges, admission, and activity fees for this student.
                </DialogDescription>
              </div>
            </div>
            {plan?.student && (
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {plan.student.studentName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {plan.student.admissionNumber} • {plan.enrollment.className} - {plan.enrollment.divisionName}
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
            <Skeleton className="h-48 rounded-lg" />
          </div>
        ) : !plan ? (
          <div className="p-8 text-center text-sm text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Unable to load fee generation plan for this student.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-xs">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pending To Generate
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFeatureSettings: '"tnum"' }}>
                    {formatCurrency(selectedChargesTotal)}
                  </span>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {selectedKeys.size} selected
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-xs">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Already Generated
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-semibold text-slate-700 dark:text-slate-300" style={{ fontFeatureSettings: '"tnum"' }}>
                    {plan.summary.alreadyGeneratedCount} charges
                  </span>
                  <Badge variant="outline" className="text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40">
                    Active
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-xs">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Academic Year
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {plan.enrollment.academicYearName}
                  </span>
                  <span className="text-xs text-slate-500">
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
                  className="h-8 text-xs font-medium"
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
                  />
                  <label htmlFor="showAllMonths" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    Show full year ({plan.summary.totalChargesCount} total)
                  </label>
                </div>
              </div>

              {plan.items.some((i) => i.canSyncAmount) && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="syncPending"
                    checked={syncPending}
                    onCheckedChange={(c) => setSyncPending(Boolean(c))}
                  />
                  <label htmlFor="syncPending" className="text-xs font-medium text-amber-700 dark:text-amber-400 cursor-pointer select-none">
                    Update pending uncollected charges to match latest fee changes
                  </label>
                </div>
              )}
            </div>

            {/* Charges Table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                  <TableRow>
                    <TableHead className="w-10 text-center">
                      <span className="sr-only">Select</span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">Fee Item</TableHead>
                    <TableHead className="text-xs font-semibold">Period</TableHead>
                    <TableHead className="text-xs font-semibold">Due Date</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-sm text-slate-500">
                        No charges found for this enrollment.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedItems.map((item) => {
                      const isSelected = selectedKeys.has(item.key);
                      return (
                        <TableRow
                          key={item.key}
                          className={item.isGenerated ? "opacity-75 bg-slate-50/40 dark:bg-slate-900/20" : ""}
                        >
                          <TableCell className="text-center py-2.5">
                            {item.isGenerated ? (
                              <CheckCircle2 className="h-4 w-4 mx-auto text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleItem(item.key)}
                                aria-label={`Select ${item.chargeTypeName} for ${item.periodLabel}`}
                              />
                            )}
                          </TableCell>

                          <TableCell className="py-2.5">
                            <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {item.chargeTypeName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase font-normal">
                                {item.frequency}
                              </Badge>
                              {item.canSyncAmount && (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  Template amount changed to {formatCurrency(item.templateFinalAmount)}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-slate-700 dark:text-slate-300">
                            {item.periodLabel}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-slate-600 dark:text-slate-400">
                            {item.dueDate ? formatDateOnly(item.dueDate) : "—"}
                          </TableCell>

                          <TableCell
                            className="py-2.5 text-right font-medium text-sm text-slate-900 dark:text-slate-100"
                            style={{ fontFeatureSettings: '"tnum"' }}
                          >
                            {formatCurrency(item.finalAmount)}
                          </TableCell>

                          <TableCell className="py-2.5 text-center">
                            {item.isGenerated ? (
                              <Badge
                                variant="outline"
                                className={
                                  item.status === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40"
                                    : item.status === "OVERDUE"
                                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40"
                                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40"
                                }
                              >
                                {item.status}
                              </Badge>
                            ) : item.isAllowedWindow ? (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Ready
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-400 border-slate-200 dark:border-slate-800">
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
        )}

        <DialogFooter className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-slate-500">
            {selectedKeys.size > 0 ? (
              <span>
                Ready to generate <strong>{selectedKeys.size}</strong> charge{selectedKeys.size > 1 ? "s" : ""} totaling{" "}
                <strong className="text-slate-900 dark:text-white">{formatCurrency(selectedChargesTotal)}</strong>
              </span>
            ) : (
              <span>Select charges from the table above</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
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
