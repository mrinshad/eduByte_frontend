"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
    CheckCircle2, 
    Loader2, 
    ArrowLeft, 
    Receipt,
    Search,
    Check,
    AlertCircle,
    Layers,
    Users,
    Sparkles,
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
import { getFeeStructures, FeeStructureSummary } from "@/lib/services/feeStructure";
import { 
    getEnrollmentsWithoutFeeStructure, 
    bulkAssignFeeStructure, 
    UnassignedFeeStudent, 
    FeeAssignmentSummary 
} from "@/lib/services/feeStructureAssignment";
import { useCurrentAcademicYear } from "@/lib/academic-year-store";

export default function BulkFeeAssignPage() {
    const router = useRouter();
    const globalAcademicYearId = useCurrentAcademicYear();

    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);

    // Dropdown Data
    const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [feeStructures, setFeeStructures] = useState<FeeStructureSummary[]>([]);

    // Selected Filters
    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedDivision, setSelectedDivision] = useState("all");
    const [viewMode, setViewMode] = useState<"UNASSIGNED" | "ALL">("UNASSIGNED");

    // Table Data & Search
    const [students, setStudents] = useState<UnassignedFeeStudent[]>([]);
    const [summary, setSummary] = useState<FeeAssignmentSummary | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<Set<string>>(new Set());

    // Target Fee Structure to Assign
    const [targetFeeStructureId, setTargetFeeStructureId] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Initial Load: Academic Years and Classes
    useEffect(() => {
        async function fetchInitialData() {
            try {
                const [years, cls] = await Promise.all([
                    getAcademicYears(),
                    getClasses()
                ]);
                setAcademicYears(years);
                setClasses(cls);

                // Match global academic year by either ID or name so selectedAcademicYear always holds the valid year ID
                const matchedYear = years.find(
                    y => y.id === globalAcademicYearId || y.name?.trim() === globalAcademicYearId?.trim()
                );
                if (matchedYear) {
                    setSelectedAcademicYear(matchedYear.id);
                } else if (years.length > 0) {
                    const active = years.find(y => y.isActive);
                    setSelectedAcademicYear(active ? active.id : years[0].id);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
                toast.error("Failed to load classes or academic years");
            }
        }
        fetchInitialData();
    }, [globalAcademicYearId]);

    // Keep selectedAcademicYear synchronized whenever global academic year changes
    useEffect(() => {
        if (!globalAcademicYearId || globalAcademicYearId === "Academic Year" || academicYears.length === 0) return;
        const matchedYear = academicYears.find(
            y => y.id === globalAcademicYearId || y.name?.trim() === globalAcademicYearId?.trim()
        );
        if (matchedYear && matchedYear.id !== selectedAcademicYear) {
            setSelectedAcademicYear(matchedYear.id);
        }
    }, [globalAcademicYearId, academicYears, selectedAcademicYear]);

    // When Class changes: fetch Divisions and FeeStructures for that class
    useEffect(() => {
        if (selectedClass) {
            getDivisions(selectedClass)
                .then(setDivisions)
                .catch(() => setDivisions([]));
            setSelectedDivision("all");

            const classObj = classes.find(c => c.id === selectedClass);
            const yearObj = academicYears.find(y => y.id === selectedAcademicYear);

            // Fetch Fee Structures for this class & year
            getFeeStructures({
                className: classObj?.name || undefined,
                academicYear: yearObj?.name || undefined,
                status: "active",
                limit: 100
            })
                .then(res => {
                    const activeStructures = res.items || [];
                    setFeeStructures(activeStructures);
                    setTargetFeeStructureId(activeStructures.length > 0 ? activeStructures[0].id : "");
                })
                .catch(() => setFeeStructures([]));
        } else {
            setDivisions([]);
            setFeeStructures([]);
            setTargetFeeStructureId("");
        }
    }, [selectedClass, selectedAcademicYear, classes, academicYears]);

    // Load Students when Filters Change
    useEffect(() => {
        if (selectedAcademicYear && selectedClass) {
            loadStudents();
        } else {
            setStudents([]);
            setSummary(null);
            setSelectedEnrollmentIds(new Set());
        }
    }, [selectedAcademicYear, selectedClass, selectedDivision, viewMode]);

    const loadStudents = async () => {
        setFetchingStudents(true);
        try {
            const data = await getEnrollmentsWithoutFeeStructure(
                selectedAcademicYear,
                selectedClass,
                selectedDivision,
                viewMode
            );
            setSummary(data.summary);
            setStudents(data.students);
            // Default select all unassigned students in view
            const unassigned = data.students.filter(s => !s.isAssigned).map(s => s.enrollmentId);
            setSelectedEnrollmentIds(new Set(unassigned));
        } catch (error: any) {
            console.error("Failed to fetch students", error);
            toast.error(error.message || "Failed to load students list");
        } finally {
            setFetchingStudents(false);
        }
    };

    // Filtered Students by Search
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const query = searchQuery.toLowerCase();
            return (
                s.studentName.toLowerCase().includes(query) ||
                s.admissionNumber.toLowerCase().includes(query)
            );
        });
    }, [students, searchQuery]);

    // Select All Toggle
    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEnrollmentIds(new Set(filteredStudents.map(s => s.enrollmentId)));
        } else {
            setSelectedEnrollmentIds(new Set());
        }
    };

    // Single Student Checkbox Toggle
    const handleToggleStudent = (enrollmentId: string, checked: boolean) => {
        const next = new Set(selectedEnrollmentIds);
        if (checked) {
            next.add(enrollmentId);
        } else {
            next.delete(enrollmentId);
        }
        setSelectedEnrollmentIds(next);
    };

    // Execute Bulk Assignment
    const handleExecuteAssignment = async () => {
        if (!targetFeeStructureId || selectedEnrollmentIds.size === 0) {
            toast.error("Please select a fee structure and at least one student.");
            return;
        }

        setLoading(true);
        try {
            const res = await bulkAssignFeeStructure({
                enrollmentIds: Array.from(selectedEnrollmentIds),
                feeStructureId: targetFeeStructureId
            });

            toast.success(res.message || `Assigned fee structure to ${selectedEnrollmentIds.size} students.`);
            setShowConfirmDialog(false);
            await loadStudents();
        } catch (error: any) {
            console.error("Bulk assign failed", error);
            toast.error(error.message || "Failed to assign fee structure.");
        } finally {
            setLoading(false);
        }
    };

    const targetStructureObj = feeStructures.find(fs => fs.id === targetFeeStructureId);

    return (
        <PermissionGate permission="feestructures.bulkAssignButton">
            <section className="w-full px-4 py-4 sm:px-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            size="icon"
                            className="bg-background text-foreground hover:opacity-90 shadow-sm shrink-0"
                            onClick={() => router.push("/admin/fee-structures")}
                        >
                            <ArrowLeft className="h-4 w-4 text-foreground" />
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                Bulk Fee Structure Assignment
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Assign fee templates in bulk to promoted or newly admitted students.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Card */}
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 px-4 sm:px-6 py-4 bg-white dark:bg-slate-900/50">
                        <div className="flex items-center gap-2.5">
                            <Layers className="h-5 w-5 text-[#556043] dark:text-[#9ea98a]" />
                            <div>
                                <CardTitle className="text-lg  font-bold text-slate-950 dark:text-white">
                                    Target Class & Academic Year
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                                    Filter students by academic year, class, and division to assign fee structures.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block mb-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    Academic Year <span className="text-red-500">*</span>
                                </label>
                                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                                    <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                                        <SelectValue placeholder="Select Academic Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicYears.map(ay => (
                                            <SelectItem key={ay.id} value={ay.id}>
                                                {ay.name} {ay.isActive && "(Active)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block mb-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block mb-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    Division
                                </label>
                                <Select value={selectedDivision} onValueChange={setSelectedDivision} disabled={!selectedClass}>
                                    <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                                        <SelectValue placeholder="All Divisions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Divisions</SelectItem>
                                        {divisions.map(d => (
                                            <SelectItem key={d.id} value={d.id}>
                                                Division {d.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block mb-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    Display Mode
                                </label>
                                <Select value={viewMode} onValueChange={(val: "UNASSIGNED" | "ALL") => setViewMode(val)}>
                                    <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                                        <SelectValue placeholder="Display" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNASSIGNED">Unassigned Only</SelectItem>
                                        <SelectItem value="ALL">All Active Students</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Summary Metrics */}
                        {summary && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/40 text-center">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total}</div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Enrolled in Class</div>
                                </div>
                                <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-center">
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{summary.assigned}</div>
                                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-500 mt-0.5">Fee Structure Assigned</div>
                                </div>
                                <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 text-center">
                                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.unassigned}</div>
                                    <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-0.5">Missing Fee Structure</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bulk Assignment Action Card */}
                {selectedClass && (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900/50 dark:border-slate-800/50">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 text-xs sm:text-sm rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#556043]"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-1 max-w-sm">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    Assign Fee:
                                </span>
                                <Select value={targetFeeStructureId} onValueChange={setTargetFeeStructureId}>
                                    <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-[#556043]">
                                        <SelectValue placeholder={feeStructures.length === 0 ? "No fee structures found" : "Select Fee Structure"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {feeStructures.map(fs => (
                                            <SelectItem key={fs.id} value={fs.id}>
                                                {fs.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 justify-end">
                            <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs px-3 py-1.5 font-medium rounded-lg">
                                {selectedEnrollmentIds.size} selected
                            </Badge>

                            <Button
                                onClick={() => setShowConfirmDialog(true)}
                                disabled={selectedEnrollmentIds.size === 0 || !targetFeeStructureId || loading}
                                className="h-10 px-4 text-xs sm:text-sm font-medium rounded-lg bg-[#556043] hover:bg-[#4a533b] text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm gap-2"
                            >
                                <Receipt className="h-4 w-4" />
                                Assign to {selectedEnrollmentIds.size} Students
                            </Button>
                        </div>
                    </div>
                )}

                {/* Table */}
                {selectedClass && (
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                    <TableHead className="w-12 text-center text-white dark:text-foreground font-semibold px-4 sm:px-6 h-12">
                                        <Checkbox
                                            checked={filteredStudents.length > 0 && selectedEnrollmentIds.size === filteredStudents.length}
                                            onCheckedChange={handleToggleSelectAll}
                                            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#556043] dark:border-slate-500 dark:data-[state=checked]:bg-slate-100 dark:data-[state=checked]:text-slate-900"
                                        />
                                    </TableHead>
                                    <TableHead className="text-white dark:text-foreground font-semibold text-xs whitespace-nowrap px-4 sm:px-6 h-12">Admission #</TableHead>
                                    <TableHead className="text-white dark:text-foreground font-semibold text-xs whitespace-nowrap px-4 sm:px-6 h-12">Student Name</TableHead>
                                    <TableHead className="text-white dark:text-foreground font-semibold text-xs whitespace-nowrap px-4 sm:px-6 h-12">Division</TableHead>
                                    <TableHead className="text-white dark:text-foreground font-semibold text-xs whitespace-nowrap px-4 sm:px-6 h-12">Father Name</TableHead>
                                    <TableHead className="text-white dark:text-foreground font-semibold text-xs whitespace-nowrap text-right px-4 sm:px-6 h-12">Fee Structure Status</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {fetchingStudents ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                                <span>Loading student fee assignments...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {viewMode === "UNASSIGNED" 
                                                        ? "All active students in this class have a fee structure assigned!" 
                                                        : "No students found."}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map(student => {
                                        const isSelected = selectedEnrollmentIds.has(student.enrollmentId);

                                        return (
                                            <TableRow 
                                                key={student.enrollmentId}
                                                className={`transition-colors cursor-pointer border-slate-100 dark:border-slate-800/50 ${
                                                    isSelected ? "bg-[#556043]/5 dark:bg-[#556043]/15" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                                }`}
                                                onClick={() => handleToggleStudent(student.enrollmentId, !isSelected)}
                                            >
                                                <TableCell className="text-center px-4 sm:px-6 py-4" onClick={e => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={checked => handleToggleStudent(student.enrollmentId, !!checked)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 px-4 sm:px-6 py-4">
                                                    {student.admissionNumber}
                                                </TableCell>
                                                <TableCell className="font-semibold text-xs sm:text-sm text-slate-950 dark:text-white px-4 sm:px-6 py-4">
                                                    {student.studentName}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 px-4 sm:px-6 py-4">
                                                    Division {student.divisionName}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 px-4 sm:px-6 py-4">
                                                    {student.fatherName || "—"}
                                                </TableCell>
                                                <TableCell className="text-right text-xs px-4 sm:px-6 py-4">
                                                    {student.isAssigned ? (
                                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-medium dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md">
                                                            {student.feeStructureName}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-medium dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 rounded-md">
                                                            Unassigned
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
                )}

                {/* Confirmation Dialog */}
                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent className="w-[92vw] sm:max-w-lg rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold text-slate-100 dark:text-white">
                                Assign Fee Structure to {selectedEnrollmentIds.size} Students?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs sm:text-sm text-slate-200 dark:text-slate-400">
                                This will assign <strong>{targetStructureObj?.name}</strong> to the <strong>{selectedEnrollmentIds.size}</strong> selected student(s) and generate the corresponding enrollment fee templates.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
                            <AlertDialogCancel disabled={loading} className="w-full sm:w-auto rounded-full">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={e => {
                                    e.preventDefault();
                                    handleExecuteAssignment();
                                }}
                                disabled={loading}
                                className="w-full sm:w-auto bg-[#4a533b]  dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-full"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Confirm Assignment
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </section>
        </PermissionGate>
    );
}
