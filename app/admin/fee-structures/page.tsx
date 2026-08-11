"use client"

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Eye,
  Plus,
  Loader2,
  Receipt,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getFeeStructures, type FeeStructureSummary, deleteFeeStructure } from "@/lib/services/feeStructure";


function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <span className="max-w-[10rem] truncate sm:max-w-none">{label}</span>
      <button onClick={onRemove} className="shrink-0 rounded-full hover:text-red-600">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function Page() {
  const router = useRouter();

  const [feeStructures, setFeeStructures] = useState<FeeStructureSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] =
    useState<FeeStructureSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Accumulated option lists — NOT derived solely from the current filtered
  // page. This prevents a selected filter value from "disappearing" (and
  // rendering as an empty SelectValue) once the fetched list narrows down
  // to a subset that no longer contains every option.
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const response = await getFeeStructures({
          page: currentPage,
          limit: rowsPerPage,
          search,
          className: classFilter === "all" ? "" : classFilter,
          academicYear: academicYearFilter === "all" ? "" : academicYearFilter,
          status: statusFilter as "all" | "active" | "inactive",
        });
        setFeeStructures(response.items);
        setPagination(response.pagination);

        setClassOptions((prev) =>
          Array.from(
            new Set([...prev, ...response.items.map((i) => i.className).filter(Boolean)])
          )
        );
        setAcademicYearOptions((prev) =>
          Array.from(
            new Set([...prev, ...response.items.map((i) => i.academicYearName).filter(Boolean)])
          )
        );
      } catch (err) {
        setError("Could not load fee structures. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentPage, rowsPerPage, search, classFilter, academicYearFilter, statusFilter]);

  const handleDelete = async () => {
    if (!selectedFeeStructure) return;

    try {
      setDeleting(true);

      await deleteFeeStructure(selectedFeeStructure.id);

      toast.success("Fee Structure deleted successfully.");

      setFeeStructures(prev =>
        prev.filter(item => item.id !== selectedFeeStructure.id)
      );

      setDeleteDialogOpen(false);
      setSelectedFeeStructure(null);

    } catch (error: any) {
      toast.error(
        error?.message ?? "Failed to delete Fee Structure."
      );
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const start = pagination.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = pagination.total === 0 ? 0 : Math.min(currentPage * rowsPerPage, pagination.total);

  const hasActiveFilters = useMemo(
    () =>
      classFilter !== "all" ||
      academicYearFilter !== "all" ||
      statusFilter !== "all" ||
      search.trim().length > 0,
    [classFilter, academicYearFilter, statusFilter, search]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setClassFilter("all");
    setAcademicYearFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <section className="w-full px-4 py-4 sm:px-6 space-y-6">

      {/* Header */}
      
        <div className="flex flex-col gap-4">
          {/* Title row */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0 text-white" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Fee Structures</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage fee structure templates for each class and academic year.
                </p>
              </div>
            </div>
            <PermissionGate permission="feestuctures.createFeeStuctures">
            <Button
              className="w-full bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 sm:w-auto"
              onClick={() => router.push("/admin/fee-structures/createFee")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Fee Structure
            </Button>
            </PermissionGate>
          </div>

          {/* Search + filters row */}
          

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-400">Filters:</span>
              {classFilter !== "all" && (
                <FilterChip label={`Class: ${classFilter}`} onRemove={() => { setClassFilter("all"); setCurrentPage(1); }} />
              )}
              {academicYearFilter !== "all" && (
                <FilterChip label={`Year: ${academicYearFilter}`} onRemove={() => { setAcademicYearFilter("all"); setCurrentPage(1); }} />
              )}
              {statusFilter !== "all" && (
                <FilterChip label={`Status: ${statusFilter}`} onRemove={() => { setStatusFilter("all"); setCurrentPage(1); }} />
              )}
              {search.trim() && (
                <FilterChip
                  label={`Search: ${search}`}
                  onRemove={() => { setSearchInput(""); setSearch(""); setCurrentPage(1); }}
                />
              )}
            </div>
          )}
        </div>
      
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, class, or year..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-lg pl-9 border-slate-300 dark:border-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={classFilter}
            onValueChange={(value) => {
              setClassFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[calc(50%-0.25rem)] min-w-[120px] rounded-lg border-slate-300 sm:w-[140px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={academicYearFilter}
            onValueChange={(value) => {
              setAcademicYearFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[calc(50%-0.25rem)] min-w-[120px] rounded-lg border-slate-300 sm:w-[140px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {academicYearOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[calc(50%-0.25rem)] min-w-[110px] rounded-lg border-slate-300 sm:w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/30"
              onClick={clearAllFilters}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">ID</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Academic Year</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Class</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Name</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Description</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Status</TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                      <p className="text-sm">Loading fee structures...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </TableCell>
                </TableRow>
              ) : feeStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No fee structures found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                feeStructures.map((item, index) => (
                  <TableRow key={item.id} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-500">{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.academicYearName || "-"}</TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.className}</TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.name}</TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-[220px] truncate">{item.description ?? "—"}</TableCell>
                    <TableCell className="px-4 sm:px-6 py-4">
                      <Badge variant="outline" className={item.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                        : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 font-medium"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <PermissionGate permission="feestructures.viewFeesturcturesButton">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                          onClick={() => router.push(`/admin/fee-structures/viewFee?id=${item.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        </PermissionGate>

                        {/* Edit */}
                        <PermissionGate permission="feestuctures.editFeesturcturesButton">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-blue-950/40"
                          onClick={() => router.push(`/admin/fee-structures/createFee?id=${item.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        </PermissionGate>

                        {/* Delete */}
                        <PermissionGate permission="feesturctures.deleteFeesturcturesButton">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/40"
                          onClick={() => {
                            setSelectedFeeStructure(item);
                            setDeleteDialogOpen(true);
                          }} disabled={deletingId === item.id}
                        >
                          {deletingId === item.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
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

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:px-6 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 sm:text-left">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{start}</span> to{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{end}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> entries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rows per page:</span>
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
            <Button className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pl-2.5 h-9 disabled:opacity-40"
              size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading}>
              <ChevronLeft className="h-4 w-4 text-white dark:text-foreground" /> Prev
            </Button>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[4rem] text-center">
              Page {currentPage} of {totalPages}
            </div>
            <Button className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pr-2.5 h-9 disabled:opacity-40"
              size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoading}>
              Next <ChevronRight className="h-4 w-4 text-white dark:text-foreground" />
            </Button>
          </div>
        </div>
      </div>
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Fee Structure?
            </AlertDialogTitle>

            <AlertDialogDescription className="break-words">
              Are you sure you want to delete{" "}
              <strong>{selectedFeeStructure?.name}</strong>?
              <br />
              This action cannot be undone. If this Fee Structure is already
              assigned to students, the system will prevent deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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