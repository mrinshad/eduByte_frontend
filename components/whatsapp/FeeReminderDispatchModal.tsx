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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  PhoneOff,
  Layers,
} from "lucide-react";
import {
  getFeeRemindersSummary,
  dispatchFeeRemindersBatch,
  retryFailedFeeReminders,
  resolveUncertainFeeReminder,
  type FeeRemindersSummary,
  getWhatsAppLogs,
  type WhatsAppMessageLogItem,
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

interface FeeReminderDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYearId: string;
  academicYearName?: string;
  periodMonth: number;
  periodYear: number;
  initialStagingReport?: StagingSummaryReport | null;
  onDispatchComplete?: () => void;
}

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
  const [confirmSend, setConfirmSend] = useState<boolean>(false);
  const [dispatchProgress, setDispatchProgress] = useState<{
    sent: number;
    failed: number;
    uncertain: number;
    remaining: number;
  } | null>(null);

  const [uncertainLogs, setUncertainLogs] = useState<WhatsAppMessageLogItem[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [retryingFailed, setRetryingFailed] = useState<boolean>(false);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const periodLabel = `${monthNames[periodMonth - 1] || `Month ${periodMonth}`} ${periodYear}`;

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

      if (data.uncertain > 0) {
        const logData = await getWhatsAppLogs({
          messageType: "FEE_REMINDER",
          status: "UNCERTAIN",
          limit: 10,
        });
        setUncertainLogs(logData.logs);
      } else {
        setUncertainLogs([]);
      }
    } catch (err: unknown) {
      console.error("Failed to load fee reminders summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  }, [academicYearId, periodMonth, periodYear]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setConfirmSend(false);
        setDispatchProgress(null);
        void loadSummary();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loadSummary]);

  const handleStartDispatch = async () => {
    setIsDispatching(true);
    setConfirmSend(false);

    let totalSent = 0;
    let totalFailed = 0;
    let totalUncertain = 0;

    try {
      let hasMore = true;
      while (hasMore) {
        const batchResult = await dispatchFeeRemindersBatch({
          academicYearId,
          periodMonth,
          periodYear,
          batchSize: 10,
          delayMs: 250,
        });

        totalSent += batchResult.sentCount;
        totalFailed += batchResult.failedCount;
        totalUncertain += batchResult.uncertainCount;

        setDispatchProgress({
          sent: totalSent,
          failed: totalFailed,
          uncertain: totalUncertain,
          remaining: batchResult.remainingStaged,
        });

        if (batchResult.processed === 0 || batchResult.remainingStaged === 0) {
          hasMore = false;
        }
      }

      toast.success(`Dispatched ${totalSent} reminders successfully.`);
      await loadSummary();
      if (onDispatchComplete) onDispatchComplete();
    } catch (err: unknown) {
      toast.error((err as Error).message || "An error occurred during reminder dispatch.");
      await loadSummary();
    } finally {
      setIsDispatching(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setRetryingFailed(true);
      const res = await retryFailedFeeReminders({
        academicYearId,
        periodMonth,
        periodYear,
      });
      toast.success(`Requeued ${res.requeuedCount} failed reminders back to STAGED.`);
      await loadSummary();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to requeue reminders");
    } finally {
      setRetryingFailed(false);
    }
  };

  const handleResolveUncertain = async (
    logId: string,
    action: "MARK_SENT" | "MARK_FAILED" | "REQUEUE"
  ) => {
    try {
      setResolvingId(logId);
      await resolveUncertainFeeReminder({
        logId,
        action,
        note: `Staff manual resolution in dispatch modal`,
      });
      toast.success(`Message marked as ${action === "REQUEUE" ? "STAGED" : action.replace("MARK_", "")}`);
      await loadSummary();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to resolve uncertain message");
    } finally {
      setResolvingId(null);
    }
  };

  const stagedCount = summary?.staged ?? initialStagingReport?.remindersStaged ?? 0;
  const skippedList = initialStagingReport?.skippedRecipients || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDispatching && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto font-sans p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Staff Review: WhatsApp Fee Reminders
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Billing Period: {periodLabel} {academicYearName ? `• ${academicYearName}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingSummary && !summary ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs text-slate-500">Loading current reminder tracking status...</p>
          </div>
        ) : (
          <div className="space-y-5 my-2">
            {/* Status Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Staged (Ready)</span>
                  <Layers className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {summary?.staged ?? stagedCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Awaiting staff send</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Sent</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {summary?.sent ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Accepted by Meta</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Failed</span>
                  <XCircle className="h-4 w-4 text-rose-500" />
                </div>
                <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {summary?.failed ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Delivery rejected</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Uncertain</span>
                  <HelpCircle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {summary?.uncertain ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Network timeout</div>
              </div>
            </div>

            {/* Template Breakdown & Staging Notice */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Template Routing:
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Badge variant="outline" className="font-semibold text-slate-700 dark:text-slate-300">
                    Monthly: {initialStagingReport?.monthlyTemplateCount ?? 0}
                  </Badge>
                  <Badge variant="outline" className="font-semibold text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                    Quarterly: {initialStagingReport?.quarterlyTemplateCount ?? 0}
                  </Badge>
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                {initialStagingReport?.remindersSkipped ?? 0} recipients skipped
              </div>
            </div>

            {/* Dispatching in progress indicator */}
            {isDispatching && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    Dispatching WhatsApp reminders in bounded chunks...
                  </div>
                  {dispatchProgress && (
                    <span className="text-xs font-mono font-medium text-blue-700 dark:text-blue-300">
                      Remaining: {dispatchProgress.remaining}
                    </span>
                  )}
                </div>
                {dispatchProgress && (
                  <div className="text-xs text-blue-800 dark:text-blue-200 flex gap-4 pt-1 font-mono">
                    <span>Sent: {dispatchProgress.sent}</span>
                    <span>Failed: {dispatchProgress.failed}</span>
                    <span>Uncertain: {dispatchProgress.uncertain}</span>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Banner */}
            {confirmSend && (
              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Confirm Live WhatsApp Dispatch
                    </h4>
                    <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1 leading-relaxed">
                      This action will send real WhatsApp template messages to{" "}
                      <strong>{summary?.staged ?? stagedCount}</strong> registered student numbers
                      via the official Meta WhatsApp Cloud API. Messages cannot be recalled once sent.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmSend(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleStartDispatch}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                  >
                    Yes, Send Reminders Now
                  </Button>
                </div>
              </div>
            )}

            {/* Skipped Recipients List */}
            {skippedList.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-slate-100/70 dark:bg-slate-800/50 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <PhoneOff className="h-3.5 w-3.5 text-slate-500" /> Skipped Recipients ({skippedList.length})
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Never falls back to parent numbers
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto text-xs">
                  {skippedList.map((st, i) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {st.studentName || "Student"}
                        </span>
                        {st.phone && (
                          <span className="text-slate-400 font-mono text-[11px] ml-2">
                            ({st.phone})
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[11px] text-slate-500 border-slate-200">
                        {st.reason}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uncertain Messages Resolution Panel */}
            {uncertainLogs.length > 0 && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800 overflow-hidden">
                <div className="bg-amber-100/70 dark:bg-amber-950/60 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                    Uncertain Messages Requiring Review ({uncertainLogs.length})
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-normal">
                    Never auto-resent to prevent duplicates
                  </span>
                </div>
                <div className="divide-y divide-amber-100 dark:divide-amber-900 max-h-48 overflow-y-auto text-xs bg-amber-50/30 dark:bg-amber-950/20">
                  {uncertainLogs.map((log) => (
                    <div key={log.id} className="p-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {log.recipientName || log.recipientPhone}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {log.recipientPhone} • {log.errorMessage || "HTTP timeout"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resolvingId === log.id}
                          onClick={() => handleResolveUncertain(log.id, "MARK_SENT")}
                          className="h-6 px-2 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          Mark Sent
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resolvingId === log.id}
                          onClick={() => handleResolveUncertain(log.id, "REQUEUE")}
                          className="h-6 px-2 text-[11px] border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          Requeue
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resolvingId === log.id}
                          onClick={() => handleResolveUncertain(log.id, "MARK_FAILED")}
                          className="h-6 px-2 text-[11px] border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                          Mark Failed
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {summary && summary.failed > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={retryingFailed || isDispatching}
                onClick={handleRetryFailed}
                className="h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1.5"
              >
                {retryingFailed ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Retry Failed ({summary.failed})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDispatching}
              onClick={onClose}
              className="h-8 text-xs"
            >
              Close
            </Button>
            {!confirmSend && stagedCount > 0 && (
              <Button
                size="sm"
                disabled={isDispatching}
                onClick={() => setConfirmSend(true)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs inline-flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Send {stagedCount} Reminders
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
