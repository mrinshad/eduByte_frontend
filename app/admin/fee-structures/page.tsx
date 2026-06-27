"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { getFeeStructures,  type FeeStructureSummary } from "@/lib/services/feeStructure";

export default function Page() {
  const router = useRouter();

  const [feeStructures, setFeeStructures] = useState<FeeStructureSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await getFeeStructures();
        setFeeStructures(data);
      } catch (err) {
        setError("Could not load fee structures. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this fee structure? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      
      setFeeStructures((prev) => prev.filter((item) => item.id !== id));
      toast.success("Fee structure deleted successfully");
    } catch (err) {
      toast.error("Failed to delete fee structure. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = feeStructures.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.academicYearName?.toLowerCase().includes(q) ||
      item.className?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, filtered.length);

  return (
    <section className="w-full px-6 py-4 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button size="icon" className="bg-background text-foreground hover:opacity-90 shadow-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Fee Structures</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">View, manage, and organize fee structures.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
            <Input
              placeholder="Search fee structures..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <Button
            className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={() => router.push("/admin/fee-structures/createFee")}
          >
            <Plus className="h-4 w-4 mr-2 text-white dark:text-slate-900" />
            Create Fee Structure
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">ID</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Academic Year</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Class</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Name</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Description</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">Status</TableHead>
                <TableHead className="px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right">Actions</TableHead>
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
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">No fee structures found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item, index) => (
                  <TableRow key={item.id} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.academicYearName}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.className}</TableCell>
                    <TableCell className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.name}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.description ?? "—"}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className={item.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                        : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 font-medium"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                          onClick={() => router.push(`/admin/fee-structures/viewFee?id=${item.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-blue-950/40"
                          onClick={() => router.push(`/admin/fee-structures/createFee?id=${item.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/40"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4 gap-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{start}</span> to{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{end}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> entries
          </p>
          <div className="flex items-center gap-4">
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
              Page {currentPage}
            </div>
            <Button className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 pr-2.5 h-9 disabled:opacity-40"
              size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoading}>
              Next <ChevronRight className="h-4 w-4 text-white dark:text-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}