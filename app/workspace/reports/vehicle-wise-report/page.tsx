"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Bus,
    Calendar,
    Loader2,
    RefreshCcw,
    Search,
    TrendingDown,
    TrendingUp,
    User,
    Users,
    Wallet,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    getVehicleLists,
    getFinancialByVehicleReport,
    type Vehicle,
    type FinancialByVehicleData,
} from "@/lib/services/reports"; // <-- adjust to wherever you saved the API file

const BRAND = "#556043"; // Kidscove olive-green — same shade used across every report
const LOSS = "#b0524a"; // rust — reused from the shared accent palette for a loss state

const titleTextClass = "text-slate-950 dark:text-slate-100";
const supportingTextClass = "text-slate-700 dark:text-slate-300";

// Vehicles are dynamic, so instead of a lookup map we rotate the same small
// accent palette the Daily Collection and Expense By Category reports use —
// keeps every reports screen reading as one consistent product.
const ACCENT_PALETTE = [
    "#556043", // brand green
    "#3b6e91", // steel blue
    "#a8763e", // amber/bronze
    "#7a4a8f", // violet
    "#b0524a", // rust
];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function tomorrowISO() {
    const date = new Date();

    const indiaToday = new Date(
        date.toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
        })
    );

    indiaToday.setDate(indiaToday.getDate() + 1);

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(indiaToday);
}

function todayISO() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

// Groups the flat expenseBreakdown[] (category + subCategory + amount) into
// one entry per category, each carrying its subCategory rows and a running
// total — this is what feeds the Accordion.
interface GroupedCategory {
    category: string;
    total: number;
    items: { subCategory: string; amount: number }[];
}

function groupExpenseBreakdown(
    breakdown: FinancialByVehicleData["expenseBreakdown"]
): GroupedCategory[] {
    const map = new Map<string, GroupedCategory>();

    for (const item of breakdown ?? []) {
        const existing = map.get(item.category);
        if (existing) {
            existing.total += item.amount;
            existing.items.push({ subCategory: item.subCategory, amount: item.amount });
        } else {
            map.set(item.category, {
                category: item.category,
                total: item.amount,
                items: [{ subCategory: item.subCategory, amount: item.amount }],
            });
        }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export default function VehicleFinancialReportPage() {
    const router = useRouter();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehiclesError, setVehiclesError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Vehicle id currently selected on the left. The financial card on the
    // right is scoped to this, same relationship the Category/Sub Category
    // cards have on the Expense By Category report.
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    // Date range for the financial report — same pattern as the Daily
    // Collection Report page. Defaults to "today" on both ends.
    const [fromDate, setFromDate] = useState<string>(todayISO());
    const [toDate, setToDate] = useState<string>(todayISO());

    const [financial, setFinancial] = useState<FinancialByVehicleData | null>(null);
    const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);
    const [financialError, setFinancialError] = useState<string | null>(null);

    async function loadVehicles() {
        try {
            setIsLoadingVehicles(true);
            setVehiclesError(null);
            const data = await getVehicleLists();
            setVehicles(data);
        } catch {
            setVehiclesError("Could not load vehicles. Please try again.");
            setVehicles([]);
        } finally {
            setIsLoadingVehicles(false);
        }
    }

    useEffect(() => {
        loadVehicles();
    }, []);

    // Re-fetches every time the selected vehicle OR the date range changes,
    // so switching either always replaces (never merges with) the previous
    // numbers. Guards against an inverted range the same way Daily
    // Collection Report does.
    useEffect(() => {
        if (!selectedVehicleId) {
            setFinancial(null);
            return;
        }

        if (fromDate > toDate) return;

        let cancelled = false;

        async function loadFinancial(vehicleId: string, from: string, to: string) {
            try {
                setIsLoadingFinancial(true);
                setFinancialError(null);
                const data = await getFinancialByVehicleReport(vehicleId, from, to);
                if (!cancelled) setFinancial(data);
            } catch {
                if (!cancelled) {
                    setFinancialError("Could not load the financial report. Please try again.");
                    setFinancial(null);
                }
            } finally {
                if (!cancelled) setIsLoadingFinancial(false);
            }
        }

        loadFinancial(selectedVehicleId, fromDate, toDate);

        return () => {
            cancelled = true;
        };
    }, [selectedVehicleId, fromDate, toDate]);

    // Client-side filter by vehicle name, number, or driver. The endpoint
    // itself has no search param, so we narrow the already-fetched list.
    const filteredVehicles = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return vehicles;
        return vehicles.filter(
            (v) =>
                v.vehicleName.toLowerCase().includes(q) ||
                v.vehicleNumber.toLowerCase().includes(q) ||
                v.driverName.toLowerCase().includes(q)
        );
    }, [vehicles, search]);

    const selectedVehicle = useMemo(
        () => vehicles.find((v) => v.id === selectedVehicleId) ?? null,
        [vehicles, selectedVehicleId]
    );

    const groupedExpenses = useMemo(
        () => (financial ? groupExpenseBreakdown(financial.expenseBreakdown) : []),
        [financial]
    );

    const isProfit = (financial?.profit ?? 0) >= 0;
    const incomeExpenseTotal = (financial?.income ?? 0) + (financial?.expense ?? 0);
    const incomePct =
        incomeExpenseTotal > 0 ? Math.round(((financial?.income ?? 0) / incomeExpenseTotal) * 100) : 0;
    const expensePct =
        incomeExpenseTotal > 0 ? Math.round(((financial?.expense ?? 0) / incomeExpenseTotal) * 100) : 0;

    const isRangeInvalid = fromDate > toDate;

    function handleFromDateChange(value: string) {
        setFromDate(value);
        // Keep the range valid: pull "to" forward if it now precedes "from"
        if (value > toDate) setToDate(value);
    }

    function handleRefresh() {
        loadVehicles();
        if (selectedVehicleId && !isRangeInvalid) {
            setIsLoadingFinancial(true);
            getFinancialByVehicleReport(selectedVehicleId, fromDate, toDate)
                .then(setFinancial)
                .catch(() => setFinancialError("Could not load the financial report. Please try again."))
                .finally(() => setIsLoadingFinancial(false));
        }
    }

    return (
        <section className="w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 shrink-0"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                                Vehicle Financial Report
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                Income, expense &amp; profit per vehicle
                            </p>
                        </div>
                    </div>

                    {/* Date range picker — stacks on mobile, inline from tablet up */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-1 flex-col gap-2 xs:flex-row sm:flex-row">
                            <div className="relative w-full sm:w-40">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="date"
                                    aria-label="From date"
                                    value={fromDate}
                                    max={tomorrowISO()}
                                    onChange={(e) => handleFromDateChange(e.target.value)}
                                    className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
                                />
                            </div>

                            <div className="hidden shrink-0 items-center justify-center text-slate-400 sm:flex">
                                <ArrowRight className="h-4 w-4" />
                            </div>

                            <div className="relative w-full sm:w-40">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="date"
                                    aria-label="To date"
                                    value={toDate}
                                    min={fromDate}
                                    max={tomorrowISO()}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="h-10 rounded-lg pl-9 border-slate-300 dark:border-slate-700"
                                />
                            </div>
                        </div>

                        <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 shrink-0 self-end text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 sm:self-auto"
                            onClick={handleRefresh}
                            disabled={isLoadingVehicles || isLoadingFinancial || isRangeInvalid}
                        >
                            <RefreshCcw
                                className={`h-4 w-4 ${isLoadingVehicles || isLoadingFinancial ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Vehicles (left, narrower) + Financial overview (right, wider) —
                2/5 vs 3/5 split on large screens, each card scrolls internally. */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5 lg:h-[640px]">
                {/* ----------------------------------------------------- */}
                {/* Vehicles — full list on load, click to scope the       */}
                {/* financial card on the right.                           */}
                {/* ----------------------------------------------------- */}
                <Card className="flex flex-col bg-white shadow-md dark:bg-background lg:col-span-2 lg:h-full">
                    <CardHeader className="flex flex-col gap-3 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-[#556043]/10 shadow-sm">
                                <Bus className="h-4.5 w-4.5 text-[#556043] dark:text-emerald-300" />
                            </span>
                            <div>
                                <CardTitle className={`text-2xl font-semibold ${titleTextClass}`}>
                                    Vehicles
                                </CardTitle>
                                <CardDescription className={supportingTextClass}>
                                    Select a vehicle to see its financials.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search vehicle, number or driver..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 rounded-lg pl-9 pr-8 shadow-sm"
                            />
                            {search && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent
                        className="
                        space-y-3 pt-4 overflow-y-auto
                        max-h-[420px] lg:max-h-none lg:flex-1
                        scrollbar-thin
                        scrollbar-thumb-slate-300
                        scrollbar-track-transparent
                        hover:scrollbar-thumb-slate-400
                        dark:scrollbar-thumb-slate-700
                        dark:hover:scrollbar-thumb-slate-600
                    "
                    >
                        {isLoadingVehicles ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
                                <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                <p className="text-sm">Loading vehicles...</p>
                            </div>
                        ) : vehiclesError ? (
                            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-6 text-center shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                    {vehiclesError}
                                </p>
                            </div>
                        ) : vehicles.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-[#556043]/25 bg-[#556043]/5 px-5 py-6 text-center shadow-sm dark:border-emerald-400/25 dark:bg-emerald-400/10">
                                <p className={`text-sm font-medium ${titleTextClass}`}>No vehicles found</p>
                                <p className={`mt-1 text-sm ${supportingTextClass}`}>
                                    No active vehicles are set up yet.
                                </p>
                            </div>
                        ) : filteredVehicles.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center shadow-sm dark:border-white/10">
                                <p className={`text-sm font-medium ${titleTextClass}`}>
                                    No vehicles match &quot;{search}&quot;
                                </p>
                            </div>
                        ) : (
                            filteredVehicles.map((vehicle, i) => {
                                const isActive = vehicle.id === selectedVehicleId;
                                const accent = ACCENT_PALETTE[i % ACCENT_PALETTE.length];

                                return (
                                    <div
                                        key={vehicle.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedVehicleId(vehicle.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                setSelectedVehicleId(vehicle.id);
                                            }
                                        }}
                                        className={cn(
                                            "flex cursor-pointer items-center gap-3 rounded-xl border p-3 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#556043]/30",
                                            isActive
                                                ? "border-[#556043]/40 bg-[#556043]/[0.06] shadow-md dark:border-emerald-400/30 dark:bg-emerald-400/10"
                                                : "border-slate-100 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-white/[0.06]"
                                        )}
                                    >
                                        <span
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                                            style={{ backgroundColor: accent }}
                                        >
                                            <Bus className="h-4.5 w-4.5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="truncate text-sm font-semibold capitalize text-slate-950 dark:text-slate-100">
                                                    {vehicle.vehicleName}
                                                </span>
                                                <span className="shrink-0 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                                                    {vehicle.vehicleNumber}
                                                </span>
                                            </span>
                                            <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <User className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{vehicle.driverName}</span>
                                            </span>
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 gap-1 border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                        >
                                            <Users className="h-3 w-3" />
                                            {vehicle.totalStudents}
                                        </Badge>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                {/* ----------------------------------------------------- */}
                {/* Financial overview — scoped to the selected vehicle    */}
                {/* AND the selected date range.                            */}
                {/* ----------------------------------------------------- */}
                <Card className="flex flex-col bg-white shadow-md dark:bg-background lg:col-span-3 lg:h-full">
                    <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-[#556043]/10 shadow-sm">
                                <Wallet className="h-4.5 w-4.5 text-[#556043] dark:text-emerald-300" />
                            </span>
                            <div className="min-w-0">
                                <CardTitle className={`text-2xl font-semibold truncate ${titleTextClass}`}>
                                    {selectedVehicle ? selectedVehicle.vehicleName : "Financial Overview"}
                                </CardTitle>
                                <CardDescription className={`truncate ${supportingTextClass}`}>
                                    {selectedVehicle
                                        ? `${selectedVehicle.vehicleNumber} • ${selectedVehicle.driverName}`
                                        : "Please select a vehicle to see income, expense & profit."}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent
                        className="
                        space-y-4 pt-4 overflow-y-auto
                        max-h-[420px] lg:max-h-none lg:flex-1
                        scrollbar-thin
                        scrollbar-thumb-slate-300
                        scrollbar-track-transparent
                        hover:scrollbar-thumb-slate-400
                        dark:scrollbar-thumb-slate-700
                        dark:hover:scrollbar-thumb-slate-600
                    "
                    >
                        {!selectedVehicle ? (
                            <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center shadow-sm dark:border-white/10">
                                <Bus className="h-7 w-7 text-slate-300" />
                                <p className={`mt-2 text-sm font-medium ${titleTextClass}`}>
                                    Please select a vehicle
                                </p>
                                <p className={`mt-1 text-sm ${supportingTextClass}`}>
                                    Its income, expense and profit will show up here.
                                </p>
                            </div>
                        ) : isRangeInvalid ? (
                            <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 px-5 py-6 text-center shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                    The &quot;from&quot; date must be before the &quot;to&quot; date.
                                </p>
                            </div>
                        ) : isLoadingFinancial ? (
                            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 text-slate-500">
                                <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
                                <p className="text-sm">Loading financial report...</p>
                            </div>
                        ) : financialError ? (
                            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-6 text-center shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                    {financialError}
                                </p>
                            </div>
                        ) : financial ? (
                            <>
                                {/* Profit hero — brand green when in the black, rust
                                    when in the red, same gradient + glow treatment as
                                    the other reports' hero. */}
                                <div
                                    className="relative overflow-hidden rounded-2xl p-4 shadow-lg"
                                    style={{
                                        background: isProfit
                                            ? `linear-gradient(120deg, #3d4632 0%, ${BRAND} 55%, #6b7a55 100%)`
                                            : `linear-gradient(120deg, #5c2f2b 0%, ${LOSS} 55%, #c97c72 100%)`,
                                    }}
                                >
                                    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                                    <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

                                    <div className="relative">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                                                {isProfit ? (
                                                    <TrendingUp className="h-4 w-4 text-white" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-white" />
                                                )}
                                            </span>
                                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                                                {isProfit ? "Net Profit" : "Net Loss"}
                                            </p>
                                        </div>
                                        <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                            {formatCurrency(Math.abs(financial.profit))}
                                        </p>
                                        <p className="mt-1.5 text-xs text-white/70">
                                            {selectedVehicle.vehicleNumber} • {selectedVehicle.totalStudents} student
                                            {selectedVehicle.totalStudents === 1 ? "" : "s"}
                                        </p>
                                    </div>
                                </div>

                                {/* Income / Expense breakdown — same colored icon-circle
                                    + progress bar + % badge pattern as the other reports. */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 shadow-sm transition-all hover:shadow-md dark:border-slate-800/50">
                                        <span
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                                            style={{ backgroundColor: BRAND }}
                                        >
                                            <TrendingUp className="h-4.5 w-4.5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                    Income
                                                </span>
                                                <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                    {formatCurrency(financial.income)}
                                                </span>
                                            </span>
                                            <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <span
                                                    className="block h-full rounded-full transition-all"
                                                    style={{ width: `${incomePct}%`, backgroundColor: BRAND }}
                                                />
                                            </span>
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                        >
                                            {incomePct}%
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 shadow-sm transition-all hover:shadow-md dark:border-slate-800/50">
                                        <span
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                                            style={{ backgroundColor: LOSS }}
                                        >
                                            <TrendingDown className="h-4.5 w-4.5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                    Expense
                                                </span>
                                                <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                    {formatCurrency(financial.expense)}
                                                </span>
                                            </span>
                                            <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <span
                                                    className="block h-full rounded-full transition-all"
                                                    style={{ width: `${expensePct}%`, backgroundColor: LOSS }}
                                                />
                                            </span>
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                        >
                                            {expensePct}%
                                        </Badge>
                                    </div>
                                </div>

                                {/* Expense breakdown — plain shadcn Accordion, no
                                    "Expense Breakdown" header/wrapper card around it. */}
                                {groupedExpenses.length > 0 && (
                                    <Accordion
                                        type="multiple"
                                        className="rounded-xl border border-slate-100 px-1 shadow-sm dark:border-slate-800/50"
                                    >
                                        {groupedExpenses.map((group, i) => {
                                            const accent = ACCENT_PALETTE[i % ACCENT_PALETTE.length];
                                            return (
                                                <AccordionItem
                                                    key={group.category}
                                                    value={group.category}
                                                    className="border-slate-100 last:border-b-0 dark:border-slate-800/50"
                                                >
                                                    <AccordionTrigger className="px-2 py-3 hover:no-underline">
                                                        <span className="flex flex-1 items-center justify-between gap-2 pr-2">
                                                            <span className="flex items-center gap-2 min-w-0">
                                                                <span
                                                                    className="h-2 w-2 shrink-0 rounded-full"
                                                                    style={{ backgroundColor: accent }}
                                                                />
                                                                <span className="truncate text-sm font-medium capitalize text-slate-900 dark:text-slate-200">
                                                                    {group.category}
                                                                </span>
                                                            </span>
                                                            <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">
                                                                {formatCurrency(group.total)}
                                                            </span>
                                                        </span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-2 pb-2">
                                                        <div className="space-y-1.5 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/40">
                                                            {group.items.map((item, idx) => (
                                                                <div
                                                                    key={`${item.subCategory}-${idx}`}
                                                                    className="flex items-center justify-between gap-2 text-sm"
                                                                >
                                                                    <span className="truncate capitalize text-slate-600 dark:text-slate-400">
                                                                        {item.subCategory}
                                                                    </span>
                                                                    <span className="shrink-0 font-medium text-slate-800 dark:text-slate-200">
                                                                        {formatCurrency(item.amount)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                )}

                                {/* Totals footer */}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/50">
                                    <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                                        {isProfit ? "Net Profit" : "Net Loss"}
                                    </span>
                                    <span
                                        className="text-sm font-bold"
                                        style={{ color: isProfit ? BRAND : LOSS }}
                                    >
                                        {isProfit ? "+" : "−"}
                                        {formatCurrency(Math.abs(financial.profit))}
                                    </span>
                                </div>
                            </>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}