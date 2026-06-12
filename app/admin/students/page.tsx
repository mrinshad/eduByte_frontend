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

  const [students, setStudents] = useState<StudentListItem[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [limit, setLimit] = useState(10);

  const loadStudents = async () => {
    try {
      const response = await getStudents({
        page: currentPage,
        limit,
        search,
        sortBy: "admissionNumber",
        order: "desc",
      });
      console.log(response)

      setStudents(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    console.log("Current Page:", currentPage);
    loadStudents();
  }, [currentPage, search, limit]);
  const [totalRecords, setTotalRecords] = useState(0);
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
              {students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8"
                  >
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map(
                  (student, index) => {
                    console.log("a", student)
                    return (
                      <TableRow
                        key={
                          student.admissionNumber
                        }
                      >
                        <TableCell>
                          {index + 1}
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
                Page {currentPage} of {totalPages}
              </p>

              <p className="text-sm font-medium">
                Total: {totalRecords}
              </p>

              <div className="flex items-center gap-1">

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => prev - 1)
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                ).map((page) => (
                  <Button
                    key={page}
                    variant={
                      currentPage === page
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
                ))}

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => prev + 1)
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