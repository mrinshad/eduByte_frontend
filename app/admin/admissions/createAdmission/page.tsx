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
    Binary,
    Activity,
    Plus
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
import { getAcademicYears } from "@/lib/services/academicYear";
import { apiFetch } from "@/lib/api";
import { formatDateOnly } from "@/lib/utils";
import { getChargeTypes, ChargeTypes } from "@/lib/services/chargeTypes";
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
import { Checkbox } from "@/components/ui/checkbox";
import { getCCAActivities, assignStudentToCCAActivities, type CCAActivity } from "@/lib/services/cca";

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
    originalAmount: number;
    baseAmount: number;
    amount: number | "";
    dueDay: number | "";
    description: string;
    generationStartAcademicMonth?: number;
}

export interface SelectedCCAItemConfig {
    activityId: string;
    name: string;
    fee: number;
    frequency: string;
    startDate: string;
    endDate: string;
    discountAmount: number | "";
}

const StepSection = ({ stepNumber, title, description, children }: any) => (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6D755F]/10 text-[#6D755F] font-bold text-sm">
                {stepNumber}
            </div>
            <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
                {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
        </div>
        <div className="flex flex-col gap-5">{children}</div>
    </div>
);

// Small red asterisk shown next to labels for required fields
const RequiredMark = () => (
    <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
);

// Small red text shown under an invalid field
const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">{message}</p>
    ) : null;

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
  h-12 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400
  focus:ring-2 focus:ring-[#6D755F] focus:border-transparent
  dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 transition-all
`;

// Applied on top of fieldClass when that field currently has a validation error
const fieldErrorClass = `
  !border-red-400 dark:!border-red-500/60 focus:!ring-red-400/40
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
    const [activeAcademicYearId, setActiveAcademicYearId] = useState<string>("");

    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [fullStudentData, setFullStudentData] = useState<Student | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>("");
    const [rollNumber, setRollNumber] = useState<string>("");
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [selectedFeeStructureId, setSelectedFeeStructureId] = useState<string>("");
    const [fullFeeStructureData, setFullFeeStructureData] = useState<FeeStructureView | null>(null);
    const [editableFeeItems, setEditableFeeItems] = useState<EditableFeeItem[]>([]);
    const [ccaActivities, setCcaActivities] = useState<CCAActivity[]>([]);
    const [selectedCCAConfigs, setSelectedCCAConfigs] = useState<SelectedCCAItemConfig[]>([]);

    const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
    const [classPopoverOpen, setClassPopoverOpen] = useState(false);
    const [divisionPopoverOpen, setDivisionPopoverOpen] = useState(false);
    const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
    const [feePopoverOpen, setFeePopoverOpen] = useState(false);

    const [chargeTypesList, setChargeTypesList] = useState<ChargeTypes[]>([]);
    const [isAddChargeDialogOpen, setIsAddChargeDialogOpen] = useState(false);
    const [selectedNewChargeTypeIds, setSelectedNewChargeTypeIds] = useState<string[]>([]);
    const [isAddCCADialogOpen, setIsAddCCADialogOpen] = useState(false);
    const [selectedNewCCAIds, setSelectedNewCCAIds] = useState<string[]>([]);
    const [isClearFieldsDialogOpen, setIsClearFieldsDialogOpen] = useState(false);
    const [loadingChargeTypes, setLoadingChargeTypes] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [loadingStudent, setLoadingStudent] = useState(false);
    const [loadingFeeStructure, setLoadingFeeStructure] = useState(false);
    const [loadingStudentList, setLoadingStudentList] = useState(false);
    const [loadingClassList, setLoadingClassList] = useState(false);
    const [loadingDivisionList, setLoadingDivisionList] = useState(false);
    const [loadingVehicleList, setLoadingVehicleList] = useState(false);
    const [loadingFeeList, setLoadingFeeList] = useState(false);
    const [loadingEnrollment, setLoadingEnrollment] = useState(false);

    // Field-level errors for the required top-level selectors
    const [fieldErrors, setFieldErrors] = useState<{ student?: string; class?: string; division?: string; feeStructure?: string }>({});
    // Per-row errors for the fee items table, keyed by chargeTypeId
    const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

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
            (structure) =>
                structure.classId === selectedClassId &&
                (!activeAcademicYearId || structure.academicYearId === activeAcademicYearId)
        );
    }, [allFeeStructures, selectedClassId, activeAcademicYearId]);

    const handleStudentPopoverChange = async (open: boolean) => {
        setStudentPopoverOpen(open);
        if (open && studentsDropdown.length === 0) {
            try {
                setLoadingStudentList(true);
                const listData = await getStudentAdmissionAndName({ limit: 500 });
                setStudentsDropdown(Array.isArray(listData) ? listData : []);
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
                const academicYears = await getAcademicYears();
                const activeYear = academicYears.find((year) => year.isActive);
                setActiveAcademicYearId(activeYear?.id || "");
                const feeStructuresData = await getFeeStructures({ page: 1, limit: 500 });
                setAllFeeStructures(feeStructuresData.items);
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
        setFieldErrors((prev) => ({ ...prev, class: undefined }));
    };

    useEffect(() => {
        getCCAActivities()
            .then(setCcaActivities)
            .catch((err) => console.error("Failed to load CCA activities:", err));
    }, []);

    const handleOpenAddCCADialog = () => {
        setSelectedNewCCAIds(selectedCCAConfigs.map((c) => c.activityId));
        setIsAddCCADialogOpen(true);
    };

    const handleConfirmAddCCA = () => {
        setSelectedCCAConfigs((prev) => {
            const kept = prev.filter((item) => selectedNewCCAIds.includes(item.activityId));
            const newIds = selectedNewCCAIds.filter((id) => !prev.some((item) => item.activityId === id));
            const newlyAdded: SelectedCCAItemConfig[] = newIds.map((id) => {
                const act = ccaActivities.find((a) => a.id === id);
                return {
                    activityId: id,
                    name: act?.name || "Activity",
                    fee: act?.defaultFee || Number(act?.feeAmount) || 0,
                    frequency: act?.frequency || "MONTHLY",
                    startDate: new Date().toISOString().split("T")[0],
                    endDate: "",
                    discountAmount: "",
                };
            });
            return [...kept, ...newlyAdded];
        });
        setIsAddCCADialogOpen(false);
    };

    const handleUpdateCCAItem = (
        activityId: string,
        field: "startDate" | "endDate" | "discountAmount",
        value: any
    ) => {
        setSelectedCCAConfigs((prev) =>
            prev.map((item) => (item.activityId === activityId ? { ...item, [field]: value } : item))
        );
    };

    const handleRemoveCCAItem = (activityId: string) => {
        setSelectedCCAConfigs((prev) => prev.filter((item) => item.activityId !== activityId));
    };

    const ccaGrossAmount = useMemo(() => {
        return selectedCCAConfigs.reduce((sum, item) => sum + (Number(item.fee) || 0), 0);
    }, [selectedCCAConfigs]);

    const ccaTotalDiscount = useMemo(() => {
        return selectedCCAConfigs.reduce(
            (sum, item) => sum + (item.discountAmount !== "" ? Number(item.discountAmount) : 0),
            0
        );
    }, [selectedCCAConfigs]);

    const ccaNetAmount = useMemo(() => {
        return Math.max(0, ccaGrossAmount - ccaTotalDiscount);
    }, [ccaGrossAmount, ccaTotalDiscount]);

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
                        originalAmount: Number(item.amount) || 0,
                        baseAmount: Number(item.amount) || 0,
                        amount: Number(item.amount) || 0,
                        dueDay: "",
                        description: "",
                    }));
                    setEditableFeeItems(itemsLayout);
                    setItemErrors({});
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

                const feeStructuresRes = await getFeeStructures({ page: 1, limit: 500 });
                const feeStructures = feeStructuresRes.items;
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
                        originalAmount: charge.originalAmount,
                        baseAmount: charge.originalAmount,
                        amount: charge.finalAmount,
                        dueDay: charge.dueDay ?? "",
                        description: charge.description ?? "",
                        generationStartAcademicMonth: charge.generationStartAcademicMonth,
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
    const clearItemError = (chargeTypeId: string) => {
        setItemErrors((prev) => {
            if (!(chargeTypeId in prev)) return prev;
            const next = { ...prev };
            delete next[chargeTypeId];
            return next;
        });
    };

    const handleItemAmountChange = (chargeTypeId: string, value: string) => {
        setEditableFeeItems((prev) =>
            prev.map((item) =>
                item.chargeTypeId === chargeTypeId
                    ? { ...item, amount: value === "" ? "" : Number(value) }
                    : item
            )
        );
        clearItemError(chargeTypeId);
    };

    const handleItemDueDateChange = (chargeTypeId: string, value: string) => {
        setEditableFeeItems((prev) =>
            prev.map((item) =>
                item.chargeTypeId === chargeTypeId
                    ? { ...item, dueDay: value === "" ? "" : Number(value) }
                    : item
            )
        );
        clearItemError(chargeTypeId);
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
        clearItemError(chargeTypeId);
    };

    const totalAmount = useMemo(() => {
        return editableFeeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [editableFeeItems]);

    useEffect(() => {
        if (isAddChargeDialogOpen && chargeTypesList.length === 0) {
            async function fetchChargeTypes() {
                try {
                    setLoadingChargeTypes(true);
                    const types = await getChargeTypes();
                    setChargeTypesList(types);
                } catch (error) {
                    console.error("Failed to load charge types:", error);
                } finally {
                    setLoadingChargeTypes(false);
                }
            }
            fetchChargeTypes();
        }
    }, [isAddChargeDialogOpen, chargeTypesList.length]);

    const handleClearFields = () => {
        setSelectedFeeStructureId("");
        setEditableFeeItems([]);
        setSelectedCCAConfigs([]);
        setItemErrors({});
        setIsClearFieldsDialogOpen(false);
    };

    const handleAddChargeTypes = () => {
        const newItems: EditableFeeItem[] = selectedNewChargeTypeIds.map(id => {
            const chargeDef = chargeTypesList.find(c => c.id === id);
            return {
                chargeTypeId: id,
                frequency: chargeDef?.frequency || "",
                name: chargeDef?.name || "",
                originalAmount: 0,
                baseAmount: 0,
                amount: 0,
                dueDay: "",
                description: "",
            };
        });
        
        setEditableFeeItems(prev => [...prev, ...newItems]);
        setSelectedNewChargeTypeIds([]);
        setIsAddChargeDialogOpen(false);
    };

    // Checks the four required selectors and returns field-keyed messages.
    const validateTopFields = (): { valid: boolean; errors: typeof fieldErrors } => {
        const errors: typeof fieldErrors = {};
        if (!selectedStudentId) errors.student = "Please select a student";
        if (!selectedClassId) errors.class = "Please select a class";
        if (!selectedDivisionId) errors.division = "Please select a division";
        if (!selectedFeeStructureId) errors.feeStructure = "Please select a fee structure template";
        return { valid: Object.keys(errors).length === 0, errors };
    };

    // Validates every fee item row (only relevant when a fee template is linked):
    // amount must be present and non-negative; due day, if set, must be 1–31.
    const validateFeeItems = (): { valid: boolean; errors: Record<string, string> } => {
        const errors: Record<string, string> = {};

        editableFeeItems.forEach((item) => {
            if (item.amount === "") {
                errors[item.chargeTypeId] = "Enter an amount";
                return;
            }
            if (Number(item.amount) < 0) {
                errors[item.chargeTypeId] = "Amount cannot be negative";
                return;
            }
            if (item.dueDay !== "" && (Number(item.dueDay) < 1 || Number(item.dueDay) > 31)) {
                errors[item.chargeTypeId] = "Due day must be between 1 and 31";
            }
        });

        return { valid: Object.keys(errors).length === 0, errors };
    };

    // Best-effort extraction of a human-readable message from whatever
    // apiFetch throws, so real backend validation errors (e.g. duplicate
    // enrollment, invalid fee structure) reach the user instead of a
    // generic fallback.
    const getErrorMessage = (error: unknown, fallback: string): string => {
        if (error instanceof Error && error.message) return error.message;
        if (typeof error === "string" && error.trim()) return error;
        if (
            error &&
            typeof error === "object" &&
            "message" in error &&
            typeof (error as { message?: unknown }).message === "string"
        ) {
            return (error as { message: string }).message;
        }
        return fallback;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const { valid: topValid, errors: topErrors } = validateTopFields();
        setFieldErrors(topErrors);

        const { valid: itemsValid, errors: rowErrors } = validateFeeItems();
        setItemErrors(rowErrors);

        if (!topValid) {
            const firstError = Object.values(topErrors)[0];
            toast.error(firstError ?? "Please complete the required fields");
            return;
        }

        if (!itemsValid) {
            const firstError = Object.values(rowErrors)[0];
            toast.error(firstError ?? "Please fix the highlighted fee items");
            return;
        }

        try {
            setSubmitting(true);

            let result;

            if (isEditMode) {
                const enrollmentCharges = editableFeeItems.map((item) => ({
                    ...(item.id ? { id: item.id } : {}),
                    chargeTypeId: item.chargeTypeId,
                    originalAmount: String(item.originalAmount),
                    finalAmount: String(Number(item.amount) || 0),
                    discountAmount: String(item.originalAmount - (Number(item.amount) || 0)),
                    description: item.description.trim() !== "" ? item.description.trim() : null,
                    dueDay: item.dueDay !== "" ? Number(item.dueDay) : null,
                    generationStartAcademicMonth: item.generationStartAcademicMonth,
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
                    originalAmount: item.originalAmount,
                    frequency: item.frequency,
                    finalAmount: Number(item.amount) || 0,
                    discountAmount: item.originalAmount - (Number(item.amount) || 0),
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
                if (selectedCCAConfigs.length > 0 && selectedStudentId) {
                    for (const config of selectedCCAConfigs) {
                        try {
                            const ccaPayload = {
                                studentId: selectedStudentId,
                                ccaActivityIds: [config.activityId],
                                startDate: config.startDate || new Date().toISOString().split("T")[0],
                                endDate: config.endDate ? config.endDate : undefined,
                                discountAmount: config.discountAmount !== "" ? Number(config.discountAmount) : undefined,
                            };
                            console.log(`==> [Admission CCA Assignment Dispatch - ${config.name}]:`, ccaPayload);
                            await assignStudentToCCAActivities(ccaPayload);
                        } catch (ccaError) {
                            console.warn(`CCA Assignment error (${config.name}):`, ccaError);
                        }
                    }
                }
                router.back();
            } else {
                toast.error(result?.message || "An error occurred during submission.");
            }
        } catch (error) {
            console.error("Submit error:", error);
            const fallback = isEditMode ? "Failed to update admission" : "Failed to save admission";
            toast.error(getErrorMessage(error, fallback));
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
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={submitting}
                        className="rounded-xl h-11 px-6 bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            submitting ||
                            !selectedStudentId ||
                            !selectedClassId ||
                            !selectedDivisionId ||
                            !selectedFeeStructureId
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
    disabled:opacity-50
    disabled:cursor-not-allowed
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
                        <div className="w-full flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-[#6D755F]" /> Target Student<RequiredMark />
                            </span>
                            <Popover open={studentPopoverOpen} onOpenChange={handleStudentPopoverChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={studentPopoverOpen}
                                        className={cn(
                                            "w-full justify-between font-normal shadow-sm text-left",
                                            fieldClass,
                                            fieldErrors.student && fieldErrorClass
                                        )}
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
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg" align="start">
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
                                                                    setFieldErrors((prev) => ({ ...prev, student: undefined }));
                                                                }}
                                                                className="py-3 cursor-pointer"
                                                            >
                                                                <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", selectedStudentId === student.id ? "opacity-100" : "opacity-0")} />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-slate-200 dark:text-slate-100">{student.studentName}</span>
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
                            <FieldError message={fieldErrors.student} />
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
                                    <InfoItem label="Date of Birth" value={formatDateOnly(fullStudentData.dob)} />
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
                                    <Layers className="h-3.5 w-3.5 text-[#6D755F]" /> Assigned School Class<RequiredMark />
                                </span>
                                <Popover open={classPopoverOpen} onOpenChange={handleClassPopoverChange}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={classPopoverOpen}
                                            className={cn(
                                                "w-full justify-between font-normal shadow-sm text-left",
                                                fieldClass,
                                                fieldErrors.class && fieldErrorClass
                                            )}
                                        >
                                            {selectedClassId ? (
                                                classesDropdown.find(c => c.id === selectedClassId)?.name || "Parsing class..."
                                            ) : "Choose active class..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg" align="start">
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
                                <FieldError message={fieldErrors.class} />
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <GitBranch className="h-3.5 w-3.5 text-[#6D755F]" /> Specific Section Division<RequiredMark />
                                </span>
                                <Popover open={divisionPopoverOpen} onOpenChange={handleDivisionPopoverChange}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            disabled={!selectedClassId}
                                            aria-expanded={divisionPopoverOpen}
                                            className={cn(
                                                "w-full justify-between font-normal shadow-sm text-left disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/40",
                                                fieldClass,
                                                fieldErrors.division && fieldErrorClass
                                            )}
                                        >
                                            {selectedDivisionId ? (
                                                divisionsDropdown.find(d => d.id === selectedDivisionId)?.name || "Parsing division..."
                                            ) : selectedClassId ? "Choose active division..." : "Select Class first..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg" align="start">
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
                                                                        setFieldErrors((prev) => ({ ...prev, division: undefined }));
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
                                <FieldError message={fieldErrors.division} />
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
                                        {selectedVehicle ? selectedVehicle.vehicleName : "Click to view transport fleet..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg" align="start">
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
                                                                value={vehicle.vehicleName}
                                                                onSelect={() => {
                                                                    setSelectedVehicle(vehicle);
                                                                    setVehiclePopoverOpen(false);
                                                                }}
                                                                className="py-3 cursor-pointer"
                                                            >
                                                                <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", selectedVehicle?.id === vehicle.id ? "opacity-100" : "opacity-0")} />
                                                                <span className="font-medium text-slate-200 dark:text-slate-100">{vehicle.vehicleName}</span>
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
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <Bus className="h-4 w-4 text-[#6D755F]" /> Active Logistics Properties
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                                        onClick={() => setSelectedVehicle(null)}
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove Vehicle
                                    </Button>
                                </div>
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
                        <div className="md:w-1/2 flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5 text-[#6D755F]" /> Fee Structure Template<RequiredMark />
                            </span>
                            <Popover open={feePopoverOpen} onOpenChange={handleFeePopoverChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        disabled={!selectedClassId}
                                        aria-expanded={feePopoverOpen}
                                        className={cn(
                                            "w-full justify-between font-normal shadow-sm text-left disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/40",
                                            fieldClass,
                                            fieldErrors.feeStructure && fieldErrorClass
                                        )}
                                    >
                                        {selectedFeeStructureId ? (
                                            allFeeStructures.find(f => f.id === selectedFeeStructureId)?.name || "Parsing fee structure..."
                                        ) : selectedClassId ? "Click to view fee templates..." : "Select Class in Step 2 first..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg" align="start">
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
                                                                    setFieldErrors((prev) => ({ ...prev, feeStructure: undefined }));
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
                            <FieldError message={fieldErrors.feeStructure} />
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
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedNewChargeTypeIds([]);
                                                setIsAddChargeDialogOpen(true);
                                            }}
                                            className="bg-[#6D755F]/10 text-[#6D755F] border border-[#6D755F] font-medium hover:bg-[#6D755F]/20 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                                        >
                                            Add Charge Type
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                                            onClick={() => setIsClearFieldsDialogOpen(true)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Clear Fields
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                                <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[160px]">Fee Particulars</TableHead>
                                                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[140px]">Original Amount</TableHead>
                                                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[160px]">Override Amount<RequiredMark /></TableHead>
                                                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[130px]">Due Date (Days)</TableHead>
                                                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[200px]">Description</TableHead>
                                                <TableHead className="w-[60px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Remove</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {editableFeeItems.map((item) => {
                                                const discount = item.baseAmount - (Number(item.amount) || 0);
                                                const hasOverride = Number(item.amount) !== item.baseAmount;
                                                const rowError = itemErrors[item.chargeTypeId];
                                                return (
                                                    <TableRow
                                                        key={item.chargeTypeId}
                                                        className={cn(
                                                            "align-top",
                                                            rowError
                                                                ? "border-red-300 dark:border-red-500/50 bg-red-50/40 dark:bg-red-950/10"
                                                                : "border-slate-100 dark:border-slate-800"
                                                        )}
                                                    >
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
                                                                    onWheel={(e) => e.currentTarget.blur()}
                                                                    className={cn(
                                                                        "h-10 pl-8 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white",
                                                                        hasOverride && !rowError && "border-[#6D755F] ring-1 ring-[#6D755F]/30",
                                                                        rowError && fieldErrorClass
                                                                    )}
                                                                />
                                                            </div>
                                                            <FieldError message={rowError} />
                                                        </TableCell>

                                                        <TableCell className="pt-4">
                                                            <div className="relative min-w-[100px] max-w-[120px]">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    placeholder="e.g. 10"
                                                                    value={item.dueDay}
                                                                    onChange={(e) => handleItemDueDateChange(item.chargeTypeId, e.target.value)}
                                                                    onWheel={(e) => e.currentTarget.blur()}
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

                    {/* Step 5: Assign CCA Activities (Optional) */}
                    <StepSection
                        stepNumber="5"
                        title="Assign CCA Activities (Optional)"
                        description="Select optional co-curricular activities. Each selected activity has its own start date, end date, and discount configuration."
                    >
                        <div className="space-y-4">
                            {selectedCCAConfigs.length === 0 ? (
                                <div className="pt-1">
                                    <Button
                                        type="button"
                                        onClick={handleOpenAddCCADialog}
                                        className="bg-[#6D755F] hover:bg-[#5b624f] text-white font-medium text-xs h-9 shadow-sm"
                                    >
                                        <Plus className="h-4 w-4 mr-1.5" /> Add CCA Activity
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
                                        <div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                                Configured CCA Activity Allocations ({selectedCCAConfigs.length})
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Configure separate start dates, end dates, and discounts for each activity.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleOpenAddCCADialog}
                                                className="bg-[#6D755F]/10 text-[#6D755F] border border-[#6D755F] font-medium hover:bg-[#6D755F]/20 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                                            >
                                                <Activity className="h-3.5 w-3.5 mr-1.5" /> Add / Manage Activities
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                                                onClick={() => setSelectedCCAConfigs([])}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" /> Clear All
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                                    <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[150px]">
                                                        Activity Name
                                                    </TableHead>
                                                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[110px]">
                                                        Default Fee
                                                    </TableHead>
                                                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[160px]">
                                                        Start Date <RequiredMark />
                                                    </TableHead>
                                                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[160px]">
                                                        End Date (Optional)
                                                    </TableHead>
                                                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[140px]">
                                                        Discount (₹)
                                                    </TableHead>
                                                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[120px]">
                                                        Net Monthly Rate
                                                    </TableHead>
                                                    <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wider text-slate-500 w-[60px]">
                                                        Remove
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedCCAConfigs.map((item) => {
                                                    const disc = item.discountAmount !== "" ? Number(item.discountAmount) : 0;
                                                    const net = Math.max(0, item.fee - disc);
                                                    return (
                                                        <TableRow
                                                            key={item.activityId}
                                                            className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                                                        >
                                                            <TableCell className="pl-6 font-semibold text-xs text-slate-900 dark:text-slate-100">
                                                                <div className="flex items-center gap-2">
                                                                    <Activity className="h-3.5 w-3.5 text-[#6D755F]" />
                                                                    <span>{item.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                                ₹{item.fee.toLocaleString()} / {item.frequency || "Month"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="date"
                                                                    value={item.startDate}
                                                                    onChange={(e) =>
                                                                        handleUpdateCCAItem(item.activityId, "startDate", e.target.value)
                                                                    }
                                                                    className="h-9 text-xs rounded-lg bg-white dark:bg-slate-950"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="date"
                                                                    value={item.endDate}
                                                                    onChange={(e) =>
                                                                        handleUpdateCCAItem(item.activityId, "endDate", e.target.value)
                                                                    }
                                                                    className="h-9 text-xs rounded-lg bg-white dark:bg-slate-950"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="relative">
                                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                                                                        ₹
                                                                    </span>
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        placeholder="0"
                                                                        value={item.discountAmount}
                                                                        onChange={(e) =>
                                                                            handleUpdateCCAItem(
                                                                                item.activityId,
                                                                                "discountAmount",
                                                                                e.target.value === "" ? "" : Number(e.target.value)
                                                                            )
                                                                        }
                                                                        className="pl-6 h-9 text-xs rounded-lg bg-white dark:bg-slate-950"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-bold text-xs text-[#6D755F] dark:text-[#9ea98a]">
                                                                ₹{net.toLocaleString()} / Month
                                                            </TableCell>
                                                            <TableCell className="pr-6 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                                    onClick={() => handleRemoveCCAItem(item.activityId)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-6 py-3.5 text-xs gap-2">
                                        <span className="text-slate-500">
                                            Selected {selectedCCAConfigs.length} Activities &bull; Gross: ₹{ccaGrossAmount.toLocaleString()}
                                            {ccaTotalDiscount > 0 && ` | Total Discount: −₹${ccaTotalDiscount.toLocaleString()}`}
                                        </span>
                                        <span className="font-bold text-sm text-[#6D755F] dark:text-[#9ea98a]">
                                            Net Monthly CCA Total: ₹{ccaNetAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </StepSection>

                </div>
            )}

            {/* Clear Fields Confirmation Dialog */}
            <AlertDialog open={isClearFieldsDialogOpen} onOpenChange={setIsClearFieldsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear all configured charge types and reset your selected Fee Structure template. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearFields} className="bg-red-600 hover:bg-red-700 text-white">
                            Yes, clear fields
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Charge Type Dialog */}
            <AlertDialog open={isAddChargeDialogOpen} onOpenChange={setIsAddChargeDialogOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add Additional Charge Types</AlertDialogTitle>
                        <AlertDialogDescription>
                            Select one or more charge types to append to the fee structure.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-2 max-h-[320px] overflow-y-auto space-y-2 pr-1">
                        {loadingChargeTypes ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
                                <Loader2 className="h-5 w-5 animate-spin text-[#6D755F]" />
                                <span className="text-sm font-medium">Loading charge types...</span>
                            </div>
                        ) : (
                            <>
                                {chargeTypesList
                                    .filter(ct => !editableFeeItems.some(efi => efi.chargeTypeId === ct.id))
                                    .map(ct => {
                                        const isSelected = selectedNewChargeTypeIds.includes(ct.id);
                                        return (
                                            <div
                                                key={ct.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedNewChargeTypeIds(prev => prev.filter(id => id !== ct.id));
                                                    } else {
                                                        setSelectedNewChargeTypeIds(prev => [...prev, ct.id]);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl border-2 transition-colors cursor-pointer",
                                                    isSelected
                                                        ? "border-[#6D755F] bg-[#6D755F] shadow-sm"
                                                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`charge-${ct.id}`}
                                                        checked={isSelected}
                                                        tabIndex={-1}
                                                        className={cn(
                                                            "h-4 w-4 rounded border-slate-400 dark:border-slate-600 pointer-events-none data-[state=checked]:!bg-white data-[state=checked]:!text-[#6D755F] data-[state=checked]:!border-white",
                                                            isSelected && "border-white"
                                                        )}
                                                    />
                                                    <span className={cn(
                                                        "text-sm font-medium",
                                                        isSelected ? "text-white" : "text-slate-900 dark:text-slate-100"
                                                    )}>
                                                        {ct.name}
                                                    </span>
                                                </div>
                                                {ct.frequency && (
                                                    <span className={cn(
                                                        "text-xs capitalize px-2 py-0.5 rounded-md font-normal",
                                                        isSelected
                                                            ? "bg-white/20 text-white"
                                                            : "text-slate-500 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                                                    )}>
                                                        {ct.frequency.toLowerCase()}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                {chargeTypesList.filter(ct => !editableFeeItems.some(efi => efi.chargeTypeId === ct.id)).length === 0 && !loadingChargeTypes && (
                                    <div className="text-center py-6 text-xs text-slate-500">
                                        All available charge types are already added.
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedNewChargeTypeIds([])}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAddChargeTypes}
                            disabled={selectedNewChargeTypeIds.length === 0}
                            style={{ backgroundColor: "#6D755F" }}
                            className="!text-white font-medium shadow-sm hover:!bg-[#5b624f] disabled:opacity-40 disabled:shadow-none disabled:hover:!bg-[#6D755F]"
                        >
                            Done ({selectedNewChargeTypeIds.length})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add CCA Activity Dialog */}
            <AlertDialog open={isAddCCADialogOpen} onOpenChange={setIsAddCCADialogOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Select Co-Curricular Activities (CCA)</AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose one or more CCA activities to assign with this student admission.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-2 max-h-[320px] overflow-y-auto space-y-2 pr-1">
                        {ccaActivities.length === 0 ? (
                            <div className="text-center py-6 text-xs text-slate-500">
                                No CCA activities configured yet. Manage activities in Admin &gt; Co-Curricular (CCA).
                            </div>
                        ) : (
                            ccaActivities.map((act) => {
                                const isSelected = selectedNewCCAIds.includes(act.id);
                                return (
                                    <div
                                        key={act.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedNewCCAIds((prev) => prev.filter((id) => id !== act.id));
                                            } else {
                                                setSelectedNewCCAIds((prev) => [...prev, act.id]);
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border-2 transition-colors cursor-pointer",
                                            isSelected
                                                ? "border-[#6D755F] bg-[#6D755F] shadow-sm"
                                                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`cca-${act.id}`}
                                                checked={isSelected}
                                                tabIndex={-1}
                                                className={cn(
                                                    "h-4 w-4 rounded border-slate-400 dark:border-slate-600 pointer-events-none data-[state=checked]:!bg-white data-[state=checked]:!text-[#6D755F] data-[state=checked]:!border-white",
                                                    isSelected && "border-white"
                                                )}
                                            />
                                            <div>
                                                <span className={cn("text-sm font-medium block", isSelected ? "text-white" : "text-slate-900 dark:text-slate-100")}>
                                                    {act.name}
                                                </span>
                                                <span className={cn("text-xs", isSelected ? "text-white/80" : "text-slate-500")}>
                                                    ₹{(act.defaultFee || Number(act.feeAmount) || 0).toLocaleString()} / {act.frequency || "MONTHLY"}
                                                </span>
                                            </div>
                                        </div>
                                        {act.code && (
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-md font-mono",
                                                isSelected ? "bg-white/20 text-white" : "text-slate-500 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                                            )}>
                                                {act.code}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsAddCCADialogOpen(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAddCCA}
                            style={{ backgroundColor: "#6D755F" }}
                            className="!text-white font-medium shadow-sm hover:!bg-[#5b624f]"
                        >
                            Done ({selectedNewCCAIds.length})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}