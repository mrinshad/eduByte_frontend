"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api-error";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    ArrowLeft,
    ChevronsUpDown,
    Loader2,
    Layers,
    Calendar,
    Wallet,
    Trash2,
    Plus,
    FileText,
    Check
} from "lucide-react";

import { getClasses, type SchoolClass } from "@/lib/services/class";
import { getAcademicYears, type AcademicYearSummary } from "@/lib/services/academicYear";
import { getChargeTypes, type ChargeTypes } from "@/lib/services/chargeTypes";
import { createFeeStructure, GetEditFeeStructure, EditFeeStructure, type CreateFeeStructureInput } from "@/lib/services/feeStructure";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Shared UI Components from Admission Page ---
const FEE_STRUCTURE_DUPLICATE_MAP = {
  name: { field: "name", message: "A fee structure with this name already exists" },
};
const inputClass = `
  h-14
  w-full
  rounded-xl
  border border-slate-300 dark:border-slate-700
  px-4
  text-base
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-slate-100
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  focus:ring-2
  focus:ring-[#6D755F]
  focus:border-[#6D755F]
`;

// Dropdown panel styling (shared across all popovers)
const popoverContentClass = `
  rounded-xl
  border border-slate-200 dark:border-slate-800
  bg-white dark:bg-slate-900
  shadow-lg
  p-0
`;

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

// Small red asterisk shown next to labels for required fields
const RequiredMark = () => (
    <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>
);

// ── Field-level validators (same pattern as the Create Staff form) ──

const STRUCTURE_NAME_PATTERN = /^[a-zA-Z0-9\s.,'()/-]+$/;

function validateStructureName(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return "Structure name is required";
    if (trimmed.length < 3) return "Must be at least 3 characters";
    if (trimmed.length > 100) return "Must be under 100 characters";
    if (!STRUCTURE_NAME_PATTERN.test(trimmed)) return "Only letters, numbers, spaces and . , ' ( ) - / are allowed";
    return undefined;
}

function validateClassSelection(value: string): string | undefined {
    if (!value) return "Please select a class";
    return undefined;
}

function validateAcademicYearSelection(value: string): string | undefined {
    if (!value) return "Please select an academic year";
    return undefined;
}

function validateDescription(value: string): string | undefined {
    const trimmed = value.trim();
    if (trimmed.length > 500) return "Must be under 500 characters";
    return undefined;
}

// --- Main Page Component ---

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const feeStructureId = searchParams.get("id");
    const isEditMode = !!feeStructureId;

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);

    const [feeItems, setFeeItems] = useState<{ chargeTypeId: string; amount: string; }[]>([]);
    const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

    // Field-level errors for the Core Configuration inputs
    const [fieldErrors, setFieldErrors] = useState<{
        name?: string;
        selectedClass?: string;
        selectedAcademicYear?: string;
        description?: string;
    }>({});

    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState("");

    const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

    const [chargeTypes, setChargeTypes] = useState<ChargeTypes[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);

    // Popover open states
    const [classOpen, setClassOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);
    const [openChargeIndex, setOpenChargeIndex] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [classData, academicYearData, chargeTypeData] = await Promise.all([
                    getClasses(),
                    getAcademicYears(),
                    getChargeTypes(),
                ]);

                setClasses(classData);
                setAcademicYears(academicYearData);
                setChargeTypes(chargeTypeData);

                if (isEditMode && feeStructureId) {
                    const response = await GetEditFeeStructure(feeStructureId);
                    const data = response.data;

                    setName(data.name);
                    setDescription(data.description || "");
                    setIsActive(data.isActive);

                    const academicYear = academicYearData.find(ay => ay.name === data.academicYearName);
                    if (academicYear) setSelectedAcademicYear(academicYear.id);

                    const classItem = classData.find(c => c.name === data.className);
                    if (classItem) setSelectedClass(classItem.id);

                    const items = data.items.map(item => ({
                        chargeTypeId: chargeTypeData.find(ct => ct.name === item.chargeTypeName)?.id || "",
                        amount: item.amount,
                    }));
                    setFeeItems(items);
                } else {
                    const activeYear = academicYearData.find((y) => y.isActive);
                    if (activeYear) setSelectedAcademicYear(activeYear.id);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [isEditMode, feeStructureId]);

    const addFeeItem = () => {
        setFeeItems([...feeItems, { chargeTypeId: "", amount: "" }]);
    };

    const deleteFeeItem = (index: number) => {
        setFeeItems(feeItems.filter((_, i) => i !== index));
        setItemErrors((prev) => {
            const next: Record<number, string> = {};
            Object.entries(prev).forEach(([key, value]) => {
                const keyIndex = Number(key);
                if (keyIndex === index) return; // drop the removed row's error
                const shiftedIndex = keyIndex > index ? keyIndex - 1 : keyIndex;
                next[shiftedIndex] = value;
            });
            return next;
        });
    };

    const clearItemError = (index: number) => {
        setItemErrors((prev) => {
            if (!(index in prev)) return prev;
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    // Validates every fee item row individually and returns a map of
    // index -> error message. Also flags duplicate charge type selections.
    const validateFeeItems = (): { valid: boolean; errors: Record<number, string> } => {
        const errors: Record<number, string> = {};
        const seenChargeTypeIds = new Map<string, number>();

        feeItems.forEach((item, index) => {
            if (!item.chargeTypeId) {
                errors[index] = "Select a charge type";
                return;
            }

            if (seenChargeTypeIds.has(item.chargeTypeId)) {
                errors[index] = "This charge type is already added";
                const firstIndex = seenChargeTypeIds.get(item.chargeTypeId)!;
                errors[firstIndex] = "This charge type is already added";
                return;
            }
            seenChargeTypeIds.set(item.chargeTypeId, index);

            const trimmedAmount = item.amount.trim();
            if (trimmedAmount === "") {
                errors[index] = "Enter an amount";
                return;
            }

            const numericAmount = Number(trimmedAmount);
            if (Number.isNaN(numericAmount)) {
                errors[index] = "Amount must be a number";
            } else if (numericAmount <= 0) {
                errors[index] = "Amount must be greater than 0";
            } else if (numericAmount > 10000000) {
                errors[index] = "Amount seems unrealistically high";
            }
        });

        return { valid: Object.keys(errors).length === 0, errors };
    };

    // Best-effort extraction of a human-readable message from whatever
    // apiFetch throws (Error instance, plain object with `message`, or a
    // raw string), so real backend validation errors reach the user
    // instead of a generic fallback.
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

    const handleCreateFeeStructure = async () => {
        const nextFieldErrors: typeof fieldErrors = {
            name: validateStructureName(name),
            selectedClass: validateClassSelection(selectedClass),
            selectedAcademicYear: validateAcademicYearSelection(selectedAcademicYear),
            description: validateDescription(description),
        };
        setFieldErrors(nextFieldErrors);

        if (feeItems.length === 0) {
            toast.error("Please add at least one fee item");
            return;
        }

        const { valid, errors } = validateFeeItems();
        setItemErrors(errors);

        // Surface the first problem found, top fields first, then fee items
        const firstFieldError = Object.values(nextFieldErrors).find(Boolean);
        if (firstFieldError) {
            toast.error(firstFieldError);
            return;
        }

        if (!valid) {
            const firstItemError = Object.values(errors)[0];
            toast.error(firstItemError ?? "Please fix the highlighted fee items");
            return;
        }

        try {
            setSubmitting(true);
            const payload: CreateFeeStructureInput = {
                name: name.trim(),
                academicYearId: selectedAcademicYear,
                classId: selectedClass,
                isActive,
                description: description.trim(),
                items: feeItems.map((item) => ({
                    chargeTypeId: item.chargeTypeId,
                    amount: Number(item.amount),
                })),
            };

            if (isEditMode && feeStructureId) {
                await EditFeeStructure(feeStructureId, payload);
                toast.success("Fee Structure updated successfully");
            } else {
                await createFeeStructure(payload);
                toast.success("Fee Structure created successfully");
            }

            router.push("/admin/fee-structures");
        } catch (error) {
            console.error(error);
            const fallback = isEditMode
                ? "Failed to update fee structure"
                : "Failed to create fee structure";
            const parsed = parseApiError(error, fallback, FEE_STRUCTURE_DUPLICATE_MAP);

            if (parsed.field) {
                setFieldErrors((prev) => ({ ...prev, [parsed.field as keyof typeof prev]: parsed.message }));
            }
            toast.error(parsed.message);

            if (parsed.isAuthError) {
                router.push("/login");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {isEditMode ? "Edit Fee Structure" : "Create Fee Structure"}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Set up fee components, assign charge types, and configure billing parameters.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()} disabled={submitting} className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        Discard
                    </Button>
                    <Button
                        onClick={handleCreateFeeStructure}
                        disabled={submitting || !selectedClass || !selectedAcademicYear || !name}
                        className="rounded-xl h-11 px-8 bg-[#6D755F] text-white hover:bg-[#5b624f] shadow-md dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {submitting
                            ? "Processing..."
                            : isEditMode
                                ? "Update Structure"
                                : "Confirm Structure"}
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#6D755F]" />
                    <span className="text-sm font-medium">Loading structure data...</span>
                </div>
            ) : (
                <div className="mx-auto max-w-5xl space-y-8 pb-12">
                    {/* Step 1: Core Configuration */}
                    <StepSection
                        stepNumber="1"
                        title="Core Configuration"
                        description="Define the overarching properties for this financial blueprint."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Class Selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5 text-[#6D755F]" /> Target Class<RequiredMark />
                                </Label>
                                <Popover open={classOpen} onOpenChange={setClassOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={classOpen}
                                            className={cn(
                                                "h-14 w-full justify-between rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                                                "focus:ring-2 focus:ring-[#6D755F] focus:border-[#6D755F]",
                                                fieldErrors.selectedClass && "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400"
                                            )}
                                        >
                                            {selectedClass ? classes.find((c) => c.id === selectedClass)?.name : "Select class name"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className={cn(popoverContentClass, "w-[--radix-popover-trigger-width]")} align="start">
                                        <Command>
                                            <CommandInput placeholder="Search class..." />
                                            <CommandList>
                                                <CommandEmpty>No classes found.</CommandEmpty>
                                                <CommandGroup>
                                                    {classes.map((cls) => (
                                                        <CommandItem
                                                            key={cls.id}
                                                            value={cls.name}
                                                            onSelect={() => {
                                                                setSelectedClass(cls.id);
                                                                setFieldErrors((prev) => ({ ...prev, selectedClass: undefined }));
                                                                setClassOpen(false);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", selectedClass === cls.id ? "opacity-100" : "opacity-0")} />
                                                            <span>{cls.name}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {fieldErrors.selectedClass && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.selectedClass}
                                    </p>
                                )}
                            </div>

                            {/* Academic Year Selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-[#6D755F]" /> Academic Year<RequiredMark />
                                </Label>
                                <Popover open={yearOpen} onOpenChange={setYearOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={yearOpen}
                                            className={cn(
                                                "h-14 w-full justify-between rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                                                "focus:ring-2 focus:ring-[#6D755F] focus:border-[#6D755F]",
                                                fieldErrors.selectedAcademicYear && "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400"
                                            )}
                                        >
                                            {selectedAcademicYear ? academicYears.find((y) => y.id === selectedAcademicYear)?.name : "Select Academic Year"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className={cn(popoverContentClass, "w-[--radix-popover-trigger-width]")} align="start">
                                        <Command>
                                            <CommandInput placeholder="Search academic year..." />
                                            <CommandList>
                                                <CommandEmpty>No academic years found.</CommandEmpty>
                                                <CommandGroup>
                                                    {academicYears.map((year) => (
                                                        <CommandItem
                                                            key={year.id}
                                                            value={year.name}
                                                            onSelect={() => {
                                                                setSelectedAcademicYear(year.id);
                                                                setFieldErrors((prev) => ({ ...prev, selectedAcademicYear: undefined }));
                                                                setYearOpen(false);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", selectedAcademicYear === year.id ? "opacity-100" : "opacity-0")} />
                                                            <span>
                                                                {year.name}
                                                                {year.isActive ? " (Active)" : ""}
                                                            </span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {fieldErrors.selectedAcademicYear && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.selectedAcademicYear}
                                    </p>
                                )}
                            </div>

                            {/* Structure Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-[#6D755F]" /> Structure Name<RequiredMark />
                                </Label>
                                <Input
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, name: undefined }));
                                    }}
                                    placeholder="e.g. Grade 10 - Annual Standard"
                                    className={cn(
                                        inputClass,
                                        fieldErrors.name && "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400"
                                    )}
                                />
                                {fieldErrors.name && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2 md:row-span-2">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-[#6D755F]" /> Description
                                </Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, description: undefined }));
                                    }}
                                    placeholder="Optional details regarding this fee structure..."
                                    className={cn(
                                        inputClass,
                                        "min-h-[120px] py-3 resize-none",
                                        fieldErrors.description && "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400"
                                    )}
                                />
                                {fieldErrors.description && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.description}
                                    </p>
                                )}
                            </div>

                            {/* Active Status */}
                            <div className="space-y-2 flex flex-col justify-center">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <Check className="h-3.5 w-3.5 text-[#6D755F]" /> Operational Status
                                </Label>
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <Checkbox
                                        id="activeStatus"
                                        checked={isActive}
                                        onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                                        className="data-[state=checked]:bg-[#6D755F] data-[state=checked]:text-white border-slate-300 dark:border-slate-700 h-5 w-5 rounded-md"
                                    />
                                    <Label htmlFor="activeStatus" className="text-sm font-medium cursor-pointer">
                                        Mark as Active Template
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </StepSection>

                    {/* Step 2: Fee Items Mapping */}
                    <StepSection
                        stepNumber="2"
                        title="Fee Component Mapping"
                        description="Assign specific charge types and their base amounts for this structure."
                    >
                        {feeItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 py-12 text-center">
                                <Wallet className="h-8 w-8 text-slate-400 mb-4" />
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No Fee Items Mapped</h3>
                                <p className="text-sm text-slate-500 mt-1 mb-6 max-w-sm">
                                    Add individual fee components like Tuition, Transport, or Library fees to complete the structure.
                                </p>
                                <Button onClick={addFeeItem} className="rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                    <Plus className="h-4 w-4 mr-2" /> Add First Item
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
                                        <div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                                Active Components<RequiredMark />
                                            </span>
                                            <span className="text-xs text-slate-500">Configure base amounts for each charge type.</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={addFeeItem}
                                            className="h-9 rounded-lg bg-[#6D755F]/10 text-[#6D755F] hover:bg-[#6D755F]/20 dark:bg-[#6D755F]/20 dark:text-white"
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add Component
                                        </Button>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {feeItems.map((item, index) => {
                                            const rowError = itemErrors[index];
                                            return (
                                                <div key={index} className="space-y-1.5">
                                                    <div
                                                        className={cn(
                                                            "flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30",
                                                            rowError
                                                                ? "border-red-400 dark:border-red-500/60 bg-red-50/50 dark:bg-red-950/20"
                                                                : "border-slate-100 dark:border-slate-800"
                                                        )}
                                                    >
                                                        <div className="w-full md:flex-1">
                                                            <Popover open={openChargeIndex === index} onOpenChange={(open) => setOpenChargeIndex(open ? index : null)}>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn(
                                                                            inputClass,
                                                                            "h-11 justify-between",
                                                                            rowError && "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400"
                                                                        )}
                                                                    >
                                                                        {item.chargeTypeId ? chargeTypes.find((ct) => ct.id === item.chargeTypeId)?.name : "Select Charge Type"}
                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className={cn(popoverContentClass, "w-[--radix-popover-trigger-width]")} align="start">
                                                                    <Command>
                                                                        <CommandInput placeholder="Search charge type..." />
                                                                        <CommandList>
                                                                            <CommandEmpty>No charge types found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {chargeTypes.map((chargeType) => (
                                                                                    <CommandItem
                                                                                        key={chargeType.id}
                                                                                        value={chargeType.name}
                                                                                        onSelect={() => {
                                                                                            const updated = [...feeItems];
                                                                                            updated[index].chargeTypeId = chargeType.id;
                                                                                            setFeeItems(updated);
                                                                                            clearItemError(index);
                                                                                            setOpenChargeIndex(null);
                                                                                        }}
                                                                                        className="cursor-pointer"
                                                                                    >
                                                                                        <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", item.chargeTypeId === chargeType.id ? "opacity-100" : "opacity-0")} />
                                                                                        <span>{chargeType.name}</span>
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>

                                                        <div className="w-full md:w-48 relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₹</span>
                                                            <Input
                                                                type="number"
                                                                placeholder="Amount"
                                                                value={item.amount}
                                                                onChange={(e) => {
                                                                    const updated = [...feeItems];
                                                                    updated[index].amount = e.target.value;
                                                                    setFeeItems(updated);
                                                                    clearItemError(index);
                                                                }}
                                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                                className={cn(
                                                                    inputClass,
                                                                    "h-11 pl-8",
                                                                    rowError && "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400"
                                                                )}
                                                            />
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteFeeItem(index)}
                                                            className="h-11 w-11 shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    {rowError && (
                                                        <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                                            {rowError}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl bg-[#6D755F] px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white/90">Gross Structure Total</span>
                                        <span className="text-xs text-white/70">Calculated sum of all configured components</span>
                                    </div>
                                    <span className="text-3xl font-bold tracking-tight text-white">
                                        ₹{feeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()}
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