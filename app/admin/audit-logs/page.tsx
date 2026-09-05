"use client";

import * as React from "react";
import { useEffect, useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import {
  Search,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ShieldAlert,
  Clock,
  User,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  PlusCircle,
  Trash2,
  Edit3,
  ChevronDown,
  FileText,
  Code2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PageHeader from "@/components/common/pageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/auth/PermissionGate";

import {
  getAuditLogs,
  getAuditMetadata,
  type AuditLog,
  type AuditPagination,
} from "@/lib/services/audit-service";

// ---------------------------------------------------------------------------
// Helpers & Field Formatters (Non-technical / Human Friendly)
// ---------------------------------------------------------------------------
function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionBadgeStyle(action: string) {
  const act = action.toUpperCase();
  if (act.includes("CREATE") || act.includes("ADMIT")) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  }
  if (act.includes("DELETE") || act.includes("CANCEL") || act.includes("REVERSE")) {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
  }
  if (act.includes("UPDATE") || act.includes("EDIT")) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
  }
  if (act.includes("COLLECT") || act.includes("PAY")) {
    return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30";
  }
  if (act.includes("RELIEVE")) {
    return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
  }
  return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
}

function getModuleBadgeStyle(module: string) {
  const mod = module.toUpperCase();
  if (mod.includes("STUDENT")) {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
  }
  if (mod.includes("FEE") || mod.includes("CHARGE")) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
  }
  if (mod.includes("ADMISSION")) {
    return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20";
  }
  if (mod.includes("USER") || mod.includes("ROLE")) {
    return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20";
  }
  if (mod.includes("RELIEV")) {
    return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
  }
  if (mod.includes("VEHICLE") || mod.includes("TRANSPORT")) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
  }
  return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
}

function formatModuleLabel(module: string): string {
  const map: Record<string, string> = {
    STUDENT: "Student Directory",
    STUDENTS: "Student Directory",
    ADMISSION: "Admissions",
    RELIEVING: "Student Relieving",
    PROMOTION: "Student Promotion",
    FEE_COLLECTION: "Fee Collection",
    FEE_GENERATION: "Fee Generation",
    STUDENT_CHARGES: "Student Ledgers",
    VEHICLE: "Transport & Fleet",
    EXPENSE: "Expenses",
    FINE: "Fines & Penalties",
    USER: "User Accounts",
    USERS: "User Accounts",
    ROLE: "Roles & Permissions",
    ROLES: "Roles & Permissions",
  };
  return map[module.toUpperCase()] || module;
}

const IGNORED_SYSTEM_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "passwordHash",
  "password",
  "isDeleted",
  "deletedAt",
  "refreshTokenVersion",
]);

function formatFieldLabel(key: string): string {
  const dictionary: Record<string, string> = {
    dob: "Date of Birth",
    adharNo: "Aadhaar Number",
    rollNumber: "Roll Number",
    admissionNumber: "Admission No",
    whatsappNumber: "WhatsApp Number",
    studentName: "Student Name",
    fatherName: "Father Name",
    fatherMobile: "Father Mobile",
    motherName: "Mother Name",
    motherMobile: "Mother Mobile",
    bloodGroup: "Blood Group",
    paymentMethod: "Payment Method",
    chargeType: "Charge Type",
    feeStructure: "Fee Structure",
    academicYear: "Academic Year",
    regNo: "Registration No",
    registrationNumber: "Registration No",
    seatCapacity: "Seat Capacity",
    driverName: "Driver Name",
    driverPhone: "Driver Phone",
    vehicleNumber: "Vehicle Number",
    vehicleType: "Vehicle Type",
    relievedDate: "Relieved Date",
    dueDate: "Due Date",
    isActive: "Account Status",
    isDeleted: "Deleted Status",
    amount: "Amount",
    balance: "Balance",
    paidAmount: "Paid Amount",
    totalAmount: "Total Amount",
    discountAmount: "Discount",
    fineAmount: "Fine Amount",
  };

  if (dictionary[key]) return dictionary[key];

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function renderFormattedValue(value: any, fieldKey?: string): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/60 italic">—</span>;
  }

  if (typeof value === "boolean") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] font-medium px-2 py-0.5",
          value
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30"
        )}
      >
        {value ? "Active / Yes" : "Inactive / No"}
      </Badge>
    );
  }

  if (typeof value === "number") {
    const isCurrency = fieldKey && /(amount|fee|fine|balance|total|cost|price|discount)/i.test(fieldKey);
    if (isCurrency) {
      return <span className="font-semibold text-foreground tabular-nums">₹{value.toLocaleString("en-IN")}</span>;
    }
    return <span className="font-medium text-foreground tabular-nums">{value.toLocaleString()}</span>;
  }

  if (typeof value === "string") {
    // Check ISO Date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return (
          <span className="text-foreground tabular-nums">
            {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        );
      }
    }
    // Check common enum statuses
    if (/^(ACTIVE|PROMOTED|COMPLETED|RELIEVED|CANCELLED|PAID|PARTIAL|PENDING|OVERDUE)$/i.test(value)) {
      return (
        <Badge variant="outline" className="text-[10px] font-semibold tracking-wide uppercase">
          {value}
        </Badge>
      );
    }
    return <span className="text-foreground">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground/60 italic">None</span>;
    if (typeof value[0] === "string" || typeof value[0] === "number") {
      return <span className="text-foreground">{value.join(", ")}</span>;
    }
    return <span className="text-foreground font-medium">{value.length} record(s)</span>;
  }

  if (typeof value === "object") {
    if (value.name) return <span className="text-foreground font-medium">{value.name}</span>;
    if (value.title) return <span className="text-foreground font-medium">{value.title}</span>;
    return <span className="text-foreground text-xs">{JSON.stringify(value)}</span>;
  }

  return String(value);
}

interface DiffResult {
  isCreate: boolean;
  isDelete: boolean;
  isUpdate: boolean;
  changed: { key: string; label: string; oldVal: any; newVal: any }[];
  added: { key: string; label: string; val: any }[];
  removed: { key: string; label: string; val: any }[];
  unchanged: { key: string; label: string; val: any }[];
  totalFields: number;
}

function calculateDiff(oldData: any, newData: any): DiffResult {
  const hasOld = oldData && typeof oldData === "object" && Object.keys(oldData).length > 0;
  const hasNew = newData && typeof newData === "object" && Object.keys(newData).length > 0;

  const isCreate = Boolean(hasNew && !hasOld);
  const isDelete = Boolean(hasOld && !hasNew);
  const isUpdate = Boolean(hasOld && hasNew);

  const oldKeys = hasOld ? Object.keys(oldData) : [];
  const newKeys = hasNew ? Object.keys(newData) : [];
  const allKeys = Array.from(new Set([...oldKeys, ...newKeys])).filter(
    (k) => !IGNORED_SYSTEM_KEYS.has(k)
  );

  const changed: { key: string; label: string; oldVal: any; newVal: any }[] = [];
  const added: { key: string; label: string; val: any }[] = [];
  const removed: { key: string; label: string; val: any }[] = [];
  const unchanged: { key: string; label: string; val: any }[] = [];

  for (const k of allKeys) {
    const label = formatFieldLabel(k);
    const inOld = hasOld && k in oldData;
    const inNew = hasNew && k in newData;
    const oVal = hasOld ? oldData[k] : undefined;
    const nVal = hasNew ? newData[k] : undefined;

    if (inOld && inNew) {
      const isOldEmpty = oVal === null || oVal === undefined || oVal === "";
      const isNewEmpty = nVal === null || nVal === undefined || nVal === "";

      if (isOldEmpty && isNewEmpty) {
        unchanged.push({ key: k, label, val: nVal });
      } else if (JSON.stringify(oVal) !== JSON.stringify(nVal)) {
        changed.push({ key: k, label, oldVal: oVal, newVal: nVal });
      } else {
        unchanged.push({ key: k, label, val: nVal });
      }
    } else if (inNew && !inOld) {
      const isNewEmpty = nVal === null || nVal === undefined || nVal === "";
      if (!isNewEmpty) {
        added.push({ key: k, label, val: nVal });
      }
    } else if (inOld && !inNew) {
      const isOldEmpty = oVal === null || oVal === undefined || oVal === "";
      if (!isOldEmpty) {
        removed.push({ key: k, label, val: oVal });
      }
    }
  }

  return {
    isCreate,
    isDelete,
    isUpdate,
    changed,
    added,
    removed,
    unchanged,
    totalFields: allKeys.length,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AuditLogsPage() {
  const [, startTransition] = useTransition();

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<AuditPagination>({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<"createdAt" | "module" | "action" | "description">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Metadata for filter options
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [showUnchanged, setShowUnchanged] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Metadata once
  useEffect(() => {
    getAuditMetadata().then((data) => {
      setAvailableModules(data.modules || []);
      setAvailableActions(data.actions || []);
    });
  }, []);

  // Fetch Audit Logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs({
        page: currentPage,
        limit,
        from: fromDate || undefined,
        to: toDate || undefined,
        module: moduleFilter !== "ALL" ? moduleFilter : undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        q: search || undefined,
        sortBy,
        order,
      });

      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, fromDate, toDate, moduleFilter, actionFilter, search, sortBy, order]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Reset modal toggles on select change
  useEffect(() => {
    setShowUnchanged(false);
    setCopiedRaw(false);
  }, [selectedLog]);

  // Sorting Toggle
  const handleSort = (field: "createdAt" | "module" | "action" | "description") => {
    startTransition(() => {
      if (sortBy === field) {
        setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setOrder("desc");
      }
      setCurrentPage(1);
    });
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setModuleFilter("ALL");
    setActionFilter("ALL");
    setFromDate("");
    setToDate("");
    setSortBy("createdAt");
    setOrder("desc");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search ||
      moduleFilter !== "ALL" ||
      actionFilter !== "ALL" ||
      fromDate ||
      toDate ||
      sortBy !== "createdAt" ||
      order !== "desc"
  );

  const copyRawJson = () => {
    if (!selectedLog) return;
    const payload = {
      id: selectedLog.id,
      module: selectedLog.module,
      action: selectedLog.action,
      description: selectedLog.description,
      operator: selectedLog.user ? `${selectedLog.user.name} (@${selectedLog.user.username})` : "System",
      createdAt: selectedLog.createdAt,
      previousData: selectedLog.oldData,
      updatedData: selectedLog.newData,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedRaw(true);
    toast.success("Audit details copied to clipboard");
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const diff = selectedLog ? calculateDiff(selectedLog.oldData, selectedLog.newData) : null;

  return (
    <PermissionGate permission="auditLogs.listOnNavbar">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <PageHeader
          title="Audit Logs"
          description="Chronological record of actions, modifications, and operators across all modules"
          showBackButton={false}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={loading}
              className="gap-2 shadow-xs"
            >
              <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          }
        />

        {/* Filter & Search Toolbar */}
        <div className="rounded-xl border bg-card p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            {/* Keyword Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search description or reference..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Module Filter */}
            <Select
              value={moduleFilter}
              onValueChange={(val) => {
                setModuleFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sections</SelectItem>
                {availableModules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {formatModuleLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action Filter */}
            <Select
              value={actionFilter}
              onValueChange={(val) => {
                setActionFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {availableActions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rows Per Page */}
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                setLimit(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range & Filter Reset Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Date Range:
              </span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 w-36 text-xs"
                placeholder="From Date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 w-36 text-xs"
                placeholder="To Date"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                {/* When */}
                <TableHead
                  className="w-[180px] cursor-pointer select-none font-semibold text-foreground"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-1.5">
                    Date & Time
                    {sortBy === "createdAt" ? (
                      order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                {/* Who */}
                <TableHead className="w-[190px] font-semibold text-foreground">
                  Operator
                </TableHead>

                {/* Where (Section) */}
                <TableHead
                  className="w-[160px] cursor-pointer select-none font-semibold text-foreground"
                  onClick={() => handleSort("module")}
                >
                  <div className="flex items-center gap-1.5">
                    Section
                    {sortBy === "module" ? (
                      order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                {/* What (Action) */}
                <TableHead
                  className="w-[140px] cursor-pointer select-none font-semibold text-foreground"
                  onClick={() => handleSort("action")}
                >
                  <div className="flex items-center gap-1.5">
                    Action
                    {sortBy === "action" ? (
                      order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                {/* Description */}
                <TableHead
                  className="cursor-pointer select-none font-semibold text-foreground"
                  onClick={() => handleSort("description")}
                >
                  <div className="flex items-center gap-1.5">
                    Description
                    {sortBy === "description" ? (
                      order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                {/* Inspect Action */}
                <TableHead className="w-[110px] text-right font-semibold text-foreground">
                  Changes
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ShieldAlert className="h-8 w-8 opacity-40" />
                      <p className="font-medium text-sm">No audit logs found</p>
                      <p className="text-xs text-muted-foreground/70">
                        Try adjusting your search filters or selected date range.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    {/* Timestamp */}
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>

                    {/* Operator */}
                    <TableCell>
                      {log.user ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-xs text-foreground flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {log.user.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>@{log.user.username}</span>
                            {log.user.role?.name && (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[9px] font-semibold uppercase"
                              >
                                {log.user.role.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">System Engine</span>
                      )}
                    </TableCell>

                    {/* Section */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-semibold px-2 py-0.5 border", getModuleBadgeStyle(log.module))}
                      >
                        {formatModuleLabel(log.module)}
                      </Badge>
                    </TableCell>

                    {/* Action */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-bold tracking-wider uppercase border", getActionBadgeStyle(log.action))}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>

                    {/* Description */}
                    <TableCell className="text-xs text-foreground max-w-[360px] truncate" title={log.description || ""}>
                      {log.description || "—"}
                    </TableCell>

                    {/* View Changes Action */}
                    <TableCell className="text-right">
                      <PermissionGate permission="auditLogs.viewButton">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-2.5 text-xs gap-1.5 font-medium hover:bg-primary/5 hover:text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-muted/20 gap-3 text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-medium text-foreground">
                {logs.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)}
              </span>{" "}
              of <span className="font-medium text-foreground">{pagination.totalRecords}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage || loading}
                className="h-8 px-2.5 gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>

              <span className="px-2 text-xs font-medium text-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage || loading}
                className="h-8 px-2.5 gap-1 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Human-Friendly Audit Details Modal */}
        <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="sm:max-w-3xl w-full max-h-[85vh] flex flex-col p-6 overflow-hidden">
            <DialogHeader className="pb-3 border-b">
              <div className="flex items-center gap-2 mb-1.5">
                {selectedLog && (
                  <>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-semibold px-2 py-0.5 uppercase border", getModuleBadgeStyle(selectedLog.module))}
                    >
                      {formatModuleLabel(selectedLog.module)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold uppercase border", getActionBadgeStyle(selectedLog.action))}
                    >
                      {selectedLog.action}
                    </Badge>
                  </>
                )}
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {selectedLog ? formatDateTime(selectedLog.createdAt) : ""}
                </span>
              </div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Activity Details
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/80 font-medium">
                {selectedLog?.description || "Summary of activity performed"}
              </DialogDescription>
            </DialogHeader>

            {selectedLog && diff && (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs pt-1">
                {/* Clean Context Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 border">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Performed By
                    </span>
                    <span className="font-medium text-foreground text-xs flex items-center gap-1.5 mt-0.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedLog.user ? selectedLog.user.name : "System Engine"}
                    </span>
                    {selectedLog.user?.role?.name && (
                      <span className="block text-[10px] text-muted-foreground pl-5">
                        Role: {selectedLog.user.role.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Section / Module
                    </span>
                    <span className="font-medium text-foreground text-xs flex items-center gap-1.5 mt-0.5">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatModuleLabel(selectedLog.module)}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Timestamp
                    </span>
                    <span className="font-medium text-foreground text-xs flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDateTime(selectedLog.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Case 1: Record Modification (Update) */}
                {diff.isUpdate && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="font-semibold text-sm text-foreground">
                          Modified Information ({diff.changed.length} changed)
                        </span>
                      </div>
                      {diff.unchanged.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowUnchanged(!showUnchanged)}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showUnchanged && "rotate-180")} />
                          {showUnchanged ? "Hide" : "Show"} unchanged ({diff.unchanged.length})
                        </Button>
                      )}
                    </div>

                    {diff.changed.length === 0 ? (
                      <div className="p-4 rounded-lg border bg-muted/20 text-center text-muted-foreground text-xs">
                        No direct value modifications detected (record touched or refreshed without field changes).
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow>
                              <TableHead className="w-[180px] font-semibold text-foreground text-xs">Field</TableHead>
                              <TableHead className="font-semibold text-rose-600 dark:text-rose-400 text-xs">Previous Value</TableHead>
                              <TableHead className="w-[24px] text-center"></TableHead>
                              <TableHead className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">Updated Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {diff.changed.map((row) => (
                              <TableRow key={row.key} className="hover:bg-muted/30">
                                <TableCell className="font-medium text-xs text-foreground">
                                  {row.label}
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="p-1.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 inline-block max-w-full break-words">
                                    {renderFormattedValue(row.oldVal, row.key)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                  <ArrowRight className="h-3.5 w-3.5 mx-auto opacity-70" />
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 inline-block max-w-full break-words font-medium">
                                    {renderFormattedValue(row.newVal, row.key)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Optional Unchanged Fields */}
                    {showUnchanged && diff.unchanged.length > 0 && (
                      <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                        <span className="font-semibold text-xs text-muted-foreground block">
                          Unchanged Fields
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {diff.unchanged.map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-2 rounded bg-background border">
                              <span className="text-muted-foreground font-medium">{item.label}</span>
                              <span className="font-medium">{renderFormattedValue(item.val, item.key)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Case 2: New Record Created */}
                {diff.isCreate && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-sm text-foreground">
                        Created Record Information
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border bg-card p-3">
                      {diff.added.length > 0
                        ? diff.added.map((item) => (
                            <div key={item.key} className="p-2.5 rounded-md bg-muted/30 border flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                                {item.label}
                              </span>
                              <div className="font-medium text-xs text-foreground">
                                {renderFormattedValue(item.val, item.key)}
                              </div>
                            </div>
                          ))
                        : (
                          <span className="text-muted-foreground italic col-span-2 text-center py-4">
                            No field data provided for creation.
                          </span>
                        )}
                    </div>
                  </div>
                )}

                {/* Case 3: Record Removed or Relieved */}
                {diff.isDelete && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      <span className="font-semibold text-sm text-foreground">
                        Removed / Relieved Record Information
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border bg-card p-3">
                      {diff.removed.length > 0
                        ? diff.removed.map((item) => (
                            <div key={item.key} className="p-2.5 rounded-md bg-rose-500/5 border border-rose-500/10 flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                                {item.label}
                              </span>
                              <div className="font-medium text-xs text-foreground">
                                {renderFormattedValue(item.val, item.key)}
                              </div>
                            </div>
                          ))
                        : (
                          <span className="text-muted-foreground italic col-span-2 text-center py-4">
                            No prior field snapshot available.
                          </span>
                        )}
                    </div>
                  </div>
                )}

                {/* Secondary: Discrete Raw JSON Accordion for Technical Reference */}
                <details className="pt-2 border-t text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground font-medium py-1 inline-flex items-center gap-1.5 select-none">
                    <Code2 className="h-3.5 w-3.5" /> Technical / Raw Payload
                  </summary>
                  <div className="mt-2 p-3 rounded-lg bg-muted/40 border space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between items-center pb-1 border-b">
                      <span>Full Audit Payload</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyRawJson}
                        className="h-6 px-2 text-[10px] gap-1"
                      >
                        {copiedRaw ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copiedRaw ? "Copied" : "Copy JSON"}
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap break-all max-h-[160px] overflow-auto text-[10px] text-foreground/80">
                      {JSON.stringify(
                        {
                          previousData: selectedLog.oldData,
                          updatedData: selectedLog.newData,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
