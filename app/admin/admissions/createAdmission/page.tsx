"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

// ── Service API Imports (Updated Paths) ──
import {
    getStudentById,
    getStudentAdmissionAndName,
    StudentAdmissionAndName,
    Student
} from "@/lib/services/student";
import { createStudentAdmission } from "@/lib/services/admissions";
import { getVehicles, Vehicle } from "@/lib/services/vehicle";
import { getFeeStructures, viewFeeStructure, FeeStructureSummary, FeeStructureView } from "@/lib/services/feeStructure";
import { apiFetch } from "@/lib/api";

// ── Structural Entity Types ──
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

// ── Dropdown API Functions ──
export async function getClasses(): Promise<SchoolClass[]> {
    const payload = (await apiFetch("/api/classes")) as ApiSuccessWrapper<SchoolClass[]>;
    return payload?.data ?? [];
}

export async function getDivisions(classId: string): Promise<Division[]> {
    const payload = (await apiFetch(`/api/divisions/class/${classId}`)) as ApiSuccessWrapper<Division[]>;
    return payload?.data ?? [];
}

// ── Step Section Component Frame ──
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

const InfoGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-slate-200 dark:bg-slate-800 gap-[1px]">
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

    // ── Dropdown List Arrays ──
    const [studentsDropdown, setStudentsDropdown] = useState<StudentAdmissionAndName[]>([]);
    const [classesDropdown, setClassesDropdown] = useState<SchoolClass[]>([]);
    const [divisionsDropdown, setDivisionsDropdown] = useState<Division[]>([]);
    const [vehiclesDropdown, setVehiclesDropdown] = useState<Vehicle[]>([]);

    // Master collection of ALL fee structures loaded from your standard API
    const [allFeeStructures, setAllFeeStructures] = useState<FeeStructureSummary[]>([]);

    // ── Target Selections States ──
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [fullStudentData, setFullStudentData] = useState<Student | null>(null);

    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>("");
    const [rollNumber, setRollNumber] = useState<string>("");

    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    const [selectedFeeStructureId, setSelectedFeeStructureId] = useState<string>("");
    const [fullFeeStructureData, setFullFeeStructureData] = useState<FeeStructureView | null>(null);

    const [editableFeeItems, setEditableFeeItems] = useState<{
        chargeTypeId: string;
        name: string;
        baseAmount: number;
        amount: number | "";
    }[]>([]);

    // ── Popover Interactive Toggles ──
    const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
    const [classPopoverOpen, setClassPopoverOpen] = useState(false);
    const [divisionPopoverOpen, setDivisionPopoverOpen] = useState(false);
    const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
    const [feePopoverOpen, setFeePopoverOpen] = useState(false);

    // ── Loading Spinners Indicators ──
    const [submitting, setSubmitting] = useState(false);
    const [loadingStudent, setLoadingStudent] = useState(false);
    const [loadingFeeStructure, setLoadingFeeStructure] = useState(false);

    const [loadingStudentList, setLoadingStudentList] = useState(false);
    const [loadingClassList, setLoadingClassList] = useState(false);
    const [loadingDivisionList, setLoadingDivisionList] = useState(false);
    const [loadingVehicleList, setLoadingVehicleList] = useState(false);
    const [loadingFeeList, setLoadingFeeList] = useState(false);

    // ── CLIENT-SIDE FILTER ──
    const filteredFeeStructures = useMemo(() => {
        if (!selectedClassId) return [];

        // Directly match the selected class UUID with the structure's classId
        return allFeeStructures.filter(
            (structure) => (structure as any).classId === selectedClassId
        );
    }, [allFeeStructures, selectedClassId]);


    // ── LAZY DROPDOWN FETCH HANDLERS ──

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
                console.error("Failed to load lightweight student layout lists:", error);
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
                console.error("Failed to extract active classes structure array:", error);
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
                console.error("Failed to fetch division routes nodes:", error);
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
                console.error("Failed to load vehicle dropdown selections:", error);
            } finally {
                setLoadingVehicleList(false);
            }
        }
    };

    // Loads the default complete structure lists pool onto the client environment
    const handleFeePopoverChange = async (open: boolean) => {
        setFeePopoverOpen(open);
        if (open && allFeeStructures.length === 0) {
            try {
                setLoadingFeeList(true);
                const feeStructuresData = await getFeeStructures();
                setAllFeeStructures(feeStructuresData);
            } catch (error) {
                console.error("Failed to extract system accounting models:", error);
            } finally {
                setLoadingFeeList(false);
            }
        }
    };

    // Reset dependent structures when class configuration targets alter
    const handleClassSelect = (classId: string) => {
        setSelectedClassId(classId);
        setSelectedDivisionId("");
        setDivisionsDropdown([]);

        // Wipe prior fee assignments completely to handle changing boundaries securely
        setSelectedFeeStructureId("");
        setEditableFeeItems([]);
    };

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
                console.error("Error evaluating student data properties lookups:", error);
            } finally {
                setLoadingStudent(false);
            }
        }
        fetchFullStudent();
    }, [selectedStudentId]);

    useEffect(() => {
        if (!selectedFeeStructureId) {
            setFullFeeStructureData(null);
            setEditableFeeItems([]);
            return;
        }

        async function fetchStructureDetails() {
            try {
                setLoadingFeeStructure(true);
                const response = await viewFeeStructure(selectedFeeStructureId);
                if (response.success && response.data) {
                    setFullFeeStructureData(response.data);

                    const itemsLayout = response.data.items.map((item) => ({
                        chargeTypeId: item.chargeTypeId,
                        name: item.chargeTypeName,
                        baseAmount: Number(item.amount) || 0,
                        amount: Number(item.amount) || 0,
                    }));
                    setEditableFeeItems(itemsLayout);
                }
            } catch (error) {
                console.error("Error setting ledger templates parameters map:", error);
            } finally {
                setLoadingFeeStructure(false);
            }
        }
        fetchStructureDetails();
    }, [selectedFeeStructureId]);

    const handleItemAmountChange = (chargeTypeId: string, value: string) => {
        setEditableFeeItems((prev) =>
            prev.map((item) =>
                item.chargeTypeId === chargeTypeId
                    ? { ...item, amount: value === "" ? "" : Number(value) }
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

const handleSubmit = async () => {
    if (!selectedStudentId || !selectedClassId || !selectedDivisionId) {
        alert("Ensure Student, Class, and Division targets are selected before running creation tasks.");
        return;
    }

    try {
        setSubmitting(true);

        const chargeOverrides = editableFeeItems
            .filter((item) => Number(item.amount) !== item.baseAmount)
            .map((item) => ({
                chargeTypeId: item.chargeTypeId,
                finalAmount: Number(item.amount) || 0
            }));

        const targetPayload = {
            studentId: selectedStudentId,
            classId: selectedClassId, 
            divisionId: selectedDivisionId, 
            feeStructureId: selectedFeeStructureId || null,
            rollNumber: rollNumber.trim() || null,
            vehicleId: selectedVehicle?.id || null,
            chargeOverrides: chargeOverrides,
            // academicYearId is safely omitted here
        };

        const result = await createStudentAdmission(targetPayload);
        if (result.success) {
            router.back();
        } else {
            alert(result.message || "An operations error occurred during submission.");
        }
    } catch (error) {
        console.error("Error processing operations command execution:", error);
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
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Admission</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Link system database structural parameters directly to avoid transaction exceptions.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()} disabled={submitting} className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        Discard
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || !selectedStudentId || !selectedClassId || !selectedDivisionId} className="rounded-xl h-11 px-8 bg-[#6D755F] hover:bg-[#5b624f] text-white shadow-md">
                        {submitting ? "Processing Request..." : "Confirm Admission"}
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-5xl space-y-8 pb-12">

                {/* ── Step 1: Student Choice Picker Dropdown Module ── */}
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
                                                : fullStudentData?.studentName || "Resolving schema attributes properties records..."
                                        })()
                                    ) : "Click to load student records registry options..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Filter student registries entries..." />
                                    <CommandList>
                                        {loadingStudentList ? (
                                            <div className="flex items-center justify-center p-6 gap-2 text-slate-500">
                                                <Loader2 className="h-4 w-4 animate-spin text-[#6D755F]" />
                                                <span className="text-xs font-medium">Assembling file paths profiles indexes...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty>No matching registrations tracked.</CommandEmpty>
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
                            <span className="text-sm">Fetching structural student profile properties...</span>
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

                {/* ── Step 2: Class, Division, and Roll Number Configuration ── */}
                <StepSection
                    stepNumber="2"
                    title="Class & Placement Controls"
                    description="Assign the explicit structural class and section division index targets to satisfy core transaction logic requirements."
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* Class Picker */}
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
                                            classesDropdown.find(c => c.id === selectedClassId)?.name || "Parsing allocated class entity..."
                                        ) : "Choose active class..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                    <Command>
                                        <CommandInput placeholder="Filter classes templates..." />
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

                        {/* Division Picker */}
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
                                            divisionsDropdown.find(d => d.id === selectedDivisionId)?.name || "Parsing allocated divisions..."
                                        ) : selectedClassId ? "Choose active division..." : "Select Class target first..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                    <Command>
                                        <CommandInput placeholder="Filter section tracks..." />
                                        <CommandList>
                                            {loadingDivisionList ? (
                                                <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6D755F]" /> Pulling down branch components...
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No matching divisions structural indexes tracked.</CommandEmpty>
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

                        {/* Manual Roll Input Control Field */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Binary className="h-3.5 w-3.5 text-[#6D755F]" /> Roll Number Designation
                            </span>
                            <Input
                                placeholder="Enter manual layout roll sequencing identifier..."
                                value={rollNumber}
                                onChange={(e) => setRollNumber(e.target.value)}
                                className={fieldClass}
                            />
                        </div>

                    </div>
                </StepSection>

                {/* ── Step 3: Transport Assignment Configuration ── */}
                <StepSection
                    stepNumber="3"
                    title="Assign Transport Fleet (Optional)"
                    description="Link vehicle logistics scheduling routes directly to this student data grid page layout configuration."
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
                                    {selectedVehicle ? `${selectedVehicle.vehicleName} (${selectedVehicle.vehicleNumber})` : "Click to view transport fleet choices..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Search system routes tables..." />
                                    <CommandList>
                                        {loadingVehicleList ? (
                                            <div className="flex items-center justify-center p-6 gap-2 text-slate-500">
                                                <Loader2 className="h-4 w-4 animate-spin text-[#6D755F]" />
                                                <span className="text-xs font-medium">Assembling route listings...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty>No matching fleet transport vehicle found.</CommandEmpty>
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
                            <InfoGrid>
                                <InfoItem label="Vehicle Unique Reference" value={selectedVehicle.id.toUpperCase()} />
                                <InfoItem label="Registration Plate" value={selectedVehicle.vehicleNumber} />
                                <InfoItem label="Designated Operator/Driver" value={selectedVehicle.driverName} />
                                <InfoItem label="Route/Vehicle Variant" value={selectedVehicle.vehicleName} />
                            </InfoGrid>
                        </div>
                    )}
                </StepSection>

                {/* ── Step 4: Fee Matrix Compilation (With Client-Side Filtering) ── */}
                <StepSection
                    stepNumber="4"
                    title="Configure Fee Structure Template"
                    description="Load templates dynamically scoped to your selected class to eliminate structural conflicts."
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
                                        allFeeStructures.find(f => f.id === selectedFeeStructureId)?.name || "Parsing assigned fee matrix rules structure..."
                                    ) : selectedClassId ? "Click to view structural configurations..." : "Select Class target in Step 2 first..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Search system pricing schemas..." />
                                    <CommandList>
                                        {loadingFeeList ? (
                                            <div className="flex items-center justify-center p-6 gap-2 text-slate-500">
                                                <Loader2 className="h-4 w-4 animate-spin text-[#6D755F]" />
                                                <span className="text-xs font-medium">Downloading template structures...</span>
                                            </div>
                                        ) : (
                                            <>
                                                {/* FIXED: Reading from client-filtered results array */}
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
                            <span className="text-sm">Assembling breakdown table layout items properties...</span>
                        </div>
                    ) : editableFeeItems.length === 0 ? (
                        <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 py-12 text-center">
                            <Wallet className="h-6 w-6 text-slate-400 mb-3" />
                            <p className="text-sm text-slate-500">No billing layout mapped. Open the template picker selector tool above to link configuration properties.</p>
                        </div>
                    ) : (
                        <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
                                <div>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                        {allFeeStructures.find(f => f.id === selectedFeeStructureId)?.name || "Modified Layout Accounts"}
                                    </span>
                                    <span className="text-xs text-slate-500">Active layout parameters (Altered row amounts compile into the transaction overrides data frame)</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                                    onClick={() => setSelectedFeeStructureId("")}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Unlink Template Layout
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-slate-500">Fee Particulars Name</TableHead>
                                            <TableHead className="w-[280px] text-xs font-medium uppercase tracking-wider text-slate-500">Amount Override Modification</TableHead>
                                            <TableHead className="w-[100px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Remove</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editableFeeItems.map((item) => (
                                            <TableRow key={item.chargeTypeId} className="border-slate-100 dark:border-slate-800">
                                                <TableCell className="pl-6 font-medium text-slate-800 dark:text-slate-200">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="relative w-full max-w-[200px]">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₹</span>
                                                        <Input
                                                            type="number"
                                                            value={item.amount}
                                                            onChange={(e) => handleItemAmountChange(item.chargeTypeId, e.target.value)}
                                                            className="h-10 w-full pl-8 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
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
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-[#6D755F] px-6 py-5">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white/90">Gross Enrollment Ledger Total</span>
                                    <span className="text-xs text-white/70">Calculated composite sum of particulars active layout row items values</span>
                                </div>
                                <span className="text-3xl font-bold tracking-tight text-white">
                                    ₹{totalAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </StepSection>

            </div>
        </div>
    );
}