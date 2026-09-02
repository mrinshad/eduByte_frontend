"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    CalendarIcon,
    Check,
    ChevronsUpDown,
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
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
    createStudent,
    updateStudent,
    getStudentById,
    StudentInput,
} from "@/lib/services/student";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Which fields are mandatory. bloodGroup is intentionally excluded (optional).
type RequiredField =
    | "admissionNumber"
    | "studentName"
    | "dob"
    | "fatherName"
    | "fatherMobile"
    | "motherName"
    | "motherMobile"
    | "whatsappNumber"
    | "address";

const PHONE_REGEX = /^[0-9]{10}$/;

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

// Small red asterisk shown next to labels for required fields
const RequiredMark = () => (
    <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
);

// ── Shared Field Styling (Ensuring strictly equal height and width) ──
const fieldClass = `
  flex w-full h-12 px-3 py-2 items-center rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-[#556043]/30 focus:border-[#556043]
  dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 transition-all
`;

// Applied on top of fieldClass when that field currently has a validation error
const fieldErrorClass = `
  !border-red-400 dark:!border-red-500/60 focus:!ring-red-400/40 focus:!border-red-400
`;

// Small red text shown under an invalid field
const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{message}</p>
    ) : null;

export default function Page() {
    const [date, setDate] = React.useState<Date>();
    const [calendarOpen, setCalendarOpen] = React.useState(false);
    const [genderOpen, setGenderOpen] = useState(false);
    const [bloodGroupOpen, setBloodGroupOpen] = useState(false);
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
        adharNo: "",
        religion: "",
        community: "",
        category: "",
        fatherName: "",
        fatherMobile: "",
        motherName: "",
        motherMobile: "",
        whatsappNumber: "",
        address: "",
    });

    // Field-level validation errors, keyed by field name
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, string>>>({});

    useEffect(() => {
        const loadStudent = async () => {
            if (!id) return;
            try {
                const student = await getStudentById(id);
                if (student) {
                    setFormData({
                        admissionNumber: student.admissionNumber ?? "",
                        studentName: student.studentName ?? "",
                        gender: student.gender ?? "Male",
                        dob: student.dob ?? "",
                        bloodGroup: student.bloodGroup ?? "",
                        adharNo: student.adharNo ?? "",
                        religion: student.religion ?? "",
                        community: student.community ?? "",
                        category: student.category ?? "",
                        fatherName: student.fatherName ?? "",
                        fatherMobile: student.fatherMobile ?? "",
                        motherName: student.motherName ?? "",
                        motherMobile: student.motherMobile ?? "",
                        whatsappNumber: student.whatsappNumber ?? "",
                        address: student.address ?? "",
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
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear that field's error as soon as the user edits it
        setFieldErrors((prev) => {
            if (!(name in prev)) return prev;
            const next = { ...prev };
            delete next[name as RequiredField];
            return next;
        });
    };

    // Runs every required-field check and returns a map of field -> message.
    // Phone fields also get a basic 10-digit format check.
    const validateForm = (): { valid: boolean; errors: Partial<Record<RequiredField, string>> } => {
        const errors: Partial<Record<RequiredField, string>> = {};

        if (!formData.admissionNumber.trim()) errors.admissionNumber = "Admission number is required";
        if (!formData.studentName.trim()) errors.studentName = "Student's full name is required";
        if (!formData.dob) errors.dob = "Date of birth is required";

        if (!formData.fatherName.trim()) {
            errors.fatherName = "Father's name is required";
        }
        if (!formData.fatherMobile.trim()) {
            errors.fatherMobile = "Father's phone number is required";
        } else if (!PHONE_REGEX.test(formData.fatherMobile.trim())) {
            errors.fatherMobile = "Enter a valid 10-digit father's phone number";
        }

        if (!formData.motherName.trim()) {
            errors.motherName = "Mother's name is required";
        }
        if (!formData.motherMobile.trim()) {
            errors.motherMobile = "Mother's phone number is required";
        } else if (!PHONE_REGEX.test(formData.motherMobile.trim())) {
            errors.motherMobile = "Enter a valid 10-digit mother's phone number";
        }

        if (!formData.whatsappNumber.trim()) {
            errors.whatsappNumber = "Whatsapp number is required";
        } else if (!PHONE_REGEX.test(formData.whatsappNumber.trim())) {
            errors.whatsappNumber = "Enter a valid 10-digit whatsapp number";
        }

        if (!formData.address.trim()) errors.address = "Address is required";

        return { valid: Object.keys(errors).length === 0, errors };
    };

    // Cheap, submit-independent check used only to enable/disable the
    // Save button — mirrors validateForm's "required" checks (not the
    // phone-format checks) so the button unlocks as soon as fields are
    // filled, and the format is caught with a clear message on submit.
    const isRequiredFilled = useMemo(() => {
        return (
            formData.admissionNumber.trim() !== "" &&
            formData.studentName.trim() !== "" &&
            formData.dob !== "" &&
            formData.fatherName.trim() !== "" &&
            formData.fatherMobile.trim() !== "" &&
            formData.motherName.trim() !== "" &&
            formData.motherMobile.trim() !== "" &&
            formData.whatsappNumber.trim() !== "" &&
            formData.address.trim() !== ""
        );
    }, [formData]);

    // Best-effort extraction of a human-readable message from whatever
    // apiFetch throws, so real backend validation errors (e.g. duplicate
    // admission number) reach the user instead of a generic fallback.
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

    const handleSubmit = async () => {
        const { valid, errors } = validateForm();
        setFieldErrors(errors);

        if (!valid) {
            const firstError = Object.values(errors)[0];
            toast.error(firstError ?? "Please fix the highlighted fields");
            return;
        }

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
            const fallback = id ? "Failed to update student record" : "Failed to save student record";
            toast.error(getErrorMessage(error, fallback));
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
                        disabled={loading || initialLoading || !isRequiredFilled}
                        className="rounded-xl h-11 px-8 bg-[#556043] text-white hover:bg-[#4a533b] shadow-md dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <Label htmlFor="admissionNumber" className="text-slate-700 dark:text-slate-300">
                                    Admission Number<RequiredMark />
                                </Label>
                                <Input
                                    id="admissionNumber"
                                    name="admissionNumber"
                                    value={formData.admissionNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. ADM-2024-001"
                                    className={cn(fieldClass, fieldErrors.admissionNumber && fieldErrorClass)}
                                />
                                <FieldError message={fieldErrors.admissionNumber} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="studentName" className="text-slate-700 dark:text-slate-300">
                                    Full Name<RequiredMark />
                                </Label>
                                <Input
                                    id="studentName"
                                    name="studentName"
                                    value={formData.studentName}
                                    onChange={handleChange}
                                    placeholder="Student's Legal Name"
                                    className={cn(fieldClass, fieldErrors.studentName && fieldErrorClass)}
                                />
                                <FieldError message={fieldErrors.studentName} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">
                                    Date Of Birth<RequiredMark />
                                </Label>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={loading}
                                            className={cn(
                                                "justify-start text-left font-normal",
                                                fieldClass,
                                                !date && "text-slate-400",
                                                fieldErrors.dob && fieldErrorClass
                                            )}
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
                                                setFieldErrors((prev) => {
                                                    if (!("dob" in prev)) return prev;
                                                    const next = { ...prev };
                                                    delete next.dob;
                                                    return next;
                                                });
                                                setCalendarOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FieldError message={fieldErrors.dob} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">
                                    Gender<RequiredMark />
                                </Label>
                                <Popover open={genderOpen} onOpenChange={setGenderOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={genderOpen}
                                            disabled={loading}
                                            className={cn("w-full justify-between font-normal text-left", fieldClass)}
                                        >
                                            {formData.gender || "Select Gender"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                        <Command>
                                            <CommandList>
                                                <CommandGroup>
                                                    {["Male", "Female"].map((gender) => (
                                                        <CommandItem
                                                            key={gender}
                                                            value={gender}
                                                            onSelect={() => {
                                                                setFormData((prev) => ({ ...prev, gender: gender as "Male" | "Female" }));
                                                                setGenderOpen(false);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4 text-[#556043]", formData.gender === gender ? "opacity-100" : "opacity-0")} />
                                                            <span>{gender}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Blood Group</Label>
                                <Popover open={bloodGroupOpen} onOpenChange={setBloodGroupOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={bloodGroupOpen}
                                            disabled={loading}
                                            className={cn("w-full justify-between font-normal text-left", fieldClass, !formData.bloodGroup && "text-slate-400")}
                                        >
                                            {formData.bloodGroup || "Select Blood Group"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                        <Command>
                                            <CommandList>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="none"
                                                        onSelect={() => {
                                                            setFormData((prev) => ({ ...prev, bloodGroup: "" }));
                                                            setBloodGroupOpen(false);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-[#556043]", formData.bloodGroup === "" ? "opacity-100" : "opacity-0")} />
                                                        <span className="text-slate-100">Not specified</span>
                                                    </CommandItem>
                                                    {bloodGroups.map((group) => (
                                                        <CommandItem
                                                            key={group}
                                                            value={group}
                                                            onSelect={() => {
                                                                setFormData((prev) => ({ ...prev, bloodGroup: group }));
                                                                setBloodGroupOpen(false);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4 text-[#556043]", formData.bloodGroup === group ? "opacity-100" : "opacity-0")} />
                                                            <span>{group}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsappNumber" className="text-slate-700 dark:text-slate-300">
                                    Whatsapp Number<RequiredMark />
                                </Label>
                                <Input
                                    id="whatsappNumber"
                                    name="whatsappNumber"
                                    value={formData.whatsappNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. 9876543210"
                                    className={cn(fieldClass, fieldErrors.whatsappNumber && fieldErrorClass)}
                                />
                                <FieldError message={fieldErrors.whatsappNumber} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adharNo" className="text-slate-700 dark:text-slate-300">
                                    Aadhaar Number
                                </Label>
                                <Input
                                    id="adharNo"
                                    name="adharNo"
                                    value={formData.adharNo || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. 1234 5678 9012"
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="religion" className="text-slate-700 dark:text-slate-300">
                                    Religion
                                </Label>
                                <Input
                                    id="religion"
                                    name="religion"
                                    value={formData.religion || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. Islam / Hinduism / Christianity"
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="community" className="text-slate-700 dark:text-slate-300">
                                    Community
                                </Label>
                                <Input
                                    id="community"
                                    name="community"
                                    value={formData.community || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. Community"
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-slate-700 dark:text-slate-300">
                                    Category
                                </Label>
                                <Input
                                    id="category"
                                    name="category"
                                    value={formData.category || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. General / OBC / SC / ST"
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
                                        <Label htmlFor="fatherName" className="text-slate-700 dark:text-slate-300">
                                            Full Name<RequiredMark />
                                        </Label>
                                        <Input
                                            id="fatherName"
                                            name="fatherName"
                                            value={formData.fatherName}
                                            onChange={handleChange}
                                            placeholder="Father's Legal Name"
                                            className={cn(fieldClass, fieldErrors.fatherName && fieldErrorClass)}
                                        />
                                        <FieldError message={fieldErrors.fatherName} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fatherMobile" className="text-slate-700 dark:text-slate-300">
                                            Phone Number<RequiredMark />
                                        </Label>
                                        <Input
                                            id="fatherMobile"
                                            name="fatherMobile"
                                            value={formData.fatherMobile}
                                            onChange={handleChange}
                                            placeholder="Contact Number"
                                            className={cn(fieldClass, fieldErrors.fatherMobile && fieldErrorClass)}
                                        />
                                        <FieldError message={fieldErrors.fatherMobile} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 rounded-xl border border-slate-100 dark:border-slate-800/60 p-5 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                    <span className="text-sm font-semibold tracking-tight text-[#556043] dark:text-slate-300">MOTHER'S INFO</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="motherName" className="text-slate-700 dark:text-slate-300">
                                            Full Name<RequiredMark />
                                        </Label>
                                        <Input
                                            id="motherName"
                                            name="motherName"
                                            value={formData.motherName}
                                            onChange={handleChange}
                                            placeholder="Mother's Legal Name"
                                            className={cn(fieldClass, fieldErrors.motherName && fieldErrorClass)}
                                        />
                                        <FieldError message={fieldErrors.motherName} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="motherMobile" className="text-slate-700 dark:text-slate-300">
                                            Phone Number<RequiredMark />
                                        </Label>
                                        <Input
                                            id="motherMobile"
                                            name="motherMobile"
                                            value={formData.motherMobile}
                                            onChange={handleChange}
                                            placeholder="Contact Number"
                                            className={cn(fieldClass, fieldErrors.motherMobile && fieldErrorClass)}
                                        />
                                        <FieldError message={fieldErrors.motherMobile} />
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
                            <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">
                                Complete Address<RequiredMark />
                            </Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="House/Flat No., Street, City, State, ZIP Code"
                                className={cn("min-h-[120px] resize-y", fieldClass, "h-auto py-3 items-start", fieldErrors.address && fieldErrorClass)}
                            />
                            <FieldError message={fieldErrors.address} />
                        </div>
                    </StepSection>

                </div>
            )}
        </div>
    );
}