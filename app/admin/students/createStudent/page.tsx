"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    ArrowLeft, 
    CalendarIcon, 
    User, 
    Users, 
    MapPin, 
    Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
    createStudent,
    updateStudent,
    getStudentById,
    StudentInput,
} from "@/lib/services/student";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ── Reusable Step Section Component ──
const StepSection = ({ stepNumber, title, description, icon: Icon, children }: any) => (
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#556043]/10 text-[#556043] font-bold">
                {stepNumber}
            </div>
            <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5 text-[#556043]" />}
                    {title}
                </h2>
                {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
        </div>
        <div className="flex flex-col gap-6">{children}</div>
    </div>
);

// ── Shared Field Styling (Ensuring strictly equal height and width) ──
const fieldClass = `
  flex w-full h-12 px-3 py-2 items-center rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-[#556043]/30 focus:border-[#556043]
  dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 transition-all
`;

// ── Shared Select Item Theme ──
const selectItemClass = `
  rounded-lg cursor-pointer text-slate-900 dark:text-slate-100
  data-[highlighted]:bg-[#556043] data-[highlighted]:text-white
  data-[state=checked]:bg-[#556043] data-[state=checked]:text-white
`;

export default function Page() {
    const [date, setDate] = React.useState<Date>();
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);

    const [formData, setFormData] = useState<StudentInput>({
        admissionNumber: "",
        studentName: "",
        gender: "Male",
        dob: "",
        bloodGroup: "",
        fatherName: "",
        fatherMobile: "",
        motherName: "",
        motherMobile: "",
        whatsappNumber: "",
        address: "",
    });

    useEffect(() => {
        const loadStudent = async () => {
            if (!id) return;
            try {
                const student = await getStudentById(id);
                if (student) {
                    setFormData({
                        admissionNumber: student.admissionNumber,
                        studentName: student.studentName,
                        gender: student.gender,
                        dob: student.dob ?? "",
                        bloodGroup: student.bloodGroup ?? "",
                        fatherName: student.fatherName,
                        fatherMobile: student.fatherMobile,
                        motherName: student.motherName,
                        motherMobile: student.motherMobile,
                        whatsappNumber: student.whatsappNumber,
                        address: student.address,
                    });
                    setDate(student.dob ? new Date(student.dob) : undefined);
                }
            } catch (error) {
                toast.error("Failed to load student details");
            } finally {
                setInitialLoading(false);
            }
        };

        loadStudent();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (id) {
                await updateStudent(id, formData);
                toast.success("Student updated successfully");
            } else {
                await createStudent(formData);
                toast.success("Student created successfully");
            }
            router.push("/admin/students");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save student record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
            {/* ── Header Area ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => router.back()} 
                        className="rounded-xl h-10 w-10 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    >
                        <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {id ? "Edit Student Profile" : "Register New Student"}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {id ? "Update the core directory details for this student." : "Fill out the required information to create a new profile."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => router.back()} 
                        disabled={loading} 
                        className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || initialLoading}
                        className="rounded-xl h-11 px-8 bg-[#556043] text-white hover:bg-[#4a533b] shadow-md dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : id ? "Update Profile" : "Save Student"}
                    </Button>
                </div>
            </div>

            {/* ── Form Content ── */}
            {initialLoading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                    <span className="text-sm font-medium">Loading student data...</span>
                </div>
            ) : (
                <div className="mx-auto max-w-5xl space-y-8 pb-12">
                    
                    {/* Step 1: Basic Information */}
                    <StepSection
                        stepNumber="1"
                        icon={User}
                        title="Basic Information"
                        description="Core identity and academic registration details."
                    >
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="admissionNumber" className="text-slate-700 dark:text-slate-300">Admission Number</Label>
                                <Input
                                    id="admissionNumber"
                                    name="admissionNumber"
                                    value={formData.admissionNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. ADM-2024-001"
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="studentName" className="text-slate-700 dark:text-slate-300">Full Name</Label>
                                <Input
                                    id="studentName"
                                    name="studentName"
                                    value={formData.studentName}
                                    onChange={handleChange}
                                    placeholder="Student's Legal Name"
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Date Of Birth</Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn("justify-start text-left font-normal", fieldClass, !date && "text-slate-400")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                            {date ? format(date, "PPP") : "Select Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-xl border-slate-200 dark:border-slate-800">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            captionLayout="dropdown"
                                            onSelect={(selectedDate) => {
                                                if (!selectedDate) return;
                                                setDate(selectedDate);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    dob: selectedDate.toISOString(),
                                                }));
                                                setOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-slate-700 dark:text-slate-300">Gender</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value as "Male" | "Female" }))}
                                >
                                    <SelectTrigger id="gender" className={fieldClass}>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-lg p-1">
                                        <SelectItem value="Male" className={selectItemClass}>Male</SelectItem>
                                        <SelectItem value="Female" className={selectItemClass}>Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bloodGroup" className="text-slate-700 dark:text-slate-300">Blood Group</Label>
                                <Select
                                    value={formData.bloodGroup}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, bloodGroup: value }))}
                                >
                                    <SelectTrigger id="bloodGroup" className={fieldClass}>
                                        <SelectValue placeholder="Select Blood Group" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-lg p-1">
                                        {bloodGroups.map((group) => (
                                            <SelectItem key={group} value={group} className={selectItemClass}>
                                                {group}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsappNumber" className="text-slate-700 dark:text-slate-300">Whatsapp Number</Label>
                                <Input
                                    id="whatsappNumber"
                                    name="whatsappNumber"
                                    value={formData.whatsappNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. +91 9876543210"
                                    className={fieldClass}
                                />
                            </div>
                        </div>
                    </StepSection>

                    {/* Step 2: Parent Details */}
                    <StepSection
                        stepNumber="2"
                        icon={Users}
                        title="Parent / Guardian Details"
                        description="Emergency contact and primary guardian information."
                    >
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <div className="space-y-5 rounded-xl border border-slate-100 dark:border-slate-800/60 p-5 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                    <span className="text-sm font-semibold tracking-tight text-[#556043] dark:text-slate-300">FATHER'S INFO</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fatherName" className="text-slate-700 dark:text-slate-300">Full Name</Label>
                                        <Input
                                            id="fatherName"
                                            name="fatherName"
                                            value={formData.fatherName}
                                            onChange={handleChange}
                                            placeholder="Father's Legal Name"
                                            className={fieldClass}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fatherMobile" className="text-slate-700 dark:text-slate-300">Phone Number</Label>
                                        <Input
                                            id="fatherMobile"
                                            name="fatherMobile"
                                            value={formData.fatherMobile}
                                            onChange={handleChange}
                                            placeholder="Contact Number"
                                            className={fieldClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 rounded-xl border border-slate-100 dark:border-slate-800/60 p-5 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                    <span className="text-sm font-semibold tracking-tight text-[#556043] dark:text-slate-300">MOTHER'S INFO</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="motherName" className="text-slate-700 dark:text-slate-300">Full Name</Label>
                                        <Input
                                            id="motherName"
                                            name="motherName"
                                            value={formData.motherName}
                                            onChange={handleChange}
                                            placeholder="Mother's Legal Name"
                                            className={fieldClass}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="motherMobile" className="text-slate-700 dark:text-slate-300">Phone Number</Label>
                                        <Input
                                            id="motherMobile"
                                            name="motherMobile"
                                            value={formData.motherMobile}
                                            onChange={handleChange}
                                            placeholder="Contact Number"
                                            className={fieldClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </StepSection>

                    {/* Step 3: Address */}
                    <StepSection
                        stepNumber="3"
                        icon={MapPin}
                        title="Residential Address"
                        description="Primary physical location and mailing address."
                    >
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Complete Address</Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="House/Flat No., Street, City, State, ZIP Code"
                                className={cn("min-h-[120px] resize-y", fieldClass, "h-auto py-3 items-start")}
                            />
                        </div>
                    </StepSection>

                </div>
            )}
        </div>
    );
}