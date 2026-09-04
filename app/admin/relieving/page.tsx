"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogOut,
  Search,
  Users,
  GraduationCap,
  Bus,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { getClasses, SchoolClass } from "@/lib/services/class";
import { getDivisions, Division } from "@/lib/services/division";
import { getAcademicYears, AcademicYearSummary } from "@/lib/services/academicYear";
import {
  getRosterForRelieving,
  massRelieveStudents,
  RelievingRosterItem,
  RelievingRosterResponse
} from "@/lib/services/studentRelieving";
import { useCurrentAcademicYear } from "@/lib/academic-year-store";

export default function StudentRelievingPage() {
  const router = useRouter();
  const globalAcademicYearId = useCurrentAcademicYear();

  const [loading, setLoading] = useState(false);
  const [fetchingRoster, setFetchingRoster] = useState(false);

  // Dropdowns
  const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  // Filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Roster & Selection
  const [rosterData, setRosterData] = useState<RelievingRosterResponse>({
    roster: [],
    summary: { total: 0, active: 0, completed: 0, withDues: 0 }
  });
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [relievedDate, setRelievedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial load of dropdowns
  useEffect(() => {
    async function initDropdowns() {
      try {
        setLoading(true);
        const [years, cls] = await Promise.all([
          getAcademicYears(),
          getClasses()
        ]);
        setAcademicYears(years);
        setClasses(cls);

        if (globalAcademicYearId) {
          setSelectedAcademicYear(globalAcademicYearId);
        } else if (years.length > 0) {
          const activeYear = years.find((y) => y.isActive) || years[0];
          setSelectedAcademicYear(activeYear.id);
        }

        if (cls.length > 0) {
          setSelectedClass(cls[0].id);
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
        toast.error("Failed to load initial dropdown options.");
      } finally {
        setLoading(false);
      }
    }
    initDropdowns();
  }, [globalAcademicYearId]);

  // Load divisions when class changes
  useEffect(() => {
    async function loadDivisionsForClass() {
      if (!selectedClass) {
        setDivisions([]);
        return;
      }
      try {
        const divs = await getDivisions(selectedClass);
        setDivisions(divs);
        setSelectedDivision("all");
      } catch (err) {
        console.error("Failed to fetch divisions", err);
      }
    }
    loadDivisionsForClass();
  }, [selectedClass]);

  // Fetch student roster
  const fetchRoster = async () => {
    if (!selectedAcademicYear || !selectedClass) return;

    try {
      setFetchingRoster(true);
      const data = await getRosterForRelieving({
        academicYearId: selectedAcademicYear,
        classId: selectedClass,
        divisionId: selectedDivision,
        search: searchQuery,
      });
      setRosterData(data);
      setSelectedEnrollmentIds([]);
    } catch (err) {
      console.error("Failed to fetch roster for relieving", err);
      toast.error("Failed to load student roster.");
      setRosterData({
        roster: [],
        summary: { total: 0, active: 0, completed: 0, withDues: 0 }
      });
    } finally {
      setFetchingRoster(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedAcademicYear, selectedClass, selectedDivision]);

  // Selectable active students
  const relievableStudents = useMemo(() => {
    return rosterData.roster.filter((s) => s.isRelievable);
  }, [rosterData.roster]);

  const allRelievableSelected =
    relievableStudents.length > 0 &&
    relievableStudents.every((s) => selectedEnrollmentIds.includes(s.enrollmentId));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEnrollmentIds(relievableStudents.map((s) => s.enrollmentId));
    } else {
      setSelectedEnrollmentIds([]);
    }
  };

  const handleToggleSelect = (enrollmentId: string) => {
    setSelectedEnrollmentIds((prev) =>
      prev.includes(enrollmentId)
        ? prev.filter((id) => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  // Selected students details for confirmation modal
  const selectedStudentsInfo = useMemo(() => {
    const selected = rosterData.roster.filter((s) =>
      selectedEnrollmentIds.includes(s.enrollmentId)
    );
    const totalDues = selected.reduce((sum, s) => sum + s.outstandingDues, 0);
    const studentsWithDues = selected.filter((s) => s.outstandingDues > 0);
    return {
      count: selected.length,
      totalDues,
      withDuesCount: studentsWithDues.length
    };
  }, [rosterData.roster, selectedEnrollmentIds]);

  // Execute Mass Relieving
  const handleConfirmRelieve = async () => {
    if (selectedEnrollmentIds.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await massRelieveStudents({
        enrollmentIds: selectedEnrollmentIds,
        relievedDate,
      });

      toast.success(
        `Successfully relieved ${res.relievedCount} student(s) as COMPLETED.`
      );
      setIsConfirmOpen(false);
      await fetchRoster();
    } catch (err: any) {
      console.error("Mass relieve failed", err);
      toast.error(err?.response?.data?.message || "Failed to relieve students.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-[#556043]" />
              Student Relieving
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select students from a class to mass relieve graduating or departing students.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter Bar Card ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Academic Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Academic Year
              </label>
              <Select
                value={selectedAcademicYear}
                onValueChange={setSelectedAcademicYear}
                disabled={loading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((ay) => (
                    <SelectItem key={ay.id} value={ay.id}>
                      {ay.name} {ay.isActive && "• (Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Class
              </label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={loading || classes.length === 0}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Division */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Division
              </label>
              <Select
                value={selectedDivision}
                onValueChange={setSelectedDivision}
                disabled={loading || !selectedClass}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      Division {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Search Student
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Name or Admission #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchRoster()}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Enrolled</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {rosterData.summary.total}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active (Relievable)</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {rosterData.summary.active}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Already Relieved</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                {rosterData.summary.completed}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">With Dues</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                {rosterData.summary.withDues}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Table Roster Card ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">Class Roster</CardTitle>
              <CardDescription className="text-xs">
                Select active students below to mark their enrollments as completed.
              </CardDescription>
            </div>
            {relievableStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {selectedEnrollmentIds.length} of {relievableStudents.length} selected
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] border-none text-white">
                <TableHead className="w-12 px-4 text-center">
                  <Checkbox
                    checked={allRelievableSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={relievableStudents.length === 0}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#556043]"
                  />
                </TableHead>
                <TableHead className="text-white font-semibold whitespace-nowrap">Roll #</TableHead>
                <TableHead className="text-white font-semibold whitespace-nowrap">Admission #</TableHead>
                <TableHead className="text-white font-semibold whitespace-nowrap">Student Name</TableHead>
                <TableHead className="text-white font-semibold whitespace-nowrap">Division</TableHead>
                <TableHead className="text-white font-semibold whitespace-nowrap">Transport</TableHead>
                <TableHead className="text-white font-semibold whitespace-nowrap">Outstanding Dues</TableHead>
                <TableHead className="text-white font-semibold whitespace-nowrap text-right">Enrollment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetchingRoster ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#556043]" />
                    <p className="mt-2 text-xs text-slate-500">Loading student roster...</p>
                  </TableCell>
                </TableRow>
              ) : rosterData.roster.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center text-slate-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-400 stroke-1" />
                    No students found in this class/division.
                  </TableCell>
                </TableRow>
              ) : (
                rosterData.roster.map((student) => {
                  const isSelected = selectedEnrollmentIds.includes(student.enrollmentId);
                  const hasDues = student.outstandingDues > 0;

                  return (
                    <TableRow
                      key={student.enrollmentId}
                      className={
                        !student.isRelievable
                          ? "bg-slate-50/50 dark:bg-slate-900/20 opacity-70"
                          : isSelected
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                          : ""
                      }
                    >
                      <TableCell className="px-4 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(student.enrollmentId)}
                          disabled={!student.isRelievable}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.rollNumber}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {student.admissionNumber}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {student.studentName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {student.divisionName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {student.assignedVehicle ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Bus className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            {student.assignedVehicle}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasDues ? (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 font-semibold"
                          >
                            ₹{student.outstandingDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                          >
                            Clear (₹0)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {student.enrollmentStatus === "ACTIVE" ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                          >
                            Active
                          </Badge>
                        ) : student.enrollmentStatus === "COMPLETED" ? (
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 font-medium"
                          >
                            Relieved
                          </Badge>
                        ) : student.enrollmentStatus === "PROMOTED" ? (
                          <Badge
                            variant="outline"
                            className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400 font-medium"
                          >
                            Promoted
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          >
                            {student.enrollmentStatus}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Bottom Action Dock ── */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedEnrollmentIds.length}
            </span>{" "}
            student(s) selected
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Relieving Date:
              </label>
              <Input
                type="date"
                value={relievedDate}
                onChange={(e) => setRelievedDate(e.target.value)}
                className="w-full sm:w-44 h-9"
              />
            </div>

            <Button
              className="w-full sm:w-auto bg-[#556043] text-white hover:bg-[#464f37]"
              disabled={selectedEnrollmentIds.length === 0}
              onClick={() => setIsConfirmOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Relieve Selected ({selectedEnrollmentIds.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Confirmation Modal ── */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <GraduationCap className="h-5 w-5 text-[#556043]" />
              Confirm Student Relieving
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="text-slate-700 dark:text-slate-300">
                  You are about to relieve{" "}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {selectedStudentsInfo.count} student(s)
                  </strong>{" "}
                  on{" "}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {new Date(relievedDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </strong>
                  .
                </p>

                <div className="rounded-lg bg-slate-100 dark:bg-slate-800/60 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span>Enrollment Status:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">COMPLETED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Student Master Status:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">WITHDRAWN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recurring Billing:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Deactivated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport Capacity:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Released</span>
                  </div>
                </div>

                {selectedStudentsInfo.totalDues > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Outstanding Dues Notice:
                    </p>
                    <p>
                      {selectedStudentsInfo.withDuesCount} student(s) currently have{" "}
                      <strong>
                        ₹{selectedStudentsInfo.totalDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>{" "}
                      in unpaid fees.
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      These past fee records will remain safely preserved in Fee Collection so school accountants can collect them anytime.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#556043] text-white hover:bg-[#464f37]"
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRelieve();
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Relieving...
                </>
              ) : (
                "Confirm & Relieve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
