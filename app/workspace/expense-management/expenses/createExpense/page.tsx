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
    Tags,
    Layers3,
    Bus,
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
// Shared bits — same sage accent (#6D755F) as the rest of the app.
// ---------------------------------------------------------------------

const SAGE = "#6D755F";

const fieldClass = `
  h-11 rounded-lg border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400
  focus:ring-2 focus:ring-[#6D755F] focus:border-transparent
  dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 transition-all
`;

const datePickerClassName =
    "w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#6D755F] focus:ring-2 focus:ring-[#6D755F]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50";
const datePickerCalendarClassName = "rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950";
const datePickerPopperClassName = "z-50";

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{children}</label>
);

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

    // ── Split payments ────────────────────────────────────────────────────
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

    const selectedVehicle = useMemo(
        () => vehiclesDropdown.find((v) => v.id === selectedVehicleId) ?? null,
        [vehiclesDropdown, selectedVehicleId]
    );

    const filteredSubCategories = useMemo(() => {
        if (!selectedCategoryId) return [];
        return subCategoriesDropdown.filter((sc) => sc.categoryId === selectedCategoryId);
    }, [subCategoriesDropdown, selectedCategoryId]);

    // ── Lazy loaders ──────────────────────────────────────────────────────
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

    // Preload categories + sub categories eagerly.
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
    const allocationPct = amount && Number(amount) > 0 ? Math.min(100, (totalAllocated / Number(amount)) * 100) : 0;

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
        if (Math.abs(remaining) >= 0.01) {
            if (remaining > 0) {
                toast.error(
                    `₹${remaining.toLocaleString()} is still unallocated.`
                );
            } else {
                toast.error(
                    `Allocated amount exceeds the expense by ₹${Math.abs(
                        remaining
                    ).toLocaleString()}.`
                );
            }

            return;
        }
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
        <div className="flex w-full rounded-2xl flex-col bg-white dark:bg-slate-950 lg:h-[80vh] lg:flex-row lg:overflow-hidden">

            {/* ── Left: form fields ───────────────────────────────────── */}
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 lg:p-10">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0 rounded-lg border-slate-200 dark:border-slate-700">
                        <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create Expense</h1>
                        <p className="text-xs text-slate-400">Log a new expense and how it was paid</p>
                    </div>
                </div>

                {/* Expense number / date / amount */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Expense Number</FieldLabel>
                        <Input
                            placeholder="e.g. EXP003"
                            value={expenseNumber}
                            onChange={(e) => setExpenseNumber(e.target.value)}
                            className={fieldClass}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Date</FieldLabel>
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

                </div>

                {/* Category / sub category / vehicle */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Category</FieldLabel>
                        <Popover open={categoryPopoverOpen} onOpenChange={handleCategoryPopoverChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={categoryPopoverOpen}
                                    className={cn("w-full justify-between font-normal shadow-sm text-left px-3", fieldClass)}
                                >
                                    <span className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-200">
                                        <Tags className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <span className="truncate">{selectedCategory ? selectedCategory.name : "Choose category"}</span>
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Filter categories..." />
                                    <CommandList>
                                        {loadingCategoryList ? (
                                            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: SAGE }} /> Loading...
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
                                                            <Check className={cn("mr-2 h-4 w-4", selectedCategoryId === category.id ? "opacity-100" : "opacity-0")} style={{ color: SAGE }} />
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

                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Sub Category</FieldLabel>
                        <Popover open={subCategoryPopoverOpen} onOpenChange={handleSubCategoryPopoverChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={!selectedCategoryId}
                                    aria-expanded={subCategoryPopoverOpen}
                                    className={cn("w-full justify-between font-normal shadow-sm text-left px-3 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/40", fieldClass)}
                                >
                                    <span className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-200">
                                        <Layers3 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <span className="truncate">
                                            {selectedSubCategory ? selectedSubCategory.name : selectedCategoryId ? "Choose sub category" : "Pick a category first"}
                                        </span>
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Filter sub categories..." />
                                    <CommandList>
                                        {loadingSubCategoryList ? (
                                            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: SAGE }} /> Loading...
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
                                                            <Check className={cn("mr-2 h-4 w-4", selectedSubCategoryId === subCategory.id ? "opacity-100" : "opacity-0")} style={{ color: SAGE }} />
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Amount</FieldLabel>
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

                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Vehicle (optional)</FieldLabel>
                        <Popover open={vehiclePopoverOpen} onOpenChange={handleVehiclePopoverChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={vehiclePopoverOpen}
                                    className={cn("w-full justify-between font-normal shadow-sm text-left px-3", fieldClass)}
                                >
                                    <span className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-200">
                                        <Bus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <span className="truncate">{selectedVehicle ? selectedVehicle.vehicleName : "Not linked"}</span>
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Search vehicles..." />
                                    <CommandList>
                                        {loadingVehicleList ? (
                                            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: SAGE }} /> Loading...
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
                                                        <Check className={cn("mr-2 h-4 w-4", selectedVehicleId === "" ? "opacity-100" : "opacity-0")} style={{ color: SAGE }} />
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
                                                            <Check className={cn("mr-3 h-4 w-4", selectedVehicleId === vehicle.id ? "opacity-100" : "opacity-0")} style={{ color: SAGE }} />
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

                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                    {/* LEFT */}

                    <div className="flex flex-col gap-1.5">

                        <FieldLabel>Notes</FieldLabel>

                        <textarea
                            placeholder="Optional context for this expense"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={6}
                            className="
                w-full
                resize-none
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-sm
                dark:border-slate-700
                dark:bg-slate-950
                focus:ring-2
                focus:ring-[#6D755F]
            "
                        />

                    </div>

                    {/* RIGHT */}
                    {/* Payment split */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <FieldLabel>Payment Accounts</FieldLabel>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={addPaymentRow}
                                className="h-7 rounded-md px-2 text-xs hover:bg-transparent hover:underline"
                                style={{ color: SAGE }}
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" /> Add account
                            </Button>
                        </div>

                        <div className="flex max-h-[168px] flex-col gap-2 overflow-y-auto pr-1">
                            {payments.map((row, index) => {
                                const rowAccount = accountsDropdown.find((a) => a.id === row.accountId);
                                return (

                                    <div key={row.id} className="flex shrink-0 items-center gap-2">
                                        <Popover
                                            open={openPaymentRowId === row.id}
                                            onOpenChange={(open) => handlePaymentPopoverChange(row.id, open)}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openPaymentRowId === row.id}
                                                    className={cn("h-10 flex-1 justify-between font-normal text-left px-3 border-slate-200 bg-white dark:bg-slate-950", fieldClass)}
                                                >
                                                    <span className="truncate">{rowAccount ? rowAccount.name : `Choose account ${index + 1}`}</span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Filter accounts..." />
                                                    <CommandList>
                                                        {loadingAccountList ? (
                                                            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: SAGE }} /> Loading...
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
                                                                            <Check className={cn("mr-2 h-4 w-4", row.accountId === account.id ? "opacity-100" : "opacity-0")} style={{ color: SAGE }} />
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
                                            className={cn("h-10 w-28 shrink-0 border-slate-200 bg-white dark:bg-slate-950", fieldClass)}
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removePaymentRow(row.id)}
                                            disabled={payments.length === 1}
                                            className="h-10 w-9 shrink-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        {payments.length > 3 && (
                            <p className="text-[11px] text-slate-400">{payments.length} accounts · scroll for more</p>
                        )}
                    </div>
                </div>


            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            </div>

            {/* ── Right: review & submit panel ───────────────────────── */}
            <div
                className="flex w-full flex-col justify-between gap-6 p-6 text-white lg:w-[340px] lg:shrink-0 lg:p-8"
                style={{ backgroundColor: SAGE }}
            >
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-white/60">Amount</p>
                        <p className="mt-1 text-4xl font-bold tracking-tight">
                            ₹{(Number(amount) || 0).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                            {expenseDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-white/15 pt-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-white/60">Category</span>
                            <span className="font-medium">{selectedCategory ? selectedCategory.name : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/60">Sub category</span>
                            <span className="font-medium">{selectedSubCategory ? selectedSubCategory.name : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/60">Vehicle</span>
                            <span className="font-medium">{selectedVehicle ? selectedVehicle.vehicleName : "—"}</span>
                        </div>
                    </div>

                    {/* <div className="flex flex-col gap-1.5 border-t border-white/15 pt-4">
                            <label className="text-xs font-medium uppercase tracking-wider text-white/60">Notes</label>
                            <textarea
                                placeholder="Optional context for this expense"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/20"
                            />
                        </div> */}

                    <div className="flex flex-col gap-2 border-t border-white/15 pt-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">Allocated</span>
                            <span className="font-medium">
                                ₹{totalAllocated.toLocaleString()} / ₹{(Number(amount) || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                            <div
                                className={cn("h-full rounded-full transition-all", remaining < 0 ? "bg-red-300" : "bg-white")}
                                style={{ width: `${allocationPct}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-white/60">
                            {remaining === 0
                                ? "Fully allocated"
                                : remaining > 0
                                    ? `₹${remaining.toLocaleString()} not yet allocated`
                                    : `₹${Math.abs(remaining).toLocaleString()} over the expense amount`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-11 w-full rounded-lg bg-white text-sm font-semibold text-slate-900 shadow-md hover:bg-white/90 disabled:opacity-50"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing
                            </span>
                        ) : (
                            "Confirm Expense"
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