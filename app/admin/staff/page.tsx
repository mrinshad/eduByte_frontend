"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  ArrowLeft, Pencil, Trash2, Plus,
  ChevronLeft, ChevronRight, Search, Loader2, Users,
  ChevronDown, ChevronUp, ChevronsUpDown, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { deleteStaff, getStaff, type StaffListItem, type StaffPagination } from "@/lib/services/staff";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function SortableHeader({
  label,
  field,
  sortBy,
  order,
  onSort,
}: {
  label: string;
  field: string;
  sortBy: string;
  order: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  const isActive = sortBy === field;

  return (
    <TableHead
      onClick={() => onSort(field)}
      className={cn(
        "px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap",
        "cursor-pointer select-none transition-colors hover:bg-white/10 dark:hover:bg-white/5"
      )}
      title={`Sort by ${label}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {isActive ? (
          order === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        )}
      </span>
    </TableHead>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {label}
      <button onClick={onRemove} className="rounded-full hover:text-red-600">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export default function Page() {
  const router = useRouter();

  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [pagination, setPagination] = useState<StaffPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [staffToDelete, setStaffToDelete] = useState<StaffListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const loadStaff = async () => {
      try {
        setLoading(true);
        const response = await getStaff({
          page: currentPage,
          limit: rowsPerPage,
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          sortBy,
          order,
        });
        if (!cancelled) {
          setStaff(response.data.items);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setStaff([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStaff();
    return () => {
      cancelled = true;
    };
  }, [currentPage, rowsPerPage, search, sortBy, order, statusFilter]);

  const { total, totalPages, page: safePage } = pagination;
  const startEntry = total === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const endEntry = total === 0 ? 0 : Math.min(safePage * rowsPerPage, total);

  const hasActiveFilters = useMemo(
    () => statusFilter !== "all" || search.trim().length > 0,
    [statusFilter, search]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStaff(staffToDelete.id);
      toast.success("Staff deleted successfully");
      setStaffToDelete(null);

      const response = await getStaff({
        page: currentPage,
        limit: rowsPerPage,
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        sortBy,
        order,
      });

      if (response.data.items.length === 0 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setStaff(response.data.items);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete staff");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatText = (value?: string | null) => (value && value.trim() !== "" ? value : "-");

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setOrder("asc");
    }
    setCurrentPage(1);
  };

  return (
    <section className="w-full px-3 sm:px-6 py-4 space-y-6">

      {/* ── Header & Actions ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button
            size="icon"
            className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Staff Directory
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              View and manage staff records, contact details, and employment status.
            </p>
          </div>
        </div>

        {/* Action bar: stacks on mobile, wraps on tablet, single row on desktop */}
        <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search staff..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full md:w-[140px] rounded-lg border-slate-300 shrink-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/30 shrink-0"
              onClick={clearAllFilters}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
          <PermissionGate permission="staff.creaStaffButton">
          <Button
            className="w-full md:w-auto shrink-0 bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={() => router.push("/admin/staff/createStaff")}
          >
            <Plus className="h-4 w-4 mr-2 text-white dark:text-slate-900" />
            Create Staff
          </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-xs font-medium text-slate-400">Filters:</span>
          {statusFilter !== "all" && (
            <FilterChip
              label={`Status: ${STATUS_LABELS[statusFilter] ?? statusFilter}`}
              onRemove={() => { setStatusFilter("all"); setCurrentPage(1); }}
            />
          )}
          {search.trim() && (
            <FilterChip
              label={`Search: ${search}`}
              onRemove={() => { setSearchInput(""); setSearch(""); setCurrentPage(1); }}
            />
          )}
        </div>
      )}

      {/* ── Data Table Container ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="w-full overflow-x-auto [scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]">
          <Table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  ID
                </TableHead>
                <SortableHeader label="Employee Code" field="employeeCode" sortBy={sortBy} order={order} onSort={toggleSort} />
                <SortableHeader label="Name" field="name" sortBy={sortBy} order={order} onSort={toggleSort} />
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Phone
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                  Email
                </TableHead>
                <SortableHeader label="Joining Date" field="joiningDate" sortBy={sortBy} order={order} onSort={toggleSort} />
                <SortableHeader label="Status" field="status" sortBy={sortBy} order={order} onSort={toggleSort} />
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Loading staff...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No staff found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member, index) => (
                  <TableRow
                    key={member.id}
                    className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                  >
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-500">
                      {startEntry + index}
                    </TableCell>

                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatText(member.employeeCode)}
                    </TableCell>

                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100 max-w-[180px] truncate">
                      {formatText(member.name)}
                    </TableCell>

                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatText(member.phone)}
                    </TableCell>

                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {formatText(member.email)}
                    </TableCell>

                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(member.joiningDate)}
                    </TableCell>

                    <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          member.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                            : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 font-medium"
                        }
                      >
                        {member.status ?? "-"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <PermissionGate permission="staff.editStaffButton">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                          onClick={() => router.push(`/admin/staff/createStaff?id=${member.id}`)}
                          title="Edit Staff"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        </PermissionGate>
                        <PermissionGate permission="staff.deleteStaffButton">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete Staff"
                          onClick={() => setStaffToDelete(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex flex-col lg:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 sm:px-6 py-4 gap-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center lg:text-left order-2 lg:order-1">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{startEntry}</span> to{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{endEntry}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{total}</span> entries
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 sm:justify-end order-1 lg:order-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 justify-between w-full sm:w-auto">
              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40 flex-1 sm:flex-none"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 text-white dark:text-foreground" />
                Prev
              </Button>

              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[4rem] text-center">
                Page {safePage} of {totalPages}
              </div>

              <Button
                className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pr-2.5 h-9 disabled:opacity-40 flex-1 sm:flex-none"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 text-white dark:text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!staffToDelete}
        onOpenChange={(open) => {
          if (!open) setStaffToDelete(null);
        }}
      >
        <AlertDialogContent className="w-[92vw] sm:max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{staffToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this staff record. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteStaff();
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}