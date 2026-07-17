"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Shared UI Components from Admission Page ---

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

const selectClass = `
  h-14
  w-full
  rounded-xl
  border border-slate-300 dark:border-slate-700
  px-4
  text-base
  !bg-white dark:!bg-slate-900
  !text-slate-900 dark:!text-slate-100
  justify-between
  focus:ring-2
  focus:ring-[#6D755F]
  focus:border-[#6D755F]
`;

// Dropdown panel styling (shared across all selects)
const selectContentClass = `
  rounded-xl
  border border-slate-200 dark:border-slate-800
  bg-white dark:bg-slate-900
  shadow-lg
`;

// Updated SelectItem theme styling
const selectItemClass = `
  rounded-lg cursor-pointer text-slate-900 dark:text-slate-100
  focus:bg-[#6D755F]/10 dark:focus:bg-[#6D755F]/20
  data-[highlighted]:bg-[#6D755F] data-[highlighted]:text-white
  data-[state=checked]:bg-[#6D755F] data-[state=checked]:text-white
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

// --- Main Page Component ---

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const feeStructureId = searchParams.get("id");
    const isEditMode = !!feeStructureId;

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);

    const [feeItems, setFeeItems] = useState<{ chargeTypeId: string; amount: string; }[]>([]);

    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState("");

    const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

    const [chargeTypes, setChargeTypes] = useState<ChargeTypes[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(false);


    const [open, setOpen] = useState(false);

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
    };

    const handleCreateFeeStructure = async () => {
        if (!name.trim()) return toast.error("Please enter a fee structure name");
        if (!selectedClass) return toast.error("Please select a class");
        if (!selectedAcademicYear) return toast.error("Please select an academic year");
        if (feeItems.length === 0) return toast.error("Please add at least one fee item");

        try {
            setSubmitting(true);
            const payload: CreateFeeStructureInput = {
                name,
                academicYearId: selectedAcademicYear,
                classId: selectedClass,
                isActive,
                description,
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
            toast.error(isEditMode ? "Failed to update fee structure" : "Failed to create fee structure");
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
                                    <Layers className="h-3.5 w-3.5 text-[#6D755F]" /> Target Class
                                </Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className={selectClass}>
                                        <SelectValue placeholder="Select class name" />
                                    </SelectTrigger>

                                    <SelectContent className={selectContentClass}>
                                        {classes.map((cls) => (
                                            <SelectItem
                                                key={cls.id}
                                                value={cls.id}
                                                className={selectItemClass}
                                            >
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Academic Year Selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-[#6D755F]" /> Academic Year
                                </Label>
                                <Select
                                    value={selectedAcademicYear}
                                    onValueChange={setSelectedAcademicYear}
                                >
                                    <SelectTrigger className={selectClass}>
                                        <SelectValue placeholder="Select Academic Year" />
                                    </SelectTrigger>

                                    <SelectContent className={selectContentClass}>
                                        {academicYears.map((year) => (
                                            <SelectItem
                                                key={year.id}
                                                value={year.id}
                                                className={selectItemClass}
                                            >
                                                {year.name}
                                                {year.isActive ? " (Active)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Structure Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-[#6D755F]" /> Structure Name
                                </Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Grade 10 - Annual Standard"
                                    className={inputClass}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2 md:row-span-2">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-[#6D755F]" /> Description
                                </Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional details regarding this fee structure..."
                                    className={cn(inputClass, "min-h-[120px] py-3 resize-none")}
                                />
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
                                                Active Components
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
                                        {feeItems.map((item, index) => (
                                            <div key={index} className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                                <div className="w-full md:flex-1">
                                                    <Select
                                                        value={item.chargeTypeId}
                                                        onValueChange={(value) => {
                                                            const updated = [...feeItems];
                                                            updated[index].chargeTypeId = value;
                                                            setFeeItems(updated);
                                                        }}
                                                    >
                                                        <SelectTrigger className={cn(inputClass, "h-11")}>
                                                            <SelectValue placeholder="Select Charge Type" />
                                                        </SelectTrigger>
                                                        <SelectContent className={cn(selectContentClass, "p-1")}>
                                                            {chargeTypes.map((chargeType) => (
                                                                <SelectItem
                                                                    key={chargeType.id}
                                                                    value={chargeType.id}
                                                                    className={selectItemClass}
                                                                >
                                                                    {chargeType.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
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
                                                        }}
                                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                        className={cn(inputClass, "h-11 pl-8")}
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
                                        ))}
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