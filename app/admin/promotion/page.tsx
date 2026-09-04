"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft, 
    AlertCircle, 
    Loader2, 
    ArrowLeft, 
    GraduationCap,
    Users,
    Bus,
    CreditCard,
    Search,
    X,
    Check,
    AlertTriangle,
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
import { getVehicles, Vehicle } from "@/lib/services/vehicle";
import { getAcademicYears, AcademicYearSummary } from "@/lib/services/academicYear";
import { 
    getStudentsForPromotion, 
    promoteStudents, 
    completeStudents, 
    PromotionStudent, 
    PromotionSummary,
    PromotionPayloadStudent 
} from "@/lib/services/promotion";
import { useCurrentAcademicYear } from "@/lib/academic-year-store";

const STEPS = [
    { num: 1, title: "Source Class", subtitle: "Select source & view progress", icon: GraduationCap },
    { num: 2, title: "Select Students", subtitle: "Choose students to promote", icon: Users },
    { num: 3, title: "Destination & Config", subtitle: "Target class, dues & transport", icon: Bus },
    { num: 4, title: "Review & Confirm", subtitle: "Final validation & execute", icon: CheckCircle2 }
];

export default function PromotionStepperPage() {
    const router = useRouter();
    const globalAcademicYearId = useCurrentAcademicYear();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Global Reference Data
    const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    // Step 1: Source Selection State
    const [sourceAcademicYear, setSourceAcademicYear] = useState("");
    const [sourceClass, setSourceClass] = useState("");
    const [summary, setSummary] = useState<PromotionSummary | null>(null);
    const [students, setStudents] = useState<PromotionStudent[]>([]);
    const [fetchingStudents, setFetchingStudents] = useState(false);

    // Step 2: Student Selection State
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [divisionFilter, setDivisionFilter] = useState("all");
    const [completingStudentIds, setCompletingStudentIds] = useState<string[] | null>(null);

    // Step 3: Destination & Per-Student Config State
    const [targetAcademicYear, setTargetAcademicYear] = useState("");
    const [targetClass, setTargetClass] = useState("");
    const [targetDivisions, setTargetDivisions] = useState<Division[]>([]);
    const [targetDivision, setTargetDivision] = useState("");
    const [loadingDivisions, setLoadingDivisions] = useState(false);

    // Carry-forward states mapped by enrollmentId
    const [carryForwardDues, setCarryForwardDues] = useState<Record<string, boolean>>({});
    const [carryForwardVehicles, setCarryForwardVehicles] = useState<Record<string, boolean>>({});
    const [studentVehicles, setStudentVehicles] = useState<Record<string, string>>({});

    // Fetch master dropdowns on mount
    useEffect(() => {
        async function fetchMasterData() {
            try {
                const [years, cls, vehs] = await Promise.all([
                    getAcademicYears(),
                    getClasses(),
                    getVehicles()
                ]);
                setAcademicYears(years);
                setClasses(cls);
                setVehicles(vehs);

                // Set default academic year
                if (globalAcademicYearId && globalAcademicYearId !== "Academic Year") {
                    setSourceAcademicYear(globalAcademicYearId);
                } else if (years.length > 0) {
                    const active = years.find(y => y.isActive);
                    setSourceAcademicYear(active ? active.id : years[0].id);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
                toast.error("Failed to load reference data");
            }
        }
        fetchMasterData();
    }, [globalAcademicYearId]);

    // Load students whenever source academic year or class changes
    useEffect(() => {
        if (sourceAcademicYear && sourceClass) {
            loadStudentsData();
        } else {
            setStudents([]);
            setSummary(null);
            setSelectedStudentIds(new Set());
        }
    }, [sourceAcademicYear, sourceClass]);

    const loadStudentsData = async () => {
        setFetchingStudents(true);
        try {
            const data = await getStudentsForPromotion(sourceAcademicYear, sourceClass);
            setSummary(data.summary);
            setStudents(data.students);
            setSelectedStudentIds(new Set());
        } catch (error: any) {
            console.error("Failed to fetch students for promotion", error);
            toast.error(error.message || "Failed to load class students");
        } finally {
            setFetchingStudents(false);
        }
    };

    // Load divisions when target class changes
    useEffect(() => {
        if (targetClass) {
            setLoadingDivisions(true);
            getDivisions(targetClass)
                .then(divs => {
                    setTargetDivisions(divs);
                    setTargetDivision(divs.length > 0 ? divs[0].id : "");
                })
                .catch(err => {
                    console.error("Failed to load target divisions", err);
                    toast.error("Failed to load divisions for selected class");
                })
                .finally(() => setLoadingDivisions(false));
        } else {
            setTargetDivisions([]);
            setTargetDivision("");
        }
    }, [targetClass]);

    // Filtered students in Step 2
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDivision = divisionFilter === "all" || s.divisionId === divisionFilter;
            return matchesSearch && matchesDivision;
        });
    }, [students, searchQuery, divisionFilter]);

    // Unique divisions from loaded active students
    const availableDivisions = useMemo(() => {
        const divMap = new Map<string, string>();
        students.forEach(s => {
            if (s.divisionId && s.divisionName) {
                divMap.set(s.divisionId, s.divisionName);
            }
        });
        return Array.from(divMap.entries()).map(([id, name]) => ({ id, name }));
    }, [students]);

    // Selected students list object
    const selectedStudents = useMemo(() => {
        return students.filter(s => selectedStudentIds.has(s.enrollmentId));
    }, [students, selectedStudentIds]);

    // Toggle select all
    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(new Set(filteredStudents.map(s => s.enrollmentId)));
        } else {
            setSelectedStudentIds(new Set());
        }
    };

    // Toggle single student
    const handleToggleStudent = (enrollmentId: string, checked: boolean) => {
        const next = new Set(selectedStudentIds);
        if (checked) {
            next.add(enrollmentId);
        } else {
            next.delete(enrollmentId);
        }
        setSelectedStudentIds(next);
    };

    // Step 3 Initialization: pre-populate defaults for selected students
    useEffect(() => {
        if (currentStep === 3) {
            const nextDues: Record<string, boolean> = {};
            const nextCVehicles: Record<string, boolean> = {};
            const nextVehicles: Record<string, string> = {};

            selectedStudents.forEach(s => {
                // Default dues carry-forward to true if student has dues
                if (s.outstandingDues > 0 && carryForwardDues[s.enrollmentId] === undefined) {
                    nextDues[s.enrollmentId] = true;
                }
                // Default vehicle carry-forward to true if student has vehicle
                if (s.vehicleAssignment && carryForwardVehicles[s.enrollmentId] === undefined) {
                    nextCVehicles[s.enrollmentId] = true;
                    nextVehicles[s.enrollmentId] = s.vehicleAssignment.vehicleId;
                }
            });

            setCarryForwardDues(prev => ({ ...nextDues, ...prev }));
            setCarryForwardVehicles(prev => ({ ...nextCVehicles, ...prev }));
            setStudentVehicles(prev => ({ ...nextVehicles, ...prev }));

            // Auto-select target academic year if empty
            if (!targetAcademicYear && academicYears.length > 0) {
                // Try to find an academic year after source year, or default to current
                const currentIndex = academicYears.findIndex(y => y.id === sourceAcademicYear);
                if (currentIndex !== -1 && currentIndex + 1 < academicYears.length) {
                    setTargetAcademicYear(academicYears[currentIndex + 1].id);
                } else {
                    setTargetAcademicYear(sourceAcademicYear);
                }
            }
        }
    }, [currentStep, selectedStudents, sourceAcademicYear, academicYears]);

    // Handle "Mark as Completed"
    const handleExecuteComplete = async () => {
        if (!completingStudentIds || completingStudentIds.length === 0) return;

        setLoading(true);
        try {
            const res = await completeStudents(completingStudentIds);
            toast.success(res.message || `Successfully marked ${completingStudentIds.length} students as COMPLETED.`);
            setCompletingStudentIds(null);
            await loadStudentsData();
        } catch (error: any) {
            console.error("Failed to complete students", error);
            toast.error(error.message || "Failed to mark students as completed.");
        } finally {
            setLoading(false);
        }
    };

    // Handle "Promote Students" Execution (Step 4)
    const handleExecutePromotion = async () => {
        if (!sourceAcademicYear || !targetAcademicYear || !targetClass || !targetDivision || selectedStudents.length === 0) {
            toast.error("Please complete all destination settings.");
            return;
        }

        const payloadStudents: PromotionPayloadStudent[] = selectedStudents.map(s => ({
            enrollmentId: s.enrollmentId,
            carryForwardDues: s.outstandingDues > 0 ? (carryForwardDues[s.enrollmentId] ?? true) : true,
            carryForwardVehicle: !!carryForwardVehicles[s.enrollmentId],
            vehicleId: carryForwardVehicles[s.enrollmentId] ? (studentVehicles[s.enrollmentId] || null) : null
        }));

        setLoading(true);
        try {
            const res = await promoteStudents({
                sourceAcademicYearId: sourceAcademicYear,
                targetAcademicYearId: targetAcademicYear,
                targetClassId: targetClass,
                targetDivisionId: targetDivision,
                students: payloadStudents
            });

            toast.success(res.message || `Successfully promoted ${res.data?.promoted || selectedStudents.length} students.`);
            // Reset to step 1 and reload data
            setCurrentStep(1);
            setSelectedStudentIds(new Set());
            await loadStudentsData();
        } catch (error: any) {
            console.error("Promotion failed", error);
            toast.error(error.message || "Failed to promote students. Please review details.");
        } finally {
            setLoading(false);
        }
    };

    // Derived metadata for reviews
    const sourceYearObj = academicYears.find(y => y.id === sourceAcademicYear);
    const sourceClassObj = classes.find(c => c.id === sourceClass);
    const targetYearObj = academicYears.find(y => y.id === targetAcademicYear);
    const targetClassObj = classes.find(c => c.id === targetClass);
    const targetDivisionObj = targetDivisions.find(d => d.id === targetDivision);

    const studentsWithDues = useMemo(() => selectedStudents.filter(s => s.outstandingDues > 0), [selectedStudents]);
    const studentsWithVehicles = useMemo(() => selectedStudents.filter(s => s.vehicleAssignment !== null), [selectedStudents]);

    // Validation for Step 3: check if any student has dues but carry-forward is unchecked
    const blockedDuesStudents = useMemo(() => {
        return studentsWithDues.filter(s => carryForwardDues[s.enrollmentId] === false);
    }, [studentsWithDues, carryForwardDues]);

    const isStep3Valid = Boolean(
        targetAcademicYear && 
        targetClass && 
        targetDivision && 
        blockedDuesStudents.length === 0
    );

    // ==========================================
    // RENDER: STEP INDICATOR HEADER
    // ==========================================
    const renderStepperHeader = () => (
        <div className="w-full bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm dark:bg-slate-900/50 dark:border-slate-800/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STEPS.map((step) => {
                    const isCurrent = currentStep === step.num;
                    const isCompleted = currentStep > step.num;
                    const Icon = step.icon;

                    return (
                        <div 
                            key={step.num}
                            onClick={() => {
                                // Allow jumping back to earlier completed steps
                                if (isCompleted) setCurrentStep(step.num);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isCompleted ? "cursor-pointer hover:border-[#556043]/40 bg-slate-50/50 dark:bg-slate-900/40" : ""
                            } ${
                                isCurrent 
                                    ? "border-[#556043] bg-[#556043]/10 ring-1 ring-[#556043] dark:bg-[#556043]/20" 
                                    : isCompleted 
                                    ? "border-slate-200 dark:border-slate-800" 
                                    : "border-slate-100 bg-slate-50/30 opacity-60 dark:border-slate-800/40 dark:bg-slate-950/20"
                            }`}
                        >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 transition-colors ${
                                isCurrent 
                                    ? "bg-[#556043] text-white shadow-sm" 
                                    : isCompleted 
                                    ? "bg-emerald-600 text-white" 
                                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                                {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.num}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-semibold truncate ${
                                    isCurrent ? "text-[#556043] dark:text-[#9ea98a]" : isCompleted ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"
                                }`}>
                                    {step.title}
                                </p>
                                <p className="text-xs text-slate-500 truncate dark:text-slate-400">
                                    {step.subtitle}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ==========================================
    // RENDER: STEP 1 (SOURCE SELECTION)
    // ==========================================
    const renderStep1 = () => (
        <div className="space-y-6">
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 px-4 sm:px-6 py-4 bg-white dark:bg-slate-900/50">
                    <div className="flex items-center gap-2.5">
                        <GraduationCap className="h-5 w-5 text-[#556043] dark:text-[#9ea98a]" />
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                                Source Class Selection
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Select the academic year and class you wish to promote students from.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Source Academic Year <span className="text-red-500">*</span>
                            </label>
                            <Select value={sourceAcademicYear} onValueChange={setSourceAcademicYear}>
                                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                                    <SelectValue placeholder="Select Academic Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicYears.map(ay => (
                                        <SelectItem key={ay.id} value={ay.id}>
                                            {ay.name} {ay.isActive && "(Active Year)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Source Class <span className="text-red-500">*</span>
                            </label>
                            <Select value={sourceClass} onValueChange={setSourceClass}>
                                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
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
                    </div>

                    {/* Progress Dashboard */}
                    {fetchingStudents ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                            <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                            <p className="text-xs font-medium">Fetching class enrollment progress...</p>
                        </div>
                    ) : summary ? (
                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Class Enrollment Status Summary
                                </h4>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {sourceClassObj?.name} ({sourceYearObj?.name})
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                <div className="p-3 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-center">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {summary.total}
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Enrolled</div>
                                </div>

                                <div className="p-3 sm:p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20 text-center">
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                        {summary.promoted}
                                    </div>
                                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">Promoted</div>
                                </div>

                                <div className="p-3 sm:p-4 rounded-lg border border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20 text-center">
                                    <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                                        {summary.withdrawn}
                                    </div>
                                    <div className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-0.5">Withdrawn</div>
                                </div>

                                <div className="p-3 sm:p-4 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20 text-center">
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                        {summary.completed}
                                    </div>
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">Completed</div>
                                </div>

                                <div className="p-3 sm:p-4 rounded-lg border-2 border-[#556043] bg-[#556043]/10 dark:bg-[#556043]/20 text-center relative overflow-hidden">
                                    <div className="text-2xl font-bold text-[#556043] dark:text-[#9ea98a]">
                                        {summary.remaining}
                                    </div>
                                    <div className="text-xs font-semibold text-[#556043] dark:text-[#9ea98a] mt-0.5">Remaining Active</div>
                                </div>
                            </div>

                            {summary.remaining === 0 && (
                                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 font-medium">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>All students in this class have already been promoted, completed, or withdrawn for this academic year.</span>
                                </div>
                            )}
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!sourceAcademicYear || !sourceClass || !summary || summary.remaining === 0}
                    className="bg-[#556043] hover:bg-[#4a533b] text-white shadow-sm font-medium text-xs sm:text-sm h-10 px-6 gap-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-lg"
                >
                    Proceed to Select Students
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    // ==========================================
    // RENDER: STEP 2 (STUDENT SELECTION)
    // ==========================================
    const renderStep2 = () => (
        <div className="space-y-4">
            {/* Action & Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50">
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or admission #..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 w-full text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#556043]"
                        />
                    </div>

                    <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                        <SelectTrigger className="h-10 text-xs sm:text-sm w-full sm:w-44 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                            <SelectValue placeholder="All Divisions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Divisions</SelectItem>
                            {availableDivisions.map(d => (
                                <SelectItem key={d.id} value={d.id}>
                                    Division {d.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                    <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700 text-xs px-3 py-1 font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md">
                        {selectedStudentIds.size} of {filteredStudents.length} selected
                    </Badge>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompletingStudentIds(Array.from(selectedStudentIds))}
                        disabled={selectedStudentIds.size === 0 || loading}
                        className="h-10 text-xs sm:text-sm rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-950/40 font-medium"
                    >
                        Mark as Completed
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => setCurrentStep(3)}
                        disabled={selectedStudentIds.size === 0}
                        className="h-10 text-xs sm:text-sm font-semibold rounded-lg bg-[#556043] hover:bg-[#4a533b] text-white shadow-sm gap-1.5 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 px-4"
                    >
                        Configure Destination ({selectedStudentIds.size})
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Students Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                            <TableHead className="w-12 px-4 sm:px-6 h-12 text-center text-white dark:text-foreground font-semibold">
                                <Checkbox
                                    checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                                    onCheckedChange={handleToggleSelectAll}
                                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#556043]"
                                />
                            </TableHead>
                            <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Admission #</TableHead>
                            <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Student Name</TableHead>
                            <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Division</TableHead>
                            <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Father Name</TableHead>
                            <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Transport</TableHead>
                            <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right text-xs sm:text-sm">Outstanding Dues</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center text-xs sm:text-sm text-slate-500">
                                    No active students found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map(student => {
                                const isSelected = selectedStudentIds.has(student.enrollmentId);
                                const hasDues = student.outstandingDues > 0;

                                return (
                                    <TableRow 
                                        key={student.enrollmentId} 
                                        className={`border-slate-100 dark:border-slate-800/50 transition-colors cursor-pointer ${
                                            isSelected ? "bg-[#556043]/10 dark:bg-[#556043]/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                                        }`}
                                        onClick={() => handleToggleStudent(student.enrollmentId, !isSelected)}
                                    >
                                        <TableCell className="px-4 sm:px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => handleToggleStudent(student.enrollmentId, !!checked)}
                                            />
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                            {student.admissionNumber}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-100">
                                            {student.studentName}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                            {student.divisionName ? `Division ${student.divisionName}` : "—"}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                            {student.fatherName || "—"}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                            {student.vehicleAssignment ? (
                                                <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium dark:bg-slate-800 dark:text-slate-300">
                                                    <Bus className="h-3 w-3 text-slate-500" />
                                                    {student.vehicleAssignment.vehicleName}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-500">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm">
                                            {hasDues ? (
                                                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-semibold dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 text-xs">
                                                    ₹{student.outstandingDues.toFixed(2)}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">₹0.00</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Bottom Nav Bar */}
            <div className="flex justify-between items-center pt-2">
                <Button 
                    variant="ghost" 
                    onClick={() => setCurrentStep(1)} 
                    className="text-slate-600 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:text-[#9ea98a] dark:hover:bg-[#556043]/20 gap-1.5 font-medium text-xs sm:text-sm rounded-lg"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Source Class
                </Button>

                <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={selectedStudentIds.size === 0}
                    className="bg-[#556043] hover:bg-[#4a533b] text-white shadow-sm font-semibold h-10 px-6 gap-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-xs sm:text-sm rounded-lg"
                >
                    Proceed to Destination Settings
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    // ==========================================
    // RENDER: STEP 3 (DESTINATION CONFIG)
    // ==========================================
    const renderStep3 = () => (
        <div className="space-y-6">
            {/* Target Destination Card */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 px-4 sm:px-6 py-4 bg-white dark:bg-slate-900/50">
                    <div className="flex items-center gap-2.5">
                        <GraduationCap className="h-5 w-5 text-[#556043] dark:text-[#9ea98a]" />
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                                Destination Academic Setup
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Specify where the selected {selectedStudents.length} students will be promoted to.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Target Academic Year <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Select value={targetAcademicYear} onValueChange={setTargetAcademicYear}>
                                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                                    <SelectValue placeholder="Select Academic Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicYears.map(ay => (
                                        <SelectItem key={ay.id} value={ay.id}>
                                            {ay.name} {ay.isActive && "(Active Year)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Target Class <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Select value={targetClass} onValueChange={setTargetClass}>
                                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
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

                        <div className="space-y-2">
                            <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Target Division <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Select 
                                value={targetDivision} 
                                onValueChange={setTargetDivision}
                                disabled={!targetClass || loadingDivisions}
                            >
                                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#556043]">
                                    <SelectValue placeholder={loadingDivisions ? "Loading divisions..." : "Select Division"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {targetDivisions.map(d => (
                                        <SelectItem key={d.id} value={d.id}>
                                            Division {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2.5 font-medium">
                        <Sparkles className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                        <div>
                            <span className="font-semibold">Automatic Roll Number Allocation:</span> Roll numbers will be automatically assigned in alphabetical order (1, 2, 3...) for all active students in the destination class & division upon completion.
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Outstanding Dues Configuration Section */}
            {studentsWithDues.length > 0 && (
                <Card className="rounded-xl border border-rose-200/80 bg-white shadow-sm dark:border-rose-950 dark:bg-slate-900/50 overflow-hidden">
                    <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2.5">
                            <CreditCard className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                            <div>
                                <CardTitle className="text-base font-semibold text-rose-900 dark:text-rose-200">
                                    Outstanding Dues Carry-Forward ({studentsWithDues.length} Students)
                                </CardTitle>
                                <CardDescription className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                                    These students have pending fees or fines from the current session. Dues must be carried forward to allow promotion.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Admission #</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Student Name</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right text-xs sm:text-sm">Fee Due</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right text-xs sm:text-sm">Fine Due</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-right text-xs sm:text-sm">Total Outstanding</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-center w-48 text-xs sm:text-sm">Carry Forward Dues</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {studentsWithDues.map(s => {
                                    const isCarryingForward = carryForwardDues[s.enrollmentId] !== false;

                                    return (
                                        <TableRow key={s.enrollmentId} className={`border-slate-100 dark:border-slate-800/50 transition-colors ${!isCarryingForward ? "bg-rose-50/60 dark:bg-rose-950/30" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/40"}`}>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{s.admissionNumber}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-100">{s.studentName}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm text-slate-600 dark:text-slate-400">₹{s.feeDue.toFixed(2)}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm text-slate-600 dark:text-slate-400">₹{s.fineDue.toFixed(2)}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">₹{s.outstandingDues.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Checkbox
                                                        checked={isCarryingForward}
                                                        onCheckedChange={checked => {
                                                             setCarryForwardDues(prev => ({
                                                                ...prev,
                                                                [s.enrollmentId]: !!checked
                                                            }));
                                                        }}
                                                    />
                                                    <span className={`text-xs font-medium ${isCarryingForward ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400 font-semibold"}`}>
                                                        {isCarryingForward ? "Carry Forward" : "Blocked (Unchecked)"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {blockedDuesStudents.length > 0 && (
                        <div className="p-3.5 bg-rose-50/80 border-t border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                            <span>
                                <strong>Action Required:</strong> {blockedDuesStudents.length} student(s) cannot be promoted because their dues are not selected to carry forward. Please check "Carry Forward" or clear their dues first.
                            </span>
                        </div>
                    )}
                </Card>
            )}

            {/* Vehicle Assignment Configuration Section */}
            {studentsWithVehicles.length > 0 && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 px-4 sm:px-6 py-4 bg-white dark:bg-slate-900/50">
                        <div className="flex items-center gap-2.5">
                            <Bus className="h-5 w-5 text-[#556043] dark:text-[#9ea98a]" />
                            <div>
                                <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                                    Transport Vehicle Assignments ({studentsWithVehicles.length} Students)
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Choose whether to carry forward existing vehicle assignments to the new academic year.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Admission #</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Student Name</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Current Vehicle</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-center w-40 text-xs sm:text-sm">Carry Forward Transport</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap w-64 text-xs sm:text-sm">Target Vehicle</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {studentsWithVehicles.map(s => {
                                    const isCarryingVehicle = carryForwardVehicles[s.enrollmentId] !== false;
                                    const selectedVehicle = studentVehicles[s.enrollmentId] || s.vehicleAssignment?.vehicleId || "";

                                    return (
                                        <TableRow key={s.enrollmentId} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{s.admissionNumber}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-100">{s.studentName}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                                {s.vehicleAssignment?.vehicleName} ({s.vehicleAssignment?.vehicleNumber})
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Checkbox
                                                        checked={isCarryingVehicle}
                                                        onCheckedChange={checked => {
                                                            setCarryForwardVehicles(prev => ({
                                                                ...prev,
                                                                [s.enrollmentId]: !!checked
                                                            }));
                                                        }}
                                                    />
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                        {isCarryingVehicle ? "Yes" : "No"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={selectedVehicle}
                                                    onValueChange={val => {
                                                        setStudentVehicles(prev => ({
                                                            ...prev,
                                                            [s.enrollmentId]: val
                                                        }));
                                                    }}
                                                    disabled={!isCarryingVehicle}
                                                >
                                                    <SelectTrigger className="h-9 text-xs sm:text-sm rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus-visible:ring-1 focus-visible:ring-[#556043]">
                                                        <SelectValue placeholder="Select Vehicle" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {vehicles.map(v => (
                                                            <SelectItem key={v.id} value={v.id}>
                                                                {v.vehicleName} ({v.vehicleNumber})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Navigation Footer */}
            <div className="flex justify-between items-center pt-2">
                <Button 
                    variant="ghost" 
                    onClick={() => setCurrentStep(2)} 
                    className="text-slate-600 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:text-[#9ea98a] dark:hover:bg-[#556043]/20 gap-1.5 font-medium text-xs sm:text-sm rounded-lg"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Student Selection
                </Button>

                <Button
                    onClick={() => setCurrentStep(4)}
                    disabled={!isStep3Valid}
                    className="bg-[#556043] hover:bg-[#4a533b] text-white shadow-sm font-semibold h-10 px-6 gap-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-xs sm:text-sm rounded-lg"
                >
                    Review & Confirm Promotion
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    // ==========================================
    // RENDER: STEP 4 (REVIEW & CONFIRM)
    // ==========================================
    const renderStep4 = () => {
        const carriedDuesCount = selectedStudents.filter(s => s.outstandingDues > 0 && carryForwardDues[s.enrollmentId] !== false).length;
        const totalDuesAmount = selectedStudents
            .filter(s => s.outstandingDues > 0 && carryForwardDues[s.enrollmentId] !== false)
            .reduce((sum, s) => sum + s.outstandingDues, 0);

        const carriedVehiclesCount = selectedStudents.filter(s => s.vehicleAssignment && carryForwardVehicles[s.enrollmentId] !== false).length;

        return (
            <div className="space-y-6">
                {/* Executive Transition Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900/50">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Source Class Origin
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-1">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {sourceClassObj?.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                Academic Year: <span className="font-semibold text-slate-900 dark:text-slate-100">{sourceYearObj?.name}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-2 border-[#556043]/30 bg-[#556043]/5 shadow-sm dark:border-[#556043]/40 dark:bg-[#556043]/10 overflow-hidden">
                        <CardHeader className="border-b border-[#556043]/20 px-4 sm:px-6 py-3.5 bg-[#556043]/10 dark:bg-[#556043]/20">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#556043] dark:text-[#9ea98a]">
                                Target Destination
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-1">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {targetClassObj?.name} — Division {targetDivisionObj?.name}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                Academic Year: <span className="font-semibold text-slate-900 dark:text-slate-100">{targetYearObj?.name}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Key Summary Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-[#556043] dark:text-[#9ea98a]">
                            {selectedStudents.length}
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                            Students to Promote
                        </div>
                    </div>

                    <div className="p-3 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
                            {carriedDuesCount}
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                            Carrying Dues (₹{totalDuesAmount.toFixed(2)})
                        </div>
                    </div>

                    <div className="p-3 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {carriedVehiclesCount}
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                            Carrying Transport
                        </div>
                    </div>
                </div>

                {/* Read-Only Student Roster Preview */}
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900/50">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Student Roster for Promotion Execution ({selectedStudents.length})
                        </CardTitle>
                    </CardHeader>

                    <div className="overflow-x-auto max-h-96">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
                                    <TableHead className="w-12 px-4 sm:px-6 h-12 text-center text-white dark:text-foreground font-semibold text-xs sm:text-sm">#</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Admission #</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Student Name</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Source Div</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Dues Status</TableHead>
                                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap text-xs sm:text-sm">Transport</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {selectedStudents.map((s, idx) => {
                                    const hasDues = s.outstandingDues > 0;
                                    const assignedVehicleId = studentVehicles[s.enrollmentId] || s.vehicleAssignment?.vehicleId;
                                    const assignedVehicle = vehicles.find(v => v.id === assignedVehicleId);
                                    const carryingVehicle = carryForwardVehicles[s.enrollmentId] !== false && s.vehicleAssignment;

                                    return (
                                        <TableRow key={s.enrollmentId} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                            <TableCell className="px-4 sm:px-6 py-4 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">{idx + 1}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{s.admissionNumber}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-100">{s.studentName}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">Div {s.divisionName || "—"}</TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                                                {hasDues ? (
                                                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold text-[11px] dark:bg-rose-950/30 dark:text-rose-400">
                                                        ₹{s.outstandingDues.toFixed(2)} Carried
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-500 text-xs">Clear</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                                                {carryingVehicle && assignedVehicle ? (
                                                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium text-[11px] dark:bg-blue-950/30 dark:text-blue-400">
                                                        <Bus className="h-3 w-3" />
                                                        {assignedVehicle.vehicleName}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Navigation & Submit Footer */}
                <div className="flex justify-between items-center pt-2">
                    <Button 
                        variant="ghost" 
                        onClick={() => setCurrentStep(3)} 
                        disabled={loading}
                        className="text-slate-600 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:text-[#9ea98a] dark:hover:bg-[#556043]/20 gap-1.5 font-medium text-xs sm:text-sm rounded-lg"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Destination Configuration
                    </Button>

                    <Button
                        onClick={handleExecutePromotion}
                        disabled={loading}
                        className="bg-[#556043] hover:bg-[#4a533b] text-white shadow-sm font-semibold h-10 px-6 gap-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-xs sm:text-sm rounded-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Executing Promotion Batch...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Confirm & Execute Promotion
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <PermissionGate permission="students.listOnNavbar">
            <section className="w-full px-4 py-4 sm:px-6 space-y-6">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-9 w-9 shrink-0 text-slate-700 dark:text-slate-200"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                Student Promotion
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Batch promote active students into their next academic year and class.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4-Step Stepper Bar */}
                {renderStepperHeader()}

                {/* Step Content */}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}

                {/* AlertDialog Confirmation for "Mark as Completed" */}
                <AlertDialog 
                    open={completingStudentIds !== null} 
                    onOpenChange={open => { if (!open) setCompletingStudentIds(null); }}
                >
                    <AlertDialogContent className="w-[95vw] sm:max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-4 sm:p-6">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                                Mark {completingStudentIds?.length} Student(s) as Completed?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                This will set the enrollment status to <strong>COMPLETED</strong> for final-year graduating students, deactivating their recurring fee templates and soft-deleting any unbilled pending charges. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
                            <AlertDialogCancel disabled={loading} className="w-full sm:w-auto rounded-lg">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleExecuteComplete();
                                }}
                                disabled={loading}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Confirm Completion
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </section>
        </PermissionGate>
    );
}
