"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Layers,
  Check,
} from "lucide-react";
import {
  getFeeRemindersSummary,
  dispatchFeeRemindersBatch,
  markFeeRemindersAsSent,
  type FeeRemindersSummary,
} from "@/lib/services/whatsapp";

export interface StagingSummaryReport {
  remindersStaged: number;
  remindersSkipped: number;
  monthlyTemplateCount: number;
  quarterlyTemplateCount: number;
  skippedRecipients?: Array<{
    enrollmentId?: string;
    studentId?: string;
    studentName?: string;
    phone?: string;
    reason: string;
  }>;
  billingPeriod?: {
    month: number;
    year: number;
  };
}

export interface FeeReminderDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYearId: string;
  academicYearName?: string;
  periodMonth: number;
  periodYear: number;
  initialStagingReport?: StagingSummaryReport | null;
  onDispatchComplete?: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function FeeReminderDispatchModal({
  isOpen,
  onClose,
  academicYearId,
  academicYearName,
  periodMonth,
  periodYear,
  initialStagingReport,
  onDispatchComplete,
}: FeeReminderDispatchModalProps) {
  const [summary, setSummary] = useState<FeeRemindersSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isMarkingSent, setIsMarkingSent] = useState<boolean>(false);

  const periodLabel = `${MONTH_NAMES[periodMonth - 1] || `Month ${periodMonth}`} ${periodYear}`;

  const loadSummary = useCallback(async () => {
    if (!academicYearId || !periodMonth || !periodYear) return;
    try {
      setLoadingSummary(true);
      const data = await getFeeRemindersSummary({
        academicYearId,
        periodMonth,
        periodYear,
      });
      setSummary(data);
    } catch (err: unknown) {
      console.warn("Could not load fee reminders summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  }, [academicYearId, periodMonth, periodYear]);

  useEffect(() => {
    if (isOpen) {
      void loadSummary();
    }
  }, [isOpen, loadSummary]);

  const stagedCount =
    summary?.staged ?? initialStagingReport?.remindersStaged ?? 0;
  const sentCount = summary?.sent ?? 0;
  const skippedCount = initialStagingReport?.remindersSkipped ?? 0;
  const monthlyCount = initialStagingReport?.monthlyTemplateCount ?? 0;
  const quarterlyCount = initialStagingReport?.quarterlyTemplateCount ?? 0;
  const alreadySent = stagedCount === 0 && sentCount > 0;

  const handleMarkAsSent = async () => {
    try {
      setIsMarkingSent(true);
      const res = await markFeeRemindersAsSent({
        academicYearId,
        periodMonth,
        periodYear,
      });

      toast.success(
        `Marked ${res.markedCount} reminder${res.markedCount !== 1 ? "s" : ""} as sent (messages were not dispatched).`
      );

      if (onDispatchComplete) {
        onDispatchComplete();
      }
      onClose();
    } catch (err: unknown) {
      toast.error(
        (err as Error).message || "An error occurred while marking reminders as sent."
      );
    } finally {
      setIsMarkingSent(false);
    }
  };

  const handleStartDispatch = async () => {
    if (stagedCount === 0) {
      toast.info("No staged reminders are pending to be sent for this period.");
      return;
    }

    try {
      setIsDispatching(true);
      let remaining = stagedCount;
      let totalSent = 0;
      let iteration = 0;

      while (remaining > 0 && iteration < 10) {
        iteration++;
        const res = await dispatchFeeRemindersBatch({
          academicYearId,
          periodMonth,
          periodYear,
          batchSize: 50,
          delayMs: 250,
        });

        totalSent += res.sentCount;
        remaining = res.remainingStaged;

        if (res.processed === 0 || res.remainingStaged === 0) {
          break;
        }
      }

      if (totalSent > 0) {
        toast.success(
          `Dispatched ${totalSent} WhatsApp fee reminder${totalSent > 1 ? "s" : ""} successfully!`
        );
      } else {
        toast.info("Reminder dispatch completed.");
      }

      if (onDispatchComplete) {
        onDispatchComplete();
      }
      onClose();
    } catch (err: unknown) {
      toast.error(
        (err as Error).message || "An error occurred during WhatsApp reminder dispatch."
      );
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDispatching) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg w-[95vw] p-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl overflow-hidden [&>button:last-child]:text-slate-500 hover:[&>button:last-child]:text-slate-800 dark:hover:[&>button:last-child]:text-white">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#556043]/10 text-[#556043] dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0 mt-0.5">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-slate-950 dark:text-white">
              Send WhatsApp Fee Reminders
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Billing Period: {periodLabel} {academicYearName ? `• ${academicYearName}` : ""}
            </DialogDescription>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {loadingSummary && !summary ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin text-[#556043] dark:text-emerald-400" />
              <p className="text-xs text-slate-500">Checking reminder status...</p>
            </div>
          ) : alreadySent ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Reminders Already Sent
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                All <strong>{sentCount}</strong> fee reminders for <strong>{periodLabel}</strong> have already been sent to registered student numbers. No duplicate reminders will be sent.
              </p>
            </div>
          ) : stagedCount === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                <AlertCircle className="h-4 w-4 text-slate-500" />
                No Staged Reminders
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                There are no staged fee reminders waiting to be dispatched for {periodLabel}. Generate fee charges first to stage reminders for this period.
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to send WhatsApp fee reminders for <strong>{periodLabel}</strong>?
                Messages will be sent directly to registered parent numbers via the official Meta WhatsApp Cloud API.
              </p>

              {/* Summary Card */}
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Billing Period
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {periodLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" /> Eligible Students
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {stagedCount} recipient{stagedCount > 1 ? "s" : ""}
                  </span>
                </div>

                {(monthlyCount > 0 || quarterlyCount > 0) && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-400" /> Templates
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {monthlyCount > 0 ? `${monthlyCount} Monthly` : ""}
                      {monthlyCount > 0 && quarterlyCount > 0 ? " • " : ""}
                      {quarterlyCount > 0 ? `${quarterlyCount} Quarterly` : ""}
                    </span>
                  </div>
                )}

                {skippedCount > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-slate-700/60 text-[11px] text-amber-700 dark:text-amber-400">
                    <span>Skipped (missing WhatsApp number):</span>
                    <span className="font-semibold">{skippedCount}</span>
                  </div>
                )}
              </div>

              {/* Informational notice */}
              <div className="flex items-center gap-2 text-[11px] text-[#556043] dark:text-emerald-400 bg-[#556043]/10 dark:bg-emerald-950/40 p-2.5 rounded-lg font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Reminders are sent once and button will be locked after send.</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isDispatching || isMarkingSent}
            className="h-9 px-3.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            {alreadySent ? "Close" : "Cancel"}
          </Button>

          {!alreadySent && stagedCount > 0 && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleMarkAsSent}
                disabled={isDispatching || isMarkingSent || stagedCount === 0}
                className="h-9 px-3.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-400 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                title="Mark reminders as sent without dispatching external WhatsApp messages"
              >
                {isMarkingSent ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700 dark:text-emerald-300" />
                    Marking as Sent...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                    Mark as Sent (Skip Send)
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleStartDispatch}
                disabled={isDispatching || isMarkingSent || stagedCount === 0}
                className="h-9 px-4 text-xs font-semibold bg-[#556043] hover:bg-[#465037] text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    Sending Reminders...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 text-white" />
                    Confirm & Send Reminders
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
