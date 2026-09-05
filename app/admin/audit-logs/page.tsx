"use client";

import * as React from "react";
import { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  PlusCircle,
  Trash2,
  Edit3,
  ChevronDown,
  FileText,
  Code2,
  Download,
} from "lucide-react";
import { exportToCsv, type CsvColumn } from "@/lib/utils/csvExport";

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
  DialogFooter,
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

function renderFormattedValue(
  value: any,
  fieldKey?: string,
  colorContext: "rose" | "emerald" | "default" = "default"
): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    if (colorContext === "rose") {
      return <span className="text-rose-600/80 dark:text-rose-400/80 italic font-normal">—</span>;
    }
    if (colorContext === "emerald") {
      return <span className="text-emerald-700/80 dark:text-emerald-400/80 italic font-normal">—</span>;
    }
    return <span className="text-slate-400 dark:text-slate-500 italic font-normal">—</span>;
  }

  const textColor =
    colorContext === "rose"
      ? "text-rose-700 dark:text-rose-300 font-medium"
      : colorContext === "emerald"
      ? "text-emerald-800 dark:text-emerald-300 font-semibold"
      : "text-slate-900 dark:text-slate-100";

  if (typeof value === "boolean") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] font-medium px-2 py-0.5 border",
          value
            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
            : "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30"
        )}
      >
        {value ? "Active / Yes" : "Inactive / No"}
      </Badge>
    );
  }

  if (typeof value === "number") {
    const isCurrency = fieldKey && /(amount|fee|fine|balance|total|cost|price|discount)/i.test(fieldKey);
    if (isCurrency) {
      return (
        <span className={cn("tabular-nums", textColor, colorContext === "default" && "font-semibold")}>
          ₹{value.toLocaleString("en-IN")}
        </span>
      );
    }
    return (
      <span className={cn("tabular-nums font-medium", textColor)}>
        {value.toLocaleString()}
      </span>
    );
  }

  if (typeof value === "string") {
    // Check ISO Date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return (
          <span className={cn("tabular-nums font-medium", textColor)}>
            {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        );
      }
    }
    // Check common enum statuses
    if (/^(ACTIVE|PROMOTED|COMPLETED|RELIEVED|CANCELLED|PAID|PARTIAL|PENDING|OVERDUE)$/i.test(value)) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
        >
          {value}
        </Badge>
      );
    }
    return <span className={textColor}>{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400 dark:text-slate-500 italic">None</span>;
    if (typeof value[0] === "string" || typeof value[0] === "number") {
      return <span className={textColor}>{value.join(", ")}</span>;
    }
    return <span className={cn(textColor, "font-medium")}>{value.length} record(s)</span>;
  }

  if (typeof value === "object") {
    if (value.name) return <span className={cn(textColor, "font-medium")}>{value.name}</span>;
    if (value.title) return <span className={cn(textColor, "font-medium")}>{value.title}</span>;
    return <span className={cn(textColor, "text-xs font-mono")}>{JSON.stringify(value)}</span>;
  }

  return <span className={textColor}>{String(value)}</span>;
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
  const router = useRouter();
  const [, startTransition] = useTransition();

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await getAuditLogs({
        page: 1,
        limit: 5000,
        q: search || undefined,
        module: moduleFilter !== "ALL" ? moduleFilter : undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sortBy,
        order,
      });

      const logsList = res?.logs || [];
      if (!logsList.length) {
        toast.info("No audit logs found to export.");
        return;
      }

      const columns: CsvColumn<AuditLog>[] = [
        { header: "Date & Time", accessor: (l) => formatDateTime(l.createdAt) },
        { header: "Operator", accessor: (l) => l.user?.name || l.user?.username || "System" },
        { header: "Username", accessor: (l) => l.user?.username || "-" },
        { header: "Role", accessor: (l) => l.user?.role?.name || "-" },
        { header: "Section", accessor: (l) => formatModuleLabel(l.module) },
        { header: "Action", accessor: (l) => l.action || "" },
        { header: "Description", accessor: (l) => l.description || "-" },
        { header: "Reference ID", accessor: (l) => l.referenceId || "-" },
      ];

      const success = exportToCsv({
        filename: "audit_logs",
        columns,
        data: logsList,
      });

      if (success) {
        toast.success(`Exported ${logsList.length} audit log records successfully.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to export audit logs");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PermissionGate permission="auditLogs.listOnNavbar">
      <section className="w-full px-4 py-4 sm:px-6 space-y-6">
        {/* ── Page Header (Matching Admin Standard) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Button
              className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-[#556043] dark:text-[#9ea98a]" />
                Audit Logs
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Chronological record of actions, modifications, and operators across all modules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Button
              onClick={handleExportCsv}
              disabled={exporting || loading}
              className="w-full sm:w-auto bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg gap-2"
            >
              {exporting ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-white dark:text-slate-900" />
              ) : (
                <Download className="h-4 w-4 text-white dark:text-slate-900" />
              )}
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={loadLogs}
              disabled={loading}
              className="w-full sm:w-auto border-slate-300 text-slate-700  dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm h-10 px-3.5 text-xs sm:text-sm font-medium rounded-lg gap-2 bg-white dark:bg-slate-950"
            >
              <RotateCcw className={cn("h-4 w-4 text-slate-600 dark:text-slate-400", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Filter & Search Toolbar ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Keyword Search */}
            <div className="relative lg:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 z-10" />
                <Input
                  placeholder="Search description, reference, operator..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 pr-8 h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-[#556043]"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Module Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Section
              </label>
              <Select
                value={moduleFilter}
                onValueChange={(val) => {
                  setModuleFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043] data-placeholder:text-slate-400 dark:data-placeholder:text-slate-500">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-lg">
                  <SelectItem value="ALL" className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">All Sections</SelectItem>
                  {availableModules.map((m) => (
                    <SelectItem key={m} value={m} className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
                      {formatModuleLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Action
              </label>
              <Select
                value={actionFilter}
                onValueChange={(val) => {
                  setActionFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043] data-placeholder:text-slate-400 dark:data-placeholder:text-slate-500">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-lg">
                  <SelectItem value="ALL" className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">All Actions</SelectItem>
                  {availableActions.map((a) => (
                    <SelectItem key={a} value={a} className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rows Per Page */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Page Size
              </label>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043] data-placeholder:text-slate-400 dark:data-placeholder:text-slate-500">
                  <SelectValue placeholder="Page Size" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-lg">
                  <SelectItem value="10" className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">10 per page</SelectItem>
                  <SelectItem value="20" className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">20 per page</SelectItem>
                  <SelectItem value="50" className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">50 per page</SelectItem>
                  <SelectItem value="100" className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range & Filter Reset Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Date Range:
              </span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-36 text-xs rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-[#556043] [color-scheme:light] dark:[color-scheme:dark]"
                placeholder="From Date"
              />
              <span className="text-slate-500 dark:text-slate-400 font-medium">to</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-36 text-xs rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-[#556043] [color-scheme:light] dark:[color-scheme:dark]"
                placeholder="To Date"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* ── Table (Matching Admin Standard #556043 Header) ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                {/* When */}
                <TableHead
                  className="w-[180px] px-4 sm:px-6 h-12 cursor-pointer select-none font-semibold text-white dark:text-foreground text-xs sm:text-sm tracking-tight whitespace-nowrap"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-1.5">
                    Date & Time
                    {sortBy === "createdAt" ? (
                      order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-white dark:text-foreground" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-white dark:text-foreground" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-white/60 dark:text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                {/* Who */}
                <TableHead className="w-[190px] px-4 sm:px-6 h-12 font-semibold text-white dark:text-foreground text-xs sm:text-sm tracking-tight whitespace-nowrap">
                  Operator
                </TableHead>

                {/* Where (Section) */}
                <TableHead
                  className="w-[160px] px-4 sm:px-6 h-12 cursor-pointer select-none font-semibold text-white dark:text-foreground text-xs sm:text-sm tracking-tight whitespace-nowrap"
                  onClick={() => handleSort("module")}
                >
                  <div className="flex items-center gap-1.5">
                    Section
                    {sortBy === "module" ? (
                      order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-white dark:text-foreground" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-white dark:text-foreground" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-white/60 dark:text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                {/* What (Action) */}
                <TableHead
                  className="w-[140px] px-4 sm:px-6 h-12 cursor-pointer select-none font-semibold text-white dark:text-foreground text-xs sm:text-sm tracking-tight whitespace-nowrap"
                  onClick={() => handleSort("action")}
                >
                  <div className="flex items-center gap-1.5">
                    Action
                    {sortBy === "action" ? (
                      order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-white dark:text-foreground" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-white dark:text-foreground" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-white/60 dark:text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                {/* Description */}
                <TableHead
                  className="px-4 sm:px-6 h-12 cursor-pointer select-none font-semibold text-white dark:text-foreground text-xs sm:text-sm tracking-tight whitespace-nowrap"
                  onClick={() => handleSort("description")}
                >
                  <div className="flex items-center gap-1.5">
                    Description
                    {sortBy === "description" ? (
                      order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-white dark:text-foreground" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-white dark:text-foreground" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-white/60 dark:text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                {/* Inspect Action */}
                <TableHead className="w-[110px] px-4 sm:px-6 h-12 text-right font-semibold text-white dark:text-foreground text-xs sm:text-sm tracking-tight whitespace-nowrap">
                  Changes
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4 sm:px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="px-4 sm:px-6 py-4"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="px-4 sm:px-6 py-4"><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                    <TableCell className="px-4 sm:px-6 py-4"><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                    <TableCell className="px-4 sm:px-6 py-4"><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                      <ShieldAlert className="h-8 w-8 text-[#556043] dark:text-[#9ea98a] stroke-1 opacity-70" />
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-200">No audit logs found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Try adjusting your search filters or selected date range.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {/* Timestamp */}
                    <TableCell className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(log.createdAt)}
                    </TableCell>

                    {/* Operator */}
                    <TableCell className="px-4 sm:px-6 py-4">
                      {log.user ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            {log.user.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
                            <span>@{log.user.username}</span>
                            {log.user.role?.name && (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[9px] font-semibold text-slate-700 dark:text-slate-300 uppercase border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80"
                              >
                                {log.user.role.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">System Engine</span>
                      )}
                    </TableCell>

                    {/* Section */}
                    <TableCell className="px-4 sm:px-6 py-4">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-semibold px-2 py-0.5 border", getModuleBadgeStyle(log.module))}
                      >
                        {formatModuleLabel(log.module)}
                      </Badge>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="px-4 sm:px-6 py-4">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-bold tracking-wider uppercase border", getActionBadgeStyle(log.action))}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>

                    {/* Description */}
                    <TableCell className="px-4 sm:px-6 py-4 text-xs text-slate-800 dark:text-slate-200 max-w-[360px] truncate" title={log.description || ""}>
                      {log.description || "—"}
                    </TableCell>

                    {/* View Changes Action */}
                    <TableCell className="px-4 sm:px-6 py-4 text-right">
                      <PermissionGate permission="auditLogs.viewButton">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 px-2.5 rounded-lg text-slate-600 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:text-[#9ea98a] dark:hover:bg-[#556043]/20 gap-1.5 text-xs font-medium"
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

          {/* ── Pagination Footer (Matching Admin Standard) ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40 gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {logs.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)}
              </span>{" "}
              of <span className="font-semibold text-slate-900 dark:text-white">{pagination.totalRecords}</span> entries
            </div>

            <div className="flex items-center gap-4">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage || loading}
              >
                <ChevronLeft className="h-4 w-4 text-white dark:text-foreground" />
                Prev
              </Button>

              <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[4rem] text-center">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>

              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 text-white dark:text-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Human-Friendly Audit Details Modal */}
        <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
            <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#556043]/10 dark:bg-[#556043]/20 flex items-center justify-center shrink-0 text-[#556043] dark:text-[#9ea98a]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-base font-semibold text-slate-950 dark:text-white">
                      Activity Details
                    </DialogTitle>
                    {selectedLog && (
                      <div className="flex items-center gap-1.5">
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
                      </div>
                    )}
                  </div>
                  <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    {selectedLog?.description || "Summary of activity performed"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedLog && diff && (
              <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1 text-xs">
                {/* Clean Context Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                      Performed By
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 mt-0.5">
                      <User className="h-3.5 w-3.5 text-[#556043] dark:text-[#9ea98a]" />
                      {selectedLog.user ? selectedLog.user.name : "System Engine"}
                    </span>
                    {selectedLog.user?.role?.name && (
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                        Role: {selectedLog.user.role.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                      Section / Module
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 mt-0.5">
                      <Layers className="h-3.5 w-3.5 text-[#556043] dark:text-[#9ea98a]" />
                      {formatModuleLabel(selectedLog.module)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                      Timestamp
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-[#556043] dark:text-[#9ea98a]" />
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
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          Modified Information ({diff.changed.length} changed)
                        </span>
                      </div>
                      {diff.unchanged.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowUnchanged(!showUnchanged)}
                          className="h-7 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white gap-1"
                        >
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showUnchanged && "rotate-180")} />
                          {showUnchanged ? "Hide" : "Show"} unchanged ({diff.unchanged.length})
                        </Button>
                      )}
                    </div>

                    {diff.changed.length === 0 ? (
                      <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40 text-center text-slate-500 text-xs">
                        No direct value modifications detected (record touched or refreshed without field changes).
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                              <TableHead className="w-[180px] font-semibold text-white dark:text-foreground text-xs">Field</TableHead>
                              <TableHead className="font-semibold text-white dark:text-foreground text-xs">Previous Value</TableHead>
                              <TableHead className="w-[28px] text-center"></TableHead>
                              <TableHead className="font-semibold text-white dark:text-foreground text-xs">Updated Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {diff.changed.map((row) => (
                              <TableRow key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100">
                                  {row.label}
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 inline-block max-w-full break-words">
                                    {renderFormattedValue(row.oldVal, row.key, "rose")}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-slate-400 dark:text-slate-500">
                                  <ArrowRight className="h-3.5 w-3.5 mx-auto text-[#556043] dark:text-[#9ea98a]" />
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 inline-block max-w-full break-words font-semibold">
                                    {renderFormattedValue(row.newVal, row.key, "emerald")}
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
                      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40 space-y-2">
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 block">
                          Unchanged Fields
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {diff.unchanged.map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">{item.label}</span>
                              <span className="font-medium text-slate-900 dark:text-slate-100">{renderFormattedValue(item.val, item.key, "default")}</span>
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
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        Created Record Information
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3">
                      {diff.added.length > 0
                        ? diff.added.map((item) => (
                            <div key={item.key} className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                                {item.label}
                              </span>
                              <div className="font-medium text-xs text-slate-900 dark:text-slate-100">
                                {renderFormattedValue(item.val, item.key, "default")}
                              </div>
                            </div>
                          ))
                        : (
                          <span className="text-slate-400 italic col-span-2 text-center py-4">
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
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        Removed / Relieved Record Information
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3">
                      {diff.removed.length > 0
                        ? diff.removed.map((item) => (
                            <div key={item.key} className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10 flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                                {item.label}
                              </span>
                              <div className="font-medium text-xs text-slate-900 dark:text-slate-100">
                                {renderFormattedValue(item.val, item.key, "default")}
                              </div>
                            </div>
                          ))
                        : (
                          <span className="text-slate-400 italic col-span-2 text-center py-4">
                            No prior field snapshot available.
                          </span>
                        )}
                    </div>
                  </div>
                )}

                {/* Secondary: Discrete Raw JSON Accordion for Technical Reference */}
                <details className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <summary className="cursor-pointer hover:text-slate-900 dark:hover:text-white font-medium py-1 inline-flex items-center gap-1.5 select-none">
                    <Code2 className="h-3.5 w-3.5 text-[#556043] dark:text-[#9ea98a]" /> Technical / Raw Payload
                  </summary>
                  <div className="mt-2 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/70 dark:border-slate-800">
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
                    <pre className="whitespace-pre-wrap break-all max-h-[160px] overflow-auto text-[10px] text-slate-800 dark:text-slate-200">
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

            <DialogFooter className="m-0 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between sm:justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedLog?.referenceId ? (
                  <span className="font-mono text-[11px]">
                    Reference ID: <span className="text-slate-700 dark:text-slate-300 font-semibold">{selectedLog.referenceId}</span>
                  </span>
                ) : (
                  <span>Audit Reference Log</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="rounded-full px-5 h-9 text-xs sm:text-sm font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </PermissionGate>
  );
}
