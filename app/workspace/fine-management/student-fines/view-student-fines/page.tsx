"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowLeft,
  Receipt,
  User,
  GraduationCap,
  Undo2,
  AlertCircle,
  Pencil,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StudentFineFormDialog from "@/components/common/StudentFineFormDialog";

import { getStudentFineById, reverseStudentFine, type StudentFineDetail } from "@/lib/services/fineTypes";
import { refreshLateFines } from "@/lib/services/lateFine";

// ---------------------------------------------------------------------------
// Sub-components — matches the InfoSection / InfoGrid / InfoItem pattern
// used on the admission detail page.
// ---------------------------------------------------------------------------


function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
      <div className="flex items-center gap-2.5 bg-background px-4 py-3 dark:bg-background">
        <Icon className="h-4 w-4 shrink-0 text-foreground" />
        <span className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3">
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="break-words text-sm font-medium text-slate-950 dark:text-slate-100">{value}</div>
    </div>
  );
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400";
    case "PARTIAL":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400";
    case "REVERSED":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400";
    default:
      return "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400";
  }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ViewStudentFinePage() {
  // reverse
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  const [confirmReverse, setConfirmReverse] = useState(false)

  // edit — opens the shared StudentFineFormDialog instead of navigating
  // to a separate edit route.
  const [editOpen, setEditOpen] = useState(false)

  const handleReverseFine = async () => {
    if (!reverseReason.trim()) {
      toast.error("Please enter a reversal reason")
      return
    }

    try {
      const response = await reverseStudentFine(
        fine!.id,
        reverseReason
      )

      toast.success("Fine reversed successfully")

      const updatedFine = await getStudentFineById(fine!.id)
      setFine(updatedFine)

      setReverseOpen(false)
      setReverseReason("")
      setConfirmReverse(false)
    } catch (error: any) {
      console.error("Reverse Error:", error)

      toast.error(
        error?.message || "Failed to reverse fine"
      )
    }
  }

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const [fine, setFine] = useState<StudentFineDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadFine() {
    if (!id) {
      setLoading(false)
      return
    }

    try {
      const data = await getStudentFineById(id)
      if (data?.enrollmentId) {
        await refreshLateFines(data.enrollmentId);
      }
      setFine(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <section className="w-full px-4 py-4 sm:px-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </section>
    );
  }

  if (!fine) {
    return (
      <section className="w-full px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          Fine record not found.
        </div>
      </section>
    );
  }

  const amount = Number(fine.amount) || 0;
  const paidAmount = Number(fine.paidAmount) || 0;
  const balanceAmount = Number(fine.balanceAmount);
  const safeBalanceAmount = Number.isFinite(balanceAmount) ? balanceAmount : amount - paidAmount;

  return (
    <section className="w-full px-4 py-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            className="shrink-0 bg-background text-foreground hover:opacity-90 shadow-sm"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {fine.student}
            </h1>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
              {fine.admissionNumber}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-white"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setReverseOpen(true)}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Reverse Fine
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Student & class information ── */}
        <InfoSection icon={User} title="Student Information">
          <InfoGrid>
            <InfoItem label="Full name" value={fine.student} />
            <InfoItem label="Admission no." value={fine.admissionNumber} />
            <InfoItem label="Class" value={fine.class || "—"} />
            <InfoItem label="Division" value={fine.division || "—"} />
            <InfoItem label="Roll number" value={fine.rollNumber ?? "—"} />
          </InfoGrid>
        </InfoSection>

        {/* ── Fine details ── */}
        <InfoSection icon={GraduationCap} title="Fine Details">
          <InfoGrid>
            <InfoItem label="Fine type" value={fine.fine} />
            <InfoItem label="Reason" value={fine.reason || "—"} />
            <InfoItem
              label="Status"
              value={
                <Badge variant="outline" className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                  fine.status === "PAID"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : fine.status === "PARTIAL"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                )}>
                  {fine.status}
                </Badge>
              }
            />
          </InfoGrid>

          {/* Reversal banner — only shown when the fine has been reversed */}
          {fine.isReversed && (
            <div className="flex items-start gap-3 border-t border-violet-100 bg-violet-50 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-500/10">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
                <Undo2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">
                  Fine reversed
                </div>
                <div className="mt-0.5 break-words text-sm text-violet-900 dark:text-violet-200">
                  {fine.reversalReason || "No reversal reason provided."}
                </div>
              </div>
            </div>
          )}
        </InfoSection>

        {/* ── Amount summary ── */}
        <InfoSection icon={Receipt} title="Amount Summary">
          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4 text-center">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Fine amount
              </div>
              <div className="text-lg text-slate-950 dark:text-slate-100">
                ₹{amount.toLocaleString()}
              </div>
            </div>
            <div className="px-5 py-4 text-center">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paid
              </div>
              <div className="text-lg text-emerald-600 dark:text-emerald-400">
                ₹{paidAmount.toLocaleString()}
              </div>
            </div>
            <div className="px-5 py-4 text-center">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Balance
              </div>
              <div className="text-lg text-slate-950 dark:text-slate-100">
                ₹{safeBalanceAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </InfoSection>
      </div>

      {/* Edit Fine dialog */}
      <StudentFineFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editingFineId={fine.id}
        initialValues={{
          enrollmentId: fine.enrollmentId ?? "",
          fineTypeId: fine.fineId ?? "",
          amount: String(fine.amount ?? ""),
          reason: fine.reason ?? "",
        }}
        onSaved={loadFine}
      />

      <Dialog open={reverseOpen} onOpenChange={setReverseOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reverse Fine</DialogTitle>
            <DialogDescription>
              Do you want to reverse this fine?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">
              Reversal Reason
            </label>

            <textarea
              className="w-full min-h-[100px] rounded-md border p-3 text-sm"
              placeholder="Enter reason for reversing this fine..."
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              id="confirm-reverse"
              type="checkbox"
              checked={confirmReverse}
              onChange={(e) => setConfirmReverse(e.target.checked)}
              className="h-4 w-4 shrink-0"
            />

            <label
              htmlFor="confirm-reverse"
              className="text-sm text-muted-foreground"
            >
              I confirm that I want to reverse this fine
            </label>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setReverseOpen(false)
                setReverseReason("")
                setConfirmReverse(false)
              }}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleReverseFine}
              disabled={!confirmReverse}
            >
              Reverse Fine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}