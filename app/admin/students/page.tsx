"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Plus, View, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getStudents,
  type StudentListItem,
} from "@/lib/services/student";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getPageNumbers = (
  current: number,
  total: number
): (number | "ellipsis")[] => {
  if (total <= 0) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);

  return pages;
};

export default function Page() {
  const router = useRouter();

  const TABLEHEADERS = [
    "ID",
    "Student Name",
    "Whatsapp Number",
    "Address",
    "Status",
    "Actions",
  ];

  // Full list of students matching the current search (unpaginated).
  const [allStudents, setAllStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);

  const loadStudents = async () => {
    try {
      setLoading(true);

      const response = await getStudents({
        page: 1,
        limit: 1000,
        search,
        sortBy: "admissionNumber",
        order: "desc",
      });

      setAllStudents(response.data ?? []);
    } catch (error) {
      console.error(error);
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch only when the search term changes (pagination/limit are
  // handled entirely on the client below).
  useEffect(() => {
    loadStudents();
  }, [search]);

  // Reset to page 1 whenever the page size changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [limit]);

  const totalRecords = allStudents.length;
  const totalPages = Math.max(Math.ceil(totalRecords / limit), 1);

  // Clamp current page if it becomes invalid (e.g. limit changed,
  // or the last item on the last page was deleted).
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }

  const startIndex = (safePage - 1) * limit;
  const students = allStudents.slice(startIndex, startIndex + limit);

  const isFirstPage = safePage === 1;
  const isLastPage = totalRecords === 0 || safePage === totalPages;

  return (
    <section className="px-6 py-4">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
            Students
          </h1>

          <p className="text-sm leading-6 text-slate-600 dark:text-slate-600">
            View and manage student records,
            enrollment details, and academic
            information.
          </p>
        </div>

      </div>

      <Card className="mt-6 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex gap-20 items-center">
            <div>
              <h2 className="text-lg font-semibold">
                Student List
              </h2>

              <p className="text-sm text-muted-foreground">
                Manage student records
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />

              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="
                            h-8
                            pl-10
                            bg-white
                            text-slate-700
                            placeholder:text-slate-400
                            dark:bg-slate-900
                            dark:text-white
                            dark:placeholder:text-slate-400
                          "
              />
            </div>
          </div>

          <Button
            className="gap-2"
            onClick={() => router.push("/admin/students/createStudent")}
          >
            <Plus className="h-4 w-4" />
            Create Student
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white dark:bg-transparent dark:hover:bg-transparent">
                {TABLEHEADERS.map((header) => (
                  <TableHead
                    key={header}
                    className={`font-semibold text-slate-600 dark:text-white ${header === "Actions"
                      ? "text-right pr-4"
                      : ""
                      }`}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLEHEADERS.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLEHEADERS.length}
                    className="text-center py-8"
                  >
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map(
                  (student, index) => {
                    return (
                      <TableRow
                        key={
                          student.id
                        }
                      >
                        <TableCell>
                          {startIndex + index + 1}
                        </TableCell>

                        <TableCell>
                          {student.studentName}
                        </TableCell>

                        <TableCell>
                          {
                            student.whatsappNumber
                          }
                        </TableCell>

                        <TableCell>
                          {student.address}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${student.status ===
                              "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700"
                              }`}
                          >
                            {student.status}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                router.push(`/admin/students/createStudent?id=${student.id}`)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                router.push(`/admin/students/viewStudent?id=${student.id}`)
                              }
                            >
                              <View className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-4 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">

            {/* Left */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Rows per page
              </span>

              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right */}
            <div className="flex items-center gap-6">

              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages}
              </p>

              <p className="text-sm font-medium">
                Total: {totalRecords}
              </p>

              <div className="flex items-center gap-1">

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isFirstPage}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers(safePage, totalPages).map((page, idx) =>
                  page === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-sm text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={
                        safePage === page
                          ? "default"
                          : "ghost"
                      }
                      size="icon"
                      onClick={() =>
                        setCurrentPage(page)
                      }
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isLastPage}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}