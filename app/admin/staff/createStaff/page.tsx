"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseApiError } from "@/lib/api-error";
import {
    ArrowLeft,
    CalendarIcon,
    Check,
    ChevronsUpDown,
    Loader2,
    IdCard,
    UserRound,
    Mail,
    Phone,
    CalendarDays,
    ToggleLeft,
    BadgeCheck,
    IndianRupee,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
    createStaff,
    updateStaff,
    getStaffById,
    StaffInput,
} from "@/lib/services/staff";

// ── Shared step/field building blocks (same pattern as the admission / fee structure pages) ──
const STAFF_DUPLICATE_MAP = {
  employeeCode: { field: "employeeCode", message: "This employee code is already in use" },
  email: { field: "email", message: "This email address is already registered" },
  phone: { field: "phone", message: "This phone number is already registered" },
};

interface StepSectionProps {
    stepNumber: number | string;
    title: string;
    description?: string;
    children: React.ReactNode;
}

const StepSection = ({ stepNumber, title, description, children }: StepSectionProps) => (
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
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-slate-200 dark:bg-slate-800 gap-[1px]",
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

// Small red asterisk shown next to labels for required fields (matches the fee structure page)
const RequiredMark = () => (
    <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>
);

const fieldClass = `
  h-12 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400
  focus:ring-2 focus:ring-[#6D755F] focus:border-transparent
  dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 transition-all
`;

const fieldErrorClass = "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400";

const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
] as const;

// ── Field-level validators ──

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const EMPLOYEE_CODE_PATTERN = /^[a-zA-Z0-9-_]+$/;
const NAME_PATTERN = /^[a-zA-Z\s.'-]+$/;

function validateEmployeeCode(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return "Employee code is required";
    if (trimmed.length < 2) return "Must be at least 2 characters";
    if (trimmed.length > 30) return "Must be under 30 characters";
    if (!EMPLOYEE_CODE_PATTERN.test(trimmed)) return "Only letters, numbers, - and _ are allowed";
    return undefined;
}

function validateName(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return "Full name is required";
    if (trimmed.length < 2) return "Must be at least 2 characters";
    if (!NAME_PATTERN.test(trimmed)) return "Only letters, spaces, and . ' - are allowed";
    return undefined;
}

function validateEmail(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return "Email address is required";
    if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address";
    return undefined;
}

function validatePhone(value: string): string | undefined {
    const trimmed = value.trim().replace(/[\s-]/g, "");
    if (!trimmed) return "Phone number is required";
    if (!PHONE_PATTERN.test(trimmed)) return "Enter a valid phone number (7-15 digits)";
    return undefined;
}

function validateJoiningDate(date?: Date): string | undefined {
    if (!date) return "Joining date is required";
    if (Number.isNaN(date.getTime())) return "Enter a valid date";
    if (date.getFullYear() < 1970) return "Enter a realistic date";
    return undefined;
}

// Best-effort extraction of a human-readable message from whatever
// apiFetch throws (Error instance, plain object with `message`, or a
// raw string), so real backend validation errors reach the user
// instead of a generic fallback. Mirrors the fee structure page.
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

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const staffId = searchParams.get("id") ?? undefined;
    const isEditMode = !!staffId;

    const [employeeCode, setEmployeeCode] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [joiningDate, setJoiningDate] = useState<Date | undefined>(undefined);
    const [basicSalary, setBasicSalary] = useState<string | number>("");
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

    const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // Field-level errors, same pattern as the fee structure page: populated
    // on submit, and each one clears the moment the user edits that field.
    const [fieldErrors, setFieldErrors] = useState<{
        employeeCode?: string;
        name?: string;
        email?: string;
        phone?: string;
        joiningDate?: string;
    }>({});

    // ── Edit mode: load existing staff record ──────────────────────────────
    useEffect(() => {
    if (!isEditMode || !staffId) return;
    const id = staffId; // narrowed to string, safe to use in the closure below

    async function loadStaff() {
        try {
            setLoadingStaff(true);
            const record = await getStaffById(id);
            if (record) {
                setEmployeeCode(record.employeeCode ?? "");
                setName(record.name ?? "");
                setEmail(record.email ?? "");
                setPhone(record.phone ?? "");
                setJoiningDate(record.joiningDate ? new Date(record.joiningDate) : undefined);
                setBasicSalary(record.basicSalary !== undefined && record.basicSalary !== null ? Number(record.basicSalary) : "");
                setStatus(record.status ?? "ACTIVE");
            } else {
                toast.error("Staff record not found");
            }
        } catch (error) {
            console.error("Failed to load staff:", error);
            toast.error("Failed to load staff record");
        } finally {
            setLoadingStaff(false);
        }
    }

    loadStaff();
}, [isEditMode, staffId]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const nextFieldErrors: typeof fieldErrors = {
            employeeCode: validateEmployeeCode(employeeCode),
            name: validateName(name),
            email: validateEmail(email),
            phone: validatePhone(phone),
            joiningDate: validateJoiningDate(joiningDate),
        };
        setFieldErrors(nextFieldErrors);

        // Surface the first problem found, top field first — same UX as the
        // fee structure page (toast the first error, don't submit).
        const firstFieldError = Object.values(nextFieldErrors).find(Boolean);
        if (firstFieldError) {
            toast.error(firstFieldError);
            return;
        }

        const payload: StaffInput = {
            employeeCode: employeeCode.trim(),
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            joiningDate: joiningDate ? joiningDate.toISOString() : "",
            basicSalary: basicSalary === "" ? 0 : Number(basicSalary),
            status,
        };

        try {
            setSubmitting(true);

            const result = isEditMode
                ? await updateStaff(staffId!, payload)
                : await createStaff(payload);

            if (result?.success) {
                toast.success(isEditMode ? "Staff updated successfully" : "Staff created successfully");
                router.back();
            } else {
                toast.error(result?.message || "An error occurred during submission.");
            }
        } catch (error) {
            console.error("Submit error:", error);
    const fallback = isEditMode ? "Failed to update staff" : "Failed to create staff";
    const parsed = parseApiError(error, fallback, STAFF_DUPLICATE_MAP);

    if (parsed.field) {
        setFieldErrors((prev) => ({ ...prev, [parsed.field as keyof typeof prev]: parsed.message }));
    }
    toast.error(parsed.message);

    if (parsed.isAuthError) {
        router.push("/login"); // or wherever your login route is
    }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-300">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} disabled={submitting} className="rounded-xl h-10 w-10 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{isEditMode ? "Edit Staff" : "Create Staff"}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Link identification, contact, and employment parameters directly to satisfy staff record requirements.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()} disabled={submitting} className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || loadingStaff || !employeeCode.trim() || !name.trim() || !email.trim() || !phone.trim() || !joiningDate}
                        className="rounded-xl h-11 px-8 bg-[#6D755F] text-white hover:bg-[#5b624f] shadow-md dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {submitting
                            ? "Processing..."
                            : isEditMode
                                ? "Update Staff"
                                : "Confirm Staff"}
                    </Button>
                </div>
            </div>

            {loadingStaff ? (
                <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#6D755F]" />
                    <span className="text-sm font-medium">Loading staff data...</span>
                </div>
            ) : (
                <div className="mx-auto max-w-5xl space-y-8 pb-12">

                    {/* Step 1: Identification */}
                    <StepSection
                        stepNumber="1"
                        title="Employee Identification"
                        description="Provide the core identity fields used to reference this staff member across the system."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <IdCard className="h-3.5 w-3.5 text-[#6D755F]" /> Employee Code<RequiredMark />
                                </span>
                                <Input
                                    placeholder="e.g. emp-004"
                                    value={employeeCode}
                                    onChange={(e) => {
                                        setEmployeeCode(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, employeeCode: undefined }));
                                    }}
                                    disabled={submitting}
                                    className={cn(fieldClass, fieldErrors.employeeCode && fieldErrorClass)}
                                />
                                {fieldErrors.employeeCode && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.employeeCode}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <UserRound className="h-3.5 w-3.5 text-[#6D755F]" /> Full Name<RequiredMark />
                                </span>
                                <Input
                                    placeholder="e.g. Meena"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, name: undefined }));
                                    }}
                                    disabled={submitting}
                                    className={cn(fieldClass, fieldErrors.name && fieldErrorClass)}
                                />
                                {fieldErrors.name && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </StepSection>

                    {/* Step 2: Contact Information */}
                    <StepSection
                        stepNumber="2"
                        title="Contact Information"
                        description="Ensure accurate contact channels are on file for scheduling and notifications."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-[#6D755F]" /> Email Address<RequiredMark />
                                </span>
                                <Input
                                    type="email"
                                    placeholder="e.g. meena1992@gmail.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    disabled={submitting}
                                    className={cn(fieldClass, fieldErrors.email && fieldErrorClass)}
                                />
                                {fieldErrors.email && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-[#6D755F]" /> Phone Number<RequiredMark />
                                </span>
                                <Input
                                    type="tel"
                                    placeholder="e.g. 90111113"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                                    }}
                                    disabled={submitting}
                                    className={cn(fieldClass, fieldErrors.phone && fieldErrorClass)}
                                />
                                {fieldErrors.phone && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </StepSection>

                    {/* Step 3: Employment Configuration */}
                    <StepSection
                        stepNumber="3"
                        title="Employment Configuration"
                        description="Set the joining date and current employment status for payroll and access control."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-[#6D755F]" /> Joining Date<RequiredMark />
                                </span>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={submitting}
                                            className={cn(
                                                "h-12 w-full justify-start rounded-xl border-slate-300 bg-white px-3 text-left text-sm font-normal shadow-sm  dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50",
                                                "focus:ring-2 focus:ring-[#6D755F] focus:border-transparent",
                                                fieldErrors.joiningDate && fieldErrorClass
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                            <span>
                                                {joiningDate ? format(joiningDate, "PPP") : "Pick a date"}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={joiningDate}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setJoiningDate(date);
                                                    setFieldErrors((prev) => ({ ...prev, joiningDate: undefined }));
                                                }
                                                setCalendarOpen(false);
                                            }}
                                            defaultMonth={joiningDate}
                                            disabled={(date) => date.getFullYear() < 1970}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {fieldErrors.joiningDate && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-1">
                                        {fieldErrors.joiningDate}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <ToggleLeft className="h-3.5 w-3.5 text-[#6D755F]" /> Employment Status
                                </span>
                                <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={statusPopoverOpen}
                                            disabled={submitting}
                                            className={cn("w-full justify-between font-normal shadow-sm text-left", fieldClass)}
                                        >
                                            {STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Select status..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                        <Command>
                                            <CommandList>
                                                <CommandGroup>
                                                    {STATUS_OPTIONS.map((option) => (
                                                        <CommandItem
                                                            key={option.value}
                                                            value={option.value}
                                                            onSelect={() => {
                                                                setStatus(option.value);
                                                                setStatusPopoverOpen(false);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", status === option.value ? "opacity-100" : "opacity-0")} />
                                                            <span>{option.label}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <IndianRupee className="h-3.5 w-3.5 text-[#6D755F]" /> Monthly Basic Salary (₹)
                                </span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="e.g. 35000.00"
                                    value={basicSalary}
                                    onChange={(e) => setBasicSalary(e.target.value === "" ? "" : Number(e.target.value))}
                                    disabled={submitting}
                                    className={fieldClass}
                                />
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Default basic pay automatically pre-filled when generating monthly salary slips for this employee.
                                </p>
                            </div>
                        </div>

                        {(employeeCode || name || email || phone || joiningDate || basicSalary) && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <BadgeCheck className="h-4 w-4 text-[#6D755F]" /> Staff Record Preview
                                </h3>
                                <InfoGrid>
                                    <InfoItem label="Employee Code" value={employeeCode} />
                                    <InfoItem label="Full Name" value={name} />
                                    <InfoItem label="Status Allocation" value={
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                            status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-200 text-slate-800"
                                        )}>
                                            {status}
                                        </span>
                                    } />
                                    <InfoItem label="Email Address" value={email} />
                                    <InfoItem label="Phone Number" value={phone} />
                                    <InfoItem label="Joining Date" value={joiningDate ? format(joiningDate, "PPP") : "-"} />
                                    <InfoItem label="Basic Salary (₹)" value={basicSalary !== "" ? `₹ ${Number(basicSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "Not configured"} />
                                </InfoGrid>
                            </div>
                        )}
                    </StepSection>

                </div>
            )}
        </div>
    );
}