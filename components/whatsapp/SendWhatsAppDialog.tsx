"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  AlertTriangle,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  History,
} from "lucide-react";
import {
  sendIndividualWhatsAppMessage,
  getWhatsAppLogs,
  type WhatsAppMessageLogItem,
  type WhatsAppConfigStatus,
  getWhatsAppStatus,
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
  const [isManualNumber, setIsManualNumber] = useState(false);
  const [mode, setMode] = useState<"TEMPLATE" | "TEXT">("TEMPLATE");
  const [customMessage, setCustomMessage] = useState("");
  const [templateName, setTemplateName] = useState("fee_reminder_monthly");
  const [isSending, setIsSending] = useState(false);
  const [recentLogs, setRecentLogs] = useState<WhatsAppMessageLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [configStatus, setConfigStatus] = useState<WhatsAppConfigStatus | null>(null);

  // Initialize form when student prop changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      const defaultPhone = student?.whatsappNumber?.trim() || "";
      queueMicrotask(() => {
        setRecipientPhone(defaultPhone);
        setIsManualNumber(!defaultPhone);
        setCustomMessage("");
      });
      loadStatusAndLogs(defaultPhone);
    }
  }, [isOpen, student]);

  async function loadStatusAndLogs(phone: string) {
    try {
      const status = await getWhatsAppStatus();
      setConfigStatus(status);

      if (phone) {
        setIsLoadingLogs(true);
        const res = await getWhatsAppLogs({ phone, limit: 5 });
        setRecentLogs(res.logs || []);
      }
    } catch {
      // Non-fatal
    } finally {
      setIsLoadingLogs(false);
    }
  }

  const handlePhoneBlur = () => {
    if (recipientPhone.trim()) {
      loadStatusAndLogs(recipientPhone.trim());
    }
  };

  const formattedDueAmount = student?.totalDue
    ? `₹${student.totalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    : "₹0.00";

  async function handleSend() {
    if (!recipientPhone.trim()) {
      toast.error("Please enter a valid recipient phone number.");
      return;
    }

    if (mode === "TEXT" && !customMessage.trim()) {
      toast.error("Please enter message text.");
      return;
    }

    setIsSending(true);

    try {
      const payload = {
        studentId: student?.studentId,
        recipientPhone: recipientPhone.trim(),
        mode,
        message: mode === "TEXT" ? customMessage.trim() : undefined,
        templateName: mode === "TEMPLATE" ? templateName : undefined,
        languageCode: "en",
        parameters:
          mode === "TEMPLATE"
            ? [
                student?.studentName || "Student",
                "Current Due Notice",
                formattedDueAmount,
                "₹0.00",
                "₹0.00",
                formattedDueAmount,
                new Date().toLocaleDateString("en-IN"),
              ]
            : undefined,
      };

      const result = await sendIndividualWhatsAppMessage(payload);

      if (result.status === "SENT") {
        toast.success(
          `WhatsApp message sent successfully to ${result.recipientPhone}!`
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error("Message could not be sent.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      if (message.includes("24-hour") || message.includes("131047")) {
        toast.error(
          "24-Hour Policy Window Expired: Recipient has not messaged this business within 24 hours. Please select an Approved Template."
        );
      } else if (message.includes("timed out") || message.includes("uncertain")) {
        toast.warning(
          "Request timed out. Delivery status is uncertain. Check message history before retrying."
        );
      } else {
        toast.error(message);
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Send WhatsApp Message
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Send an approved notice template or direct text to a verified contact
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {configStatus && !configStatus.isEnabled && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 rounded-md text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              WhatsApp integration is currently <strong>disabled</strong> in settings. Outbound calls will be blocked.
            </span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Linked Student Summary Banner (if opened for a student) */}
          {student && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  {student.studentName || "Student"}
                </span>
                <Badge variant="outline" className="text-xs">
                  {student.admissionNumber || "N/A"}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Class: {student.className || "Standard"}</span>
                {student.totalDue !== undefined && (
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    Total Due: {formattedDueAmount}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recipient Phone Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Recipient Phone Number (with Country Code)</span>
              {student && (
                <button
                  type="button"
                  onClick={() => setIsManualNumber(!isManualNumber)}
                  className="text-emerald-600 hover:underline dark:text-emerald-400 text-xs"
                >
                  {isManualNumber ? "Reset to registered number" : "Use custom number"}
                </button>
              )}
            </label>
            <Input
              type="text"
              placeholder="e.g. 9876543210 or +971501234567"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              onBlur={handlePhoneBlur}
              disabled={Boolean(student && !isManualNumber && student.whatsappNumber)}
              className="text-sm font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Standard 10-digit Indian numbers are interpreted as +91. International numbers must include country code (+...).
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Message Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("TEMPLATE")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  mode === "TEMPLATE"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Approved Template (Recommended)
              </button>

              <button
                type="button"
                onClick={() => setMode("TEXT")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  mode === "TEXT"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Custom Text Message
              </button>
            </div>
          </div>

          {/* Template Selection & Preview */}
          {mode === "TEMPLATE" && (
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Select Template
                </label>
                <select
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="fee_reminder_monthly">Monthly Fee Notice Template</option>
                  <option value="fee_reminder_quarterly">Quarterly Fee Notice Template</option>
                </select>
              </div>

              {/* Live Preview Card */}
              <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between border-b pb-1">
                  <span>Fee Notice</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Approved
                  </Badge>
                </div>
                <p>Dear Parent,</p>
                <p>
                  This is a reminder regarding the school fee for{" "}
                  <strong>{student?.studentName || "Student"}</strong>.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-[11px] space-y-0.5 font-mono">
                  <div>Current Fees: {formattedDueAmount}</div>
                  <div>Total Payable: {formattedDueAmount}</div>
                  <div>Due Date: {new Date().toLocaleDateString("en-IN")}</div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Footer: KidsCove School Management System
                </p>
              </div>
            </div>
          )}

          {/* Custom Text Mode & 24-Hour Policy Warning */}
          {mode === "TEXT" && (
            <div className="space-y-2">
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 rounded-md text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Meta 24-Hour Customer Window Rule</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Free-form text can only be delivered if the recipient messaged this business number within the last 24 hours. For uninitiated reminders, select an <strong>Approved Template</strong>.
                </p>
              </div>

              <textarea
                rows={4}
                placeholder="Type your message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-2.5 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Recent Delivery History to this Contact */}
          {(isLoadingLogs || recentLogs.length > 0) && (
            <div className="space-y-1.5 border-t pt-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Recent Messages Sent to {recipientPhone}
                </span>
                {isLoadingLogs && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-1.5 bg-slate-50 dark:bg-slate-900 border rounded flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {log.status === "SENT" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : log.status === "UNCERTAIN" ? (
                        <HelpCircle className="w-3 h-3 text-amber-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-500" />
                      )}
                      <span className="truncate">{log.content || log.templateName || "Message"}</span>
                    </div>
                    <span className="text-slate-400 text-[10px] shrink-0">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isSending || !recipientPhone.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send WhatsApp Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
