"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



const TABLE_HEADERS = [
  { key: "id",      label: "ID" },
  { key: "name",    label: "Student Name" },
  { key: "phone",   label: "Whatsapp Number" },
  { key: "address", label: "Address" },
  { key: "status",  label: "Status" },
  { key: "actions", label: "Actions" },
] as const;

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"] as const;

const DEFAULT_PAGE_SIZE = 10;



export interface StudentAdmission {
  id: string;
  studentName: string;
  whatsappNumber: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  admissionNumber?: string;
}


function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 0) return [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}


export default function StudentAdmissionListPage() {
  const router = useRouter();

  const [allStudents, setAllStudents] = useState<StudentAdmission[]>([]);
  const [loading,     setLoading]     = useState(true);

  const [search,      setSearch]      = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit,       setLimit]       = useState(DEFAULT_PAGE_SIZE);



  const loadStudents = async () => {
    try {
      setLoading(true);

     
      const MOCK: StudentAdmission[] = [
        { id: "1",  studentName: "Aarav Menon",    whatsappNumber: "9876543210", address: "Ernakulam, Kerala",        status: "ACTIVE"   },
        { id: "2",  studentName: "Bhavya Krishnan", whatsappNumber: "9845123456", address: "Thrissur, Kerala",         status: "ACTIVE"   },
        { id: "3",  studentName: "Chinmay Nair",    whatsappNumber: "9712345678", address: "Thiruvananthapuram, Kerala", status: "INACTIVE" },
        { id: "4",  studentName: "Divya Pillai",    whatsappNumber: "9632147895", address: "Kozhikode, Kerala",        status: "ACTIVE"   },
        { id: "5",  studentName: "Eshan Varma",     whatsappNumber: "9558741236", address: "Kollam, Kerala",           status: "ACTIVE"   },
        { id: "6",  studentName: "Fathima Beevi",   whatsappNumber: "9447852136", address: "Malappuram, Kerala",       status: "INACTIVE" },
        { id: "7",  studentName: "Gautam Suresh",   whatsappNumber: "9387412563", address: "Palakkad, Kerala",         status: "ACTIVE"   },
        { id: "8",  studentName: "Hima Das",        whatsappNumber: "9274156832", address: "Kannur, Kerala",           status: "ACTIVE"   },
        { id: "9",  studentName: "Irfan Kutty",     whatsappNumber: "9162345789", address: "Kasaragod, Kerala",        status: "INACTIVE" },
        { id: "10", studentName: "Janaki Iyer",     whatsappNumber: "9051234567", address: "Idukki, Kerala",           status: "ACTIVE"   },
        { id: "11", studentName: "Kiran Mohan",     whatsappNumber: "8987654321", address: "Wayanad, Kerala",          status: "ACTIVE"   },
        { id: "12", studentName: "Lakshmi Devi",    whatsappNumber: "8875412369", address: "Pathanamthitta, Kerala",   status: "ACTIVE"   },
        { id: "13", studentName: "Manoj Kumar",     whatsappNumber: "8762541893", address: "Alappuzha, Kerala",        status: "INACTIVE" },
        { id: "14", studentName: "Nisha Thomas",    whatsappNumber: "8653214789", address: "Kottayam, Kerala",         status: "ACTIVE"   },
        { id: "15", studentName: "Omkar Pillai",    whatsappNumber: "8541237896", address: "Ernakulam, Kerala",        status: "ACTIVE"   },
      ];

      const q = search.toLowerCase();
      setAllStudents(
        q
          ? MOCK.filter(
              (s) =>
                s.studentName.toLowerCase().includes(q) ||
                s.whatsappNumber.includes(q) ||
                s.address.toLowerCase().includes(q) ||
                s.status.toLowerCase().includes(q),
            )
          : MOCK,
      );
    } catch (error) {
      console.error("Failed to load students:", error);
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadStudents();
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [limit]);



  const totalRecords = allStudents.length;
  const totalPages   = Math.max(Math.ceil(totalRecords / limit), 1);
  const safePage     = Math.min(currentPage, totalPages);

  // Clamp silently (no extra render cycle for the happy path).
  if (safePage !== currentPage) setCurrentPage(safePage);

  const startIndex = (safePage - 1) * limit;
  const students   = allStudents.slice(startIndex, startIndex + limit);

  const isFirstPage = safePage === 1;
  const isLastPage  = totalRecords === 0 || safePage === totalPages;



  const handleEdit   = (id: string) => router.push(`/admin/students/createStudent?id=${id}`);
  const handleView   = (id: string) => router.push(`/admin/students/viewStudent?id=${id}`);
  const handleDelete = (id: string) => {
  
    console.log("Delete student", id);
  };

  return (
    <section className="px-6 py-4">
      {/* ── Page heading ── */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
            Admission List
          </h1>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
             Manage student admissions and related settings.
          </p>
        </div>
      </div>

      <Card className="mt-6 border-slate-200 shadow-sm">
        {/* Card header */}
        <CardHeader className="flex flex-row items-center justify-between border-b flex-wrap gap-4">
          <div className="flex items-center gap-10 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Student List</h2>
              <p className="text-sm text-muted-foreground">
                Manage student admission records
              </p>
            </div>

            {/* Search */}
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-10 bg-white text-slate-700 placeholder:text-slate-400 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          <Button
            className="gap-2"
            onClick={() => router.push("/admin/admissions/createAdmission")}
          >
            <Plus className="h-4 w-4" />
            New Admission
          </Button>
        </CardHeader>

        {/* Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white dark:bg-transparent dark:hover:bg-transparent">
                {TABLE_HEADERS.map(({ key, label }) => (
                  <TableHead
                    key={key}
                    className={`font-semibold text-slate-600 dark:text-white ${
                      key === "actions" ? "text-right pr-4" : ""
                    }`}
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Loading students…
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, index) => (
                  <TableRow key={student.id}>
                    {/* Sequential row number — constant 1, 2, 3 … across pages */}
                    <TableCell>{startIndex + index + 1}</TableCell>

                    <TableCell className="font-medium">
                      {student.studentName}
                    </TableCell>

                    <TableCell>{student.whatsappNumber}</TableCell>

                    <TableCell className="max-w-[180px] truncate">
                      {student.address}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          student.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.status}
                      </span>
                    </TableCell>

                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(student.id)}
                          title="Edit student"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleView(student.id)}
                          title="View student"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(student.id)}
                          title="Delete student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* ── Pagination footer ── */}
          <div className="flex flex-col gap-4 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
            {/* Rows per page */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(limit)}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page info + page buttons */}
            <div className="flex items-center gap-6">
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages}
              </p>

              <p className="text-sm font-medium">Total: {totalRecords}</p>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isFirstPage}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                      variant={safePage === page ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ),
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isLastPage}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
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
