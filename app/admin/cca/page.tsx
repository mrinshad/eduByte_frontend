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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  assignStudentToCCA,
  getMonthName,
  type CCAActivity,
  type CCAStudentAllocation,
} from "@/lib/services/cca";
import { getNonPayment, type accountName } from "@/lib/services/accountTypes";
import { getStudentAdmissions, type BackendAdmission } from "@/lib/services/admissions";
import { getClasses, type SchoolClass } from "@/lib/services/class";

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {label}
      <button onClick={onRemove} className="rounded-full hover:text-red-600">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function CCAManagementPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"activities" | "allocations">("activities");

  // Activities State
  const [activities, setActivities] = useState<CCAActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [accounts, setAccounts] = useState<accountName[]>([]);

  // Activity Modal State
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
  }>({
    name: "",
    code: "",
    defaultFee: 500,
    frequency: "MONTHLY",
    incomeAccountId: "",
    description: "",
    inCharge: "",
  });
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<CCAActivity | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  // Student Allocations State
  const [allocations, setAllocations] = useState<CCAStudentAllocation[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(true);
  const [allAdmissions, setAllAdmissions] = useState<BackendAdmission[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  // Allocations Filters
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  // Assign Student Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [startMonth, setStartMonth] = useState<number>(1);
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────────────
  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const data = await getCCAActivities();
      setActivities(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load CCA activities");
    } finally {
      setActivitiesLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const accList = await getNonPayment();
      setAccounts(accList);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllocations = async () => {
    try {
      setAllocationsLoading(true);
      const data = await getCCAStudentAllocations();
      setAllocations(data);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  useEffect(() => {
    loadActivities();
    loadAccounts();
    loadAllocations();
    loadAdmissionsAndClasses();
  }, []);

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
    });
    setActivityModalOpen(true);
  };

  const handleOpenEditActivity = (act: CCAActivity) => {
    setEditingActivityId(act.id);
    setActivityForm({
      name: act.name,
      code: act.code || "",
      defaultFee: act.defaultFee || Number(act.feeAmount) || 0,
      frequency: (act.frequency as "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME") || "MONTHLY",
      incomeAccountId: act.incomeAccountId || "",
      description: act.description || "",
      inCharge: act.inCharge || "",
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
          name: activityForm.name,
          code: activityForm.code ? activityForm.code.trim() : null,
          feeAmount: Number(activityForm.defaultFee),
          frequency: activityForm.frequency,
          incomeAccountId: activityForm.incomeAccountId || null,
          description: activityForm.description ? activityForm.description.trim() : null,
        });
        toast.success("CCA Activity updated successfully");
      } else {
        await createCCAActivity({
          name: activityForm.name,
          code: activityForm.code ? activityForm.code.trim() : undefined,
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
      toast.success("Activity removed");
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
    setSelectedEnrollmentId("");
    setSelectedActivityIds([]);
    setStartMonth(1);
    setAssignModalOpen(true);
  };

  const handleOpenEditAllocation = (item: CCAStudentAllocation) => {
    setSelectedEnrollmentId(item.enrollmentId);
    setSelectedActivityIds(item.activities.map((a) => a.chargeTypeId));
    setStartMonth(item.activities[0]?.startMonth || 1);
    setAssignModalOpen(true);
  };

  const handleSaveAllocation = async () => {
    if (!selectedEnrollmentId) {
      toast.error("Please select a student");
      return;
    }
    if (selectedActivityIds.length === 0) {
      toast.error("Please select at least one activity");
      return;
    }

    try {
      setIsSavingAllocation(true);
      const activityPayload = selectedActivityIds.map((actId) => {
        const act = activities.find((a) => a.id === actId);
        return {
          activityId: actId,
          fee: act?.defaultFee || 0,
          startMonth,
        };
      });

      await assignStudentToCCA(selectedEnrollmentId, activityPayload);
      toast.success("Student CCA allocation saved successfully");
      setAssignModalOpen(false);
      await loadAllocations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save student allocation");
    } finally {
      setIsSavingAllocation(false);
    }
  };

  const handleRemoveAllocation = async (enrollmentId: string) => {
    try {
      await assignStudentToCCA(enrollmentId, []);
      toast.success("Student removed from CCA activities");
      await loadAllocations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove student");
    }
  };

  // ── Filtered Allocations ──────────────────────────────────────────────────
  const filteredAllocations = useMemo(() => {
    return allocations.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.studentName.toLowerCase().includes(search.toLowerCase()) ||
        item.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
        (item.parentPhone && item.parentPhone.includes(search));

      const matchActivity =
        activityFilter === "all" ||
        item.activities.some((a) => a.chargeTypeId === activityFilter || a.activityName.toLowerCase() === activityFilter.toLowerCase());

      const matchClass = classFilter === "all" || item.class.toLowerCase() === classFilter.toLowerCase();

      return matchSearch && matchActivity && matchClass;
    });
  }, [allocations, search, activityFilter, classFilter]);

  const selectedStudentObj = useMemo(() => {
    return allAdmissions.find((a) => a.id === selectedEnrollmentId);
  }, [allAdmissions, selectedEnrollmentId]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 dark:bg-slate-950 font-sans space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6D755F] dark:text-[#8d967d]">
              Co-Curricular
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Activity className="h-7 w-7 text-[#6D755F]" /> Co-Curricular Activities (CCA)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Setup activities, assign fee accounts, and manage student enrollments across academic months.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "activities" ? (
            <Button
              onClick={handleOpenAddActivity}
              className="bg-[#6D755F] hover:bg-[#5b624f] text-white shadow-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-2" /> Add CCA Activity
            </Button>
          ) : (
            <Button
              onClick={handleOpenAssignStudent}
              className="bg-[#6D755F] hover:bg-[#5b624f] text-white shadow-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-2" /> Assign Student
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
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
          <Activity className="h-4 w-4" /> 1. Setup Activities ({activities.length})
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
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Master Activities Roster
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
            ) : activities.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">No CCA activities created yet.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add activities such as Swimming, Karate, Robotics, or Dance to get started.
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
                      <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-slate-500">Activity Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Code</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Fee Account</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Default Fee</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Billing Frequency</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Enrolled</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Description</TableHead>
                      <TableHead className="pr-6 text-right text-xs uppercase tracking-wider font-semibold text-slate-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((act) => (
                      <TableRow key={act.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="pl-6 font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D755F]/10 text-[#6D755F]">
                              <Activity className="h-4 w-4" />
                            </span>
                            <span>{act.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {act.code ? (
                            <Badge variant="outline" className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {act.code}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium text-slate-600 dark:text-slate-300">
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
                            {act.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {act.activeStudentCount ?? 0} Students
                          </span>
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
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setActivityToDelete(act)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
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
          {/* Helpful Policy Note Alert */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold">Mid-Year Allocation Rule:</span> If a student joins Karate or Swimming in{" "}
              <strong>Month 4 (September)</strong>, their fee will generate strictly from Month 4 onwards. The system
              will <strong>never</strong> charge them for Months 1, 2, or 3.
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student name or admission #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="h-9 w-[160px] text-xs">
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
                <SelectTrigger className="h-9 w-[140px] text-xs">
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

              {(search || activityFilter !== "all" || classFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setActivityFilter("all");
                    setClassFilter("all");
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
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">No student allocations found.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click "+ Assign Student" to assign active students to CCA activities with custom start dates.
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
                      <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-slate-500">Student</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Class & Section</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Assigned Activities</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Billing Start Month</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Parent Contact</TableHead>
                      <TableHead className="pr-6 text-right text-xs uppercase tracking-wider font-semibold text-slate-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllocations.map((item) => (
                      <TableRow key={item.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="pl-6 font-medium text-slate-900 dark:text-slate-100">
                          <div>
                            <span className="font-semibold block">{item.studentName}</span>
                            <span className="text-xs text-slate-400 font-mono">Adm: {item.admissionNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium text-slate-700 dark:text-slate-300">
                            {item.class} {item.division ? ` - ${item.division}` : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {item.activities.map((a) => (
                              <Badge
                                key={a.chargeTypeId}
                                className="bg-[#6D755F]/15 text-[#6D755F] dark:bg-[#6D755F]/25 dark:text-[#9ea98a] border-none text-[11px] font-medium"
                              >
                                {a.activityName} (₹{a.monthlyFee}/mo)
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{item.activities[0]?.startMonthName || "Month 1 (June)"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">
                          {item.parentPhone || item.parentWhatsApp || "—"}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditAllocation(item)}
                              className="h-8 w-8 text-slate-500 hover:text-[#6D755F] hover:bg-[#6D755F]/10"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAllocation(item.enrollmentId)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Remove CCA Activities"
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
      )}

      {/* ── CREATE / EDIT ACTIVITY DIALOG ──────────────────────────────────── */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingActivityId ? "Edit CCA Activity" : "Add Co-Curricular Activity"}
            </DialogTitle>
            <DialogDescription>
              Assign the activity to an income account and specify its default monthly fee.
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
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Code
                </label>
                <Input
                  placeholder="e.g. KGF"
                  value={activityForm.code}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="h-10 font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fee Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
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
                    className="pl-7 h-10"
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
                Description / Notes (Optional)
              </label>
              <Input
                placeholder="Brief description of training sessions, materials, etc."
                value={activityForm.description}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveActivity}
              disabled={isSavingActivity}
              className="bg-[#6D755F] hover:bg-[#5b624f] text-white"
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Co-Curricular (CCA) Activities</DialogTitle>
            <DialogDescription>
              Select an enrolled student, choose their activities, and pick the billing start month.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Student Search & Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Student <span className="text-red-500">*</span>
              </label>
              <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal text-left h-10 text-xs"
                  >
                    {selectedStudentObj
                      ? `[${selectedStudentObj.admissionNumber}] ${selectedStudentObj.studentName} (${selectedStudentObj.class})`
                      : "Search and choose active student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search student name or admission #..." className="text-xs" />
                    <CommandList>
                      <CommandEmpty>No matching students found.</CommandEmpty>
                      <CommandGroup className="max-h-56 overflow-y-auto">
                        {allAdmissions.map((adm) => (
                          <CommandItem
                            key={adm.id}
                            value={`${adm.admissionNumber} ${adm.studentName} ${adm.class}`}
                            onSelect={() => {
                              setSelectedEnrollmentId(adm.id);
                              setStudentPopoverOpen(false);
                            }}
                            className="cursor-pointer py-2"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-[#6D755F]",
                                selectedEnrollmentId === adm.id ? "opacity-100" : "opacity-0"
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
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Choose Activities (Multiple Allowed) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {activities.map((act) => {
                  const isChecked = selectedActivityIds.includes(act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedActivityIds((prev) => prev.filter((id) => id !== act.id));
                        } else {
                          setSelectedActivityIds((prev) => [...prev, act.id]);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer",
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
                          <span className="text-[10px] text-slate-500">₹{act.defaultFee}/mo</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start Month Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Billing Start Month <span className="text-red-500">*</span>
              </label>
              <Select value={String(startMonth)} onValueChange={(val) => setStartMonth(Number(val))}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select Start Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Month 1 — June (Academic Start)</SelectItem>
                  <SelectItem value="2">Month 2 — July</SelectItem>
                  <SelectItem value="3">Month 3 — August</SelectItem>
                  <SelectItem value="4">Month 4 — September (Term 2)</SelectItem>
                  <SelectItem value="5">Month 5 — October</SelectItem>
                  <SelectItem value="6">Month 6 — November</SelectItem>
                  <SelectItem value="7">Month 7 — December</SelectItem>
                  <SelectItem value="8">Month 8 — January</SelectItem>
                  <SelectItem value="9">Month 9 — February</SelectItem>
                  <SelectItem value="10">Month 10 — March</SelectItem>
                  <SelectItem value="11">Month 11 — April</SelectItem>
                  <SelectItem value="12">Month 12 — May</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400">
                Fees will start generating strictly from {getMonthName(startMonth)}. Prior months are not billed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAllocation}
              disabled={isSavingAllocation}
              className="bg-[#6D755F] hover:bg-[#5b624f] text-white"
            >
              {isSavingAllocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Save Allocation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION DIALOG ────────────────────────────────────── */}
      <AlertDialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete CCA Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{activityToDelete?.name}</strong>? This activity will be removed
              from the master roster.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingActivity ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
