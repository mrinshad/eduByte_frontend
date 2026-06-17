"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getStudentCharges, type StudentCharge} from "@/lib/services/studentCharges";


export default function StudentChargesPage() {
  const [charges, setCharges] = useState<StudentCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getStudentCharges();
      setCharges(data);
    } catch (err) {
      setError("Failed to load student charges");
    } finally {
      setLoading(false);
    }
  }

  const filteredCharges = useMemo(() => {
    const query = search.toLowerCase();

    return charges.filter((item) => {
      return (
        item.student?.toLowerCase().includes(query) ||
        item.admissionNumber?.toLowerCase().includes(query) ||
        item.class?.toLowerCase().includes(query)
      );
    });
  }, [charges, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCharges.length / rowsPerPage)
  );

  const paginatedCharges = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredCharges.slice(start, start + rowsPerPage);
  }, [filteredCharges, currentPage, rowsPerPage]);

  const entryMetrics = useMemo(() => {
    if (filteredCharges.length === 0) {
      return { start: 0, end: 0 };
    }

    return {
      start: (currentPage - 1) * rowsPerPage + 1,
      end: Math.min(
        currentPage * rowsPerPage,
        filteredCharges.length
      ),
    };
  }, [filteredCharges, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            PAID
          </Badge>
        );

      case "PARTIAL":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            PARTIAL
          </Badge>
        );

      default:
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            PENDING
          </Badge>
        );
    }
  };

  return (
    <section className="w-full px-6 py-4 space-y-6">

      {/* Header */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div>
          <h1 className="text-2xl font-semibold">
            Student Charges
          </h1>

          <p className="text-sm text-slate-500">
            View all student fee charges and payments.
          </p>
        </div>

        {/* Same Search UI */}

        <div className="relative w-full sm:w-80 shadow-sm rounded-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />

          <Input
            placeholder="Search by admission no, student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>

      {/* Table */}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

        <Table>

          <TableHeader>
            <TableRow className="bg-[oklch(0.46_0.04_125)] hover:bg-[oklch(0.46_0.04_125)]">

              <TableHead className="text-white">
                Admission No
              </TableHead>

              <TableHead className="text-white">
                Student
              </TableHead>

              <TableHead className="text-white">
                Class
              </TableHead>

              <TableHead className="text-white">
                Final Amount
              </TableHead>

              <TableHead className="text-white">
                Paid Amount
              </TableHead>

              <TableHead className="text-white">
                Balance
              </TableHead>

              <TableHead className="text-white">
                Status
              </TableHead>

            </TableRow>
          </TableHeader>

          <TableBody>

            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">

                  <div className="flex flex-col items-center gap-2">

                    <Loader2 className="h-7 w-7 animate-spin" />

                    <p>Loading Charges...</p>

                  </div>

                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-red-500 h-40">
                  {error}
                </TableCell>
              </TableRow>
            ) : paginatedCharges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-40">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              paginatedCharges.map((item) => {

                const finalAmount = item.finalAmount || 0;
                const paidAmount = item.paidAmount || 0;

                return (
                  <TableRow key={item.admissionNumber}>

                    <TableCell>
                      {item.admissionNumber}
                    </TableCell>

                    <TableCell className="font-medium">
                      {item.student}
                    </TableCell>

                    <TableCell>
                      {item.class}
                    </TableCell>

                    <TableCell>
                      ₹{finalAmount.toLocaleString()}
                    </TableCell>

                    <TableCell>
                      ₹{paidAmount.toLocaleString()}
                    </TableCell>

                    <TableCell>
                      ₹{(finalAmount - paidAmount).toLocaleString()}
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>

                  </TableRow>
                );
              })
            )}

          </TableBody>

        </Table>

        {/* Same Pagination UI */}

        <div className="flex flex-col sm:flex-row items-center justify-between border-t px-6 py-4 gap-4">

          <p className="text-sm text-slate-500">
            Showing{" "}
            <strong>{entryMetrics.start}</strong> to{" "}
            <strong>{entryMetrics.end}</strong> of{" "}
            <strong>{filteredCharges.length}</strong> entries
          </p>

          <div className="flex items-center gap-6">

            <div className="flex items-center gap-2">

              <span className="text-xs">
                Rows per page:
              </span>

              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-2 py-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>

            </div>

            <div className="flex items-center gap-4">

              <Button
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(1, prev - 1)
                  )
                }
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <span>
                Page {currentPage}
              </span>

              <Button
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(totalPages, prev + 1)
                  )
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}