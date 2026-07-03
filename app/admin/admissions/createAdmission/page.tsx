"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import {
    ArrowLeft,
    Check,
    ChevronsUpDown,
    Trash2,
    User,
    Bus,
    Wallet,
    MapPin,
    Loader2,
    Layers,
    GitBranch,
    Binary
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
    getStudentById,
    getStudentAdmissionAndName,
    StudentAdmissionAndName,
    Student
} from "@/lib/services/student";
import {
    createStudentAdmission,
    updateStudentAdmission,
    getEnrollmentById,
} from "@/lib/services/admissions";
import { getVehicles, Vehicle } from "@/lib/services/vehicle";
import { getFeeStructures, viewFeeStructure, FeeStructureSummary, FeeStructureView } from "@/lib/services/feeStructure";
import { apiFetch } from "@/lib/api";

import { useSearchParams } from "next/navigation";

export type SchoolClass = {
    id: string;
    name: string;
    divisionCount: number;
};

export type Division = {
    id: string;
    name: string;
};

interface ApiSuccessWrapper<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function getClasses(): Promise<SchoolClass[]> {
    const payload = (await apiFetch("/api/classes")) as ApiSuccessWrapper<SchoolClass[]>;
    return payload?.data ?? [];
}

export async function getDivisions(classId: string): Promise<Division[]> {
    const payload = (await apiFetch(`/api/divisions/class/${classId}`)) as ApiSuccessWrapper<Division[]>;
    return payload?.data ?? [];
}

interface EditableFeeItem {
    id?: string;
    chargeTypeId: string;
    frequency: string;
    name: string;
    baseAmount: number;
    amount: number | "";
    dueDay: number | "";
    description: string;
}

const StepSection = ({ stepNumber, title, description, children }: any) => (
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6D755F]/10 text-[#6D755F] font-bold">
                {stepNumber}
            </div>
            <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
                {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
        </div>
        <div className="flex flex-col gap-6">{children}</div>
    </div>
);

const InfoGrid = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-slate-200 dark:bg-slate-800 gap-[1px]",
                className
            )}
        >
            {children}
        </div>
    </div>
);

const InfoItem = ({ label, value, className }: { label: string; value?: string | React.ReactNode; className?: string }) => (
    <div className={cn("p-4 flex flex-col space-y-1.5 bg-slate-50 dark:bg-slate-950/50 transition-colors hover:bg-white dark:hover:bg-slate-900", className)}>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value || "-"}</span>
    </div>
);

const fieldClass = `
  h-12 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400
  focus:ring-2 focus:ring-[#6D755F] focus:border-transparent
  dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 transition-all
`;

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const enrollmentId = searchParams.get("id") ?? undefined;
    const isEditMode = !!enrollmentId;

    const [studentsDropdown, setStudentsDropdown] = useState<StudentAdmissionAndName[]>([]);
    const [classesDropdown, setClassesDropdown] = useState<SchoolClass[]>([]);
    const [divisionsDropdown, setDivisionsDropdown] = useState<Division[]>([]);
    const [vehiclesDropdown, setVehiclesDropdown] = useState<Vehicle[]>([]);
    const [allFeeStructures, setAllFeeStructures] = useState<FeeStructureSummary[]>([]);

    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [fullStudentData, setFullStudentData] = useState<Student | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>("");
    const [rollNumber, setRollNumber] = useState<string>("");
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [selectedFeeStructureId, setSelectedFeeStructureId] = useState<string>("");
    const [fullFeeStructureData, setFullFeeStructureData] = useState<FeeStructureView | null>(null);
    const [editableFeeItems, setEditableFeeItems] = useState<EditableFeeItem[]>([]);

    const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
    const [classPopoverOpen, setClassPopoverOpen] = useState(false);
    const [divisionPopoverOpen, setDivisionPopoverOpen] = useState(false);
    const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
    const [feePopoverOpen, setFeePopoverOpen] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [loadingStudent, setLoadingStudent] = useState(false);
    const [loadingFeeStructure, setLoadingFeeStructure] = useState(false);
    const [loadingStudentList, setLoadingStudentList] = useState(false);
    const [loadingClassList, setLoadingClassList] = useState(false);
    const [loadingDivisionList, setLoadingDivisionList] = useState(false);
    const [loadingVehicleList, setLoadingVehicleList] = useState(false);
    const [loadingFeeList, setLoadingFeeList] = useState(false);
    const [loadingEnrollment, setLoadingEnrollment] = useState(false);

    // When true, the fee-structure-details effect must NOT overwrite editableFeeItems.
    // Set to true at the very start of loadEnrollment() and cleared only after
    // editableFeeItems has been populated with the real saved charges.
    const isLoadingEnrollmentRef = useRef(false);

    // Tracks which enrollmentId was last fully loaded so we never re-run
    // loadEnrollment for the same id (e.g. after a React strict-mode double
    // render) while also re-running correctly when the id changes.
    const lastLoadedEnrollmentIdRef = useRef<string | null>(null);

    const filteredFeeStructures = useMemo(() => {
        if (!selectedClassId) return [];
        return allFeeStructures.filter(
            (structure) => (structure as any).classId === selectedClassId
        );
    }, [allFeeStructures, selectedClassId]);

    const handleStudentPopoverChange = async (open: boolean) => {
        setStudentPopoverOpen(open);
        if (open && studentsDropdown.length === 0) {
            try {
                setLoadingStudentList(true);
                const listData = await getStudentAdmissionAndName();
                if (Array.isArray(listData)) {
                    setStudentsDropdown(listData);
                } else if (listData && (listData as any).data) {
                    setStudentsDropdown((listData as any).data);
                }
            } catch (error) {
                console.error("Failed to load student list:", error);
            } finally {
                setLoadingStudentList(false);
            }
        }
    };

    const handleClassPopoverChange = async (open: boolean) => {
        setClassPopoverOpen(open);
        if (open && classesDropdown.length === 0) {
            try {
                setLoadingClassList(true);
                const data = await getClasses();
                setClassesDropdown(data);
            } catch (error) {
                console.error("Failed to fetch classes:", error);
            } finally {
                setLoadingClassList(false);
            }
        }
    };

    const handleDivisionPopoverChange = async (open: boolean) => {
        setDivisionPopoverOpen(open);
        if (open && selectedClassId) {
            try {
                setLoadingDivisionList(true);
                const data = await getDivisions(selectedClassId);
                setDivisionsDropdown(data);
            } catch (error) {
                console.error("Failed to fetch divisions:", error);
            } finally {
                setLoadingDivisionList(false);
            }
        }
    };

    const handleVehiclePopoverChange = async (open: boolean) => {
        setVehiclePopoverOpen(open);
        if (open && vehiclesDropdown.length === 0) {
            try {
                setLoadingVehicleList(true);
                const vehiclesData = await getVehicles();
                setVehiclesDropdown(vehiclesData);
            } catch (error) {
                console.error("Failed to load vehicles:", error);
            } finally {
                setLoadingVehicleList(false);
            }
        }
    };

    const handleFeePopoverChange = async (open: boolean) => {
        setFeePopoverOpen(open);
        if (open && allFeeStructures.length === 0) {
            try {
                setLoadingFeeList(true);
                const feeStructuresData = await getFeeStructures();
                setAllFeeStructures(feeStructuresData);
            } catch (error) {
                console.error("Failed to load fee structures:", error);
            } finally {
                setLoadingFeeList(false);
            }
        }
    };

    const handleClassSelect = (classId: string) => {
        setSelectedClassId(classId);
        setSelectedDivisionId("");
        setDivisionsDropdown([]);
        setSelectedFeeStructureId("");
        setEditableFeeItems([]);
    };

    // ── Student detail fetch ──────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedStudentId) {
            setFullStudentData(null);
            return;
        }
        async function fetchFullStudent() {
            try {
                setLoadingStudent(true);
                const completeRecord = await getStudentById(selectedStudentId);
                setFullStudentData(completeRecord);
            } catch (error) {
                console.error("Error fetching student data:", error);
            } finally {
                setLoadingStudent(false);
            }
        }
        fetchFullStudent();
    }, [selectedStudentId]);

    // ── Fee structure detail fetch ────────────────────────────────────────────
    useEffect(() => {
        if (!selectedFeeStructureId) {
            setFullFeeStructureData(null);
            if (!isLoadingEnrollmentRef.current) {
                setEditableFeeItems([]);
            }
            return;
        }

        // Skip populating fee items from template if enrollment is loading —
        // loadEnrollment() will set them directly from saved charges.
        if (isLoadingEnrollmentRef.current) {
            // Still fetch the structure metadata (for display name etc.)
            // but do NOT touch editableFeeItems.
            viewFeeStructure(selectedFeeStructureId).then((response) => {
                if (response.success && response.data) {
                    setFullFeeStructureData(response.data);
                }
            }).catch(console.error);
            return;   // ← early return before the async function that overwrites items
        }

        async function fetchStructureDetails() {
            try {
                setLoadingFeeStructure(true);
                const response = await viewFeeStructure(selectedFeeStructureId);
                if (response.success && response.data) {
                    setFullFeeStructureData(response.data);

                    const itemsLayout: EditableFeeItem[] = response.data.items.map((item) => ({
                        chargeTypeId: item.chargeTypeId,
                        frequency: item.frequency,
                        name: item.chargeTypeName,
                        baseAmount: Number(item.amount) || 0,
                        amount: Number(item.amount) || 0,
                        dueDay: "",
                        description: "",
                    }));
                    setEditableFeeItems(itemsLayout);
                }
            } catch (error) {
                console.error("Error loading fee structure:", error);
            } finally {
                setLoadingFeeStructure(false);
            }
        }

        fetchStructureDetails();
    }, [selectedFeeStructureId]);

    // ── Edit mode: load existing enrollment ───────────────────────────────────
    useEffect(() => {
        if (!isEditMode || !enrollmentId) return;

        // Skip if we already loaded this exact enrollment (e.g. strict-mode double render).
        if (lastLoadedEnrollmentIdRef.current === enrollmentId) return;

        const id = enrollmentId;

        async function loadEnrollment() {
            try {
                setLoadingEnrollment(true);

                // Set the guard BEFORE any state mutations so the fee-structure
                // effect can never slip in and overwrite editableFeeItems.
                isLoadingEnrollmentRef.current = true;

                // Reset all form state so stale values from a previous edit
                // session never bleed into this one.
                setSelectedStudentId("");
                setFullStudentData(null);
                setSelectedClassId("");
                setSelectedDivisionId("");
                setDivisionsDropdown([]);
                setRollNumber("");
                setSelectedVehicle(null);
                setSelectedFeeStructureId("");
                setFullFeeStructureData(null);
                setEditableFeeItems([]);

                const enrollment = await getEnrollmentById(id);

                setSelectedStudentId(enrollment.student.id);

                const classes = await getClasses();
                setClassesDropdown(classes);
                const selectedClass = classes.find(c => c.name === enrollment.classId);
                if (selectedClass) {
                    setSelectedClassId(selectedClass.id);
                }

                if (selectedClass) {
                    const divisions = await getDivisions(selectedClass.id);
                    setDivisionsDropdown(divisions);
                    const selectedDivision = divisions.find(d => d.name === enrollment.division);
                    if (selectedDivision) {
                        setSelectedDivisionId(selectedDivision.id);
                    }
                }

                const feeStructures = await getFeeStructures();
                setAllFeeStructures(feeStructures);
                const selectedFee = feeStructures.find(f => f.name === enrollment.feeStructureName);
                if (selectedFee) {
                    setSelectedFeeStructureId(selectedFee.id);
                }

                const vehicles = await getVehicles();
                setVehiclesDropdown(vehicles);
                const vehicle = vehicles.find(v => v.vehicleName === enrollment.vehicleName);
                if (vehicle) {
                    setSelectedVehicle(vehicle);
                }

                setRollNumber(enrollment.rollNumber ?? "");

                // Populate fee items with real saved charges — this must be the
                // last write before clearing the guard so it always wins.
                setEditableFeeItems(
                    enrollment.charges.map((charge) => ({
                        id: charge.id,
                        frequency: charge.frequency,
                        chargeTypeId: charge.chargeTypeId,
                        name: charge.chargeType,
                        baseAmount: charge.originalAmount,
                        amount: charge.finalAmount,
                        dueDay: charge.dueDay ?? "",
                        description: charge.description ?? "",
                    }))
                );

                // Mark this enrollment as fully loaded.
                lastLoadedEnrollmentIdRef.current = id;
            } catch (error) {
                console.error("Failed to load enrollment:", error);
            } finally {
                setLoadingEnrollment(false);
                // Clear the guard only after all state has been committed.
                isLoadingEnrollmentRef.current = false;
            }
        }

        loadEnrollment();
    }, [isEditMode, enrollmentId]);

    // ── Fee item change handlers ──────────────────────────────────────────────
    const handleItemAmountChange = (chargeTypeId: string, value: string) => {
        setEditableFeeItems((prev) =>
            prev.map((item) =>
                item.chargeTypeId === chargeTypeId
                    ? { ...item, amount: value === "" ? "" : Number(value) }
                    : item
            )
        );
    };

    const handleItemDueDateChange = (chargeTypeId: string, value: string) => {
        setEditableFeeItems((prev) =>
            prev.map((item) =>
                item.chargeTypeId === chargeTypeId
                    ? { ...item, dueDay: value === "" ? "" : Number(value) }
                    : item
            )
        );
    };

    const handleItemDescriptionChange = (chargeTypeId: string, value: string) => {
        setEditableFeeItems((prev) =>
            prev.map((item) =>
                item.chargeTypeId === chargeTypeId
                    ? { ...item, description: value }
                    : item
            )
        );
    };

    const handleRemoveItem = (chargeTypeId: string) => {
        setEditableFeeItems((prev) => prev.filter((item) => item.chargeTypeId !== chargeTypeId));
    };

    const totalAmount = useMemo(() => {
        return editableFeeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [editableFeeItems]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!selectedStudentId || !selectedClassId || !selectedDivisionId) {
            alert("Ensure Student, Class, and Division targets are selected before submitting.");
            return;
        }

        try {
            setSubmitting(true);

            let result;

            if (isEditMode) {
                const enrollmentCharges = editableFeeItems.map((item) => ({
                    ...(item.id ? { id: item.id } : {}),
                    chargeTypeId: item.chargeTypeId,
                    originalAmount: String(item.baseAmount),
                    finalAmount: String(Number(item.amount) || 0),
                    discountAmount: String(item.baseAmount - (Number(item.amount) || 0)),
                    description: item.description.trim() !== "" ? item.description.trim() : null,
                    dueDay: item.dueDay !== "" ? Number(item.dueDay) : null,
                }));

                result = await updateStudentAdmission(enrollmentId!, {
                    classId: selectedClassId,
                    divisionId: selectedDivisionId,
                    feeStructureId: selectedFeeStructureId || null,
                    rollNumber: rollNumber.trim() || null,
                    vehicleId: selectedVehicle?.id || null,
                    enrollmentCharges,
                });

                toast.success("Admission updated successfully");
            } else {
                const chargeOverrides = editableFeeItems.map((item) => ({
                    chargeTypeId: item.chargeTypeId,
                    frequency: item.frequency,
                    originalAmount: item.baseAmount,
                    finalAmount: Number(item.amount) || 0,
                    discountAmount: item.baseAmount - (Number(item.amount) || 0),
                    description: item.description.trim() !== "" ? item.description.trim() : null,
                    dueDay: item.dueDay !== "" ? Number(item.dueDay) : null,
                }));

                result = await createStudentAdmission({
                    studentId: selectedStudentId,
                    classId: selectedClassId,
                    divisionId: selectedDivisionId,
                    feeStructureId: selectedFeeStructureId || null,
                    rollNumber: rollNumber.trim() || null,
                    vehicleId: selectedVehicle?.id || null,
                    chargeOverrides,
                });

                toast.success("Admission created successfully");
            }

            if (result?.success) {
                router.back();
            } else {
                alert(result?.message || "An error occurred during submission.");
            }
        } catch (error) {
            toast.error("Failed to save admission");
            console.error("Submit error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-300">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{isEditMode ? "Edit Admission" : "Create Admission"}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Link system database structural parameters directly to avoid transaction exceptions.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()} disabled={submitting} className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            submitting ||
                            !selectedStudentId ||
                            !selectedClassId ||
                            !selectedDivisionId
                        }
                        className="
    rounded-xl
    h-11
    px-8
    bg-[#6D755F]
    text-white
    hover:bg-[#5b624f]
    shadow-md
    dark:bg-slate-100
    dark:text-slate-900
    dark:hover:bg-slate-200
  "
                    >
                        {submitting
                            ? "Processing..."
                            : isEditMode
                                ? "Update Admission"
                                : "Confirm Admission"}
                    </Button>
                </div>
            </div>

            {loadingEnrollment ? (
                <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#6D755F]" />
                    <span className="text-sm font-medium">Loading enrollment data...</span>
                </div>
            ) : (
                <div className="mx-auto max-w-5xl space-y-8 pb-12">

                    {/* Step 1: Student Selection */}
                    <StepSection
                        stepNumber="1"
                        title="Select Target Student Profile"
                        description="Extract lightweight items from index directory list frames securely on-click."
                    >
                        <div className="w-full">
                            <Popover open={studentPopoverOpen} onOpenChange={handleStudentPopoverChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={studentPopoverOpen}
                                        className={cn("w-full justify-between font-normal shadow-sm text-left", fieldClass)}
                                    >
                                        {selectedStudentId ? (
                                            (() => {
                                                const matched = studentsDropdown.find(s => s.id === selectedStudentId);
                                                return matched
                                                    ? `[${matched.admissionNumber}] - ${matched.studentName}`
                                                    : fullStudentData?.studentName || "Resolving student record..."
                                            })()
                                        ) : "Click to load student records..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                    <Command>
                                        <CommandInput placeholder="Filter student records..." />
                                        <CommandList>
                                            {loadingStudentList ? (
                                                <div className="flex items-center justify-center p-6 gap-2 text-slate-500">
                                                    <Loader2 className="h-4 w-4 animate-spin text-[#6D755F]" />
                                                    <span className="text-xs font-medium">Loading students...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No matching students found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {studentsDropdown.map((student) => (
                                                            <CommandItem
                                                                key={student.id}
                                                                value={`${student.admissionNumber} ${student.studentName}`}
                                                                onSelect={() => {
                                                                    setSelectedStudentId(student.id);
                                                                    setStudentPopoverOpen(false);
                                                                }}
                                                                className="py-3 cursor-pointer"
                                                            >
                                                                <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", selectedStudentId === student.id ? "opacity-100" : "opacity-0")} />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{student.studentName}</span>
                                                                    <span className="text-xs text-slate-400">Admission No: {student.admissionNumber}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {loadingStudent ? (
                            <div className="flex items-center justify-center p-6 text-slate-500 gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-[#6D755F]" />
                                <span className="text-sm">Fetching student profile...</span>
                            </div>
                        ) : fullStudentData && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4 text-[#6D755F]" /> Verified Student Profile Details
                                </h3>
                                <InfoGrid>
                                    <InfoItem label="Admission Number" value={fullStudentData.admissionNumber} />
                                    <InfoItem label="Status Allocation" value={
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                            fullStudentData.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-200 text-slate-800"
                                        )}>
                                            {fullStudentData.status}
                                        </span>
                                    } />
                                    <InfoItem label="Date of Birth" value={fullStudentData.dob} />
                                    <InfoItem label="Gender & Blood Group" value={`${fullStudentData.gender}, ${fullStudentData.bloodGroup}`} />
                                    <InfoItem label="Father's Legal Name" value={fullStudentData.fatherName} />
                                    <InfoItem label="Father's Phone Contact" value={fullStudentData.fatherMobile} />
                                    <InfoItem label="Mother's Legal Name" value={fullStudentData.motherName} />
                                    <InfoItem label="Mother's Phone Contact" value={fullStudentData.motherMobile} />
                                    <InfoItem label="WhatsApp Identifier" value={fullStudentData.whatsappNumber} />
                                    <InfoItem
                                        className="md:col-span-1 lg:col-span-3"
                                        label="Registered Residential Address"
                                        value={
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-4 w-4 text-slate-400" />
                                                <span>{fullStudentData.address}</span>
                                            </div>
                                        }
                                    />
                                </InfoGrid>
                            </div>
                        )}
                    </StepSection>

                    {/* Step 2: Class, Division, Roll Number */}
                    <StepSection
                        stepNumber="2"
                        title="Class & Placement Controls"
                        description="Assign the explicit structural class and section division index targets to satisfy core transaction logic requirements."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5 text-[#6D755F]" /> Assigned School Class
                                </span>
                                <Popover open={classPopoverOpen} onOpenChange={handleClassPopoverChange}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={classPopoverOpen}
                                            className={cn("w-full justify-between font-normal shadow-sm text-left", fieldClass)}
                                        >
                                            {selectedClassId ? (
                                                classesDropdown.find(c => c.id === selectedClassId)?.name || "Parsing class..."
                                            ) : "Choose active class..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                        <Command>
                                            <CommandInput placeholder="Filter classes..." />
                                            <CommandList>
                                                {loadingClassList ? (
                                                    <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6D755F]" /> Fetching lists...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>No classes recorded.</CommandEmpty>
                                                        <CommandGroup>
                                                            {classesDropdown.map((c) => (
                                                                <CommandItem
                                                                    key={c.id}
                                                                    value={c.name}
                                                                    onSelect={() => {
                                                                        handleClassSelect(c.id);
                                                                        setClassPopoverOpen(false);
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", selectedClassId === c.id ? "opacity-100" : "opacity-0")} />
                                                                    <span>{c.name}</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <GitBranch className="h-3.5 w-3.5 text-[#6D755F]" /> Specific Section Division
                                </span>
                                <Popover open={divisionPopoverOpen} onOpenChange={handleDivisionPopoverChange}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            disabled={!selectedClassId}
                                            aria-expanded={divisionPopoverOpen}
                                            className={cn("w-full justify-between font-normal shadow-sm text-left disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/40", fieldClass)}
                                        >
                                            {selectedDivisionId ? (
                                                divisionsDropdown.find(d => d.id === selectedDivisionId)?.name || "Parsing division..."
                                            ) : selectedClassId ? "Choose active division..." : "Select Class first..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                        <Command>
                                            <CommandInput placeholder="Filter sections..." />
                                            <CommandList>
                                                {loadingDivisionList ? (
                                                    <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6D755F]" /> Loading...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>No divisions found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {divisionsDropdown.map((d) => (
                                                                <CommandItem
                                                                    key={d.id}
                                                                    value={d.name}
                                                                    onSelect={() => {
                                                                        setSelectedDivisionId(d.id);
                                                                        setDivisionPopoverOpen(false);
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", selectedDivisionId === d.id ? "opacity-100" : "opacity-0")} />
                                                                    <span>{d.name}</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Binary className="h-3.5 w-3.5 text-[#6D755F]" /> Roll Number Designation
                                </span>
                                <Input
                                    placeholder="Enter roll number..."
                                    value={rollNumber}
                                    onChange={(e) => setRollNumber(e.target.value)}
                                    className={fieldClass}
                                />
                            </div>
                        </div>
                    </StepSection>

                    {/* Step 3: Transport */}
                    <StepSection
                        stepNumber="3"
                        title="Assign Transport Fleet (Optional)"
                        description="Link vehicle logistics scheduling routes directly to this student configuration."
                    >
                        <div className="md:w-1/2">
                            <Popover open={vehiclePopoverOpen} onOpenChange={handleVehiclePopoverChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={vehiclePopoverOpen}
                                        className={cn("w-full justify-between font-normal shadow-sm text-left", fieldClass)}
                                    >
                                        {selectedVehicle ? `${selectedVehicle.vehicleName} (${selectedVehicle.vehicleNumber})` : "Click to view transport fleet..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search vehicles..." />
                                        <CommandList>
                                            {loadingVehicleList ? (
                                                <div className="flex items-center justify-center p-6 gap-2 text-slate-500">
                                                    <Loader2 className="h-4 w-4 animate-spin text-[#6D755F]" />
                                                    <span className="text-xs font-medium">Loading fleet...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No vehicles found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {vehiclesDropdown.map((vehicle) => (
                                                            <CommandItem
                                                                key={vehicle.id}
                                                                value={`${vehicle.vehicleName} ${vehicle.vehicleNumber}`}
                                                                onSelect={() => {
                                                                    setSelectedVehicle(vehicle);
                                                                    setVehiclePopoverOpen(false);
                                                                }}
                                                                className="py-3 cursor-pointer"
                                                            >
                                                                <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", selectedVehicle?.id === vehicle.id ? "opacity-100" : "opacity-0")} />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{vehicle.vehicleName}</span>
                                                                    <span className="text-xs text-slate-400">Plate: {vehicle.vehicleNumber} | Driver: {vehicle.driverName}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {selectedVehicle && (
                            <div className="mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <Bus className="h-4 w-4 text-[#6D755F]" /> Active Logistics Properties
                                </h3>
                                <InfoGrid className="md:grid-cols-3 lg:grid-cols-3">
                                    <InfoItem label="Registration Plate" value={selectedVehicle.vehicleNumber} />
                                    <InfoItem label="Designated Driver" value={selectedVehicle.driverName} />
                                    <InfoItem label="Vehicle Name" value={selectedVehicle.vehicleName} />
                                </InfoGrid>
                            </div>
                        )}
                    </StepSection>

                    {/* Step 4: Fee Structure */}
                    <StepSection
                        stepNumber="4"
                        title="Configure Fee Structure Template"
                        description="Load templates dynamically scoped to your selected class. All charge items are included in the submission."
                    >
                        <div className="md:w-1/2">
                            <Popover open={feePopoverOpen} onOpenChange={handleFeePopoverChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        disabled={!selectedClassId}
                                        aria-expanded={feePopoverOpen}
                                        className={cn("w-full justify-between font-normal shadow-sm text-left disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/40", fieldClass)}
                                    >
                                        {selectedFeeStructureId ? (
                                            allFeeStructures.find(f => f.id === selectedFeeStructureId)?.name || "Parsing fee structure..."
                                        ) : selectedClassId ? "Click to view fee templates..." : "Select Class in Step 2 first..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search fee templates..." />
                                        <CommandList>
                                            {loadingFeeList ? (
                                                <div className="flex items-center justify-center p-6 gap-2 text-slate-500">
                                                    <Loader2 className="h-4 w-4 animate-spin text-[#6D755F]" />
                                                    <span className="text-xs font-medium">Loading templates...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No templates configured for this class.</CommandEmpty>
                                                    <CommandGroup>
                                                        {filteredFeeStructures.map((template) => (
                                                            <CommandItem
                                                                key={template.id}
                                                                value={template.name}
                                                                onSelect={() => {
                                                                    setSelectedFeeStructureId(template.id);
                                                                    setFeePopoverOpen(false);
                                                                }}
                                                                className="py-3 cursor-pointer"
                                                            >
                                                                <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", selectedFeeStructureId === template.id ? "opacity-100" : "opacity-0")} />
                                                                <span className="font-medium text-slate-900 dark:text-slate-100">{template.name}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {loadingFeeStructure ? (
                            <div className="flex items-center justify-center p-6 text-slate-500 gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-[#6D755F]" />
                                <span className="text-sm">Loading fee breakdown...</span>
                            </div>
                        ) : editableFeeItems.length === 0 ? (
                            <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 py-12 text-center">
                                <Wallet className="h-6 w-6 text-slate-400 mb-3" />
                                <p className="text-sm text-slate-500">No billing layout mapped. Select a fee template above to continue.</p>
                            </div>
                        ) : (
                            <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
                                    <div>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                            {allFeeStructures.find(f => f.id === selectedFeeStructureId)?.name || "Fee Items"}
                                        </span>
                                        <span className="text-xs text-slate-500">All charge items are sent in the payload. Override amounts, set due dates, and add descriptions as needed.</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                                        onClick={() => setSelectedFeeStructureId("")}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Unlink Template
                                    </Button>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                                <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[160px]">Fee Particulars</TableHead>
                                                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[140px]">Current Amount</TableHead>
                                                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[160px]">Override Amount</TableHead>
                                                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[130px]">Due Date (Days)</TableHead>
                                                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[200px]">Description</TableHead>
                                                <TableHead className="w-[60px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Remove</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {editableFeeItems.map((item) => {
                                                const discount = item.baseAmount - (Number(item.amount) || 0);
                                                const hasOverride = Number(item.amount) !== item.baseAmount;
                                                return (
                                                    <TableRow key={item.chargeTypeId} className="border-slate-100 dark:border-slate-800 align-top">
                                                        <TableCell className="pl-6 font-medium text-slate-800 dark:text-slate-200 pt-4">
                                                            {item.name}
                                                            {hasOverride && discount > 0 && (
                                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                    −₹{discount.toLocaleString()}
                                                                </span>
                                                            )}
                                                            {hasOverride && discount < 0 && (
                                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                                    +₹{Math.abs(discount).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </TableCell>

                                                        <TableCell className="pt-4">
                                                            <div className="flex items-center h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 min-w-[110px] max-w-[130px]">
                                                                <span className="text-slate-400 text-sm font-medium mr-1">₹</span>
                                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                                    {item.baseAmount.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="pt-4">
                                                            <div className="relative min-w-[130px] max-w-[150px]">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₹</span>
                                                                <Input
                                                                    type="number"
                                                                    value={item.amount}
                                                                    onChange={(e) => handleItemAmountChange(item.chargeTypeId, e.target.value)}
                                                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                                    className={cn(
                                                                        "h-10 pl-8 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white",
                                                                        hasOverride && "border-[#6D755F] ring-1 ring-[#6D755F]/30"
                                                                    )}
                                                                />
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="pt-4">
                                                            <div className="relative min-w-[100px] max-w-[120px]">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    placeholder="e.g. 10"
                                                                    value={item.dueDay}
                                                                    onChange={(e) => handleItemDueDateChange(item.chargeTypeId, e.target.value)}
                                                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                                    className="h-10 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400"
                                                                />
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="pt-4">
                                                            <Input
                                                                type="text"
                                                                placeholder="Optional note (or leave blank)"
                                                                value={item.description}
                                                                onChange={(e) => handleItemDescriptionChange(item.chargeTypeId, e.target.value)}
                                                                className="h-10 min-w-[180px] rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400"
                                                            />
                                                        </TableCell>

                                                        <TableCell className="text-right pr-6 pt-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                                onClick={() => handleRemoveItem(item.chargeTypeId)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-[#6D755F] px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white/90">Gross Enrollment Ledger Total</span>
                                        <span className="text-xs text-white/70">Calculated sum of all active override amounts</span>
                                    </div>
                                    <span className="text-3xl font-bold tracking-tight text-white">
                                        ₹{totalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </StepSection>

                </div>
            )}
        </div>
    );
}