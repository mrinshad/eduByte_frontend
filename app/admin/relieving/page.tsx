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
  CreditCard,
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

export default function StudentRelievingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetchingRoster, setFetchingRoster] = useState(false);

  // Reference Data
  const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  // Strict Hierarchy: Academic Year -> Class -> Division
  // Starts completely UNSELECTED so user is forced to select Academic Year first
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Roster & Selection State
  const [rosterData, setRosterData] = useState<RelievingRosterResponse>({
    roster: [],
    summary: { total: 0, active: 0, completed: 0, withDues: 0 }
  });
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [relievedDate, setRelievedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial load of master dropdown data (without auto-preselecting academic year)
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
        // Strict sequence: Do NOT auto-preselect academic year.
        // User must explicitly pick the Academic Year first.
      } catch (err) {
        console.error("Failed to load filter options", err);
        toast.error("Failed to load initial dropdown options.");
      } finally {
        setLoading(false);
      }
    }
    initDropdowns();
  }, []);

  // Load divisions dynamically when Class changes
  useEffect(() => {
    async function loadDivisionsForClass() {
      if (!selectedClass) {
        setDivisions([]);
        setSelectedDivision("");
        return;
      }
      try {
        const divs = await getDivisions(selectedClass);
        setDivisions(divs);
        setSelectedDivision("all");
      } catch (err) {
        console.error("Failed to fetch divisions", err);
        setDivisions([]);
        setSelectedDivision("");
      }
    }
    loadDivisionsForClass();
  }, [selectedClass]);

  // Fetch student roster whenever valid filters change
  const fetchRoster = async () => {
    if (!selectedAcademicYear || !selectedClass) {
      setRosterData({
        roster: [],
        summary: { total: 0, active: 0, completed: 0, withDues: 0 }
      });
      setSelectedEnrollmentIds([]);
      return;
    }

    try {
      setFetchingRoster(true);
      const data = await getRosterForRelieving({
        academicYearId: selectedAcademicYear,
        classId: selectedClass,
        divisionId: selectedDivision || "all",
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

  // Handle Hierarchical Academic Year Change
  const handleAcademicYearChange = (yearId: string) => {
    setSelectedAcademicYear(yearId);
    setSelectedClass(""); // Reset downstream class
    setSelectedDivision(""); // Reset downstream division
    setDivisions([]);
    setRosterData({
      roster: [],
      summary: { total: 0, active: 0, completed: 0, withDues: 0 }
    });
    setSelectedEnrollmentIds([]);
  };

  // Handle Hierarchical Class Change
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedDivision(classId ? "all" : ""); // Reset downstream division
    setSelectedEnrollmentIds([]);
  };

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

  // Metadata labels
  const selectedYearObj = academicYears.find((y) => y.id === selectedAcademicYear);
  const selectedClassObj = classes.find((c) => c.id === selectedClass);

  return (
    <PermissionGate permission="students.listOnNavbar">
      <section className="w-full px-4 py-4 sm:px-6 space-y-6">
        {/* ── Page Header (Matching Student Promotion) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-[#556043] dark:text-[#9ea98a]" />
                Student Relieving
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Select an academic year and class in order to mass relieve graduating or departing students.
              </p>
            </div>
          </div>
        </div>

        {/* ── Top Selection Card: Academic Year & Class (Matching Promotion Step 1) ── */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 px-4 sm:px-6 py-4 bg-white dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="h-5 w-5 text-[#556043] dark:text-[#9ea98a]" />
              <div>
                <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                  Source Class Selection
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select the academic year and class you wish to relieve students from.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1: Academic Year */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedAcademicYear}
                  onValueChange={handleAcademicYearChange}
                  disabled={loading}
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((ay) => (
                      <SelectItem key={ay.id} value={ay.id}>
                        {ay.name} {ay.isActive && "• (Active Year)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Class (Strictly disabled until Academic Year is picked) */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Class <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedClass}
                  onValueChange={handleClassChange}
                  disabled={loading || !selectedAcademicYear || classes.length === 0}
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                    <SelectValue
                      placeholder={
                        !selectedAcademicYear ? "Select Academic Year first" : "Select Class"
                      }
                    />
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
            </div>

            {/* ── Progress Dashboard / Metric Cards (Inside Top Card, matching Promotion Step 1) ── */}
            {selectedClass && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Class Roster Status Summary
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedClassObj?.name} ({selectedYearObj?.name})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {rosterData.summary.total}
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Total Enrolled
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-lg border-2 border-[#556043] bg-[#556043]/10 dark:bg-[#556043]/20 text-center relative overflow-hidden">
                    <div className="text-2xl font-bold text-[#556043] dark:text-[#9ea98a]">
                      {rosterData.summary.active}
                    </div>
                    <div className="text-xs font-semibold text-[#556043] dark:text-[#9ea98a] mt-0.5">
                      Active (Relievable)
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20 text-center">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {rosterData.summary.completed}
                    </div>
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                      Already Relieved
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 text-center">
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {rosterData.summary.withDues}
                    </div>
                    <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                      With Dues
                    </div>
                  </div>
                </div>

                {rosterData.summary.total > 0 && rosterData.summary.active === 0 && (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>All students in this class have already been relieved for this academic year.</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Action & Filter Bar (Matching Promotion Step 2) ── */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={
                  !selectedClass ? "Select class to search..." : "Search by name or admission #..."
                }
                value={searchQuery}
                disabled={!selectedClass}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchRoster()}
                className="pl-9 h-10 w-full text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#556043]"
              />
            </div>

            {/* Step 3: Division Filter (Strictly disabled until Class is picked) */}
            <Select
              value={selectedDivision}
              onValueChange={setSelectedDivision}
              disabled={!selectedClass}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm w-full sm:w-44 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                <SelectValue
                  placeholder={!selectedClass ? "Select Class first" : "All Divisions"}
                />
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

          <div className="flex items-center gap-2 justify-end">
            {selectedClass && (
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-100 text-slate-700 text-xs px-3 py-1 font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md"
              >
                {selectedEnrollmentIds.length} of {relievableStudents.length} selected
              </Badge>
            )}

            <Button
              size="sm"
              disabled={selectedEnrollmentIds.length === 0 || !selectedClass}
              onClick={() => setIsConfirmOpen(true)}
              className="h-10 text-xs sm:text-sm font-semibold rounded-lg bg-[#556043] hover:bg-[#4a533b] text-white shadow-sm gap-1.5 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 px-4"
            >
              <LogOut className="h-4 w-4" />
              Relieve Selected ({selectedEnrollmentIds.length})
            </Button>
          </div>
        </div>

        {/* ── Students Table (Matching Promotion Step 2 Styling) ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none text-white">
                <TableHead className="w-12 px-4 sm:px-6 h-12 text-center text-white dark:text-foreground font-semibold">
                  <Checkbox
                    checked={allRelievableSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={relievableStudents.length === 0 || !selectedClass}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#556043]"
                  />
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">
                  Roll #
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">
                  Admission #
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">
                  Student Name
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">
                  Division
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">
                  Transport
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">
                  Outstanding Dues
                </TableHead>
                <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right text-xs sm:text-sm">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Hierarchical Placeholder: Academic Year not selected */}
              {!selectedAcademicYear ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                      <GraduationCap className="h-8 w-8 text-slate-400 dark:text-slate-600 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No Academic Year Selected
                      </p>
                      <p className="text-xs text-slate-500">
                        Please select an Academic Year above to begin.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !selectedClass ? (
                /* Hierarchical Placeholder: Class not selected */
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                      <GraduationCap className="h-8 w-8 text-slate-400 dark:text-slate-600 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No Class Selected
                      </p>
                      <p className="text-xs text-slate-500">
                        Please select a Class above to load eligible students.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : fetchingRoster ? (
                /* Loading State */
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                      <p className="text-xs font-medium">Fetching class student roster...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rosterData.roster.length === 0 ? (
                /* Empty Roster */
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center text-slate-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-400 stroke-1" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No Students Found
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No student enrollments exist for this class and division.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                /* Student Rows */
                rosterData.roster.map((student) => {
                  const isSelected = selectedEnrollmentIds.includes(student.enrollmentId);
                  const hasDues = student.outstandingDues > 0;

                  return (
                    <TableRow
                      key={student.enrollmentId}
                      className={`border-slate-100 dark:border-slate-800/50 transition-colors ${
                        !student.isRelievable
                          ? "bg-slate-50/30 dark:bg-slate-900/20 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-[#556043]/10 dark:bg-[#556043]/20 cursor-pointer"
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (student.isRelievable) {
                          handleToggleSelect(student.enrollmentId);
                        }
                      }}
                    >
                      <TableCell
                        className="px-4 sm:px-6 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(student.enrollmentId)}
                          disabled={!student.isRelievable}
                        />
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {student.rollNumber || "—"}
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 font-mono text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                        {student.admissionNumber}
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {student.studentName}
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        {student.divisionName ? `Division ${student.divisionName}` : "—"}
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                        {student.assignedVehicle ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium dark:bg-slate-800 dark:text-slate-300">
                            <Bus className="h-3 w-3 text-slate-500" />
                            {student.assignedVehicle}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                        {hasDues ? (
                          <Badge
                            variant="outline"
                            className="border-rose-200 bg-rose-50 text-rose-700 font-semibold dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 text-xs gap-1"
                          >
                            <CreditCard className="h-3 w-3" />
                            ₹{student.outstandingDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">₹0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 text-right">
                        {student.enrollmentStatus === "ACTIVE" ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400 font-medium"
                          >
                            Active
                          </Badge>
                        ) : student.enrollmentStatus === "COMPLETED" ? (
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-400 font-medium"
                          >
                            Relieved
                          </Badge>
                        ) : student.enrollmentStatus === "PROMOTED" ? (
                          <Badge
                            variant="outline"
                            className="border-purple-200 bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-400 font-medium"
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

        {/* ── Confirmation Modal (Matching Promotion Theme) ── */}
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
                    </strong>
                    .
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Relieving Date:
                    </label>
                    <Input
                      type="date"
                      value={relievedDate}
                      onChange={(e) => setRelievedDate(e.target.value)}
                      className="w-full h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]"
                    />
                  </div>

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
                className="bg-[#556043] hover:bg-[#4a533b] text-white"
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
      </section>
    </PermissionGate>
  );
}
