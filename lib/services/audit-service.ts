"use client";

import { apiFetch } from "@/lib/api";

export interface AuditOperator {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role?: {
    id: string;
    name: string;
  } | null;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  module: string;
  action: string;
  description: string | null;
  endpoint: string | null;
  ipAddress: string | null;
  referenceId: string | null;
  oldData: any;
  newData: any;
  createdAt: string;
  user?: AuditOperator | null;
}

export interface AuditPagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  module?: string;
  action?: string;
  userId?: string;
  q?: string;
  sortBy?: "createdAt" | "module" | "action" | "description";
  order?: "asc" | "desc";
}

export interface AuditMetadata {
  modules: string[];
  actions: string[];
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

/**
 * Fetch paginated, filtered, and sorted audit logs from the backend.
 */
export async function getAuditLogs(params: AuditLogQueryParams = {}): Promise<{
  logs: AuditLog[];
  pagination: AuditPagination;
}> {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.module && params.module !== "ALL") query.set("module", params.module);
  if (params.action && params.action !== "ALL") query.set("action", params.action);
  if (params.userId && params.userId !== "ALL") query.set("userId", params.userId);
  if (params.q) query.set("q", params.q);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.order) query.set("order", params.order);

  const url = `/api/audit-logs${query.toString() ? `?${query.toString()}` : ""}`;
  const response = (await apiFetch(url)) as ApiSuccess<{
    logs: AuditLog[];
    pagination: AuditPagination;
  }>;

  return response.data;
}

/**
 * Fetch distinct modules and actions recorded in audit logs to populate filter dropdowns.
 */
export async function getAuditMetadata(): Promise<AuditMetadata> {
  try {
    const response = (await apiFetch("/api/audit-logs/metadata")) as ApiSuccess<AuditMetadata>;
    return response.data || { modules: [], actions: [] };
  } catch {
    return {
      modules: [
        "STUDENTS",
        "ADMISSIONS",
        "FEE_COLLECTION",
        "FEE_STRUCTURE",
        "STUDENT_RELIEVING",
        "USERS",
        "ROLES",
        "EXPENSES",
      ],
      actions: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "COLLECT_FEE",
        "RELIEVE_STUDENT",
        "MASS_RELIEVE",
        "UPDATE_ROLE",
      ],
    };
  }
}

/**
 * Fetch detailed audit log by ID.
 */
export async function getAuditLogById(id: string): Promise<AuditLog | null> {
  const response = (await apiFetch(`/api/audit-logs/${id}`)) as ApiSuccess<{
    log: AuditLog;
  }>;
  return response.data?.log ?? null;
}
