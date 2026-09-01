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
  getCCAAssignments,
  assignStudentToCCAActivities,
  bulkAssignStudentToCCAActivity,
  updateCCAAssignment,
  dropCCAAssignment,
  deleteCCAAssignment,
  type CCAActivity,
  type CCAAssignmentItem,
} from "@/lib/services/cca";
import { getNonPayment, type accountName } from "@/lib/services/accountTypes";
import { getStudentAdmissions, type BackendAdmission } from "@/lib/services/admissions";
import { getClasses, type SchoolClass } from "@/lib/services/class";
import { useCurrentAcademicYear } from "@/lib/academic-year-store";

export default function CCAManagementPage() {
  const router = useRouter();
  const currentAcademicYear = useCurrentAcademicYear();

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
    status: "ACTIVE" | "INACTIVE";
  }>({
    name: "",
    code: "",
    defaultFee: 500,
    frequency: "MONTHLY",
    incomeAccountId: "",
    description: "",
    status: "ACTIVE",
  });
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<CCAActivity | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  // ── Student Allocations State ─────────────────────────────────────────────
  const [allocations, setAllocations] = useState<CCAAssignmentItem[]>([]);
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

  // Bulk Assign Modal State
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkActivityId, setBulkActivityId] = useState("");
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkDivision, setBulkDivision] = useState("all");
  const [bulkStartDate, setBulkStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkDiscount, setBulkDiscount] = useState<number | "">(0);
  const [bulkSelectedStudentIds, setBulkSelectedStudentIds] = useState<string[]>([]);
  const [isSavingBulkAssign, setIsSavingBulkAssign] = useState(false);

  // Edit Assignment Modal State
  const [editingAssignment, setEditingAssignment] = useState<{
    id: string;
    studentName: string;
    admissionNumber: string;
    activityName: string;
    feeAmount: number | "";
    frequency: string;
    startDate: string;
    endDate: string;
    discountAmount: number | "";
  } | null>(null);
  const [isSavingEditAssignment, setIsSavingEditAssignment] = useState(false);

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
      const data = await getCCAAssignments({ limit: 500 });
      setAllocations(data.ccaAssignments || []);
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
  }, [currentAcademicYear]);


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
        item.ccaActivityId === activityFilter ||
        (item.activityName && item.activityName.toLowerCase() === activityFilter.toLowerCase());

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

  // ── Bulk Allocation Actions ───────────────────────────────────────────────
  const bulkClassStudents = useMemo(() => {
    if (!bulkClassId) return [];
    return allAdmissions.filter((adm) => {
      const classMatch = adm.class?.toLowerCase() === bulkClassId.toLowerCase();
      if (!classMatch) return false;
      if (bulkDivision !== "all") {
        return adm.division?.toLowerCase() === bulkDivision.toLowerCase();
      }
      return true;
    });
  }, [allAdmissions, bulkClassId, bulkDivision]);

  const availableDivisions = useMemo(() => {
    if (!bulkClassId) return [];
    const divs = new Set<string>();
    allAdmissions.forEach((adm) => {
      if (adm.class?.toLowerCase() === bulkClassId.toLowerCase() && adm.division) {
        divs.add(adm.division);
      }
    });
    return Array.from(divs).sort();
  }, [allAdmissions, bulkClassId]);

  const isAlreadyEnrolled = (studentAdmissionNo: string) => {
    if (!bulkActivityId) return false;
    const targetActivity = activities.find((a) => a.id === bulkActivityId);
    return allocations.some(
      (alloc) =>
        alloc.admissionNumber === studentAdmissionNo &&
        (alloc.ccaActivityId === bulkActivityId || (targetActivity && alloc.activityName === targetActivity.name)) &&
        alloc.status === "ACTIVE"
    );
  };

  const handleOpenBulkAssign = () => {
    const firstActiveActivity = activities.find((a) => a.status === "ACTIVE");
    setBulkActivityId(firstActiveActivity ? firstActiveActivity.id : activities[0]?.id || "");
    setBulkClassId(classes[0] ? classes[0].name : "");
    setBulkDivision("all");
    setBulkStartDate(new Date().toISOString().split("T")[0]);
    setBulkEndDate("");
    setBulkDiscount(0);
    setBulkSelectedStudentIds([]);
    setBulkAssignModalOpen(true);
  };

  const handleSelectAllStudents = () => {
    const eligibleStudentIds = bulkClassStudents
      .filter((adm) => !isAlreadyEnrolled(adm.admissionNumber || ""))
      .map((adm) => adm.studentId);

    if (bulkSelectedStudentIds.length === eligibleStudentIds.length && eligibleStudentIds.length > 0) {
      setBulkSelectedStudentIds([]);
    } else {
      setBulkSelectedStudentIds(eligibleStudentIds);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setBulkSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSaveBulkAssign = async () => {
    if (!bulkActivityId) {
      toast.error("Please select a CCA activity.");
      return;
    }
    if (!bulkClassId) {
      toast.error("Please select a class.");
      return;
    }
    if (bulkSelectedStudentIds.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }
    if (!bulkStartDate) {
      toast.error("Please select a start date.");
      return;
    }

    try {
      setIsSavingBulkAssign(true);
      const res = await bulkAssignStudentToCCAActivity({
        ccaActivityId: bulkActivityId,
        studentIds: bulkSelectedStudentIds,
        startDate: bulkStartDate,
        endDate: bulkEndDate || null,
        discountAmount: bulkDiscount === "" ? 0 : Number(bulkDiscount),
      });

      toast.success(res.message || `Successfully assigned ${bulkSelectedStudentIds.length} student(s).`);
      setBulkAssignModalOpen(false);
      setBulkSelectedStudentIds([]);
      loadAllocations();
    } catch (err: any) {
      console.error("Bulk assign failed:", err);
      toast.error(err.message || "Failed to bulk assign students.");
    } finally {
      setIsSavingBulkAssign(false);
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

  const handleOpenEditAssignment = (item: CCAAssignmentItem) => {
    setEditingAssignment({
      id: item.id,
      studentName: item.studentName,
      admissionNumber: item.admissionNumber,
      activityName: item.activityName || "CCA Activity",
      feeAmount: item.feeAmount !== undefined && item.feeAmount !== null ? item.feeAmount : "",
      frequency: "MONTHLY",
      startDate: item.startDate ? (item.startDate.includes("T") ? item.startDate.split("T")[0] : item.startDate) : new Date().toISOString().split("T")[0],
      endDate: item.endDate ? (item.endDate.includes("T") ? item.endDate.split("T")[0] : item.endDate) : "",
      discountAmount: item.discountAmount !== undefined && item.discountAmount !== null ? item.discountAmount : "",
    });
  };

  const handleSaveEditAssignment = async () => {
    if (!editingAssignment) return;
    if (!editingAssignment.startDate) {
      toast.error("Please provide a valid start date");
      return;
    }
    if (editingAssignment.endDate && editingAssignment.endDate < editingAssignment.startDate) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    try {
      setIsSavingEditAssignment(true);
      await updateCCAAssignment(editingAssignment.id, {
        startDate: editingAssignment.startDate,
        endDate: editingAssignment.endDate ? editingAssignment.endDate : null,
        discountAmount: editingAssignment.discountAmount !== "" ? Number(editingAssignment.discountAmount) : 0,
        feeAmount: editingAssignment.feeAmount !== "" ? Number(editingAssignment.feeAmount) : 0,
      });
      toast.success("CCA Assignment updated successfully");
      setEditingAssignment(null);
      await loadAllocations();
      await loadActivities();
    } catch (err: any) {
      console.error("Failed to update assignment:", err);
      toast.error(err.message || "Failed to update assignment");
    } finally {
      setIsSavingEditAssignment(false);
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
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Co-Curricular Activities
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage co-curricular activities and student assignments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">

          {activeTab === "activities" ? (
            <Button
              onClick={handleOpenAddActivity}
              className="bg-[#556043] hover:bg-[#4a533b] text-white shadow-sm font-medium text-xs h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add CCA Activity
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenBulkAssign}
                variant="outline"
                className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200  dark:hover:bg-slate-700 shadow-2xs font-medium text-xs h-9 gap-1.5"
              >
                <Layers className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                Bulk Assign Class
              </Button>
              <Button
                onClick={handleOpenAssignStudent}
                className="bg-[#556043] hover:bg-[#4a533b] text-white shadow-sm font-medium text-xs h-9"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Assign Student
              </Button>
            </div>
          )}
        </div>
      </div>



      {/* ── Tabs Navigation ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("activities")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
            activeTab === "activities"
              ? "bg-white text-[#556043] shadow-sm dark:bg-slate-900 dark:text-white"
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
              ? "bg-white text-[#556043] shadow-sm dark:bg-slate-900 dark:text-white"
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
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="relative w-full sm:max-w-xs sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search activity name, code, account..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="pl-9 h-10 w-full rounded-lg border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={activityStatusFilter} onValueChange={setActivityStatusFilter}>
                <SelectTrigger className="h-10 w-[130px] border border-slate-300 dark:border-slate-700">
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
                <Loader2 className="h-5 w-5 animate-spin text-[#556043]" />
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
                  className="mt-4 bg-[#556043] hover:bg-[#4a533b] text-white text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Activity
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background border-none">
                      <TableHead className="pl-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Activity Name
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Code
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Fee Account
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Default Fee
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Billing Frequency
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Description
                      </TableHead>
                      <TableHead className="pr-6 text-right h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
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
                          {act.name}
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
                              className="h-8 w-8 text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10"
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
          {/* Filters Bar */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end mt-4">
            <div className="relative w-full sm:max-w-xs sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student name, admission #, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 w-full rounded-lg border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="h-10 w-[150px] border border-slate-300 dark:border-slate-700">
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
                <SelectTrigger className="h-9 w-[130px] text-xs border border-slate-300 dark:border-slate-700">
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
                <SelectTrigger className="h-9 w-[120px] text-xs border border-slate-300 dark:border-slate-700">
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
                <Loader2 className="h-5 w-5 animate-spin text-[#556043]" />
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
                  className="mt-4 bg-[#556043] hover:bg-[#4a533b] text-white text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Assign First Student
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background border-none">
                      <TableHead className="pl-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Student Info
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Class & Div
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Assigned Activity
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Start / End Date
                      </TableHead>
                      <TableHead className="h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Discount / Net Fee
                      </TableHead>
                      <TableHead className="pr-6 text-right h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllocations.map((item) => {
                      const totalGross = item.feeAmount || 0;
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
                              <Badge
                                className={cn(
                                  "border-none text-[11px] font-medium",
                                  item.status === "DROPPED"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                    : item.status === "INACTIVE"
                                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    : "bg-[#556043]/15 text-[#556043] dark:bg-[#556043]/25 dark:text-[#9ea98a]"
                                )}
                              >
                                {item.activityName} {(item.feeAmount || 0) > 0 ? `(₹${item.feeAmount}/mo)` : ""}
                              </Badge>
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
                                {item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : "Active"}
                              </span>
                              {item.endDate && (
                                <span className="text-[10px] text-slate-400">
                                  Until: {new Date(item.endDate).toLocaleDateString('en-GB')}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                ₹{net.toLocaleString()} / mo
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <span>Base: ₹{totalGross.toLocaleString()}</span>
                                {discount > 0 && (
                                  <span className="text-emerald-600 font-semibold">
                                    (−₹{discount.toLocaleString()})
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditAssignment(item)}
                                className="h-8 px-2 text-slate-600 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:text-[#9ea98a] text-xs font-medium"
                                title="Edit Assignment"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setAssignmentToDrop({
                                    id: item.id,
                                    studentName: item.studentName,
                                    activityName: item.activityName,
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
                                    id: item.id,
                                    studentName: item.studentName,
                                    activityName: item.activityName,
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
              className="bg-[#556043] hover:bg-[#4a533b] text-white text-xs"
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
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-[#556043]" /> Assign Student to CCA Activities
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select an active student, choose one or multiple CCA activities, set the billing start date, optional end date, and discount amount.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs flex-1 overflow-y-auto pr-2">
            {/* Student Search & Select */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 dark:text-white">
                Select Active Student <span className="text-red-500">*</span>
              </label>
              <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal text-left h-10 text-xs rounded-xl truncate bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                  >
                    <span className="truncate">
                      {selectedStudentObj
                        ? `[${selectedStudentObj.admissionNumber}] ${selectedStudentObj.studentName} (${selectedStudentObj.class})`
                        : "Search and choose student..."}
                    </span>
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
                                "mr-2 h-4 w-4 text-[#556043]",
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
              <label className="font-semibold text-slate-900 dark:text-white text-xs">
                Choose CCA Activities <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {activities.map((act) => {
                  const isChecked = selectedAssignConfigs.some((c) => c.activityId === act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => handleToggleAssignActivity(act)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-900",
                        isChecked
                          ? "border-[#556043]"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Checkbox
                          checked={isChecked}
                          className="pointer-events-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-[#556043] data-[state=checked]:text-white data-[state=checked]:border-[#556043]"
                        />
                        <div className="truncate">
                          <span className="text-xs font-bold block text-slate-900 dark:text-white truncate">
                            {act.name}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            ₹{(act.defaultFee || Number(act.feeAmount) || 0).toLocaleString()} / {act.frequency || "MONTHLY"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-Activity Configuration Table (Desktop) & Cards (Mobile) */}
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

                {/* Mobile View: Cards */}
                <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto p-2 space-y-2">
                  {selectedAssignConfigs.map((item) => {
                    const disc = item.discountAmount !== "" ? Number(item.discountAmount) : 0;
                    const net = Math.max(0, item.fee - disc);
                    return (
                      <div key={item.activityId} className="p-3 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ₹{item.fee.toLocaleString()} / {item.frequency || "Month"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-[#556043]/15 text-[#556043] dark:bg-[#556043]/25 text-[11px] font-bold">
                              ₹{net.toLocaleString()}/mo
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-red-600"
                              onClick={() => handleRemoveAssignItem(item.activityId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Start Date *</label>
                            <Input
                              type="date"
                              value={item.startDate}
                              onChange={(e) =>
                                handleUpdateAssignItem(item.activityId, "startDate", e.target.value)
                              }
                              className="h-8 text-[11px] rounded-lg text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">End Date</label>
                            <Input
                              type="date"
                              value={item.endDate}
                              onChange={(e) =>
                                handleUpdateAssignItem(item.activityId, "endDate", e.target.value)
                              }
                              className="h-8 text-[11px] rounded-lg text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Discount Amount (₹)</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
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
                              className="pl-5 h-8 text-[11px] rounded-lg text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden sm:block overflow-x-auto max-h-56 w-full max-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                        <TableHead className="pl-4 text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[100px]">
                          Activity
                        </TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[110px]">
                          Start Date *
                        </TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[110px]">
                          End Date
                        </TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[90px]">
                          Discount (₹)
                        </TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500 min-w-[70px]">
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
                                className="h-8 text-xs rounded-lg text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={item.endDate}
                                onChange={(e) =>
                                  handleUpdateAssignItem(item.activityId, "endDate", e.target.value)
                                }
                                className="h-8 text-xs rounded-lg text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
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
                                  className="pl-5 h-8 text-xs rounded-lg text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-xs text-[#556043] dark:text-[#9ea98a]">
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
                  <span className="text-slate-500 text-[11px] sm:text-xs">
                    Selected {selectedAssignConfigs.length} Activities &bull; Gross: ₹{modalFeeSummary.grossFee.toLocaleString()}
                    {modalFeeSummary.discount > 0 && ` | Discount: −₹${modalFeeSummary.discount.toLocaleString()}`}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-[#556043] dark:text-[#9ea98a]">
                    Net Monthly: ₹{modalFeeSummary.netFee.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 shrink-0 mt-4">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSaveAllocation}
              disabled={isSavingAllocation}
              className="bg-[#556043] hover:bg-[#4a533b] text-white text-xs"
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

      {/* ── BULK ASSIGN BY CLASS DIALOG ─────────────────────────────────────── */}
      <Dialog open={bulkAssignModalOpen} onOpenChange={setBulkAssignModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Layers className="h-5 w-5 text-orange-600 dark:text-orange-400" /> Bulk Assign Students to CCA Activity
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select an activity, pick a class/division, configure start date and discounts, and enroll multiple students at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs flex-1 overflow-y-auto pr-2">
            {/* Row 1: CCA Activity & Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-semibold dark:text-white">
                  Target CCA Activity <span className="text-red-500">*</span>
                </label>
                <Select
                  value={bulkActivityId}
                  onValueChange={(val) => {
                    setBulkActivityId(val);
                    setBulkSelectedStudentIds([]);
                  }}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700">
                    <SelectValue placeholder="Select CCA Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities
                      .filter((a) => a.status === "ACTIVE")
                      .map((act) => (
                        <SelectItem key={act.id} value={act.id}>
                          {act.name} (₹{act.defaultFee || Number(act.feeAmount) || 0}/mo)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 dark:text-white">
                  Target Class <span className="text-red-500">*</span>
                </label>
                <Select
                  value={bulkClassId}
                  onValueChange={(val) => {
                    setBulkClassId(val);
                    setBulkDivision("all");
                    setBulkSelectedStudentIds([]);
                  }}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Division & Start Date & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 dark:text-white">Division</label>
                <Select
                  value={bulkDivision}
                  onValueChange={(val) => {
                    setBulkDivision(val);
                    setBulkSelectedStudentIds([]);
                  }}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700">
                    <SelectValue placeholder="All Divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {availableDivisions.map((div) => (
                      <SelectItem key={div} value={div}>
                        Division {div}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 dark:text-white">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 dark:text-white">Discount per Student (₹)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₹</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={bulkDiscount === "" ? "" : bulkDiscount}
                    onChange={(e) => setBulkDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="pl-6 h-10 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Student Checklist Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  Students in Class ({bulkClassStudents.length})
                </label>
                {bulkClassStudents.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllStudents}
                    className="h-7 px-2 text-xs text-[#556043] hover:text-[#4a533b] hover:bg-[#556043]/10 dark:text-slate-300 dark:hover:bg-[#556043]/20"
                  >
                    {bulkSelectedStudentIds.length > 0 &&
                    bulkSelectedStudentIds.length ===
                      bulkClassStudents.filter(
                        (s) => !isAlreadyEnrolled(s.admissionNumber || "")
                      ).length
                      ? "Deselect All"
                      : "Select All Eligible"}
                  </Button>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 max-h-60 overflow-y-auto">
                {bulkClassStudents.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-xs">No active students found in the selected class/division.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                      <tr className="text-slate-500">
                        <th className="p-2.5 w-10 text-center"></th>
                        <th className="p-2.5 font-medium">Roll / Adm #</th>
                        <th className="p-2.5 font-medium">Student Name</th>
                        <th className="p-2.5 font-medium">Division</th>
                        <th className="p-2.5 font-medium text-right pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {bulkClassStudents.map((adm) => {
                        const sId = adm.studentId;
                        const admNo = adm.admissionNumber || "—";
                        const sName = adm.studentName || "—";
                        const enrolled = isAlreadyEnrolled(admNo);
                        const isSelected = bulkSelectedStudentIds.includes(sId);

                        return (
                          <tr
                            key={sId}
                            onClick={() => {
                              if (!enrolled) toggleStudentSelection(sId);
                            }}
                            className={cn(
                              "cursor-pointer transition-colors",
                              enrolled
                                ? "bg-slate-50/60 opacity-60 cursor-not-allowed dark:bg-slate-950/40"
                                : isSelected
                                ? "bg-[#556043]/10 dark:bg-[#556043]/20"
                                : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                            )}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                disabled={enrolled}
                                checked={isSelected}
                                readOnly
                                className="h-4 w-4 rounded border-slate-300 accent-[#556043] pointer-events-none"
                              />
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {adm.rollNumber ? `#${adm.rollNumber} • ` : ""}
                              {admNo}
                            </td>
                            <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                              {sName}
                            </td>
                            <td className="p-2.5 text-slate-500">
                              {adm.division || "—"}
                            </td>
                            <td className="p-2.5 text-right pr-3">
                              {enrolled ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                >
                                  Already Enrolled
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200"
                                >
                                  Available
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Summary Bar */}
              {bulkSelectedStudentIds.length > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-[#556043]/10 dark:bg-[#556043]/20 border border-[#556043]/20 p-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {bulkSelectedStudentIds.length} Student(s) Selected
                    </span>
                    {bulkDiscount !== "" && Number(bulkDiscount) > 0 && (
                      <span className="text-[11px] text-[#556043] dark:text-[#556043] block">
                        Discount applied: ₹{Number(bulkDiscount).toLocaleString()} / student
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-sm text-[#556043]">
                    Ready to Enroll
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setBulkAssignModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBulkAssign}
              disabled={isSavingBulkAssign || bulkSelectedStudentIds.length === 0}
              className="bg-[#556043] hover:bg-[#4a533b] text-white text-xs font-medium"
            >
              {isSavingBulkAssign ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Assigning Students...
                </>
              ) : (
                `Assign ${bulkSelectedStudentIds.length} Students`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT CCA ASSIGNMENT DIALOG ─────────────────────────────────────── */}
      <Dialog
        open={!!editingAssignment}
        onOpenChange={(open) => !open && setEditingAssignment(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
              <Pencil className="h-5 w-5 text-[#556043]" /> Edit CCA Student Assignment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update the billing start date, optional end date, and discount configuration for this student.
            </DialogDescription>
          </DialogHeader>

          {editingAssignment && (
            <div className="space-y-4 py-2 text-xs flex-1 overflow-y-auto pr-2">
              {/* Activity Info Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Student
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                      {editingAssignment.studentName}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Adm: {editingAssignment.admissionNumber}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Activity
                    </span>
                    <Badge className="bg-[#556043]/15 text-[#556043] dark:bg-[#556043]/25 dark:text-[#9ea98a] border-none text-xs font-semibold">
                      {editingAssignment.activityName}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Editable Amount & Discount Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Base Charge Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={editingAssignment.feeAmount}
                      onChange={(e) =>
                        setEditingAssignment((prev) =>
                          prev
                            ? {
                                ...prev,
                                feeAmount:
                                  e.target.value === "" ? "" : Number(e.target.value),
                              }
                            : null
                        )
                      }
                      className="pl-7 h-10 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Discount Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={editingAssignment.discountAmount}
                      onChange={(e) =>
                        setEditingAssignment((prev) =>
                          prev
                            ? {
                                ...prev,
                                discountAmount:
                                  e.target.value === "" ? "" : Number(e.target.value),
                              }
                            : null
                        )
                      }
                      className="pl-7 h-10 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={editingAssignment.startDate}
                    onChange={(e) =>
                      setEditingAssignment((prev) =>
                        prev ? { ...prev, startDate: e.target.value } : null
                      )
                    }
                    className="h-10 text-xs rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    End Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={editingAssignment.endDate}
                    onChange={(e) =>
                      setEditingAssignment((prev) =>
                        prev ? { ...prev, endDate: e.target.value } : null
                      )
                    }
                    className="h-10 text-xs rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Net Rate Summary Box */}
              {(() => {
                const base =
                  editingAssignment.feeAmount !== ""
                    ? Number(editingAssignment.feeAmount)
                    : 0;
                const disc =
                  editingAssignment.discountAmount !== ""
                    ? Number(editingAssignment.discountAmount)
                    : 0;
                const net = Math.max(0, base - disc);
                return (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#556043]/10 dark:bg-[#556043]/20 border border-[#556043]/20">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Net Monthly Rate
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Base: ₹{base.toLocaleString()}
                        {disc > 0 && ` − Discount: ₹${disc.toLocaleString()}`}
                      </span>
                    </div>
                    <span className="text-base font-bold text-[#556043] dark:text-[#9ea98a]">
                      ₹{net.toLocaleString()} / mo
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setEditingAssignment(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditAssignment}
              disabled={isSavingEditAssignment}
              className="bg-[#556043] hover:bg-[#4a533b] text-white text-xs font-medium"
            >
              {isSavingEditAssignment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Update Assignment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DROP CONFIRMATION DIALOG ───────────────────────────────────────── */}
      <AlertDialog open={!!assignmentToDrop} onOpenChange={(open) => !open && setAssignmentToDrop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop Student from CCA?</AlertDialogTitle>
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
            <AlertDialogTitle>Remove CCA Assignment?</AlertDialogTitle>
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
            <AlertDialogTitle>Delete "{activityToDelete?.name}"?</AlertDialogTitle>
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

