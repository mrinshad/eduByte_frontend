"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import {
    ArrowLeft,
    Check,
    ChevronsUpDown,
    Loader2,
    Receipt,
    Tags,
    Layers3,
    Wallet,
    Bus,
    Hash,
    FileText,
    IndianRupee,
    Plus,
    Trash2,
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
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
    createExpense,
    getExpenseCategories,
    getExpenseSubCategories,
    
    getPaymentMethodAccounts,
    type PaymentMethodAccount,
    type ExpenseCategory,
    type ExpenseSubCategory,
} from "@/lib/services/expense";
import { getVehicles, type Vehicle } from "@/lib/services/vehicle";

// ---------------------------------------------------------------------
// Shared layout pieces — same shape as the Admission page's StepSection,
// recolored to the amber accent used across the Expense pages.
// ---------------------------------------------------------------------

const StepSection = ({ stepNumber, title, description, children }: any) => (
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
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

const fieldClass = `
  h-12 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400
  focus:ring-2 focus:ring-amber-500 focus:border-transparent
  dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 transition-all
`;

const datePickerClassName =
    "w-full h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50";
const datePickerCalendarClassName = "rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950";
const datePickerPopperClassName = "z-50";

// ---------------------------------------------------------------------
// Payment split types
// ---------------------------------------------------------------------

type PaymentRow = {
    id: string;
    accountId: string;
    amount: number | "";
};

const createPaymentRow = (): PaymentRow => ({
    id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    accountId: "",
    amount: "",
});

export default function Page() {
    const router = useRouter();

    // ── Lookup data ─────────────────────────────────────────────────────────
    const [categoriesDropdown, setCategoriesDropdown] = useState<ExpenseCategory[]>([]);
    const [subCategoriesDropdown, setSubCategoriesDropdown] = useState<ExpenseSubCategory[]>([]);
    const [accountsDropdown, setAccountsDropdown] = useState<PaymentMethodAccount[]>([]);
    const [vehiclesDropdown, setVehiclesDropdown] = useState<Vehicle[]>([]);

    // ── Form state ──────────────────────────────────────────────────────────
    const [expenseNumber, setExpenseNumber] = useState<string>("");
    const [expenseDate, setExpenseDate] = useState<Date>(new Date());
    const [amount, setAmount] = useState<number | "">("");
    const [notes, setNotes] = useState<string>("");

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

    // ── Split payments (replaces the single payment account field) ──────────
    const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow()]);
    const [openPaymentRowId, setOpenPaymentRowId] = useState<string | null>(null);

    // ── Popover open state ─────────────────────────────────────────────────
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
    const [subCategoryPopoverOpen, setSubCategoryPopoverOpen] = useState(false);
    const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);

    // ── Loading state ───────────────────────────────────────────────────────
    const [loadingCategoryList, setLoadingCategoryList] = useState(false);
    const [loadingSubCategoryList, setLoadingSubCategoryList] = useState(false);
    const [loadingAccountList, setLoadingAccountList] = useState(false);
    const [loadingVehicleList, setLoadingVehicleList] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const selectedCategory = useMemo(
        () => categoriesDropdown.find((c) => c.id === selectedCategoryId) ?? null,
        [categoriesDropdown, selectedCategoryId]
    );

    const selectedSubCategory = useMemo(
        () => subCategoriesDropdown.find((sc) => sc.id === selectedSubCategoryId) ?? null,
        [subCategoriesDropdown, selectedSubCategoryId]
    );

    const filteredSubCategories = useMemo(() => {
        if (!selectedCategoryId) return [];
        return subCategoriesDropdown.filter((sc) => sc.categoryId === selectedCategoryId);
    }, [subCategoriesDropdown, selectedCategoryId]);

    // ── Lazy loaders, same pattern as the Admission page popovers ─────────────
    const handleCategoryPopoverChange = async (open: boolean) => {
        setCategoryPopoverOpen(open);
        if (open && categoriesDropdown.length === 0) {
            try {
                setLoadingCategoryList(true);
                const data = await getExpenseCategories();
                setCategoriesDropdown(data);
            } catch (error) {
                console.error("Failed to load expense categories:", error);
            } finally {
                setLoadingCategoryList(false);
            }
        }
    };

    const handleSubCategoryPopoverChange = async (open: boolean) => {
        setSubCategoryPopoverOpen(open);
        if (open && subCategoriesDropdown.length === 0) {
            try {
                setLoadingSubCategoryList(true);
                const data = await getExpenseSubCategories();
                setSubCategoriesDropdown(data);
            } catch (error) {
                console.error("Failed to load expense sub categories:", error);
            } finally {
                setLoadingSubCategoryList(false);
            }
        }
    };

    // Shared account list, lazily loaded the first time *any* payment row's
    // popover is opened (all rows draw from the same accounts dropdown).
    const ensureAccountsLoaded = async () => {
        if (accountsDropdown.length > 0 || loadingAccountList) return;
        try {
            setLoadingAccountList(true);
            const data = await getPaymentMethodAccounts();
            setAccountsDropdown(data);
        } catch (error) {
            console.error("Failed to load accounts:", error);
        } finally {
            setLoadingAccountList(false);
        }
    };

    const handlePaymentPopoverChange = (rowId: string, open: boolean) => {
        setOpenPaymentRowId(open ? rowId : null);
        if (open) void ensureAccountsLoaded();
    };

    const handleVehiclePopoverChange = async (open: boolean) => {
        setVehiclePopoverOpen(open);
        if (open && vehiclesDropdown.length === 0) {
            try {
                setLoadingVehicleList(true);
                const data = await getVehicles();
                setVehiclesDropdown(data);
            } catch (error) {
                console.error("Failed to load vehicles:", error);
            } finally {
                setLoadingVehicleList(false);
            }
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        setSelectedSubCategoryId("");
    };

    // ── Payment row helpers ──────────────────────────────────────────────────
    const addPaymentRow = () => setPayments((prev) => [...prev, createPaymentRow()]);

    const removePaymentRow = (rowId: string) =>
        setPayments((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== rowId) : prev));

    const updatePaymentAccount = (rowId: string, accountId: string) =>
        setPayments((prev) => prev.map((p) => (p.id === rowId ? { ...p, accountId } : p)));

    const updatePaymentAmount = (rowId: string, value: number | "") =>
        setPayments((prev) => prev.map((p) => (p.id === rowId ? { ...p, amount: value } : p)));

    // Preload categories + sub categories eagerly since Step 2 depends on the
    // category → sub category relationship being ready to filter instantly.
    useEffect(() => {
        void (async () => {
            try {
                const [cats, subs] = await Promise.all([
                    getExpenseCategories(),
                    getExpenseSubCategories(),
                ]);
                setCategoriesDropdown(cats);
                setSubCategoriesDropdown(subs);
            } catch (error) {
                console.error("Failed to preload category data:", error);
            }
        })();
    }, []);

    const totalAllocated = useMemo(
        () => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        [payments]
    );

    const remaining = (Number(amount) || 0) - totalAllocated;

    const paymentsValid =
        payments.length > 0 &&
        payments.every((p) => !!p.accountId && p.amount !== "" && Number(p.amount) > 0) &&
        amount !== "" &&
        remaining === 0;

    const isValid =
        expenseNumber.trim() !== "" &&
        !!selectedCategoryId &&
        !!selectedSubCategoryId &&
        amount !== "" &&
        Number(amount) > 0 &&
        !!expenseDate &&
        paymentsValid;

    const handleSubmit = async () => {
        if (!isValid) {
            if (amount !== "" && Number(amount) > 0 && remaining !== 0) {
                toast.error(
                    remaining > 0
                        ? `Payments are short by ₹${remaining.toLocaleString()}. Allocate the full amount across accounts.`
                        : `Payments exceed the expense amount by ₹${Math.abs(remaining).toLocaleString()}.`
                );
            } else {
                toast.error("Fill in expense number, category, sub category, amount, and payment split before submitting.");
            }
            return;
        }

        try {
            setSubmitting(true);

            const result = await createExpense({
                expenseNumber: expenseNumber.trim(),
                categoryId: selectedCategoryId,
                vehicleId: selectedVehicleId || null,
                subCategoryId: selectedSubCategoryId,
                notes: notes.trim(),
                amount: Number(amount),
                expenseDate: expenseDate.toISOString(),
                payments: payments.map((p) => ({
                    accountId: p.accountId,
                    amount: Number(p.amount),
                })),
            });

            if (result?.success) {
                toast.success(result?.message || "Expense created successfully");
                router.back();
            } else {
                toast.error(result?.message || "An error occurred during submission.");
            }
        } catch (error) {
            toast.error("Failed to create expense");
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
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Expense</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Record a new expense against a category, sub category, and one or more payment accounts.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()} disabled={submitting} className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !isValid}
                        className="rounded-xl h-11 px-8 bg-amber-600 text-white hover:bg-amber-700 shadow-md dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                    >
                        {submitting ? "Processing..." : "Confirm Expense"}
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-5xl space-y-8 pb-12">
                {/* Step 1: Expense Details */}
                <StepSection
                    stepNumber="1"
                    title="Expense Identification"
                    description="Provide the expense reference number, the date it was incurred, and the amount."
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Expense Number
                            </span>
                            <Input
                                placeholder="e.g. EXP003"
                                value={expenseNumber}
                                onChange={(e) => setExpenseNumber(e.target.value)}
                                className={fieldClass}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Receipt className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Expense Date
                            </span>
                            <DatePicker
                                selected={expenseDate}
                                onChange={(date: Date | null) => setExpenseDate(date ?? new Date())}
                                dateFormat="PPP"
                                className={datePickerClassName}
                                calendarClassName={datePickerCalendarClassName}
                                popperClassName={datePickerPopperClassName}
                                wrapperClassName="w-full"
                                showMonthDropdown
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={15}
                                dropdownMode="select"
                                openToDate={expenseDate}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IndianRupee className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Amount
                            </span>
                            <Input
                                type="number"
                                min={0}
                                placeholder="e.g. 4000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={fieldClass}
                            />
                        </div>
                    </div>
                </StepSection>

                {/* Step 2: Category & Sub Category */}
                <StepSection
                    stepNumber="2"
                    title="Category & Sub Category"
                    description="Select the expense category, then choose the sub category it falls under."
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Tags className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Expense Category
                            </span>
                            <Popover open={categoryPopoverOpen} onOpenChange={handleCategoryPopoverChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={categoryPopoverOpen}
                                        className={cn("w-full justify-between font-normal shadow-sm text-left", fieldClass)}
                                    >
                                        {selectedCategory ? selectedCategory.name : "Choose a category..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                    <Command>
                                        <CommandInput placeholder="Filter categories..." />
                                        <CommandList>
                                            {loadingCategoryList ? (
                                                <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" /> Loading...
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No categories found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {categoriesDropdown.map((category) => (
                                                            <CommandItem
                                                                key={category.id}
                                                                value={category.name}
                                                                onSelect={() => {
                                                                    handleCategorySelect(category.id);
                                                                    setCategoryPopoverOpen(false);
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4 text-amber-600", selectedCategoryId === category.id ? "opacity-100" : "opacity-0")} />
                                                                <span>{category.name}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers3 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Sub Category
                            </span>
                            <Popover open={subCategoryPopoverOpen} onOpenChange={handleSubCategoryPopoverChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        disabled={!selectedCategoryId}
                                        aria-expanded={subCategoryPopoverOpen}
                                        className={cn("w-full justify-between font-normal shadow-sm text-left disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/40", fieldClass)}
                                    >
                                        {selectedSubCategory
                                            ? selectedSubCategory.name
                                            : selectedCategoryId
                                                ? "Choose a sub category..."
                                                : "Select a category first..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                    <Command>
                                        <CommandInput placeholder="Filter sub categories..." />
                                        <CommandList>
                                            {loadingSubCategoryList ? (
                                                <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" /> Loading...
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No sub categories for this category.</CommandEmpty>
                                                    <CommandGroup>
                                                        {filteredSubCategories.map((subCategory) => (
                                                            <CommandItem
                                                                key={subCategory.id}
                                                                value={subCategory.name}
                                                                onSelect={() => {
                                                                    setSelectedSubCategoryId(subCategory.id);
                                                                    setSubCategoryPopoverOpen(false);
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4 text-amber-600", selectedSubCategoryId === subCategory.id ? "opacity-100" : "opacity-0")} />
                                                                <span>{subCategory.name}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </StepSection>

                {/* Step 3: Payment Accounts & Vehicle */}
                <StepSection
                    stepNumber="3"
                    title="Payment Accounts & Vehicle"
                    description="Split this expense across one or more accounts, and link a vehicle if it relates to transport."
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Payment Accounts
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={addPaymentRow}
                                className="h-8 rounded-lg text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" /> Add account
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {payments.map((row, index) => {
                                const rowAccount = accountsDropdown.find((a) => a.id === row.accountId);
                                return (
                                    <div key={row.id} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                        <Popover
                                            open={openPaymentRowId === row.id}
                                            onOpenChange={(open) => handlePaymentPopoverChange(row.id, open)}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openPaymentRowId === row.id}
                                                    className={cn("w-full sm:flex-1 justify-between font-normal shadow-sm text-left", fieldClass)}
                                                >
                                                    {rowAccount ? rowAccount.name : `Choose account ${index + 1}...`}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Filter accounts..." />
                                                    <CommandList>
                                                        {loadingAccountList ? (
                                                            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" /> Loading...
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <CommandEmpty>No accounts found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {accountsDropdown.map((account) => (
                                                                        <CommandItem
                                                                            key={account.id}
                                                                            value={account.name}
                                                                            onSelect={() => {
                                                                                updatePaymentAccount(row.id, account.id);
                                                                                setOpenPaymentRowId(null);
                                                                            }}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <Check className={cn("mr-2 h-4 w-4 text-amber-600", row.accountId === account.id ? "opacity-100" : "opacity-0")} />
                                                                            <span>{account.name}</span>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Amount"
                                            value={row.amount}
                                            onChange={(e) =>
                                                updatePaymentAmount(row.id, e.target.value === "" ? "" : Number(e.target.value))
                                            }
                                            onWheel={(e) => e.currentTarget.blur()}
                                            className={cn("w-full sm:w-40", fieldClass)}
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removePaymentRow(row.id)}
                                            disabled={payments.length === 1}
                                            className="h-12 w-12 shrink-0 rounded-xl border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 disabled:opacity-40 dark:border-slate-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        <div
                            className={cn(
                                "flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium",
                                remaining === 0
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            )}
                        >
                            <span>Allocated ₹{totalAllocated.toLocaleString()} of ₹{(Number(amount) || 0).toLocaleString()}</span>
                            <span>
                                {remaining === 0
                                    ? "Fully allocated"
                                    : remaining > 0
                                        ? `₹${remaining.toLocaleString()} remaining`
                                        : `₹${Math.abs(remaining).toLocaleString()} over`}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Bus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Vehicle (Optional)
                        </span>
                        <Popover open={vehiclePopoverOpen} onOpenChange={handleVehiclePopoverChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={vehiclePopoverOpen}
                                    className={cn("w-full justify-between font-normal shadow-sm text-left", fieldClass)}
                                >
                                    {selectedVehicleId
                                        ? (() => {
                                            const v = vehiclesDropdown.find((veh) => veh.id === selectedVehicleId);
                                            return v ? `${v.vehicleName} (${v.vehicleNumber})` : "Resolving vehicle...";
                                        })()
                                        : "Not linked to a vehicle..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Search vehicles..." />
                                    <CommandList>
                                        {loadingVehicleList ? (
                                            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" /> Loading...
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty>No vehicles found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="none"
                                                        onSelect={() => {
                                                            setSelectedVehicleId("");
                                                            setVehiclePopoverOpen(false);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-amber-600", selectedVehicleId === "" ? "opacity-100" : "opacity-0")} />
                                                        <span className="text-slate-500">No vehicle</span>
                                                    </CommandItem>
                                                    {vehiclesDropdown.map((vehicle) => (
                                                        <CommandItem
                                                            key={vehicle.id}
                                                            value={`${vehicle.vehicleName} ${vehicle.vehicleNumber}`}
                                                            onSelect={() => {
                                                                setSelectedVehicleId(vehicle.id);
                                                                setVehiclePopoverOpen(false);
                                                            }}
                                                            className="py-3 cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-3 h-4 w-4 text-amber-600", selectedVehicleId === vehicle.id ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-900 dark:text-slate-100">{vehicle.vehicleName}</span>
                                                                <span className="text-xs text-slate-400">Plate: {vehicle.vehicleNumber} | Driver: {vehicle.driverName}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </StepSection>

                {/* Step 4: Notes */}
                <StepSection
                    stepNumber="4"
                    title="Notes"
                    description="Add any additional context for this expense (optional)."
                >
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Notes
                        </span>
                        <textarea
                            placeholder="e.g. testing expense posting, with transaction"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </div>

                    {/* Live summary strip, mirrors the total-ledger footer on the Admission page */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-amber-600 dark:bg-amber-500 px-6 py-5">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white/90 dark:text-slate-950/80">Expense Amount</span>
                            <span className="text-xs text-white/70 dark:text-slate-950/60">
                                {expenseDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                        </div>
                        <span className="text-3xl font-bold tracking-tight text-white dark:text-slate-950">
                            ₹{(Number(amount) || 0).toLocaleString()}
                        </span>
                    </div>
                </StepSection>
            </div>
        </div>
    );
}