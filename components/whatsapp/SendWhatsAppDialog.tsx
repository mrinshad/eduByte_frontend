"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import {
  sendIndividualWhatsAppMessage,
  type SendIndividualMessagePayload,
} from "@/lib/services/whatsapp";

export interface StudentContextData {
  studentId?: string;
  admissionNumber?: string;
  studentName?: string;
  className?: string;
  whatsappNumber?: string;
  totalDue?: number;
  agingBracket?: string;
}

interface SendWhatsAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentContextData | null;
  onSuccess?: () => void;
}

export function SendWhatsAppDialog({
  isOpen,
  onClose,
  student,
  onSuccess,
}: SendWhatsAppDialogProps) {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [mode, setMode] = useState<"TEMPLATE" | "TEXT">("TEMPLATE");
  const [templateName, setTemplateName] = useState("fee_payment_monthly");
  const [customText, setCustomText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const phone = student?.whatsappNumber?.trim() || "";
      queueMicrotask(() => {
        setRecipientPhone(phone);
        setCustomText("");
        setMode("TEMPLATE");
        setTemplateName("fee_payment_monthly");
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

    if (mode === "TEXT" && !customText.trim()) {
      toast.error("Please enter message text.");
      return;
    }

    setIsSending(true);

    try {
      const payload: SendIndividualMessagePayload = {
        studentId: student?.studentId,
        recipientPhone: recipientPhone.trim(),
        mode,
        message: mode === "TEXT" ? customText.trim() : undefined,
        templateName: mode === "TEMPLATE" ? templateName : undefined,
        languageCode:
          mode === "TEMPLATE"
            ? templateName === "fee_payment_quarterly"
              ? "en"
              : "en_US"
            : undefined,
        parameters:
          mode === "TEMPLATE"
            ? templateName === "hello_world"
              ? []
              : [
                student?.studentName || "Student",
                templateName === "fee_payment_quarterly"
                  ? "Third Quarter"
                  : `month of ${new Date().toLocaleString("en-US", { month: "long" })} ${new Date().getFullYear()}`,
                formattedDue.replace("₹", "Rs. "),
                "Rs. 0",
                "None",
                formattedDue.replace("₹", "Rs. "),
                `${new Date().getDate()}th ${new Date().toLocaleString("en-US", { month: "long" })} ${new Date().getFullYear()}`,
              ]
            : undefined,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Send WhatsApp Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Compact Student Summary */}
          {student && (
            <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {student.studentName}
                </span>
                {student.className && <span> · {student.className}</span>}
              </div>
              <div className="font-medium text-rose-600 dark:text-rose-400">
                Due: {formattedDue}
              </div>
            </div>
          )}

          {/* Recipient Phone */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Phone Number
            </label>
            <Input
              type="text"
              placeholder="e.g. 9999999999"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="text-sm font-mono h-9"
            />
          </div>

          {/* Message Template / Custom Text selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Message Template
            </label>
            <select
              value={mode === "TEXT" ? "custom_text" : templateName}
              onChange={(e) => {
                if (e.target.value === "custom_text") {
                  setMode("TEXT");
                } else {
                  setMode("TEMPLATE");
                  setTemplateName(e.target.value);
                }
              }}
              className="w-full h-9 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="fee_payment_monthly">Monthly Fee Notice (Standard)</option>
              <option value="fee_payment_quarterly">Quarterly Fee Notice</option>
              <option value="custom_text">Custom Text Message (24h Window)</option>
            </select>
          </div>

          {/* Minimal Content Preview or Textarea */}
          {mode === "TEXT" ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Message Content
              </label>
              <Textarea
                rows={3}
                placeholder="Type your message here..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Custom text requires the recipient to have messaged within 24 hours.
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-900/60 p-2.5 rounded border border-slate-100 dark:border-slate-800 space-y-0.5">
              <div className="text-slate-700 dark:text-slate-300 font-medium">
                Official Fee Notice
              </div>
              <div className="text-[11px]">
                Will send {formattedDue} outstanding notice for {student?.studentName || "student"} with breakdown and school contact details.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t gap-2 sm:gap-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSending}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isSending || !recipientPhone.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
