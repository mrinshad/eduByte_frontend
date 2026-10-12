import { apiFetch } from "@/lib/api";

export interface WhatsAppConfigStatus {
  isEnabled: boolean;
  defaultCountryCode: string;
  graphApiVersion: string;
  hasPhoneNumberId: boolean;
  hasApiToken: boolean;
  hasBusinessAccountId: boolean;
  monthlyTemplateConfigured: boolean;
  quarterlyTemplateConfigured: boolean;
}

export interface SendIndividualMessagePayload {
  studentId?: string;
  recipientPhone: string;
  mode: "TEMPLATE" | "TEXT";
  message?: string;
  templateName?: string;
  languageCode?: string;
  parameters?: string[];
}

export interface SendIndividualMessageResult {
  logId: string;
  status: "SENT" | "FAILED" | "UNCERTAIN";
  providerMessageId?: string;
  recipientPhone: string;
  recipientName?: string | null;
}

export interface WhatsAppMessageLogItem {
  id: string;
  studentId?: string | null;
  enrollmentId?: string | null;
  recipientPhone: string;
  recipientName?: string | null;
  messageType: "INDIVIDUAL" | "FEE_REMINDER";
  templateName?: string | null;
  content?: string | null;
  providerMessageId?: string | null;
  status: "STAGED" | "PROCESSING" | "SENT" | "FAILED" | "UNCERTAIN";
  errorMessage?: string | null;
  dispatchAttempts: number;
  retryCount: number;
  periodMonth?: number | null;
  periodYear?: number | null;
  createdAt: string;
  sentBy?: {
    id: string;
    name: string;
    username: string;
  } | null;
}

export interface WhatsAppLogsResponse {
  logs: WhatsAppMessageLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function getWhatsAppStatus(): Promise<WhatsAppConfigStatus | null> {
  try {
    const res = (await apiFetch("/api/whatsapp/status")) as ApiSuccess<WhatsAppConfigStatus>;
    return res.data;
  } catch (err) {
    console.warn("Could not fetch WhatsApp status:", err);
    return null;
  }
}

export async function sendIndividualWhatsAppMessage(
  payload: SendIndividualMessagePayload
): Promise<SendIndividualMessageResult> {
  const res = (await apiFetch("/api/whatsapp/individual", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as ApiSuccess<SendIndividualMessageResult>;

  return res.data;
}

export async function getWhatsAppLogs(params?: {
  phone?: string;
  studentId?: string;
  messageType?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<WhatsAppLogsResponse> {
  const query = new URLSearchParams();
  if (params?.phone) query.set("phone", params.phone);
  if (params?.studentId) query.set("studentId", params.studentId);
  if (params?.messageType) query.set("messageType", params.messageType);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = (await apiFetch(
    `/api/whatsapp/logs${query.toString() ? `?${query.toString()}` : ""}`
  )) as ApiSuccess<WhatsAppLogsResponse>;

  return res.data;
}

export interface FeeRemindersSummary {
  total: number;
  staged: number;
  processing: number;
  sent: number;
  failed: number;
  uncertain: number;
}

export interface DispatchFeeRemindersResult {
  processed: number;
  sentCount: number;
  failedCount: number;
  uncertainCount: number;
  remainingStaged: number;
  results: Array<{
    id: string;
    phone: string;
    status: "SENT" | "FAILED" | "UNCERTAIN";
    messageId?: string;
    error?: string;
  }>;
}

export async function getFeeRemindersSummary(params: {
  academicYearId?: string;
  periodMonth?: number;
  periodYear?: number;
}): Promise<FeeRemindersSummary> {
  const query = new URLSearchParams();
  if (params.academicYearId) query.set("academicYearId", params.academicYearId);
  if (params.periodMonth) query.set("periodMonth", String(params.periodMonth));
  if (params.periodYear) query.set("periodYear", String(params.periodYear));

  const res = (await apiFetch(
    `/api/whatsapp/fee-reminders/summary${query.toString() ? `?${query.toString()}` : ""}`
  )) as ApiSuccess<FeeRemindersSummary>;
  return res.data;
}

export async function dispatchFeeRemindersBatch(params: {
  academicYearId: string;
  periodMonth: number;
  periodYear: number;
  batchSize?: number;
  delayMs?: number;
}): Promise<DispatchFeeRemindersResult> {
  const res = (await apiFetch("/api/whatsapp/fee-reminders/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })) as ApiSuccess<DispatchFeeRemindersResult>;
  return res.data;
}

export async function retryFailedFeeReminders(params: {
  academicYearId: string;
  periodMonth: number;
  periodYear: number;
  maxRetries?: number;
}): Promise<{ requeuedCount: number }> {
  const res = (await apiFetch("/api/whatsapp/fee-reminders/retry-failed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })) as ApiSuccess<{ requeuedCount: number }>;
  return res.data;
}

export async function resolveUncertainFeeReminder(params: {
  logId: string;
  action: "MARK_SENT" | "MARK_FAILED" | "REQUEUE";
  note?: string;
}): Promise<WhatsAppMessageLogItem> {
  const res = (await apiFetch("/api/whatsapp/fee-reminders/resolve-uncertain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })) as ApiSuccess<WhatsAppMessageLogItem>;
  return res.data;
}
