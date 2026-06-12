"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronsUpDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
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

// ---------------------------------------------------------------------------
// Mock data — replace with real fetched data later
// ---------------------------------------------------------------------------

const MOCK_STUDENTS = [
    {
        id: "1",
        studentName: "Aarav Menon",
        admissionNumber: "ADM2024001",
        gender: "Male",
        dob: "2014-05-12",
        bloodGroup: "O+",
        fatherName: "Suresh Menon",
        fatherMobile: "+91 98765 11111",
        motherName: "Anita Menon",
        motherMobile: "+91 98765 11112",
        whatsappNumber: "+91 98765 43210",
        address: "Kochi, Kerala",
        status: "ACTIVE",
    },
    {
        id: "2",
        studentName: "Diya Nair",
        admissionNumber: "ADM2024002",
        gender: "Female",
        dob: "2015-08-22",
        bloodGroup: "A+",
        fatherName: "Ramesh Nair",
        fatherMobile: "+91 98765 22221",
        motherName: "Lakshmi Nair",
        motherMobile: "+91 98765 22222",
        whatsappNumber: "+91 98765 43211",
        address: "Thrissur, Kerala",
        status: "ACTIVE",
    },
    {
        id: "3",
        studentName: "Rohan Pillai",
        admissionNumber: "ADM2024003",
        gender: "Male",
        dob: "2013-11-03",
        bloodGroup: "B+",
        fatherName: "Vinod Pillai",
        fatherMobile: "+91 98765 33331",
        motherName: "Geetha Pillai",
        motherMobile: "+91 98765 33332",
        whatsappNumber: "+91 98765 43212",
        address: "Kozhikode, Kerala",
        status: "INACTIVE",
    },
];

const MOCK_VEHICLES = [
    { id: "v1", vehicleName: "Bus 01 - KL07AB1234" },
    { id: "v2", vehicleName: "Bus 02 - KL07AB5678" },
    { id: "v3", vehicleName: "Van 01 - KL07CD9012" },
    { id: "v4", vehicleName: "Van 02 - KL07CD3456" },
];

// Each fee structure is a template made up of multiple fee items.
// Only ONE fee structure can be selected at a time.
const MOCK_FEE_TEMPLATES = [
    {
        id: "t1",
        name: "Standard Fee Structure",
        items: [
            { name: "Tuition Fee", amount: 5000 },
            { name: "Library Fee", amount: 500 },
            { name: "Sports Fee", amount: 300 },
        ],
    },
    {
        id: "t2",
        name: "Transport Fee Structure",
        items: [
            { name: "Transport Fee", amount: 1500 },
            { name: "Fuel Surcharge", amount: 200 },
        ],
    },
    {
        id: "t3",
        name: "Annual Fee Structure",
        items: [
            { name: "Exam Fee", amount: 600 },
            { name: "Lab Fee", amount: 800 },
            { name: "Tuition Fee", amount: 5000 },
            { name: "Annual Day Fee", amount: 400 },
        ],
    },
    {
        id: "t4",
        name: "Hostel Fee Structure",
        items: [
            { name: "Hostel Rent", amount: 8000 },
            { name: "Mess Fee", amount: 3000 },
            { name: "Maintenance Fee", amount: 500 },
        ],
    },
];

// ---------------------------------------------------------------------------

const fieldClass = `
  h-12
  rounded-xl
  border-[#788164]
  bg-[#6D755F]
  text-white
  placeholder:text-white/70
  focus:ring-0
  focus:ring-offset-0
`;

const readOnlyFieldClass = `
  h-12
  rounded-xl
  border-[#788164]
  bg-[#6D755F]/60
  text-white/90
  cursor-not-allowed
`;

export default function Page() {
    const router = useRouter();

    type FeeItem = {
        id: string;
        name: string;
        amount: number | "";
    };

    type FeeTemplate = {
        id: string;
        name: string;
        items: { name: string; amount: number }[];
    };

    type SelectedFeeTemplate = {
        templateId: string;
        templateName: string;
        items: FeeItem[];
    };

    type Student = {
        id: string;
        studentName: string;
        admissionNumber: string;
        gender: string;
        dob: string;
        bloodGroup: string;
        fatherName: string;
        fatherMobile: string;
        motherName: string;
        motherMobile: string;
        whatsappNumber: string;
        address: string;
        status: string;
    };

    type Vehicle = {
        id: string;
        vehicleName: string;
    };

    // Selected student (drives all the read-only basic info fields)
    const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Selected vehicle (read-only, fetched)
    const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    // Selected fee structure (only one allowed; brings its own items)
    const [feePopoverOpen, setFeePopoverOpen] = useState(false);
    const [selectedFeeTemplate, setSelectedFeeTemplate] =
        useState<SelectedFeeTemplate | null>(null);

    const [loading, setLoading] = useState(false);

    const handleSelectTemplate = (template: FeeTemplate) => {
        setSelectedFeeTemplate({
            templateId: template.id,
            templateName: template.name,
            items: template.items.map((item, idx) => ({
                id: `${template.id}-${idx}`,
                name: item.name,
                amount: item.amount,
            })),
        });
        setFeePopoverOpen(false);
    };

    const handleClearTemplate = () => {
        setSelectedFeeTemplate(null);
    };

    const handleRemoveItem = (itemId: string) => {
        setSelectedFeeTemplate((prev) => {
            if (!prev) return prev;

            const items = prev.items.filter((item) => item.id !== itemId);

            return items.length > 0 ? { ...prev, items } : null;
        });
    };

    const handleItemAmountChange = (itemId: string, value: string) => {
        setSelectedFeeTemplate((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                items: prev.items.map((item) =>
                    item.id === itemId
                        ? { ...item, amount: value === "" ? "" : Number(value) }
                        : item
                ),
            };
        });
    };

    const totalAmount = (selectedFeeTemplate?.items ?? []).reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
    );

    const handleSubmit = () => {
        setLoading(true);

        const payload = {
            studentId: selectedStudent?.id ?? null,
            vehicleId: selectedVehicle?.id ?? null,
            feeTemplate: selectedFeeTemplate,
            totalAmount,
        };

        console.log("Create admission payload:", payload);

        setTimeout(() => setLoading(false), 600);
    };

    return (
        <section className="px-6 py-4">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div>
                    <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                        Create Admission
                    </h1>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Search and select a student to create a new admission record.
                    </p>
                </div>
            </div>

            {/* Main Card */}
            <Card className="mt-6 border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6 space-y-8">
                    {/* Student selection */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Student
                        </h2>

                        <div className="space-y-2 md:w-1/2">
                            <Label htmlFor="studentName">Student Name</Label>

                            <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={studentPopoverOpen}
                                        className={`w-full justify-between font-normal ${fieldClass}`}
                                    >
                                        {selectedStudent ? selectedStudent.studentName : "Search student..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search student by name..." />
                                        <CommandList>
                                            <CommandEmpty>No student found.</CommandEmpty>
                                            <CommandGroup>
                                                {MOCK_STUDENTS.map((student) => (
                                                    <CommandItem
                                                        key={student.id}
                                                        value={student.studentName}
                                                        onSelect={() => {
                                                            setSelectedStudent(student);
                                                            setStudentPopoverOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedStudent?.id === student.id
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{student.studentName}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {student.admissionNumber}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Read-only details fetched from the selected student */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="admissionNumber">Admission Number</Label>
                                <Input
                                    id="admissionNumber"
                                    value={selectedStudent?.admissionNumber ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Input
                                    id="gender"
                                    value={selectedStudent?.gender ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dob">Date Of Birth</Label>
                                <Input
                                    id="dob"
                                    value={selectedStudent?.dob ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bloodGroup">Blood Group</Label>
                                <Input
                                    id="bloodGroup"
                                    value={selectedStudent?.bloodGroup ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fatherName">Father Name</Label>
                                <Input
                                    id="fatherName"
                                    value={selectedStudent?.fatherName ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fatherMobile">Father Phone no</Label>
                                <Input
                                    id="fatherMobile"
                                    value={selectedStudent?.fatherMobile ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="motherName">Mother Name</Label>
                                <Input
                                    id="motherName"
                                    value={selectedStudent?.motherName ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="motherMobile">Mother Phone no</Label>
                                <Input
                                    id="motherMobile"
                                    value={selectedStudent?.motherMobile ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsappNumber">Whatsapp Number</Label>
                                <Input
                                    id="whatsappNumber"
                                    value={selectedStudent?.whatsappNumber ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Input
                                    id="status"
                                    value={selectedStudent?.status ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={selectedStudent?.address ?? ""}
                                placeholder="Auto-filled on selection"
                                readOnly
                                disabled
                                className={`min-h-[100px] ${readOnlyFieldClass}`}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    {/* Vehicle */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Transport
                        </h2>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="vehicleSelect">Vehicle Name</Label>

                                <Popover open={vehiclePopoverOpen} onOpenChange={setVehiclePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={vehiclePopoverOpen}
                                            className={`w-full justify-between font-normal ${fieldClass}`}
                                        >
                                            {selectedVehicle ? selectedVehicle.vehicleName : "Search vehicle..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search vehicle..." />
                                            <CommandList>
                                                <CommandEmpty>No vehicle found.</CommandEmpty>
                                                <CommandGroup>
                                                    {MOCK_VEHICLES.map((vehicle) => (
                                                        <CommandItem
                                                            key={vehicle.id}
                                                            value={vehicle.vehicleName}
                                                            onSelect={() => {
                                                                setSelectedVehicle(vehicle);
                                                                setVehiclePopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedVehicle?.id === vehicle.id
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {vehicle.vehicleName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vehicleName">Vehicle</Label>
                                <Input
                                    id="vehicleName"
                                    value={selectedVehicle?.vehicleName ?? ""}
                                    placeholder="Auto-filled on selection"
                                    readOnly
                                    disabled
                                    className={readOnlyFieldClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    {/* Fee Structure */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Fee Structure
                        </h2>

                        <div className="space-y-2 md:w-1/2">
                            <Label htmlFor="feeTemplateSelect">Fee Structure Template</Label>

                            <Popover open={feePopoverOpen} onOpenChange={setFeePopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={feePopoverOpen}
                                        className={`w-full justify-between font-normal ${fieldClass}`}
                                    >
                                        {selectedFeeTemplate
                                            ? selectedFeeTemplate.templateName
                                            : "Search fee structure..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search fee structure..." />
                                        <CommandList>
                                            <CommandEmpty>No fee structure found.</CommandEmpty>
                                            <CommandGroup>
                                                {MOCK_FEE_TEMPLATES.map((template) => {
                                                    const isSelected =
                                                        selectedFeeTemplate?.templateId === template.id;

                                                    const templateTotal = template.items.reduce(
                                                        (sum, item) => sum + item.amount,
                                                        0
                                                    );

                                                    return (
                                                        <CommandItem
                                                            key={template.id}
                                                            value={template.name}
                                                            onSelect={() => handleSelectTemplate(template)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    isSelected ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex w-full flex-col">
                                                                <div className="flex w-full items-center justify-between">
                                                                    <span>{template.name}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ₹{templateTotal.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {template.items.length} item
                                                                    {template.items.length > 1 ? "s" : ""}
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Selected fee structure */}
                        {!selectedFeeTemplate ? (
                            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-sm text-muted-foreground">
                                No fee structure selected yet. Search and pick one above.
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between border-b px-4 py-3">
                                    <span className="text-sm font-semibold">
                                        {selectedFeeTemplate.templateName}
                                    </span>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="text-red-500"
                                        onClick={handleClearTemplate}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fee Name</TableHead>
                                            <TableHead className="w-[180px]">Amount</TableHead>
                                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {selectedFeeTemplate.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.name}</TableCell>

                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.amount}
                                                        onChange={(e) =>
                                                            handleItemAmountChange(item.id, e.target.value)
                                                        }
                                                        className="h-9 w-32"
                                                    />
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-red-500"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex items-center justify-end gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                            <span className="text-sm font-medium text-muted-foreground">
                                Total Amount
                            </span>
                            <span className="text-lg font-semibold">
                                ₹{totalAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>

                    <Button onClick={handleSubmit} disabled={loading || !selectedStudent}>
                        {loading ? "Saving..." : "Create Admission"}
                    </Button>
                </CardFooter>
            </Card>
        </section>
    );
}