"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  sendIndividualWhatsAppMessage,
  type SendIndividualMessagePayload,
} from "@/lib/services/whatsapp";
import type { FeeReminderDetails } from "@/lib/services/advancedReports";

export interface StudentContextData {
  studentId: string;
  enrollmentId?: string;
  studentName: string;
  admissionNumber?: string;
  className?: string;
  whatsappNumber?: string;
  totalDue?: number;
  agingBracket?: string;
  charges?: any[];
  fines?: any[];
  reminderDetails?: FeeReminderDetails;
}

interface SendWhatsAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentContextData | null;
  onSuccess?: () => void;
}

export function SendWhatsAppDialog({
  isOpen,
  onClose,
  student,
  onSuccess,
}: SendWhatsAppDialogProps) {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const phone = student?.whatsappNumber?.trim() || "";
      queueMicrotask(() => {
        setRecipientPhone(phone);
      });
    }
  }, [isOpen, student]);

  const formattedDue =
    student?.totalDue !== undefined
      ? `₹${Number(student.totalDue).toLocaleString("en-IN")}`
      : "₹0";

  async function handleSend() {
    if (!recipientPhone.trim()) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setIsSending(true);

    try {
      const reminder = student?.reminderDetails;
      const templateName = reminder?.templateName || "fee_payment_monthly";
      const fallbackDueDate = `${new Date().getDate()}th ${new Date().toLocaleString("en-US", { month: "long" })} ${new Date().getFullYear()}`;
      const fallbackPeriod = `${new Date().toLocaleString("en-US", { month: "long" })} ${new Date().getFullYear()}`;

      const templateParams = templateName === "fee_payment_quarterly"
        ? (reminder && reminder.templateName === "fee_payment_quarterly" && reminder.parameters?.length === 7)
          ? reminder.parameters
          : [
              student?.studentName || "Student",
              reminder?.periodDescription || "Third Quarter",
              reminder?.currentFeesText || formattedDue.replace("₹", "Rs. "),
              reminder?.previousDuesText || "Rs. 0",
              reminder?.finesText || "None",
              reminder?.totalPayableText || formattedDue.replace("₹", "Rs. "),
              reminder?.dueDateText || fallbackDueDate,
            ]
        : (reminder && reminder.parameters && reminder.parameters.length === 7 && reminder.templateName !== "fee_payment_quarterly")
          ? reminder.parameters
          : [
              student?.studentName || "Student",
              reminder?.periodDescription || fallbackPeriod,
              reminder?.currentFeesText || formattedDue.replace("₹", "Rs. "),
              reminder?.previousDuesText || "Rs. 0",
              reminder?.finesText || "None",
              reminder?.totalPayableText || formattedDue.replace("₹", "Rs. "),
              reminder?.dueDateText || fallbackDueDate,
            ];

      const payload: SendIndividualMessagePayload = {
        studentId: student?.studentId,
        recipientPhone: recipientPhone.trim(),
        mode: "TEMPLATE",
        templateName,
        languageCode: templateName === "fee_payment_quarterly" ? "en" : "en_US",
        parameters: templateParams,
      };

      const result = await sendIndividualWhatsAppMessage(payload);

      if (result.status === "SENT") {
        toast.success(`WhatsApp sent to ${result.recipientPhone}`);
        onSuccess?.();
        onClose();
      } else if (result.status === "UNCERTAIN") {
        toast.warning("Delivery timed out. Please verify before retrying.");
      } else {
        toast.error("Failed to send WhatsApp message.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-[95vw] p-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl overflow-hidden [&>button:last-child]:text-slate-400 hover:[&>button:last-child]:text-slate-700 dark:hover:[&>button:last-child]:text-slate-200 [&>button:last-child]:top-4 [&>button:last-child]:right-4">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#556043]/10 text-[#556043] dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base font-semibold text-slate-950 dark:text-white">
            Send WhatsApp Reminder
          </DialogTitle>
        </div>

        <div className="p-5 space-y-4">
          {/* Student Info */}
          {student && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3">
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                  {student.studentName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {student.admissionNumber && <span>Adm: {student.admissionNumber}</span>}
                  {student.admissionNumber && student.className && <span> • </span>}
                  {student.className && <span>{student.className}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Total Due
                </div>
                <div className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                  {formattedDue}
                </div>
              </div>
            </div>
          )}

          {/* Recipient Phone with Edit Option */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              WhatsApp Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="e.g. 919876543210"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="h-10 pl-9 font-mono text-sm rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSending}
            className="h-9 px-3.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSend}
            disabled={isSending || !recipientPhone.trim()}
            className="h-9 px-4 text-xs font-semibold bg-[#556043] hover:bg-[#465037] text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send Reminder
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
