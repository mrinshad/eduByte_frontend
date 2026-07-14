"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    ArrowLeft,
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

import {
    createStaff,
    updateStaff,
    getStaff,
    StaffInput,
} from "@/lib/services/staff";

// ── Shared step/field building blocks (same pattern as the admission page) ──

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

const fieldClass = `
  h-12 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400
  focus:ring-2 focus:ring-[#6D755F] focus:border-transparent
  dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 transition-all
`;

// ── Date helpers ──

// "2026-07-01T00:00:00.000Z" -> "2026-07-01" (for <input type="date">)
function toDateInputValue(iso?: string | null): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

// "2026-07-01" -> "2026-07-01T00:00:00.000Z" (for the API payload)
function toIsoDateTime(dateOnly: string): string {
    return new Date(`${dateOnly}T00:00:00Z`).toISOString();
}

function formatDateOnly(iso?: string | null): string {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
] as const;

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const staffId = searchParams.get("id") ?? undefined;
    const isEditMode = !!staffId;

    const [employeeCode, setEmployeeCode] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [joiningDate, setJoiningDate] = useState<string>("");
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

    const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // ── Edit mode: load existing staff record ──────────────────────────────
    useEffect(() => {
        if (!isEditMode || !staffId) return;

        async function loadStaff() {
            try {
                setLoadingStaff(true);
                // NOTE: GET /api/staff/:id isn't a documented endpoint — only
                // list, create, and update are. So we fetch the full list
                // (same call the staff listing page uses) and find the
                // record client-side, rather than calling getStaffById.
                const response = await getStaff();
                const record = response.data.find((s) => s.id === staffId);
                if (record) {
                    setEmployeeCode(record.employeeCode ?? "");
                    setName(record.name ?? "");
                    setEmail(record.email ?? "");
                    setPhone(record.phone ?? "");
                    setJoiningDate(toDateInputValue(record.joiningDate));
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

    const isValid =
        employeeCode.trim() !== "" &&
        name.trim() !== "" &&
        email.trim() !== "" &&
        phone.trim() !== "" &&
        joiningDate.trim() !== "";

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!isValid) {
            toast.error("Ensure Employee Code, Name, Email, Phone, and Joining Date are filled before submitting.");
            return;
        }

        const payload: StaffInput = {
            employeeCode: employeeCode.trim(),
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            joiningDate: toIsoDateTime(joiningDate),
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
            toast.error("Failed to save staff");
            console.error("Submit error:", error);
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
                        disabled={submitting || !isValid || loadingStaff}
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
  "
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
                                    <IdCard className="h-3.5 w-3.5 text-[#6D755F]" /> Employee Code
                                </span>
                                <Input
                                    placeholder="e.g. emp-004"
                                    value={employeeCode}
                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                    className={fieldClass}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <UserRound className="h-3.5 w-3.5 text-[#6D755F]" /> Full Name
                                </span>
                                <Input
                                    placeholder="e.g. Meena"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={fieldClass}
                                />
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
                                    <Mail className="h-3.5 w-3.5 text-[#6D755F]" /> Email Address
                                </span>
                                <Input
                                    type="email"
                                    placeholder="e.g. meena1992@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={fieldClass}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-[#6D755F]" /> Phone Number
                                </span>
                                <Input
                                    type="tel"
                                    placeholder="e.g. 90111113"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={fieldClass}
                                />
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
                                    <CalendarDays className="h-3.5 w-3.5 text-[#6D755F]" /> Joining Date
                                </span>
                                <Input
                                    type="date"
                                    value={joiningDate}
                                    onChange={(e) => setJoiningDate(e.target.value)}
                                    className={fieldClass}
                                />
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
                        </div>

                        {(employeeCode || name || email || phone || joiningDate) && (
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
                                    <InfoItem label="Joining Date" value={formatDateOnly(joiningDate ? toIsoDateTime(joiningDate) : null)} />
                                </InfoGrid>
                            </div>
                        )}
                    </StepSection>

                </div>
            )}
        </div>
    );
}