"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseApiError } from "@/lib/api-error";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ArrowLeft,
    CalendarIcon,
    Check,
    ChevronsUpDown,
    Loader2,
    User,
    Wallet,
    TrendingUp,
    TrendingDown,
    FileText,
    AlertCircle,
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
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn, formatCurrency } from "@/lib/utils";

import {
    getPaymentMethodAccounts,
    getStaffNamesAndIds,
    type PaymentMethodAccount,
    type StaffName,
} from "@/lib/services/expense";
import { createSalarySlip } from "@/lib/services/salarySlip";

// ---------------------------------------------------------------------
// Sage green accent (#6D755F) identical to Create Expense module
// ---------------------------------------------------------------------
const SAGE = "#6D755F";

const fieldClass = `
  h-11 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400
  focus:ring-2 focus:ring-[#6D755F] focus:border-transparent
  dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 transition-all
`;

const fieldErrorClass = "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400";

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{children}</label>
);

const FieldError = ({ children }: { children?: string }) => {
    if (!children) return null;
    return <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-0.5">{children}</p>;
};

const toId = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    return String(value);
};

export default function CreateSalarySlipPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ── Dropdown lookups ────────────────────────────────────────────────────
    const [staffDropdown, setStaffDropdown] = useState<StaffName[]>([]);
    const [accountsDropdown, setAccountsDropdown] = useState<PaymentMethodAccount[]>([]);
    const [loadingLookups, setLoadingLookups] = useState(true);

    // ── Popovers ───────────────────────────────────────────────────────────
    const [staffPopoverOpen, setStaffPopoverOpen] = useState(false);
    const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    // ── Form State ──────────────────────────────────────────────────────────
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [disbursementDate, setDisbursementDate] = useState<Date>(new Date());
    const [salaryMonth, setSalaryMonth] = useState<string>(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
    });

    // Earnings
    const [basicSalary, setBasicSalary] = useState<number | "">("");
    const [overtime, setOvertime] = useState<number | "">("");
    const [bonus, setBonus] = useState<number | "">("");
    const [otherEarnings, setOtherEarnings] = useState<number | "">("");

    // Deductions
    const [advanceSalary, setAdvanceSalary] = useState<number | "">("");
    const [lossOfPay, setLossOfPay] = useState<number | "">("");
    const [fine, setFine] = useState<number | "">("");
    const [otherDeductions, setOtherDeductions] = useState<number | "">("");

    // Remarks & Leaves
    const [casualLeaves, setCasualLeaves] = useState<number | "">("");
    const [remarks, setRemarks] = useState<string>("");
    const [printAfterCreate, setPrintAfterCreate] = useState<boolean>(true);

    // Submission & Errors
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{
        staff?: string;
        salaryMonth?: string;
        basicSalary?: string;
        paymentAccount?: string;
        general?: string;
    }>({});

    // ── Load lookups on mount ───────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const [staffRes, accsRes] = await Promise.all([
                    getStaffNamesAndIds(),
                    getPaymentMethodAccounts(),
                ]);
                if (!mounted) return;
                const activeStaff = staffRes.filter((s) => s.status === "ACTIVE");
                setStaffDropdown(activeStaff);
                setAccountsDropdown(accsRes);
                if (accsRes.length > 0) {
                    setSelectedAccountId(toId(accsRes[0].id));
                }
                const paramStaffId = searchParams.get("staffId");
                if (paramStaffId) {
                    const matched = activeStaff.find((s) => toId(s.id) === paramStaffId);
                    if (matched) {
                        setSelectedStaffId(paramStaffId);
                        if (matched.basicSalary !== undefined && matched.basicSalary !== null && Number(matched.basicSalary) > 0) {
                            setBasicSalary(Number(matched.basicSalary));
                        } else {
                            setBasicSalary("");
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load payroll lookups:", err);
                toast.error("Failed to load staff or accounts");
            } finally {
                if (mounted) setLoadingLookups(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, []);

    // ── Selected entities ───────────────────────────────────────────────────
    const selectedStaff = useMemo(
        () => staffDropdown.find((s) => toId(s.id) === selectedStaffId),
        [staffDropdown, selectedStaffId]
    );

    const selectedAccount = useMemo(
        () => accountsDropdown.find((a) => toId(a.id) === selectedAccountId),
        [accountsDropdown, selectedAccountId]
    );

    // ── Live Computations ───────────────────────────────────────────────────
    const numBasic = Number(basicSalary) || 0;
    const numOT = Number(overtime) || 0;
    const numBonus = Number(bonus) || 0;
    const numOtherEarn = Number(otherEarnings) || 0;

    const totalEarnings = numBasic + numOT + numBonus + numOtherEarn;

    const numAdvance = Number(advanceSalary) || 0;
    const numLOP = Number(lossOfPay) || 0;
    const numFine = Number(fine) || 0;
    const numOtherDed = Number(otherDeductions) || 0;

    const totalDeductions = numAdvance + numLOP + numFine + numOtherDed;
    const netSalary = totalEarnings - totalDeductions;
    const isNegativeNet = totalDeductions > totalEarnings && totalEarnings > 0;

    // Formatted Month Label (e.g. "September 2026")
    const formattedMonthLabel = useMemo(() => {
        if (!salaryMonth || !/^\d{4}-\d{2}$/.test(salaryMonth)) return "—";
        const [year, month] = salaryMonth.split("-");
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        return format(date, "MMMM yyyy");
    }, [salaryMonth]);

    // ── Form Validation & Submission ────────────────────────────────────────
    const handleSubmit = async () => {
        const nextErrors: typeof errors = {};

        if (!selectedStaffId) {
            nextErrors.staff = "Please select an employee";
        }
        if (!salaryMonth || !/^\d{4}-\d{2}$/.test(salaryMonth)) {
            nextErrors.salaryMonth = "Valid month in YYYY-MM format is required";
        }
        if (basicSalary === "" || numBasic <= 0) {
            nextErrors.basicSalary = "Basic salary must be greater than 0";
        }
        if (totalDeductions > totalEarnings) {
            nextErrors.general = `Total deductions (₹${totalDeductions.toLocaleString()}) cannot exceed total earnings (₹${totalEarnings.toLocaleString()})`;
        }
        if (!selectedAccountId) {
            nextErrors.paymentAccount = "Please select a payment account";
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            toast.error(nextErrors.general || "Please resolve highlighted fields before submitting.");
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                staffId: selectedStaffId,
                salaryMonth,
                basicSalary: numBasic,
                overtime: numOT,
                bonus: numBonus,
                otherEarnings: numOtherEarn,
                advanceSalary: numAdvance,
                lossOfPay: numLOP,
                fine: numFine,
                otherDeductions: numOtherDed,
                casualLeaves: casualLeaves === "" ? 0 : Number(casualLeaves),
                remarks: remarks.trim() || undefined,
                paymentAccountId: selectedAccountId || undefined,
                paymentDate: disbursementDate.toISOString(),
            };

            const result = await createSalarySlip(payload);

            if (result.success && result.data) {
                toast.success(result.message || "Salary slip generated successfully");
                if (printAfterCreate) {
                    router.push(`/print/salary-slips/${result.data.id}`);
                } else {
                    router.push("/workspace/salary-slips");
                }
            } else {
                toast.error(result.message || "Failed to generate salary slip.");
            }
        } catch (error) {
            console.error("Submit error:", error);
            const parsed = parseApiError(error, "Failed to generate salary slip");
            toast.error(parsed.message);
            if (parsed.isAuthError) {
                router.push("/login");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingLookups) {
        return (
            <div className="flex w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-950" style={{ minHeight: "80vh" }}>
                <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#6D755F]" />
                    <p className="text-sm">Loading payroll master data…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full rounded-2xl flex-col bg-white dark:bg-slate-950 lg:h-[80vh] lg:flex-row lg:overflow-hidden">

            {/* ── Left: Form inputs (Identical scrollable panel) ─────── */}
            <div className="flex flex-1 flex-col gap-6 h-[590px] overflow-y-auto p-6 lg:p-10">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Create Salary Slip
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Disburse monthly employee compensation and record expense transaction
                        </p>
                    </div>
                </div>

                {errors.general && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errors.general}</span>
                    </div>
                )}

                {/* 1. Basic Information */}
                <div className="flex flex-col gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        1. Basic Information
                    </span>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* Employee */}
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                            <FieldLabel>Employee<span className="text-red-600 ml-0.5">*</span></FieldLabel>
                            <Popover open={staffPopoverOpen} onOpenChange={setStaffPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        data-testid="staff-combobox-trigger"
                                        aria-expanded={staffPopoverOpen}
                                        className={cn(
                                            "w-full justify-between font-normal shadow-sm text-left px-3",
                                            fieldClass,
                                            errors.staff && fieldErrorClass
                                        )}
                                    >
                                        <span className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-200">
                                            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">{selectedStaff ? selectedStaff.name : "Select employee"}</span>
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search employee..." />
                                        <CommandList>
                                            <CommandEmpty>No staff found.</CommandEmpty>
                                            <CommandGroup>
                                                {staffDropdown.map((staff) => (
                                                    <CommandItem
                                                        key={staff.id}
                                                        value={`${staff.name} ${staff.employeeCode}`}
                                                        onSelect={() => {
                                                            setSelectedStaffId(toId(staff.id));
                                                            if (staff.basicSalary !== undefined && staff.basicSalary !== null && Number(staff.basicSalary) > 0) {
                                                                setBasicSalary(Number(staff.basicSalary));
                                                            } else {
                                                                setBasicSalary("");
                                                            }
                                                            setStaffPopoverOpen(false);
                                                            if (errors.staff) setErrors((prev) => ({ ...prev, staff: undefined }));
                                                        }}
                                                        className="py-2.5 cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", toId(staff.id) === selectedStaffId ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-800 dark:text-slate-100">{staff.name}</span>
                                                            <span className="text-xs text-slate-400">Code: {staff.employeeCode}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FieldError>{errors.staff}</FieldError>
                        </div>

                        {/* Salary Month */}
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                            <FieldLabel>Salary Month<span className="text-red-600 ml-0.5">*</span></FieldLabel>
                            <Input
                                type="month"
                                data-testid="salary-month-input"
                                value={salaryMonth}
                                onChange={(e) => {
                                    setSalaryMonth(e.target.value);
                                    if (errors.salaryMonth) setErrors((prev) => ({ ...prev, salaryMonth: undefined }));
                                }}
                                className={cn("h-11", fieldClass, errors.salaryMonth && fieldErrorClass)}
                            />
                            <FieldError>{errors.salaryMonth}</FieldError>
                        </div>

                        {/* Payment Date */}
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                            <FieldLabel>Disbursement Date</FieldLabel>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-11 w-full justify-start rounded-lg border-slate-300 bg-white px-3 text-left text-sm font-normal shadow-sm hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                                            "focus:ring-2 focus:ring-[#6D755F] focus:border-transparent"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                        <span>{format(disbursementDate, "dd MMM yyyy")}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={disbursementDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setDisbursementDate(date);
                                                setCalendarOpen(false);
                                            }
                                        }}
                                        defaultMonth={disbursementDate}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                {/* 2. Earnings / Additions */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            <TrendingUp className="h-3.5 w-3.5" /> 2. Earnings / Additions
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                            Total Earnings: {formatCurrency(totalEarnings)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div className="flex flex-col gap-1">
                            <FieldLabel>Basic Salary<span className="text-red-600 ml-0.5">*</span></FieldLabel>
                            <Input
                                type="number"
                                data-testid="basic-salary-input"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={basicSalary}
                                onChange={(e) => {
                                    setBasicSalary(e.target.value === "" ? "" : Number(e.target.value));
                                    if (errors.basicSalary) setErrors((prev) => ({ ...prev, basicSalary: undefined }));
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={cn("h-10", fieldClass, errors.basicSalary && fieldErrorClass)}
                            />
                            <FieldError>{errors.basicSalary}</FieldError>
                        </div>

                        <div className="flex flex-col gap-1">
                            <FieldLabel>Overtime</FieldLabel>
                            <Input
                                type="number"
                                data-testid="overtime-input"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={overtime}
                                onChange={(e) => setOvertime(e.target.value === "" ? "" : Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={cn("h-10", fieldClass)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <FieldLabel>Bonus</FieldLabel>
                            <Input
                                type="number"
                                data-testid="bonus-input"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={bonus}
                                onChange={(e) => setBonus(e.target.value === "" ? "" : Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={cn("h-10", fieldClass)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <FieldLabel>Others</FieldLabel>
                            <Input
                                type="number"
                                data-testid="other-earnings-input"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={otherEarnings}
                                onChange={(e) => setOtherEarnings(e.target.value === "" ? "" : Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={cn("h-10", fieldClass)}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Deductions */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                            <TrendingDown className="h-3.5 w-3.5" /> 3. Deductions
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-rose-800 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/40">
                            Total Deductions: {formatCurrency(totalDeductions)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div className="flex flex-col gap-1">
                            <FieldLabel>Advance Salary</FieldLabel>
                            <Input
                                type="number"
                                data-testid="advance-salary-input"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={advanceSalary}
                                onChange={(e) => setAdvanceSalary(e.target.value === "" ? "" : Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={cn("h-10", fieldClass)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <FieldLabel>Loss of Pay (LOP)</FieldLabel>
                            <Input
                                type="number"
                                data-testid="loss-of-pay-input"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={lossOfPay}
                                onChange={(e) => setLossOfPay(e.target.value === "" ? "" : Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={cn("h-10", fieldClass)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <FieldLabel>Fine</FieldLabel>
                            <Input
                                type="number"
                                data-testid="fine-input"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={fine}
                                onChange={(e) => setFine(e.target.value === "" ? "" : Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={cn("h-10", fieldClass)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <FieldLabel>Others</FieldLabel>
                            <Input
                                type="number"
                                data-testid="other-deductions-input"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={otherDeductions}
                                onChange={(e) => setOtherDeductions(e.target.value === "" ? "" : Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={cn("h-10", fieldClass)}
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Notes, Remarks & Payment Ledger Account */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Notes & Leaves */}
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            4. Notes & Remarks
                        </span>
                        <div className="flex flex-col gap-1.5">
                            <FieldLabel>Casual Leaves Taken This Month</FieldLabel>
                            <Input
                                type="number"
                                data-testid="casual-leaves-input"
                                min={0}
                                step="1"
                                placeholder="0"
                                value={casualLeaves}
                                onChange={(e) => setCasualLeaves(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10)))}
                                className={cn("h-10 w-full sm:w-40", fieldClass)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <FieldLabel>Remarks</FieldLabel>
                            <textarea
                                data-testid="remarks-input"
                                placeholder="Optional context or payment details for this salary slip..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#6D755F] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Disbursing Account */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                5. Disbursing Payment Account
                            </span>
                            <Wallet className="h-4 w-4 text-[#6D755F]" />
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                            <FieldLabel>Disbursement Ledger Account<span className="text-red-600 ml-0.5">*</span></FieldLabel>
                            <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={accountPopoverOpen}
                                        className={cn(
                                            "w-full justify-between font-normal shadow-sm text-left px-3",
                                            fieldClass,
                                            errors.paymentAccount && fieldErrorClass
                                        )}
                                    >
                                        <span className="flex items-center gap-2 truncate text-slate-800 dark:text-slate-200">
                                            <Wallet className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">{selectedAccount ? selectedAccount.name : "Select payment account"}</span>
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search accounts..." />
                                        <CommandList>
                                            <CommandEmpty>No payment accounts found.</CommandEmpty>
                                            <CommandGroup>
                                                {accountsDropdown.map((acc) => (
                                                    <CommandItem
                                                        key={acc.id}
                                                        value={acc.name}
                                                        onSelect={() => {
                                                            setSelectedAccountId(toId(acc.id));
                                                            setAccountPopoverOpen(false);
                                                            if (errors.paymentAccount) setErrors((prev) => ({ ...prev, paymentAccount: undefined }));
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", toId(acc.id) === selectedAccountId ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-800 dark:text-slate-100">{acc.name}</span>
                                                            <span className="text-[11px] text-slate-400">{acc.type}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FieldError>{errors.paymentAccount}</FieldError>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            An expense record and double-entry transaction (Debit: Salary, Credit: Payment Account) will automatically be booked upon confirmation.
                        </p>
                    </div>
                </div>

            </div>

            {/* ── Right: Review & Submit Sidebar (Solid Sage Green #6D755F) ────── */}
            <div
                className="flex w-full flex-col justify-between gap-6 p-6 text-white lg:w-[340px] lg:shrink-0 lg:p-8"
                style={{ backgroundColor: SAGE }}
            >
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                            Net Payable Salary
                        </p>
                        <p className={cn("mt-1 text-4xl font-bold tracking-tight", isNegativeNet && "text-red-200")}>
                            {formatCurrency(Math.max(0, netSalary))}
                        </p>
                        <p className="mt-1 text-xs text-white/70">
                            Salary for {formattedMonthLabel}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2.5 border-t border-white/15 pt-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-white/70">Employee</span>
                            <span className="font-medium truncate max-w-[170px] text-right">
                                {selectedStaff ? selectedStaff.name : "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/70">Employee Code</span>
                            <span className="font-medium">{selectedStaff ? selectedStaff.employeeCode : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/70">Salary Month</span>
                            <span className="font-medium">{salaryMonth || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/70">Payment Method</span>
                            <span className="font-medium truncate max-w-[170px] text-right">
                                {selectedAccount ? selectedAccount.name : "—"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-white/15 pt-4 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-white/70">Gross Earnings</span>
                            <span className="font-semibold">{formatCurrency(totalEarnings)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/70">Total Deductions</span>
                            <span className="font-semibold text-rose-200">- {formatCurrency(totalDeductions)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/70">Casual Leaves</span>
                            <span className="font-semibold">{casualLeaves === "" ? 0 : casualLeaves} day(s)</span>
                        </div>
                        {isNegativeNet && (
                            <div className="mt-1 rounded bg-red-500/20 p-2 text-[11px] text-red-100 border border-red-300/30">
                                Warning: Deductions exceed earnings! Net salary cannot be negative.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-white/85 cursor-pointer select-none">
                        <Checkbox
                            checked={printAfterCreate}
                            onCheckedChange={(checked) => setPrintAfterCreate(checked === true)}
                            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-[#6D755F]"
                        />
                        Print voucher after creating
                    </label>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || isNegativeNet}
                        className="h-11 w-full rounded-lg bg-white text-sm font-semibold text-slate-900 shadow-md hover:bg-white/90 disabled:opacity-50"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing
                            </span>
                        ) : (
                            "Confirm & Disburse Salary"
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        disabled={submitting}
                        className="h-10 w-full rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                        Discard
                    </Button>
                </div>
            </div>

        </div>
    );
}
