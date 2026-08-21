"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { parseApiError } from "@/lib/api-error";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ArrowLeft,
    CalendarIcon,
    Check,
    ChevronsUpDown,
    Loader2,
    Tags,
    Layers3,
    Bus,
    User,
    Activity,
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
    createExpense,
    getExpenseCategories,
    getExpenseSubCategories,
    getPaymentMethodAccounts,
    getStaffNamesAndIds,
    type PaymentMethodAccount,
    type ExpenseCategory,
    type ExpenseSubCategory,
    type StaffName,
} from "@/lib/services/expense";
import { getVehicles, type Vehicle } from "@/lib/services/vehicle";
import {
    getExpenseSummaryById,
    updateExpenseSummary,
    type ExpenseDetail,
} from "@/lib/services/reports";
import { getCCAActivities, recordCCAExpense, type CCAActivity } from "@/lib/services/cca";

// ---------------------------------------------------------------------
// Shared bits — same sage accent (#6D755F) as the rest of the app.
// ---------------------------------------------------------------------

const SAGE = "#6D755F";

const fieldClass = `
  h-11 rounded-lg border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400
  focus:ring-2 focus:ring-[#6D755F] focus:border-transparent
  dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 transition-all
`;

const fieldErrorClass = "!border-red-400 dark:!border-red-500/60 focus:!ring-red-400";

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{children}</label>
);

const FieldError = ({ children }: { children?: string }) => {
    if (!children) return null;
    return <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-0.5">{children}</p>;
};

// ---------------------------------------------------------------------
// ID normalization helper
// ---------------------------------------------------------------------
// The expense detail API and the various dropdown-list APIs are not
// guaranteed to serialize IDs the same way (e.g. one side may return a
// number, the other a string). Because all the `.find(x => x.id === val)`
// lookups below use strict equality, a type mismatch causes the lookup to
// silently fail — the ID state gets set correctly, but the "selected"
// memo resolves to null and the UI falls back to placeholder text
// ("Choose category", "Not linked", etc.) even though the value is really
// there. Routing every ID through `toId()` before comparing/storing
// eliminates that class of bug.
const toId = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    return String(value);
};

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
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEditMode = !!editId;

    // ── Lookup data ─────────────────────────────────────────────────────────
    const [categoriesDropdown, setCategoriesDropdown] = useState<ExpenseCategory[]>([]);
    const [subCategoriesDropdown, setSubCategoriesDropdown] = useState<ExpenseSubCategory[]>([]);
    const [accountsDropdown, setAccountsDropdown] = useState<PaymentMethodAccount[]>([]);
    const [vehiclesDropdown, setVehiclesDropdown] = useState<Vehicle[]>([]);
    const [staffDropdown, setStaffDropdown] = useState<StaffName[]>([]);

    // ── Form state ──────────────────────────────────────────────────────────
    const [expenseDate, setExpenseDate] = useState<Date>(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [amount, setAmount] = useState<number | "">("");
    const [notes, setNotes] = useState<string>("");
    const [printAfterCreate, setPrintAfterCreate] = useState<boolean>(false);

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");
    const [ccaActivities, setCcaActivities] = useState<CCAActivity[]>([]);
    const [selectedCCAActivity, setSelectedCCAActivity] = useState<string>("");

    // ── Split payments ────────────────────────────────────────────────────
    const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow()]);
    const [openPaymentRowId, setOpenPaymentRowId] = useState<string | null>(null);

    // ── Edit mode loading ─────────────────────────────────────────────────
    const [loadingExpense, setLoadingExpense] = useState(false);
    const [expenseDetail, setExpenseDetail] = useState<ExpenseDetail | null>(null);

    // ── Field-level validation errors ──────────────────────────────────────
    const [fieldErrors, setFieldErrors] = useState<{
        category?: string;
        subCategory?: string;
        amount?: string;
    }>({});
    const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

    // ── Popover open state ─────────────────────────────────────────────────
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
    const [subCategoryPopoverOpen, setSubCategoryPopoverOpen] = useState(false);
    const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
    const [staffPopoverOpen, setStaffPopoverOpen] = useState(false);
    const [ccaPopoverOpen, setCcaPopoverOpen] = useState(false);

    // ── Loading state ───────────────────────────────────────────────────────
    const [loadingCategoryList, setLoadingCategoryList] = useState(false);
    const [loadingSubCategoryList, setLoadingSubCategoryList] = useState(false);
    const [loadingAccountList, setLoadingAccountList] = useState(false);
    const [loadingVehicleList, setLoadingVehicleList] = useState(false);
    const [loadingStaffList, setLoadingStaffList] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // NOTE: every lookup below is normalized through toId() on both sides
    // so that string/number ID mismatches between the expense-detail API
    // and the dropdown-list APIs can never cause a silent match failure.
    const selectedCategory = useMemo(
        () => categoriesDropdown.find((c) => toId(c.id) === toId(selectedCategoryId)) ?? null,
        [categoriesDropdown, selectedCategoryId]
    );

    const selectedSubCategory = useMemo(
        () => subCategoriesDropdown.find((sc) => toId(sc.id) === toId(selectedSubCategoryId)) ?? null,
        [subCategoriesDropdown, selectedSubCategoryId]
    );

    const selectedVehicle = useMemo(
        () => vehiclesDropdown.find((v) => toId(v.id) === toId(selectedVehicleId)) ?? null,
        [vehiclesDropdown, selectedVehicleId]
    );

    const selectedStaff = useMemo(
        () => staffDropdown.find((s) => toId(s.id) === toId(selectedStaffId)) ?? null,
        [staffDropdown, selectedStaffId]
    );

    const filteredSubCategories = useMemo(() => {
        if (!selectedCategoryId) return [];
        return subCategoriesDropdown.filter((sc) => toId(sc.categoryId) === toId(selectedCategoryId));
    }, [subCategoriesDropdown, selectedCategoryId]);

    // ── Preload categories + sub categories + vehicles + staff eagerly ─────
    // NOTE: vehicles & staff used to be lazy-loaded only when their popover
    // was opened. That's fine for "create" mode, but in "edit" mode it meant
    // selectedVehicle / selectedStaff below would resolve to null (because
    // vehiclesDropdown / staffDropdown were still empty arrays), so the
    // saved vehicle/staff never appeared even though selectedVehicleId /
    // selectedStaffId were set correctly from the loaded expense. Preloading
    // all four lookups together fixes that without changing UX for create mode.
    useEffect(() => {
        void (async () => {
            try {
                const [cats, subs, vehicles, staff, accounts] = await Promise.all([
                    getExpenseCategories(),
                    getExpenseSubCategories(),
                    getVehicles(),
                    getStaffNamesAndIds(),
                    getPaymentMethodAccounts(),          // ← ADD
                ]);
                setCategoriesDropdown(cats);
                setSubCategoriesDropdown(subs);
                setVehiclesDropdown(vehicles);
                setStaffDropdown(staff);
                setAccountsDropdown(accounts);           // ← ADD
            } catch (error) {
                console.error("Failed to preload dropdown data:", error);
            }
        })();
    }, []);
    useEffect(() => {
        if (accountsDropdown.length > 0 && !isEditMode) {
            setPayments((prev) => {
                // Only auto-fill on a fresh, untouched single row
                if (prev.length === 1 && prev[0].accountId === "") {
                    const cashAccount = accountsDropdown.find((a) =>
                        a.name.toLowerCase().includes("cash")
                    );
                    if (cashAccount) {
                        return [{ ...prev[0], accountId: toId(cashAccount.id) }];
                    }
                }
                return prev;
            });
        }
    }, [accountsDropdown, isEditMode]);

    useEffect(() => {
        getCCAActivities()
            .then(setCcaActivities)
            .catch((err) => console.error("Failed to load CCA activities for expense:", err));
    }, []);

    // ── Load expense data in edit mode ────────────────────────────────────
    useEffect(() => {
        if (!editId) return;

        let cancelled = false;

        async function loadExpense(id: string) {
            try {
                setLoadingExpense(true);
                const detail = await getExpenseSummaryById(id);

                // Debug aid: if category/sub-category/vehicle/staff still
                // don't populate after this fix, uncomment the line below
                // and compare the shape/types against categoriesDropdown[0].
                // console.log("expense detail from API:", detail);

                if (!cancelled && detail) {
                    setExpenseDetail(detail);
                    setAmount(detail.amount);
                    setNotes(detail.notes ?? "");
                    setExpenseDate(parseISO(detail.expenseDate));

                    // IMPORTANT: the API's expense-detail response keys these
                    // as `category` / `subCategory` / `vehicle` / `staff`
                    // (holding the *IDs* despite the plain names — there is
                    // no separate `categoryId` field on the payload). Reading
                    // `detail.categoryId` etc. here would always be
                    // undefined and silently blank out the selects. Normalize
                    // every value to a string via toId() so it matches the
                    // dropdown lists regardless of how the API serialized it.
                    setSelectedCategoryId(toId(detail.category));
                    setSelectedSubCategoryId(toId(detail.subCategory));
                    setSelectedVehicleId(toId(detail.vehicle));
                    setSelectedStaffId(toId(detail.staff));

                    if (detail.payments && detail.payments.length > 0) {
                        setPayments(
                            detail.payments.map((p) => ({
                                id:
                                    typeof crypto !== "undefined" && "randomUUID" in crypto
                                        ? crypto.randomUUID()
                                        : `row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                accountId: toId(p.accountId),
                                amount: p.amount,
                            }))
                        );
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    toast.error("Failed to load expense details.");
                }
            } finally {
                if (!cancelled) setLoadingExpense(false);
            }
        }

        loadExpense(editId);

        return () => {
            cancelled = true;
        };
    }, [editId]);

    // ── Lazy loaders ──────────────────────────────────────────────────────
    // These are kept as safety nets / refresh triggers if the popover is
    // opened before the eager preload above finishes, or if it ever fails.
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

    // In edit mode, payment accounts weren't eagerly preloaded, so the
    // "Choose account" trigger button can't resolve rowAccount until the
    // popover has been opened once. Preload accounts alongside the other
    // lookups whenever we're in edit mode so the saved account name shows
    // immediately instead of only after the user opens the dropdown.
    useEffect(() => {
        if (isEditMode) {
            void ensureAccountsLoaded();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode]);

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

    const handleStaffPopoverChange = async (open: boolean) => {
        setStaffPopoverOpen(open);
        if (open && staffDropdown.length === 0) {
            try {
                setLoadingStaffList(true);
                const data = await getStaffNamesAndIds();
                setStaffDropdown(data);
            } catch (error) {
                console.error("Failed to load staff:", error);
            } finally {
                setLoadingStaffList(false);
            }
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategoryId(toId(categoryId));
        setSelectedSubCategoryId("");
        setFieldErrors((prev) => ({ ...prev, category: undefined }));
    };

    // ── Payment row helpers ──────────────────────────────────────────────────
    const addPaymentRow = () => setPayments((prev) => [...prev, createPaymentRow()]);

    const removePaymentRow = (rowId: string) => {
        setPayments((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== rowId) : prev));
        setPaymentErrors((prev) => {
            if (!(rowId in prev)) return prev;
            const next = { ...prev };
            delete next[rowId];
            return next;
        });
    };

    const updatePaymentAccount = (rowId: string, accountId: string) => {
        setPayments((prev) => prev.map((p) => (p.id === rowId ? { ...p, accountId: toId(accountId) } : p)));
        setPaymentErrors((prev) => {
            if (!(rowId in prev)) return prev;
            const next = { ...prev };
            delete next[rowId];
            return next;
        });
    };

    const updatePaymentAmount = (rowId: string, value: number | "") => {
        setPayments((prev) => prev.map((p) => (p.id === rowId ? { ...p, amount: value } : p)));
        setPaymentErrors((prev) => {
            if (!(rowId in prev)) return prev;
            const next = { ...prev };
            delete next[rowId];
            return next;
        });
    };

    const totalAllocated = useMemo(
        () => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        [payments]
    );

    const remaining = (Number(amount) || 0) - totalAllocated;
    const allocationPct = amount && Number(amount) > 0 ? Math.min(100, (totalAllocated / Number(amount)) * 100) : 0;

    // ── Field-level validation ────────────────────────────────────────────
    const validateExpenseForm = (): {
        valid: boolean;
        fieldErrors: typeof fieldErrors;
        paymentErrors: Record<string, string>;
        firstError?: string;
    } => {
        const nextFieldErrors: typeof fieldErrors = {};
        const nextPaymentErrors: Record<string, string> = {};

        if (!selectedCategoryId) nextFieldErrors.category = "Please select a category";
        if (!selectedSubCategoryId) nextFieldErrors.subCategory = "Please select a sub category";
        if (amount === "" || Number(amount) <= 0) nextFieldErrors.amount = "Please enter a valid amount";

        payments.forEach((row) => {
            if (!row.accountId) {
                nextPaymentErrors[row.id] = "Please select a payment account";
            } else if (row.amount === "" || Number(row.amount) <= 0) {
                nextPaymentErrors[row.id] = "Please enter an amount for this account";
            }
        });

        const firstError =
            nextFieldErrors.category ??
            nextFieldErrors.subCategory ??
            nextFieldErrors.amount ??
            Object.values(nextPaymentErrors)[0];

        return {
            valid: !firstError,
            fieldErrors: nextFieldErrors,
            paymentErrors: nextPaymentErrors,
            firstError,
        };
    };

    const handleSubmit = async () => {
        const { valid, fieldErrors: nextFieldErrors, paymentErrors: nextPaymentErrors, firstError } =
            validateExpenseForm();

        setFieldErrors(nextFieldErrors);
        setPaymentErrors(nextPaymentErrors);

        if (!valid) {
            toast.error(firstError!);
            return;
        }

        if (Math.abs(remaining) >= 0.01) {
            if (remaining > 0) {
                toast.error(`${formatCurrency(remaining)} is still unallocated.`);
            } else {
                toast.error(
                    `Allocated amount exceeds the expense by ${formatCurrency(Math.abs(remaining))}.`
                );
            }
            return;
        }

        const payload = {
            categoryId: selectedCategoryId,
            vehicleId: selectedVehicleId || null,
            subCategoryId: selectedSubCategoryId,
            staffId: selectedStaffId || null,
            notes: notes.trim(),
            amount: Number(amount),
            accountId: selectedSubCategory?.expenseAccountId ?? "",  // ← ADD THIS
            expenseDate: expenseDate.toISOString(),
            payments: payments.map((p) => ({
                accountId: p.accountId,
                amount: Number(p.amount),
            })),
        };

        try {
            setSubmitting(true);

            if (isEditMode && editId) {
                const result = await updateExpenseSummary(editId, payload);
                if (result.success) {
                    if (selectedCCAActivity) {
                        recordCCAExpense({
                            id: editId,
                            expenseNumber: expenseDetail?.expenseNumber || "EXP",
                            activityName: selectedCCAActivity,
                            amount: Number(amount),
                            notes: notes.trim(),
                            expenseDate: expenseDate.toISOString(),
                        });
                    }
                    toast.success(result.message || "Expense updated successfully");
                    if (printAfterCreate) {
                        router.push(`/print/expenses/${editId}`);
                    } else {
                        router.push("/workspace/reports/expense-summary");
                    }
                } else {
                    toast.error(result.message || "An error occurred during update.");
                }
            } else {
                const result = await createExpense(payload);
                if (result.success) {
                    if (selectedCCAActivity) {
                        recordCCAExpense({
                            id: result.data.id || String(Date.now()),
                            expenseNumber: result.data.expenseNumber || "EXP",
                            activityName: selectedCCAActivity,
                            amount: Number(amount),
                            notes: notes.trim(),
                            expenseDate: expenseDate.toISOString(),
                        });
                    }
                    toast.success(result.message || "Expense created successfully");
                    if (printAfterCreate) {
                        router.push(`/print/expenses/${result.data.id}`);
                    } else {
                        router.push("/workspace/reports/expense-summary");
                    }
                } else {
                    toast.error(result.message || "An error occurred during submission.");
                }
            }
        } catch (error) {
            console.error("Submit error:", error);
            const parsed = parseApiError(error, isEditMode ? "Failed to update expense" : "Failed to create expense");
            toast.error(parsed.message);

            if (parsed.isAuthError) {
                router.push("/login");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Show loading overlay while fetching expense in edit mode
    if (isEditMode && loadingExpense) {
        return (
            <div className="flex w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-950" style={{ minHeight: "80vh" }}>
                <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#6D755F]" />
                    <p className="text-sm">Loading expense details…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full rounded-2xl flex-col bg-white dark:bg-slate-950 lg:h-[80vh] lg:flex-row lg:overflow-hidden">

            {/* ── Left: form fields ───────────────────────────────────── */}
            <div className="flex flex-1 flex-col gap-6 h-[590px] overflow-y-auto p-6 lg:p-10">
                <div className="flex items-center gap-3">
                    <Button
                        className="bg-background text-foreground hover:opacity-90 shadow-sm"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 text-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {isEditMode ? "Edit Expense" : "Create Expense"}
                        </h1>
                        <p className="text-xs text-slate-400">
                            {isEditMode
                                ? `Editing ${expenseDetail?.expenseNumber ?? ""}`
                                : "Log a new expense and how it was paid"}
                        </p>
                    </div>
                </div>

                {/* Staff / date */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Staff (optional)</FieldLabel>
                        <Popover open={staffPopoverOpen} onOpenChange={handleStaffPopoverChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={staffPopoverOpen}
                                    className={cn("w-full justify-between font-normal shadow-sm text-left px-3", fieldClass)}
                                >
                                    <span className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-200">
                                        <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <span className="truncate">{selectedStaff ? selectedStaff.name : "Not linked"}</span>
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Search staff..." />
                                    <CommandList>
                                        {loadingStaffList ? (
                                            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6D755F]" /> Loading...
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty>No staff found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="none"
                                                        onSelect={() => {
                                                            setSelectedStaffId("");
                                                            setStaffPopoverOpen(false);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", selectedStaffId === "" ? "opacity-100" : "opacity-0")} />
                                                        <span className="text-slate-100">No staff</span>
                                                    </CommandItem>
                                                    {staffDropdown.map((staff) => (
                                                        <CommandItem
                                                            key={staff.id}
                                                            value={`${staff.name} ${staff.employeeCode}`}
                                                            onSelect={() => {
                                                                setSelectedStaffId(toId(staff.id));
                                                                setStaffPopoverOpen(false);
                                                            }}
                                                            className="py-3 cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", toId(staff.id) === selectedStaffId ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-200 dark:text-slate-100">{staff.name}</span>
                                                                <span className="text-xs text-slate-400">Code: {staff.employeeCode}</span>
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

                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Date</FieldLabel>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-11 w-full justify-start rounded-lg border-slate-200 bg-white px-3 text-left text-sm font-normal  shadow-sm hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50",
                                        "focus:ring-2 focus:ring-[#6D755F] focus:border-transparent"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400 hover:text-slate-100" />
                                    <span>{format(expenseDate, "PPP")}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto rounded-xl border-slate-200 p-0 shadow-lg dark:border-slate-800"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={expenseDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            setExpenseDate(date);
                                            setCalendarOpen(false);
                                        }
                                    }}
                                    defaultMonth={expenseDate}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Category / sub category */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Category<span className="text-red-600 ml-0.5">*</span></FieldLabel>
                        <Popover open={categoryPopoverOpen} onOpenChange={handleCategoryPopoverChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={categoryPopoverOpen}
                                    className={cn(
                                        "w-full justify-between font-normal shadow-sm text-left px-3",
                                        fieldClass,
                                        fieldErrors.category && fieldErrorClass
                                    )}
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
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6D755F]" /> Loading...
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
                                                            <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", toId(category.id) === selectedCategoryId ? "opacity-100" : "opacity-0")} />
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
                        <FieldError>{fieldErrors.category}</FieldError>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Sub Category<span className="text-red-600 ml-0.5">*</span></FieldLabel>
                        <Popover open={subCategoryPopoverOpen} onOpenChange={handleSubCategoryPopoverChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={!selectedCategoryId}
                                    aria-expanded={subCategoryPopoverOpen}
                                    className={cn(
                                        "w-full justify-between font-normal shadow-sm text-left px-3 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/40",
                                        fieldClass,
                                        fieldErrors.subCategory && fieldErrorClass
                                    )}
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
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6D755F]" /> Loading...
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
                                                                setSelectedSubCategoryId(toId(subCategory.id));
                                                                setSubCategoryPopoverOpen(false);
                                                                setFieldErrors((prev) => ({ ...prev, subCategory: undefined }));
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", toId(subCategory.id) === selectedSubCategoryId ? "opacity-100" : "opacity-0")} />
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
                        <FieldError>{fieldErrors.subCategory}</FieldError>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Amount<span className="text-red-600 ml-0.5">*</span></FieldLabel>
                        <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="e.g. 4000.00"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value === "" ? "" : Number(e.target.value));
                                setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className={cn(fieldClass, fieldErrors.amount && fieldErrorClass)}
                        />
                        <FieldError>{fieldErrors.amount}</FieldError>
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
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6D755F]" /> Loading...
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
                                                        <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", selectedVehicleId === "" ? "opacity-100" : "opacity-0")} />
                                                        <span className="text-slate-200">No vehicle</span>
                                                    </CommandItem>
                                                    {vehiclesDropdown.map((vehicle) => (
                                                        <CommandItem
                                                            key={vehicle.id}
                                                            value={`${vehicle.vehicleName} ${vehicle.vehicleNumber}`}
                                                            onSelect={() => {
                                                                setSelectedVehicleId(toId(vehicle.id));
                                                                setVehiclePopoverOpen(false);
                                                            }}
                                                            className="py-3 cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-3 h-4 w-4 text-[#6D755F]", toId(vehicle.id) === selectedVehicleId ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-200 dark:text-slate-100">{vehicle.vehicleName}</span>
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

                    <div className="flex flex-col gap-1.5">
                        <FieldLabel>Linked Activity (optional)</FieldLabel>
                        <Popover open={ccaPopoverOpen} onOpenChange={setCcaPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={ccaPopoverOpen}
                                    className={cn("w-full justify-between font-normal shadow-sm text-left px-3", fieldClass)}
                                >
                                    <span className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-200">
                                        <Activity className="h-3.5 w-3.5 shrink-0 text-[#6D755F]" />
                                        <span className="truncate">{selectedCCAActivity || "Not linked"}</span>
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                                <Command>
                                    <CommandInput placeholder="Search CCA activity..." />
                                    <CommandList>
                                        <CommandEmpty>No activities found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="none"
                                                onSelect={() => {
                                                    setSelectedCCAActivity("");
                                                    setCcaPopoverOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", selectedCCAActivity === "" ? "opacity-100" : "opacity-0")} />
                                                <span className="text-slate-600 dark:text-slate-400">Not linked</span>
                                            </CommandItem>
                                            {ccaActivities.map((act) => (
                                                <CommandItem
                                                    key={act.id}
                                                    value={act.name}
                                                    onSelect={() => {
                                                        setSelectedCCAActivity(act.name);
                                                        setCcaPopoverOpen(false);
                                                    }}
                                                    className="py-2.5 cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", selectedCCAActivity === act.name ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-slate-100">{act.name}</span>
                                                        <span className="text-[11px] text-slate-400">Default: ₹{act.defaultFee}/mo</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
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
                            <FieldLabel>Payment Accounts<span className="text-red-600 ml-0.5">*</span></FieldLabel>
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
                                const rowAccount = accountsDropdown.find((a) => toId(a.id) === row.accountId);
                                const rowError = paymentErrors[row.id];
                                return (
                                    <div key={row.id} className="flex flex-col gap-1">
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Popover
                                                open={openPaymentRowId === row.id}
                                                onOpenChange={(open) => handlePaymentPopoverChange(row.id, open)}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openPaymentRowId === row.id}
                                                        className={cn(
                                                            "h-10 flex-1 justify-between font-normal text-left px-3 border-slate-200 bg-white dark:bg-slate-950",
                                                            fieldClass,
                                                            rowError && fieldErrorClass
                                                        )}
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
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6D755F]" /> Loading...
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
                                                                                <Check className={cn("mr-2 h-4 w-4 text-[#6D755F]", toId(account.id) === row.accountId ? "opacity-100" : "opacity-0")} />
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
                                                step="0.01"
                                                min={0}
                                                placeholder="0.00"
                                                value={row.amount}
                                                onChange={(e) =>
                                                    updatePaymentAmount(row.id, e.target.value === "" ? "" : Number(e.target.value))
                                                }
                                                onWheel={(e) => e.currentTarget.blur()}
                                                className={cn(
                                                    "h-10 w-28 shrink-0 border-slate-200 bg-white dark:bg-slate-950",
                                                    fieldClass,
                                                    rowError && fieldErrorClass
                                                )}
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
                                        <FieldError>{rowError}</FieldError>
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

            {/* ── Right: review & submit panel ───────────────────────── */}
            <div
                className="flex w-full flex-col justify-between gap-6 p-6 text-white lg:w-[340px] lg:shrink-0 lg:p-8"
                style={{ backgroundColor: SAGE }}
            >
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-white/60">Amount</p>
                        <p className="mt-1 text-4xl font-bold tracking-tight">
                            {formatCurrency(Number(amount) || 0)}
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
                        <div className="flex items-center justify-between">
                            <span className="text-white/60">Staff</span>
                            <span className="font-medium">{selectedStaff ? selectedStaff.name : "—"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-white/15 pt-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">Allocated</span>
                            <span className="font-medium">
                                {formatCurrency(totalAllocated)} / {formatCurrency(Number(amount) || 0)}
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
                                    ? `${formatCurrency(remaining)} not yet allocated`
                                    : `${formatCurrency(Math.abs(remaining))} over the expense amount`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer select-none">
                        <Checkbox
                            checked={printAfterCreate}
                            onCheckedChange={(checked) => setPrintAfterCreate(checked === true)}
                            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-[#6D755F]"
                        />
                        {isEditMode ? "Print voucher after updating" : "Print voucher after creating"}
                    </label>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-11 w-full rounded-lg bg-white text-sm font-semibold text-slate-900 shadow-md hover:bg-white/90 disabled:opacity-50"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing
                            </span>
                        ) : isEditMode ? (
                            "Update Expense"
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