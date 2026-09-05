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
  Globe,
  Copy,
  Check,
  Filter,
  FileCode2,
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

import {
  getAuditLogs,
  getAuditMetadata,
  type AuditLog,
  type AuditPagination,
} from "@/lib/services/audit-service";

// ---------------------------------------------------------------------------
// Helpers
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
    second: "2-digit",
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
  return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
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
  const [copiedSection, setCopiedSection] = useState<"old" | "new" | null>(null);

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

  const copyJson = (data: any, section: "old" | "new") => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedSection(section);
    toast.success("JSON copied to clipboard");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Audit Logs"
        description="Chronological audit trail capturing data changes, operator identity, and system event timelines"
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
              placeholder="Search description, reference ID, endpoint..."
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
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Modules</SelectItem>
              {availableModules.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
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
              className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
            >
              <X className="h-3.5 w-3.5" /> Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead
                className="w-[180px] cursor-pointer select-none font-semibold text-foreground"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-1.5">
                  Timestamp
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

              <TableHead className="w-[190px] font-semibold text-foreground">
                Operator (Who)
              </TableHead>

              <TableHead
                className="w-[130px] cursor-pointer select-none font-semibold text-foreground"
                onClick={() => handleSort("module")}
              >
                <div className="flex items-center gap-1.5">
                  Module
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

              <TableHead className="w-[180px] font-semibold text-foreground">
                Origin / Where
              </TableHead>

              <TableHead className="w-[80px] text-right font-semibold text-foreground">
                Diff
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 opacity-40" />
                    <p className="font-medium text-sm">No audit logs found</p>
                    <p className="text-xs text-muted-foreground/70">
                      Try adjusting your search filters, dates, or module selections.
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
                        <span className="font-medium text-xs text-foreground flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {log.user.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>@{log.user.username}</span>
                          {log.user.role?.name && (
                            <Badge
                              variant="outline"
                              className="px-1 py-0 text-[9px] font-semibold uppercase"
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

                  {/* Module */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold tracking-wider uppercase border", getModuleBadgeStyle(log.module))}
                    >
                      {log.module}
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
                  <TableCell className="text-xs text-foreground max-w-[320px] truncate" title={log.description || ""}>
                    {log.description || "—"}
                  </TableCell>

                  {/* Origin */}
                  <TableCell className="text-xs">
                    <div className="flex flex-col gap-0.5 max-w-[160px]">
                      <span className="font-mono text-[10px] text-muted-foreground truncate" title={log.endpoint || ""}>
                        {log.endpoint || "—"}
                      </span>
                      {log.ipAddress && (
                        <span className="font-mono text-[9px] text-muted-foreground/70 flex items-center gap-0.5">
                          <Globe className="h-2.5 w-2.5" />
                          {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Diff Details Button */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedLog(log)}
                      title="Inspect changes"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {pagination.totalRecords === 0
                ? 0
                : (pagination.currentPage - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalRecords
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {pagination.totalRecords}
            </span>{" "}
            audit records
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>

            <span className="text-xs px-2 font-medium">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 gap-1 text-xs"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Before / After Diff Dialog */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-4xl w-full max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={cn("text-[10px] font-bold uppercase", selectedLog ? getModuleBadgeStyle(selectedLog.module) : "")}
              >
                {selectedLog?.module}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-bold uppercase", selectedLog ? getActionBadgeStyle(selectedLog.action) : "")}
              >
                {selectedLog?.action}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground ml-auto">
                {selectedLog ? formatDateTime(selectedLog.createdAt) : ""}
              </span>
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Audit Record Inspection
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedLog?.description || "Detailed inspection of state mutation"}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 border">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Performed By
                  </span>
                  <span className="font-medium text-foreground">
                    {selectedLog.user ? `${selectedLog.user.name} (@${selectedLog.user.username})` : "System Engine"}
                  </span>
                  {selectedLog.user?.role?.name && (
                    <span className="block text-[10px] text-muted-foreground">
                      Role: {selectedLog.user.role.name}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Endpoint Trigger
                  </span>
                  <span className="font-mono text-foreground break-all">
                    {selectedLog.endpoint || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Client IP / Host
                  </span>
                  <span className="font-mono text-foreground">
                    {selectedLog.ipAddress || "—"}
                  </span>
                  {selectedLog.referenceId && (
                    <span className="block text-[10px] text-muted-foreground font-mono truncate">
                      Ref: {selectedLog.referenceId}
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side Diff Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Previous State (Old Data) */}
                <div className="rounded-lg border bg-card p-3 flex flex-col h-[320px]">
                  <div className="flex items-center justify-between pb-2 border-b mb-2">
                    <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <FileCode2 className="h-3.5 w-3.5" /> Previous State (Old Data)
                    </span>
                    {selectedLog.oldData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyJson(selectedLog.oldData, "old")}
                        className="h-6 px-2 text-[10px] gap-1"
                      >
                        {copiedSection === "old" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto rounded bg-muted/50 p-2 font-mono text-[11px] leading-relaxed">
                    {selectedLog.oldData ? (
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(selectedLog.oldData, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground italic text-xs block text-center pt-24">
                        (No prior state — Record Created)
                      </span>
                    )}
                  </div>
                </div>

                {/* Updated State (New Data) */}
                <div className="rounded-lg border bg-card p-3 flex flex-col h-[320px]">
                  <div className="flex items-center justify-between pb-2 border-b mb-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <FileCode2 className="h-3.5 w-3.5" /> Updated State (New Data)
                    </span>
                    {selectedLog.newData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyJson(selectedLog.newData, "new")}
                        className="h-6 px-2 text-[10px] gap-1"
                      >
                        {copiedSection === "new" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto rounded bg-muted/50 p-2 font-mono text-[11px] leading-relaxed">
                    {selectedLog.newData ? (
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(selectedLog.newData, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground italic text-xs block text-center pt-24">
                        (No updated state — Record Deleted)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
