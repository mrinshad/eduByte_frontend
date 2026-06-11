"use client";

import { getClasses, type SchoolClass } from "@/lib/services/class";
import { getAcademicYears, type AcademicYearSummary } from "@/lib/services/academicYear";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getChargeTypes, type ChargeTypes, } from "@/lib/services/chargeTypes";
import { createFeeStructure, GetEditFeeStructure, EditFeeStructure, type CreateFeeStructureInput } from "@/lib/services/feeStructure";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const feeStructureId = searchParams.get("id");
    const isEditMode = !!feeStructureId;

    const fieldClass =
        "bg-input border-border text-foreground placeholder:text-muted-foreground rounded-md";

    const [showFeeItems, setShowFeeItems] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);

    const [feeItems, setFeeItems] = useState<
        {
            chargeTypeId: string;
            amount: string;
        }[]
    >([]);

    const addFeeItem = () => {
        if (!showFeeItems) {
            setFeeItems([
                {
                    chargeTypeId: "",
                    amount: "",
                },
            ]);

            setShowFeeItems(true);
            return;
        }

        setFeeItems([
            {
                chargeTypeId: "",
                amount: "",
            },
            ...feeItems,
        ]);
    };

    const deleteFeeItem = (index: number) => {
        const updated = feeItems.filter((_, i) => i !== index);

        setFeeItems(updated);

        if (updated.length === 0) {
            setShowFeeItems(false);
        }
    };

    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState("");

    const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

    const [chargeTypes, setChargeTypes] = useState<ChargeTypes[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(false);


    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    classData,
                    academicYearData,
                    chargeTypeData,
                ] = await Promise.all([
                    getClasses(),
                    getAcademicYears(),
                    getChargeTypes(),
                ]);

                setClasses(classData);
                setAcademicYears(academicYearData);
                setChargeTypes(chargeTypeData);

                // If in edit mode, load the fee structure data
                if (isEditMode && feeStructureId) {
                    const response = await GetEditFeeStructure(feeStructureId);
                    const data = response.data;
                    
                    setName(data.name);
                    setDescription(data.description || "");
                    setIsActive(data.isActive);
                    
                    // Find academic year by name
                    const academicYear = academicYearData.find(ay => ay.name === data.academicYearName);
                    if (academicYear) {
                        setSelectedAcademicYear(academicYear.id);
                    }
                    
                    // Find class by name
                    const classItem = classData.find(c => c.name === data.className);
                    if (classItem) {
                        setSelectedClass(classItem.id);
                    }
                    
                    // Pre-populate fee items
                    const items = data.items.map(item => ({
                        chargeTypeId: chargeTypeData.find(ct => ct.name === item.chargeTypeName)?.id || "",
                        amount: item.amount,
                    }));
                    setFeeItems(items);
                    if (items.length > 0) {
                        setShowFeeItems(true);
                    }
                } else {
                    // Create mode - set active year as default
                    const activeYear = academicYearData.find(
                        (y) => y.isActive
                    );

                    if (activeYear) {
                        setSelectedAcademicYear(activeYear.id);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [isEditMode, feeStructureId]);

    const handleCreateFeeStructure = async () => {
        if (!name.trim()) {
            toast.error("Please enter fee structure name");
            return;
        }

        if (!selectedClass) {
            toast.error("Please select a class");
            return;
        }

        if (!selectedAcademicYear) {
            toast.error("Please select an academic year");
            return;
        }

        if (feeItems.length === 0) {
            toast.error("Please add at least one fee item");
            return;
        }
        try {
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

            console.log("Fee Structure Payload:", payload);

            let response;
            if (isEditMode && feeStructureId) {
                response = await EditFeeStructure(feeStructureId, payload);
                toast.success("Fee Structure updated successfully");
            } else {
                response = await createFeeStructure(payload);
                toast.success("Fee Structure created successfully");
            }

            console.log("API Response:", response);

            resetForm();
            router.push("/admin/fee-structures");
        } catch (error) {
            console.error(error);

            toast.error(isEditMode ? "Failed to update fee structure" : "Failed to create fee structure");
        }
    };
    const resetForm = () => {
        setName("");
        setDescription("");
        setSelectedClass("");
        setIsActive(false);

        const activeYear = academicYears.find((y) => y.isActive);

        if (activeYear) {
            setSelectedAcademicYear(activeYear.id);
        } else {
            setSelectedAcademicYear("");
        }

        setFeeItems([]);
        setShowFeeItems(false);
    };
    if (isLoading) {
        return (
            <section className="px-6 py-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="px-6 py-4">
            <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                        {isEditMode ? "Edit Fee Structure" : "Create Fee Structure"}
                    </h1>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-600">Set up fee components, assign charge types, and configure payment-related settings.</p>
                </div>
            </div>
            <Card className="mt-6 border-slate-200 dark:border-slate-700">
                <CardContent>
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                Fee Structure
                            </h2>
                            <div className="space-y-2">
                                <Label htmlFor="feeCode">Class</Label>
                                <Select
                                    value={selectedClass}
                                    onValueChange={setSelectedClass}
                                >
                                    <SelectTrigger className={`w-full ${fieldClass}`}>
                                        <SelectValue placeholder="Select class name" />
                                    </SelectTrigger>

                                    <SelectContent className="bg-white border-[#788164] rounded-3xl shadow-lg p-2">
                                        {classes.map((cls) => (
                                            <SelectItem
                                                key={cls.id}
                                                value={cls.id}
                                                className="
                                                            rounded-full
                                                            text-black
                                                            data-[highlighted]:bg-[#8a9770]
                                                            data-[highlighted]:text-white
                                                            data-[state=checked]:bg-[#8a9770]
                                                            data-[state=checked]:text-white
                                                        "
                                            >
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="feeCode">Academic Year</Label>
                                <Select
                                    value={selectedAcademicYear}
                                    onValueChange={setSelectedAcademicYear}
                                >
                                    <SelectTrigger className={`w-full ${fieldClass}`}>
                                        <SelectValue placeholder="Select Academic Year" />
                                    </SelectTrigger>

                                    <SelectContent className="bg-white border-[#788164] rounded-3xl shadow-lg p-2">
                                        {academicYears.map((year) => (
                                            <SelectItem
                                                key={year.id}
                                                value={year.id}
                                                className="
                                                            rounded-full
                                                            text-black
                                                            data-[highlighted]:bg-[#8a9770]
                                                            data-[highlighted]:text-white
                                                            data-[state=checked]:bg-[#8a9770]
                                                            data-[state=checked]:text-white
                                                            "
                                            >
                                                {year.name}
                                                {year.isActive ? " (Active)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="feeCode">Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Fee Structure Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="feeCode">Desc</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Description"
                                />
                            </div>
                            <div className="space-y-2 pl-2">


                                <div className="flex items-center gap-4">
                                    <Label htmlFor="active">Active</Label>
                                    <Checkbox
                                        checked={isActive}
                                        onCheckedChange={(checked) =>
                                            setIsActive(Boolean(checked))
                                        }
                                    />

                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 ">
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                Fee Items
                            </h2>

                            {!showFeeItems ? (
                                <Card className="mt-2">
                                    <CardContent className="p-4">
                                        <div
                                            className="
                                                            flex min-h-[280px] flex-col items-center justify-center
                                                            rounded-xl border-2 border-dashed border-border
                                                            text-center
                                                        "
                                        >
                                            <h3 className="text-xl font-semibold">
                                                Add Fee Items
                                            </h3>

                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Add fee item names and amounts.
                                            </p>

                                            <Button
                                                className="mt-6"
                                                onClick={addFeeItem}
                                            >
                                                + Add Item
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border rounded-xl mt-6">
                                    <CardContent className="p-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>

                                                <p className="text-sm text-muted-foreground">
                                                    Add fee components and amounts
                                                </p>
                                            </div>

                                            <Button
                                                size="sm"
                                                onClick={addFeeItem}
                                            >
                                                Add Item
                                            </Button>
                                        </div>

                                        <div className="space-y-3 max-h-[200px]
                                        overflow-y-auto
                                        pr-2
                                        space-y-3

                                        [&::-webkit-scrollbar]:w-2
                                        [&::-webkit-scrollbar-track]:bg-transparent
                                        [&::-webkit-scrollbar-thumb]:bg-slate-300
                                        [&::-webkit-scrollbar-thumb]:rounded-full
                                        hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                                        >
                                            {feeItems.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 border rounded-lg p-3"
                                                >
                                                    <div className="flex-1">
                                                        <Select
                                                            value={item.chargeTypeId}
                                                            onValueChange={(value) => {
                                                                const updated = [...feeItems];
                                                                updated[index].chargeTypeId = value;
                                                                setFeeItems(updated);
                                                            }}
                                                        >
                                                            <SelectTrigger className={`w-full ${fieldClass}`}>
                                                                <SelectValue placeholder="Select Fee Item" />
                                                            </SelectTrigger>

                                                            <SelectContent className="bg-white border-[#788164] rounded-3xl shadow-lg p-2">
                                                                {chargeTypes.map((chargeType) => (
                                                                    <SelectItem
                                                                        key={chargeType.id}
                                                                        value={chargeType.id}
                                                                        className="
                                                                                    rounded-full
                                                                                    text-black
                                                                                    data-[highlighted]:bg-[#8a9770]
                                                                                    data-[highlighted]:text-white
                                                                                    data-[state=checked]:bg-[#8a9770]
                                                                                    data-[state=checked]:text-white
                                                                                    "
                                                                    >
                                                                        {chargeType.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="w-40">
                                                        <Input
                                                            type="string"
                                                            placeholder="Amount"
                                                            value={item.amount}
                                                            onChange={(e) => {
                                                                const updated = [...feeItems];
                                                                updated[index].amount = e.target.value;
                                                                setFeeItems(updated);
                                                            }}
                                                        />
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => deleteFeeItem(index)}
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end p-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="ml-2"
                        onClick={handleCreateFeeStructure}
                    >
                        {isEditMode ? "Update" : "Create"}
                    </Button>
                </CardFooter>
            </Card>
        </section>
    )
}
