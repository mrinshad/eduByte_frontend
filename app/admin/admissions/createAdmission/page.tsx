"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Check, 
    ChevronsUpDown, 
    Trash2, 
    UserCircle2,
    User,
    Bus,
    Receipt,
    Wallet,
    MapPin
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

// ---------------------------------------------------------------------------
// Mock data
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
// Step-based Sub-Components
// ---------------------------------------------------------------------------

const StepSection = ({ stepNumber, title, description, icon: Icon, children }: any) => (
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6D755F]/10 text-[#6D755F] font-bold">
                {stepNumber}
            </div>
            <div>
                {/* Explicitly setting text-slate-900 and text-slate-500 to fix light mode visibility */}
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
                {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
        </div>
        <div className="flex flex-col gap-6">
            {children}
        </div>
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const fieldClass = `
  h-12
  rounded-xl
  border-slate-300
  bg-white
  text-slate-900
  placeholder:text-slate-400
  focus:ring-2
  focus:ring-[#6D755F]
  focus:border-transparent
  dark:border-slate-700
  dark:bg-slate-950
  dark:text-white
  dark:placeholder:text-slate-500
  transition-all
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

    const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    const [feePopoverOpen, setFeePopoverOpen] = useState(false);
    const [selectedFeeTemplate, setSelectedFeeTemplate] = useState<SelectedFeeTemplate | null>(null);

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
        setTimeout(() => {
            setLoading(false);
            router.back();
        }, 600);
    };

    return (
        <div className="w-full min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
            
            {/* Top Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Create Admission
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Follow the steps below to link a student, transport, and structural fee schema.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()} disabled={loading} className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        Discard
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedStudent} className="rounded-xl h-11 px-8 bg-[#6D755F] hover:bg-[#5b624f] text-white shadow-md">
                        {loading ? "Processing..." : "Confirm Admission"}
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-5xl space-y-8 pb-12">
                
                {/* --- Step 1: Student Profile Section --- */}
                <StepSection 
                    stepNumber="1"
                    title="Select Student" 
                    description="Search for the primary applicant to begin the admission process."
                >
                    <div className="md:w-1/2">
                        <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={studentPopoverOpen}
                                    className={`w-full justify-between font-normal shadow-sm ${fieldClass}`}
                                >
                                    {selectedStudent ? selectedStudent.studentName : "Search student by name or ID..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Type to search..." />
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
                                                    className="py-3 cursor-pointer"
                                                >
                                                    <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", selectedStudent?.id === student.id ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-slate-100">{student.studentName}</span>
                                                        <span className="text-xs text-slate-500">{student.admissionNumber}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {selectedStudent ? (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <User className="h-4 w-4 text-[#6D755F]" /> Record Details
                            </h3>
                            <InfoGrid>
                                <InfoItem label="Admission No" value={selectedStudent.admissionNumber} />
                                <InfoItem label="Status" value={
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                        selectedStudent.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                                    )}>
                                        {selectedStudent.status}
                                    </span>
                                } />
                                <InfoItem label="Date of Birth" value={selectedStudent.dob} />
                                <InfoItem label="Gender & Blood Group" value={`${selectedStudent.gender}, ${selectedStudent.bloodGroup}`} />
                                
                                <InfoItem label="Father's Name" value={selectedStudent.fatherName} />
                                <InfoItem label="Father's Contact" value={selectedStudent.fatherMobile} />
                                <InfoItem label="Mother's Name" value={selectedStudent.motherName} />
                                <InfoItem label="Mother's Contact" value={selectedStudent.motherMobile} />
                                
                                <InfoItem label="WhatsApp Number" value={selectedStudent.whatsappNumber} />
                                <InfoItem 
                                    className="md:col-span-1 lg:col-span-3" 
                                    label="Residential Address" 
                                    value={
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            <span>{selectedStudent.address}</span>
                                        </div>
                                    } 
                                />
                            </InfoGrid>
                        </div>
                    ) : (
                        <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 py-12 text-center transition-all">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                                <UserCircle2 className="h-6 w-6 text-slate-500" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200">Awaiting Student Selection</h3>
                            <p className="mt-1 text-sm text-slate-500 max-w-sm">Use the search box above to find and attach a student to this record.</p>
                        </div>
                    )}
                </StepSection>

                {/* --- Step 2: Transport Section --- */}
                <StepSection 
                    stepNumber="2"
                    title="Assign Transport (Optional)" 
                    description="Link a vehicle route to this student's admission."
                >
                    <div className="md:w-1/2">
                        <Popover open={vehiclePopoverOpen} onOpenChange={setVehiclePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={vehiclePopoverOpen}
                                    className={`w-full justify-between font-normal shadow-sm ${fieldClass}`}
                                >
                                    {selectedVehicle ? selectedVehicle.vehicleName : "Search available vehicle routes..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Type to search vehicle..." />
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
                                                    className="py-3 cursor-pointer"
                                                >
                                                    <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", selectedVehicle?.id === vehicle.id ? "opacity-100" : "opacity-0")} />
                                                    <span className="text-slate-900 dark:text-slate-100">{vehicle.vehicleName}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {selectedVehicle && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                             <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <Bus className="h-4 w-4 text-[#6D755F]" /> Route Information
                            </h3>
                            <InfoGrid>
                                <InfoItem label="Assigned Vehicle ID" value={selectedVehicle.id.toUpperCase()} />
                                <InfoItem className="md:col-span-1 lg:col-span-3" label="Route Details" value={selectedVehicle.vehicleName} />
                            </InfoGrid>
                        </div>
                    )}
                </StepSection>

                {/* --- Step 3: Fee Structure Section --- */}
                <StepSection 
                    stepNumber="3"
                    title="Configure Fee Structure" 
                    description="Select a base template and adjust individual line items if necessary."
                >
                    <div className="md:w-1/2">
                        <Popover open={feePopoverOpen} onOpenChange={setFeePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={feePopoverOpen}
                                    className={`w-full justify-between font-normal shadow-sm ${fieldClass}`}
                                >
                                    {selectedFeeTemplate ? selectedFeeTemplate.templateName : "Select a base fee template..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Search fee templates..." />
                                    <CommandList>
                                        <CommandEmpty>No fee structure found.</CommandEmpty>
                                        <CommandGroup>
                                            {MOCK_FEE_TEMPLATES.map((template) => {
                                                const isSelected = selectedFeeTemplate?.templateId === template.id;
                                                const templateTotal = template.items.reduce((sum, item) => sum + item.amount, 0);

                                                return (
                                                    <CommandItem
                                                        key={template.id}
                                                        value={template.name}
                                                        onSelect={() => handleSelectTemplate(template)}
                                                        className="py-3 cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", isSelected ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex w-full flex-col gap-1">
                                                            <div className="flex w-full items-center justify-between">
                                                                <span className="font-medium text-slate-900 dark:text-slate-100">{template.name}</span>
                                                                <span className="text-xs font-semibold text-[#6D755F]">₹{templateTotal.toLocaleString()}</span>
                                                            </div>
                                                            <span className="text-xs text-slate-500">{template.items.length} item{template.items.length > 1 ? "s" : ""}</span>
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

                    {!selectedFeeTemplate ? (
                        <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 py-12 text-center transition-all">
                            <Wallet className="h-6 w-6 text-slate-400 mb-3" />
                            <p className="text-sm text-slate-500">No template assigned. Select a base structure to formulate admission charges.</p>
                        </div>
                    ) : (
                        <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
                                <div>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                        {selectedFeeTemplate.templateName}
                                    </span>
                                    <span className="text-xs text-slate-500">Active breakdown</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                                    onClick={handleClearTemplate}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Clear Template
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-transparent">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-slate-500">Fee Particulars</TableHead>
                                            <TableHead className="w-[280px] text-xs font-medium uppercase tracking-wider text-slate-500">Amount Allocation</TableHead>
                                            <TableHead className="w-[100px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Remove</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedFeeTemplate.items.map((item) => (
                                            <TableRow key={item.id} className="border-slate-100 dark:border-slate-800">
                                                <TableCell className="pl-6 font-medium text-slate-800 dark:text-slate-200">{item.name}</TableCell>
                                                <TableCell>
                                                    <div className="relative w-full max-w-[200px]">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₹</span>
                                                        <Input
                                                            type="number"
                                                            value={item.amount}
                                                            onChange={(e) => handleItemAmountChange(item.id, e.target.value)}
                                                            className="h-10 w-full pl-8 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus-visible:ring-2 focus-visible:ring-[#6D755F] text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
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

                            {/* Aggregated Total Footer */}
                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-[#6D755F] px-6 py-5">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white/90">Gross Payable Amount</span>
                                    <span className="text-xs text-white/70">Calculated sum of active particulars</span>
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