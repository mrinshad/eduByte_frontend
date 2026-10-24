"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, MessageSquare, Phone, CheckCircle2 } from "lucide-react";
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
      <DialogContent className="sm:max-w-md w-[95vw] p-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl overflow-hidden [&>button:last-child]:text-slate-400 hover:[&>button:last-child]:text-slate-700 dark:hover:[&>button:last-child]:text-slate-200 [&>button:last-child]:top-4 [&>button:last-child]:right-4">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#556043]/10 text-[#556043] dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0 mt-0.5">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-slate-950 dark:text-white">
              Send WhatsApp Reminder
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send an official fee reminder or custom message directly to parent WhatsApp.
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Compact Student Summary */}
          {student && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3">
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs sm:text-sm">
                  {student.studentName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
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

          {/* Recipient Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Phone Number</span>
              <span className="text-[11px] font-normal text-slate-400">e.g. 919876543210</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="e.g. 919876543210"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="h-10 pl-9 font-mono text-xs sm:text-sm rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20"
              />
            </div>
          </div>

          {/* Message Template / Custom Text selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Message Template
            </label>
            <Select
              value={mode === "TEXT" ? "custom_text" : templateName}
              onValueChange={(val) => {
                if (val === "custom_text") {
                  setMode("TEXT");
                } else {
                  setMode("TEMPLATE");
                  setTemplateName(val);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#556043]/20 focus:border-[#556043]">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent className=" dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-lg">
                <SelectItem value="fee_payment_monthly">Monthly Fee Notice (Standard)</SelectItem>
                <SelectItem value="fee_payment_quarterly">Quarterly Fee Notice</SelectItem>
                <SelectItem value="custom_text">Custom Text Message (24h Window)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Minimal Content Preview or Textarea */}
          {mode === "TEXT" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message Content
              </label>
              <Textarea
                rows={3}
                placeholder="Type your message here..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs sm:text-sm focus-visible:border-[#556043] focus-visible:ring-2 focus-visible:ring-[#556043]/20 resize-none"
              />
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Custom text requires the recipient to have messaged within 24 hours.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-1 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Official Fee Notice
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Will send {formattedDue} outstanding notice for <strong>{student?.studentName || "student"}</strong> with breakdown and school contact details.
              </div>
            </div>
          )}
        </div>

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
                Send WhatsApp
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
