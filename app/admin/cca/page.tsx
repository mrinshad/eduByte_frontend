"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Calendar,
  Check,
  ChevronsUpDown,
  Loader2,
  ArrowLeft,
  X,
  Sparkles,
  Info,
  ShieldCheck,
  GraduationCap,
  Ban,
  Tag,
  Wallet,
  IndianRupee,
  Layers,
  Award,
  CalendarDays,
  FileSpreadsheet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatCurrency } from "@/lib/utils";

import {
  getCCAActivities,
  createCCAActivity,
  updateCCAActivity,
  deleteCCAActivity,
  getCCAStudentAllocations,
  assignStudentToCCAActivities,
  dropCCAAssignment,
  deleteCCAAssignment,
  getMonthName,
  type CCAActivity,
  type CCAStudentAllocation,
} from "@/lib/services/cca";
import { getNonPayment, type accountName } from "@/lib/services/accountTypes";
import { getStudentAdmissions, type BackendAdmission } from "@/lib/services/admissions";
import { getClasses, type SchoolClass } from "@/lib/services/class";

export default function CCAManagementPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"activities" | "allocations">("activities");

  // ── Activities State ──────────────────────────────────────────────────────
  const [activities, setActivities] = useState<CCAActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>("ALL");
  const [accounts, setAccounts] = useState<accountName[]>([]);

  // Activity Modal State
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<{
    name: string;
    code: string;
    defaultFee: number | "";
    frequency: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME";
    incomeAccountId: string;
    description: string;
    inCharge: string;
    status: "ACTIVE" | "INACTIVE";
  }>({
    name: "",
    code: "",
    defaultFee: 500,
    frequency: "MONTHLY",
    incomeAccountId: "",
    description: "",
    inCharge: "",
    status: "ACTIVE",
  });
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<CCAActivity | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  // ── Student Allocations State ─────────────────────────────────────────────
  const [allocations, setAllocations] = useState<CCAStudentAllocation[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(true);
  const [allAdmissions, setAllAdmissions] = useState<BackendAdmission[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  // Allocations Filters
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DROPPED">("ALL");

  // Assign Student Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
  const [selectedStudentAdmissionId, setSelectedStudentAdmissionId] = useState<string>("");
  const [selectedAssignConfigs, setSelectedAssignConfigs] = useState<
    Array<{
      activityId: string;
      name: string;
      fee: number;
      frequency: string;
      startDate: string;
      endDate: string;
      discountAmount: number | "";
    }>
  >([]);
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);

  // Drop / Delete Action States
  const [assignmentToDrop, setAssignmentToDrop] = useState<{ id: string; studentName: string; activityName: string } | null>(null);
  const [isDroppingAssignment, setIsDroppingAssignment] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<{ id: string; studentName: string; activityName: string } | null>(null);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────────────
  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const data = await getCCAActivities();
      setActivities(data);
    } catch (err: any) {
      console.error("Failed to load CCA activities:", err);
      toast.error(err.message || "Failed to load CCA activities");
    } finally {
      setActivitiesLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const accList = await getNonPayment();
      setAccounts(accList || []);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    }
  };

  const loadAllocations = async () => {
    try {
      setAllocationsLoading(true);
      const data = await getCCAStudentAllocations();
      setAllocations(data || []);
    } catch (err) {
      console.error("Failed to load allocations:", err);
    } finally {
      setAllocationsLoading(false);
    }
  };

  const loadAdmissionsAndClasses = async () => {
    try {
      const [admRes, clsRes] = await Promise.all([
        getStudentAdmissions({ page: 1, limit: 500 }),
        getClasses(),
      ]);
      setAllAdmissions(admRes.items || []);
      setClasses(clsRes || []);
    } catch (err) {
      console.error("Failed to load admissions or classes:", err);
    }
  };

  useEffect(() => {
    loadActivities();
    loadAccounts();
    loadAllocations();
    loadAdmissionsAndClasses();
  }, []);

  // ── Stats Computations ───────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalActivities = activities.length;
    const activeActivities = activities.filter((a) => a.status === "ACTIVE").length;
    const totalEnrolledStudents = allocations.length;
    const totalMonthlyValue = allocations.reduce((sum, al) => {
      const studentTotal = (al.activities || []).reduce((sub, act) => sub + (act.monthlyFee || 0), 0);
      const discount = Number(al.discountAmount || 0);
      return sum + Math.max(0, studentTotal - discount);
    }, 0);

    return {
      totalActivities,
      activeActivities,
      totalEnrolledStudents,
      totalMonthlyValue,
    };
  }, [activities, allocations]);

  // ── Filtered Activities ───────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchSearch =
        !activitySearch.trim() ||
        (act.name && act.name.toLowerCase().includes(activitySearch.toLowerCase())) ||
        (act.code && act.code.toLowerCase().includes(activitySearch.toLowerCase())) ||
        (act.incomeAccountName && act.incomeAccountName.toLowerCase().includes(activitySearch.toLowerCase()));

      const matchStatus =
        activityStatusFilter === "ALL" || act.status === activityStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [activities, activitySearch, activityStatusFilter]);

  // ── Filtered Allocations ──────────────────────────────────────────────────
  const filteredAllocations = useMemo(() => {
    return allocations.filter((item) => {
      const matchSearch =
        !search.trim() ||
        (item.studentName && item.studentName.toLowerCase().includes(search.toLowerCase())) ||
        (item.admissionNumber && item.admissionNumber.toLowerCase().includes(search.toLowerCase())) ||
        (item.parentPhone && item.parentPhone.includes(search));

      const matchActivity =
        activityFilter === "all" ||
        item.activities?.some(
          (a) =>
            a.chargeTypeId === activityFilter ||
            (a.activityName && a.activityName.toLowerCase() === activityFilter.toLowerCase())
        );

      const matchClass =
        classFilter === "all" ||
        (item.class && item.class !== "—" && item.class.toLowerCase() === classFilter.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && item.status !== "DROPPED" && item.status !== "INACTIVE") ||
        (statusFilter === "DROPPED" && item.status === "DROPPED");

      return matchSearch && matchActivity && matchClass && matchStatus;
    });
  }, [allocations, search, activityFilter, classFilter, statusFilter]);

  // ── Selected Student Object for Modal ─────────────────────────────────────
  const selectedStudentObj = useMemo(() => {
    return allAdmissions.find((a) => a.id === selectedStudentAdmissionId);
  }, [allAdmissions, selectedStudentAdmissionId]);

  // ── Modal Fee Calculations ────────────────────────────────────────────────
  const modalFeeSummary = useMemo(() => {
    const grossFee = selectedAssignConfigs.reduce(
      (sum, item) => sum + (Number(item.fee) || 0),
      0
    );
    const discount = selectedAssignConfigs.reduce(
      (sum, item) => sum + (item.discountAmount !== "" ? Number(item.discountAmount) : 0),
      0
    );
    const netFee = Math.max(0, grossFee - discount);
    return { grossFee, discount, netFee, count: selectedAssignConfigs.length };
  }, [selectedAssignConfigs]);

  // ── Activity Actions ──────────────────────────────────────────────────────
  const handleOpenAddActivity = () => {
    setEditingActivityId(null);
    setActivityForm({
      name: "",
      code: "",
      defaultFee: 500,
      frequency: "MONTHLY",
      incomeAccountId: accounts[0]?.id || "",
      description: "",
      inCharge: "",
      status: "ACTIVE",
    });
    setActivityModalOpen(true);
  };

  const handleOpenEditActivity = (act: CCAActivity) => {
    setEditingActivityId(act.id);
    setActivityForm({
      name: act.name,
      code: act.code || "",
      defaultFee: act.defaultFee || Number(act.feeAmount) || 0,
      frequency:
        (act.frequency as "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME") || "MONTHLY",
      incomeAccountId: act.incomeAccountId || "",
      description: act.description || "",
      inCharge: act.inCharge || "",
      status: (act.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    });
    setActivityModalOpen(true);
  };

  const handleSaveActivity = async () => {
    if (!activityForm.name.trim()) {
      toast.error("Please enter the activity name");
      return;
    }
    if (activityForm.defaultFee === "" || Number(activityForm.defaultFee) < 0) {
      toast.error("Please enter a valid default fee");
      return;
    }

    try {
      setIsSavingActivity(true);
      if (editingActivityId) {
        await updateCCAActivity(editingActivityId, {
          name: activityForm.name.trim(),
          code: activityForm.code ? activityForm.code.trim().toUpperCase() : null,
          feeAmount: Number(activityForm.defaultFee),
          frequency: activityForm.frequency,
          incomeAccountId: activityForm.incomeAccountId || null,
          description: activityForm.description ? activityForm.description.trim() : null,
          status: activityForm.status,
        });
        toast.success("CCA Activity updated successfully");
      } else {
        await createCCAActivity({
          name: activityForm.name.trim(),
          code: activityForm.code ? activityForm.code.trim().toUpperCase() : undefined,
          feeAmount: Number(activityForm.defaultFee),
          frequency: activityForm.frequency,
          incomeAccountId: activityForm.incomeAccountId || undefined,
          description: activityForm.description ? activityForm.description.trim() : undefined,
        });
        toast.success("CCA Activity created successfully");
      }
      setActivityModalOpen(false);
      await loadActivities();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save activity");
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    try {
      setIsDeletingActivity(true);
      await deleteCCAActivity(activityToDelete.id);
      toast.success("Activity removed successfully");
      setActivityToDelete(null);
      await loadActivities();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete activity");
    } finally {
      setIsDeletingActivity(false);
    }
  };

  // ── Allocation Actions ────────────────────────────────────────────────────
  const handleOpenAssignStudent = () => {
    setSelectedStudentAdmissionId("");
    setSelectedAssignConfigs([]);
    setAssignModalOpen(true);
  };

  const handleToggleAssignActivity = (act: CCAActivity) => {
    setSelectedAssignConfigs((prev) => {
      const exists = prev.some((item) => item.activityId === act.id);
      if (exists) {
        return prev.filter((item) => item.activityId !== act.id);
      } else {
        return [
          ...prev,
          {
            activityId: act.id,
            name: act.name,
            fee: act.defaultFee || Number(act.feeAmount) || 0,
            frequency: act.frequency || "MONTHLY",
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            discountAmount: "",
          },
        ];
      }
    });
  };

  const handleUpdateAssignItem = (
    activityId: string,
    field: "startDate" | "endDate" | "discountAmount",
    value: any
  ) => {
    setSelectedAssignConfigs((prev) =>
      prev.map((item) => (item.activityId === activityId ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveAssignItem = (activityId: string) => {
    setSelectedAssignConfigs((prev) => prev.filter((item) => item.activityId !== activityId));
  };

  const handleSaveAllocation = async () => {
    if (!selectedStudentAdmissionId || !selectedStudentObj) {
      toast.error("Please select a valid student");
      return;
    }
    if (selectedAssignConfigs.length === 0) {
      toast.error("Please select at least one CCA activity");
      return;
    }

    try {
      setIsSavingAllocation(true);
      const studentId = selectedStudentObj.studentId || selectedStudentAdmissionId;

      for (const config of selectedAssignConfigs) {
        const payload = {
          studentId,
          ccaActivityIds: [config.activityId],
          startDate: config.startDate || new Date().toISOString().split("T")[0],
          endDate: config.endDate ? config.endDate : undefined,
          discountAmount: config.discountAmount !== "" ? Number(config.discountAmount) : undefined,
        };

        console.log(`Submitting CCA Assignment for ${config.name}:`, payload);
        await assignStudentToCCAActivities(payload);
      }

      toast.success("Student successfully assigned to CCA activities");
      setAssignModalOpen(false);
      await loadAllocations();
      await loadActivities();
    } catch (err: any) {
      console.error("Assignment submission error:", err);
      toast.error(err.message || "Failed to save student assignment");
    } finally {
      setIsSavingAllocation(false);
    }
  };

  const handleExecuteDrop = async () => {
    if (!assignmentToDrop) return;
    try {
      setIsDroppingAssignment(true);
      await dropCCAAssignment(assignmentToDrop.id);
      toast.success(`Student dropped from ${assignmentToDrop.activityName}`);
      setAssignmentToDrop(null);
      await loadAllocations();
    } catch (err: any) {
      console.error("Failed to drop assignment:", err);
      toast.error(err.message || "Failed to drop assignment");
    } finally {
      setIsDroppingAssignment(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      setIsDeletingAssignment(true);
      await deleteCCAAssignment(assignmentToDelete.id);
      toast.success(`Assignment removed from ${assignmentToDelete.activityName}`);
      setAssignmentToDelete(null);
      await loadAllocations();
    } catch (err: any) {
      console.error("Failed to delete assignment:", err);
      toast.error(err.message || "Failed to delete assignment");
    } finally {
      setIsDeletingAssignment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 dark:bg-slate-950 font-sans space-y-6 animate-in fade-in duration-300">
      {/* ── Top Breadcrumb & Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-7 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold uppercase tracking-wider text-[#6D755F] dark:text-[#8d967d]">
              Co-Curricular Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D755F]/15 text-[#6D755F] dark:bg-[#6D755F]/25">
              <Activity className="h-6 w-6" />
            </span>
            Co-Curricular Activities (CCA)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure extra-curricular master catalog, link designated income accounts, and manage student activity assignments with custom start dates and discounts.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/workspace/reports/cca-report")}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 text-xs h-9"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-[#6D755F]" /> CCA Financial Report
          </Button>

          {activeTab === "activities" ? (
            <Button
              onClick={handleOpenAddActivity}
              className="bg-[#6D755F] hover:bg-[#5b624f] text-white shadow-sm font-medium text-xs h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add CCA Activity
            </Button>
          ) : (
            <Button
              onClick={handleOpenAssignStudent}
              className="bg-[#6D755F] hover:bg-[#5b624f] text-white shadow-sm font-medium text-xs h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Assign Student
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary Metric Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6D755F]/10 text-[#6D755F] dark:bg-[#6D755F]/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Total Activities
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {metrics.totalActivities}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium block">
                {metrics.activeActivities} Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Assigned Students
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {metrics.totalEnrolledStudents}
              </span>
              <span className="text-[10px] text-slate-400 block">Across all batches</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Monthly CCA Value
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                ₹{metrics.totalMonthlyValue.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">Projected monthly fee</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Income Accounts
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {accounts.length}
              </span>
              <span className="text-[10px] text-slate-400 block">Ledger destinations</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("activities")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
            activeTab === "activities"
              ? "bg-white text-[#6D755F] shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <Activity className="h-4 w-4" /> 1. Activity Catalog ({activities.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("allocations")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
            activeTab === "allocations"
              ? "bg-white text-[#6D755F] shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <Users className="h-4 w-4" /> 2. Student Allocations ({allocations.length})
        </button>
      </div>

      {activeTab === "activities" ? (
        /* ── TAB 1: ACTIVITIES SETUP ────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search activity name, code, account..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Select value={activityStatusFilter} onValueChange={setActivityStatusFilter}>
                <SelectTrigger className="h-9 w-[130px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {(activitySearch || activityStatusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActivitySearch("");
                    setActivityStatusFilter("ALL");
                  }}
                  className="h-9 text-xs text-slate-500 hover:text-slate-900"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Master CCA Activities Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Configure default fees and income accounts. Activities automatically link to student fee ledgers.
                </p>
              </div>
            </div>

            {activitiesLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#6D755F]" />
                <span className="text-sm font-medium">Loading CCA activities...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                  No CCA activities found.
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add activities such as Swimming, Karate, Robotics, Football, or Dance to get started.
                </p>
                <Button
                  onClick={handleOpenAddActivity}
                  className="mt-4 bg-[#6D755F] hover:bg-[#5b624f] text-white text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Activity
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Activity Name
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Code
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Fee Account
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Default Fee
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Billing Frequency
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Status
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Description
                      </TableHead>
                      <TableHead className="pr-6 text-right text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((act) => (
                      <TableRow
                        key={act.id}
                        className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      >
                        <TableCell className="pl-6 font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D755F]/10 text-[#6D755F] dark:bg-[#6D755F]/20">
                              <Activity className="h-4 w-4" />
                            </span>
                            <span>{act.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {act.code ? (
                            <Badge
                              variant="outline"
                              className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                            >
                              {act.code}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-medium text-slate-600 dark:text-slate-300"
                          >
                            {act.incomeAccount?.name || act.incomeAccountName || "General Income Account"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            ₹{(act.defaultFee || Number(act.feeAmount) || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                            {act.frequency || "MONTHLY"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-[11px] font-medium",
                              act.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}
                          >
                            {act.status || "ACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-slate-500">
                          {act.description || "—"}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditActivity(act)}
                              className="h-8 w-8 text-slate-500 hover:text-[#6D755F] hover:bg-[#6D755F]/10"
                              title="Edit Activity"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setActivityToDelete(act)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete Activity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── TAB 2: STUDENT ALLOCATIONS ─────────────────────────────────────── */
        <div className="space-y-4">
          {/* Policy Note Alert */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 shadow-sm">
            <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold">Dedicated Student Assignment API:</span> Students can be assigned to multiple CCA activities with custom start dates and optional discounts. Use the <strong className="font-semibold">Drop</strong> action to terminate active participation while preserving historic fee ledgers.
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student name, admission #, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="h-9 w-[130px] text-xs">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(val: "ALL" | "ACTIVE" | "DROPPED") => setStatusFilter(val)}
              >
                <SelectTrigger className="h-9 w-[120px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DROPPED">Dropped</SelectItem>
                </SelectContent>
              </Select>

              {(search || activityFilter !== "all" || classFilter !== "all" || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setActivityFilter("all");
                    setClassFilter("all");
                    setStatusFilter("ALL");
                  }}
                  className="h-9 text-xs text-slate-500 hover:text-slate-900"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Allocations Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
            {allocationsLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#6D755F]" />
                <span className="text-sm font-medium">Loading student allocations...</span>
              </div>
            ) : filteredAllocations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                  No student allocations found.
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click "+ Assign Student" to allocate active students to CCA activities with start dates and discounts.
                </p>
                <Button
                  onClick={handleOpenAssignStudent}
                  className="mt-4 bg-[#6D755F] hover:bg-[#5b624f] text-white text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Assign First Student
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Student Info
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Class & Div
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Assigned Activities
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Start / End Date
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Discount / Net Fee
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Parent Contact
                      </TableHead>
                      <TableHead className="pr-6 text-right text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllocations.map((item) => {
                      const totalGross = (item.activities || []).reduce((s, a) => s + (a.monthlyFee || 0), 0);
                      const discount = Number(item.discountAmount || 0);
                      const net = Math.max(0, totalGross - discount);

                      return (
                        <TableRow
                          key={item.id}
                          className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        >
                          <TableCell className="pl-6 font-medium text-slate-900 dark:text-slate-100">
                            <div>
                              <span className="font-semibold block text-sm">{item.studentName}</span>
                              <span className="text-xs text-slate-400 font-mono">
                                Adm: {item.admissionNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-medium text-slate-700 dark:text-slate-300"
                            >
                              {item.class} {item.division ? ` - ${item.division}` : ""}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.activities.map((a) => (
                                <Badge
                                  key={a.chargeTypeId}
                                  className={cn(
                                    "border-none text-[11px] font-medium",
                                    item.status === "DROPPED"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                      : item.status === "INACTIVE"
                                      ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                      : "bg-[#6D755F]/15 text-[#6D755F] dark:bg-[#6D755F]/25 dark:text-[#9ea98a]"
                                  )}
                                >
                                  {a.activityName} {a.monthlyFee > 0 ? `(₹${a.monthlyFee}/mo)` : ""}
                                </Badge>
                              ))}
                              {item.status === "DROPPED" && (
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                                  Dropped
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs text-slate-600 dark:text-slate-300">
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {item.startDate || item.activities[0]?.startDate || item.activities[0]?.startMonthName || "Month 1 (June)"}
                              </span>
                              {(item.endDate || item.activities[0]?.endDate) && (
                                <span className="text-[10px] text-slate-400">
                                  Until: {item.endDate || item.activities[0]?.endDate}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                ₹{net.toLocaleString()} / mo
                              </span>
                              {discount > 0 && (
                                <span className="text-[10px] text-emerald-600 font-semibold">
                                  Disc: −₹{discount}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">
                            {item.parentPhone || item.parentWhatsApp || "—"}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setAssignmentToDrop({
                                    id: item.assignmentId || item.id,
                                    studentName: item.studentName,
                                    activityName: item.activities.map((a) => a.activityName).join(", "),
                                  })
                                }
                                className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-medium"
                                title="Drop Student from CCA"
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" /> Drop
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setAssignmentToDelete({
                                    id: item.assignmentId || item.id,
                                    studentName: item.studentName,
                                    activityName: item.activities.map((a) => a.activityName).join(", "),
                                  })
                                }
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                title="Delete Assignment"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT ACTIVITY DIALOG ──────────────────────────────────── */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingActivityId ? "Edit CCA Activity" : "Add Co-Curricular Activity"}
            </DialogTitle>
            <DialogDescription>
              Assign the activity to an income account and specify its default fee rate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Activity Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Swimming, Karate, KungFu, Robotics"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Code
                </label>
                <Input
                  placeholder="e.g. KGF"
                  value={activityForm.code}
                  onChange={(e) =>
                    setActivityForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  className="h-10 font-mono uppercase text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fee Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="500"
                    value={activityForm.defaultFee}
                    onChange={(e) =>
                      setActivityForm((prev) => ({
                        ...prev,
                        defaultFee: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="pl-7 h-10 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Billing Frequency
                </label>
                <Select
                  value={activityForm.frequency}
                  onValueChange={(val: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME") =>
                    setActivityForm((prev) => ({ ...prev, frequency: val }))
                  }
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">MONTHLY</SelectItem>
                    <SelectItem value="QUARTERLY">QUARTERLY</SelectItem>
                    <SelectItem value="ANNUAL">ANNUAL</SelectItem>
                    <SelectItem value="ONE_TIME">ONE_TIME</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Income Account
              </label>
              <Select
                value={activityForm.incomeAccountId}
                onValueChange={(val) => setActivityForm((prev) => ({ ...prev, incomeAccountId: val }))}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status
              </label>
              <Select
                value={activityForm.status}
                onValueChange={(val: "ACTIVE" | "INACTIVE") =>
                  setActivityForm((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description / Notes (Optional)
              </label>
              <Input
                placeholder="Brief description of training sessions, coach, or equipment..."
                value={activityForm.description}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
                className="h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSaveActivity}
              disabled={isSavingActivity}
              className="bg-[#6D755F] hover:bg-[#5b624f] text-white text-xs"
            >
              {isSavingActivity ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                </>
              ) : editingActivityId ? (
                "Update Activity"
              ) : (
                "Create Activity"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN STUDENT DIALOG ─────────────────────────────────────────── */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#6D755F]" /> Assign Student to CCA Activities
            </DialogTitle>
            <DialogDescription>
              Select an active student, choose one or multiple CCA activities, set the billing start date, optional end date, and discount amount.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Student Search & Select */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Select Active Student <span className="text-red-500">*</span>
              </label>
              <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal text-left h-10 text-xs rounded-xl"
                  >
                    {selectedStudentObj
                      ? `[${selectedStudentObj.admissionNumber}] ${selectedStudentObj.studentName} (${selectedStudentObj.class})`
                      : "Search and choose student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-800" align="start">
                  <Command>
                    <CommandInput placeholder="Search student name or admission #..." className="text-xs" />
                    <CommandList>
                      <CommandEmpty>No matching active students found.</CommandEmpty>
                      <CommandGroup className="max-h-56 overflow-y-auto">
                        {allAdmissions.map((adm) => (
                          <CommandItem
                            key={adm.id}
                            value={`${adm.admissionNumber} ${adm.studentName} ${adm.class}`}
                            onSelect={() => {
                              setSelectedStudentAdmissionId(adm.id);
                              setStudentPopoverOpen(false);
                            }}
                            className="cursor-pointer py-2"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-[#6D755F]",
                                selectedStudentAdmissionId === adm.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-slate-900 dark:text-slate-100">
                                {adm.studentName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                Adm: {adm.admissionNumber} | Class: {adm.class} {adm.division}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Activities Checkboxes */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                Choose CCA Activities <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {activities.map((act) => {
                  const isChecked = selectedAssignConfigs.some((c) => c.activityId === act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => handleToggleAssignActivity(act)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border-2 transition-all cursor-pointer",
                        isChecked
                          ? "border-[#6D755F] bg-[#6D755F]/10 dark:bg-[#6D755F]/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                      )}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Checkbox
                          checked={isChecked}
                          className="data-[state=checked]:bg-[#6D755F] data-[state=checked]:border-[#6D755F]"
                        />
                        <div>
                          <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                            {act.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ₹{(act.defaultFee || Number(act.feeAmount) || 0).toLocaleString()} / {act.frequency || "MONTHLY"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-Activity Configuration Table */}
            {selectedAssignConfigs.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Configured CCA Allocations ({selectedAssignConfigs.length})
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Configure separate start dates, end dates, and discounts per activity.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-56">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                        <TableHead className="pl-4 text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[120px]">
                          Activity
                        </TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[130px]">
                          Start Date *
                        </TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[130px]">
                          End Date
                        </TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[110px]">
                          Discount (₹)
                        </TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[100px]">
                          Net Rate
                        </TableHead>
                        <TableHead className="pr-4 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500 w-[40px]">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAssignConfigs.map((item) => {
                        const disc = item.discountAmount !== "" ? Number(item.discountAmount) : 0;
                        const net = Math.max(0, item.fee - disc);
                        return (
                          <TableRow
                            key={item.activityId}
                            className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                          >
                            <TableCell className="pl-4 font-semibold text-xs text-slate-900 dark:text-slate-100">
                              <div className="flex flex-col">
                                <span>{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ₹{item.fee.toLocaleString()} / {item.frequency || "Month"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={item.startDate}
                                onChange={(e) =>
                                  handleUpdateAssignItem(item.activityId, "startDate", e.target.value)
                                }
                                className="h-8 text-xs rounded-lg"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={item.endDate}
                                onChange={(e) =>
                                  handleUpdateAssignItem(item.activityId, "endDate", e.target.value)
                                }
                                className="h-8 text-xs rounded-lg"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="0"
                                  value={item.discountAmount}
                                  onChange={(e) =>
                                    handleUpdateAssignItem(
                                      item.activityId,
                                      "discountAmount",
                                      e.target.value === "" ? "" : Number(e.target.value)
                                    )
                                  }
                                  className="pl-5 h-8 text-xs rounded-lg"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-xs text-[#6D755F] dark:text-[#9ea98a]">
                              ₹{net.toLocaleString()}
                            </TableCell>
                            <TableCell className="pr-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                onClick={() => handleRemoveAssignItem(item.activityId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-4 py-2.5 text-xs gap-2">
                  <span className="text-slate-500">
                    Selected {selectedAssignConfigs.length} Activities &bull; Gross: ₹{modalFeeSummary.grossFee.toLocaleString()}
                    {modalFeeSummary.discount > 0 && ` | Discount: −₹${modalFeeSummary.discount.toLocaleString()}`}
                  </span>
                  <span className="font-bold text-sm text-[#6D755F] dark:text-[#9ea98a]">
                    Net Monthly: ₹{modalFeeSummary.netFee.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSaveAllocation}
              disabled={isSavingAllocation}
              className="bg-[#6D755F] hover:bg-[#5b624f] text-white text-xs"
            >
              {isSavingAllocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Assigning...
                </>
              ) : (
                "Save & Assign Student"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DROP CONFIRMATION DIALOG ───────────────────────────────────────── */}
      <AlertDialog open={!!assignmentToDrop} onOpenChange={(open) => !open && setAssignmentToDrop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <Ban className="h-5 w-5" /> Drop Student from CCA?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to drop <strong>{assignmentToDrop?.studentName}</strong> from{" "}
              <strong>{assignmentToDrop?.activityName}</strong>? The student's participation will be closed with end date set to today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteDrop}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isDroppingAssignment ? "Dropping..." : "Confirm Drop"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── DELETE ASSIGNMENT DIALOG ───────────────────────────────────────── */}
      <AlertDialog open={!!assignmentToDelete} onOpenChange={(open) => !open && setAssignmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Remove CCA Assignment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to completely remove <strong>{assignmentToDelete?.studentName}</strong>'s allocation for{" "}
              <strong>{assignmentToDelete?.activityName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingAssignment ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── DELETE ACTIVITY MASTER DIALOG ──────────────────────────────────── */}
      <AlertDialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete CCA Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{activityToDelete?.name}</strong>? This activity will be removed
              from the master catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingActivity ? "Deleting..." : "Yes, Delete Activity"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

