"use client"
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, User, Loader2, Bus, Wallet, Receipt, Plus, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  getStudentDetails,
  getStudentCharges,
  getStudentFines,
  getPaymentMethodAccounts,
  collectFee,
  type EnrollmentDetails,
  type StudentCharge,
  type Fine,
  type CollectAllocation,
  type PaymentMethodAccount,
} from "@/lib/services/feeCollection"

const formatCurrency = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function InfoSection({
  icon: Icon,
  title,
  children,
  right,
}: {
  icon: React.ElementType,
  title: string,
  children: React.ReactNode,
  right?: React.ReactNode,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
      <div className="flex items-center justify-between gap-2.5 bg-background px-4 py-3 dark:bg-background">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-foreground" />
          <span className="text-sm font-semibold tracking-tight text-foreground">{title}</span>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800/50 md:grid-cols-3">
      {children}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="text-sm font-medium text-slate-950 dark:text-slate-100">{value}</div>
    </div>
  );
}

function PeriodLabel({ month, year }: { month: number | null; year: number | null }) {
  if (!month || !year) return <span>-</span>;
  const date = new Date(year, month - 1, 1);
  return <span>{date.toLocaleString("default", { month: "short" })} {year}</span>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const enrollmentId = searchParams.get("id") ?? ""

  // Enrollment details
  const [enrollmentDetails, setEnrollmentDetails] = useState<EnrollmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charges / Fines
  const [charges, setCharges] = useState<StudentCharge[]>([])
  const [fines, setFines] = useState<Fine[]>([])
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentMethodAccount[]>([])
  const [chargesLoading, setChargesLoading] = useState(true)
  const [chargesError, setChargesError] = useState<string | null>(null)

  // Selection: id -> amount to collect (keys prefixed to avoid charge/fine id collisions)
  const [selected, setSelected] = useState<Record<string, number>>({})

  // Payment lines
  const [payments, setPayments] = useState<{ accountId: string; amount: number }[]>([])

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ transactionNumber: string; totalAmount: number } | null>(null)

  const chargeKey = (id: string) => `charge:${id}`;
  const fineKey = (id: string) => `fine:${id}`;

  useEffect(() => {
    async function fetchStudentDetails() {
      try {
        setLoading(true)
        setError(null)
        const details = await getStudentDetails(enrollmentId)
        setEnrollmentDetails(details)
      } catch (err) {
        console.error("Student Details API Error:", err)
        setError(err instanceof Error ? err.message : "Something went wrong.")
      } finally {
        setLoading(false)
      }
    }

    async function fetchChargesAndFines() {
      try {
        setChargesLoading(true)
        setChargesError(null)
        const [chargesData, finesData, paymentAccountsData] = await Promise.all([
          getStudentCharges(enrollmentId),
          getStudentFines(enrollmentId),
          getPaymentMethodAccounts(),
        ])
        setCharges(chargesData)
        setFines(finesData)
        setPaymentAccounts(paymentAccountsData)

        if (paymentAccountsData.length > 0) {
          setPayments([{ accountId: paymentAccountsData[0].id, amount: 0 }])
        } else {
          setPayments([])
        }
      } catch (err) {
        console.error("Charges/Fines API Error:", err)
        setChargesError(err instanceof Error ? err.message : "Failed to load outstanding charges.")
      } finally {
        setChargesLoading(false)
      }
    }

    if (enrollmentId) {
      fetchStudentDetails()
      fetchChargesAndFines()
    } else {
      setLoading(false)
      setChargesLoading(false)
      setError("No student selected.")
    }
  }, [enrollmentId])

  const student = enrollmentDetails?.student

  // ---- Selection handlers ----
  function toggleCharge(charge: StudentCharge) {
    setSelected((prev) => {
      const key = chargeKey(charge.id)
      const next = { ...prev }
      if (key in next) {
        delete next[key]
      } else {
        next[key] = charge.balance
      }
      return next
    })
  }

  function toggleFine(fine: Fine) {
    setSelected((prev) => {
      const key = fineKey(fine.id)
      const next = { ...prev }
      if (key in next) {
        delete next[key]
      } else {
        next[key] = fine.balance
      }
      return next
    })
  }

  function updateAmount(key: string, value: number, max: number) {
    const clamped = Math.max(0, Math.min(value, max))
    setSelected((prev) => ({ ...prev, [key]: clamped }))
  }

  // ---- Totals ----
  const feeOutstanding = useMemo(() => {
    return charges.reduce((sum, c) => {
      const key = chargeKey(c.id)
      return key in selected ? sum + selected[key] : sum
    }, 0)
  }, [charges, selected])

  const fineOutstanding = useMemo(() => {
    return fines.reduce((sum, f) => {
      const key = fineKey(f.id)
      return key in selected ? sum + selected[key] : sum
    }, 0)
  }, [fines, selected])

  const totalOutstanding = feeOutstanding + fineOutstanding

  const totalPayments = useMemo(
    () => payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  )

  const difference = totalOutstanding - totalPayments

  const displayCharges = useMemo(() => {
    return [...charges].sort((a, b) => {
      if (a.canCollect !== b.canCollect) {
        return a.canCollect ? -1 : 1
      }

      const periodA = (a.periodYear ?? 0) * 100 + (a.periodMonth ?? 0)
      const periodB = (b.periodYear ?? 0) * 100 + (b.periodMonth ?? 0)
      if (periodA !== periodB) {
        return periodB - periodA
      }

      return 0
    })
  }, [charges])

  // ---- Payment line handlers ----
  function addPaymentLine() {
    const unused = paymentAccounts.find(
      (m) => !payments.some((p) => p.accountId === m.id)
    )
    if (!unused) return
    setPayments((prev) => [...prev, { accountId: unused.id, amount: 0 }])
  }

  function removePaymentLine(index: number) {
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }

  function updatePaymentAccount(index: number, accountId: string) {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, accountId } : p)))
  }

  function updatePaymentAmount(index: number, amount: number) {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, amount: Math.max(0, amount) } : p)))
  }

  // ---- Submit ----
  const canSubmit =
    totalOutstanding > 0 &&
    difference === 0 &&
    payments.every((p) => p.amount > 0) &&
    payments.length > 0 &&
    !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const allocations: CollectAllocation[] = [
        ...charges
          .filter((c) => chargeKey(c.id) in selected && selected[chargeKey(c.id)] > 0)
          .map((c) => ({ studentChargeId: c.id, amount: selected[chargeKey(c.id)] })),
        ...fines
          .filter((f) => fineKey(f.id) in selected && selected[fineKey(f.id)] > 0)
          .map((f) => ({ fineId: f.id, amount: selected[fineKey(f.id)] })),
      ]

      const result = await collectFee({
        enrollmentId,
        payments: payments.map((p) => ({ accountId: p.accountId, amount: p.amount })),
        allocations,
      })

      setSuccessInfo({ transactionNumber: result.transactionNumber, totalAmount: result.totalAmount })
      toast.success(`Fee collected successfully. Txn ${result.transactionNumber} for ${formatCurrency(result.totalAmount)}.`)
      setSelected({})
      setPayments(paymentAccounts.length > 0 ? [{ accountId: paymentAccounts[0].id, amount: 0 }] : [])

      // Refresh charges/fines to reflect updated balances
      const [chargesData, finesData] = await Promise.all([
        getStudentCharges(enrollmentId),
        getStudentFines(enrollmentId),
      ])
      setCharges(chargesData)
      setFines(finesData)
    } catch (err) {
      console.error("Collect Fee API Error:", err)
      setSubmitError(err instanceof Error ? err.message : "Payment failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button
          className="bg-background text-foreground hover:opacity-90 shadow-sm"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {loading ? "Loading..." : student?.studentName || "-"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {loading ? "" : student?.admissionNumber || "-"}
          </p>
        </div>
      </div>

      {/* ── Student / Enrollment Info ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
          <p className="text-sm">Loading student details...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-red-500">
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : enrollmentDetails && student ? (
        <div className="space-y-6">

          <InfoSection icon={User} title="Student Information">
            <InfoGrid>
              <InfoItem label="Name" value={student.studentName || "-"} />
              <InfoItem label="Admission No" value={student.admissionNumber || "-"} />
              <InfoItem label="WhatsApp Number" value={student.whatsappNumber || "-"} />
              <InfoItem label="Address" value={student.address || "-"} />
              <InfoItem label="Class & Div" value={`${enrollmentDetails.classId } - ${ enrollmentDetails.division}`}/>
              <InfoItem label="Roll Number" value={enrollmentDetails.rollNumber || "-"} />
            </InfoGrid>
          </InfoSection>

          

        </div>
      ) : null}

      {/* ── Collect Fee ── */}
      {!loading && !error && (
        <InfoSection icon={Wallet} title="Outstanding Charges & Fines">
          {chargesLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#556043]" />
              <p className="text-sm">Loading outstanding charges...</p>
            </div>
          ) : chargesError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-red-500">
              <p className="text-sm font-medium">{chargesError}</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">

              {/* Success banner */}
              {successInfo && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">
                    Payment collected successfully. Transaction {successInfo.transactionNumber} for {formatCurrency(successInfo.totalAmount)}.
                  </p>
                </div>
              )}

              {/* Student Charges table */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Student Charges
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800/50">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                      <tr className="text-left text-slate-500 dark:text-slate-400">
                        <th className="px-3 py-2 font-medium w-10"></th>
                        <th className="px-3 py-2 font-medium">Charge</th>
                        <th className="px-3 py-2 font-medium">Period</th>
                        <th className="px-3 py-2 font-medium text-right">Amount</th>
                        <th className="px-3 py-2 font-medium text-right">Paid</th>
                        <th className="px-3 py-2 font-medium text-right">Balance</th>
                        <th className="px-3 py-2 font-medium text-right w-32">Collect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {displayCharges.map((charge) => {
                        const key = chargeKey(charge.id)
                        const isSelected = key in selected
                        const disabled = !charge.canCollect || charge.balance <= 0
                        return (
                          <tr key={charge.id} className={disabled ? "opacity-50" : ""}>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={disabled}
                                onChange={() => toggleCharge(charge)}
                                className="h-4 w-4 rounded border-slate-300 accent-[#556043]"
                              />
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-950 dark:text-slate-100">
                              {charge.chargeType}
                              {charge.status !== "PENDING" && (
                                <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                                  {charge.status.replace("_", " ")}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                              <PeriodLabel month={charge.periodMonth} year={charge.periodYear} />
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                              {formatCurrency(charge.finalAmount)}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                              {formatCurrency(charge.paidAmount)}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-950 dark:text-slate-100">
                              {formatCurrency(charge.balance)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                max={charge.balance}
                                disabled={!isSelected}
                                value={isSelected ? selected[key] : ""}
                                onChange={(e) => updateAmount(key, Number(e.target.value), charge.balance)}
                                className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm outline-none focus:border-[oklch(0.46_0.04_125)] focus:ring-1 focus:ring-[oklch(0.46_0.04_125)] disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
                              />
                            </td>
                          </tr>
                        )
                      })}
                      {charges.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                            No charges found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fines table */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fines
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800/50">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                      <tr className="text-left text-slate-500 dark:text-slate-400">
                        <th className="px-3 py-2 font-medium w-10"></th>
                        <th className="px-3 py-2 font-medium">Fine</th>
                        <th className="px-3 py-2 font-medium text-right">Amount</th>
                        <th className="px-3 py-2 font-medium text-right">Paid</th>
                        <th className="px-3 py-2 font-medium text-right">Balance</th>
                        <th className="px-3 py-2 font-medium text-right w-32">Collect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {fines.map((fine) => {
                        const key = fineKey(fine.id)
                        const isSelected = key in selected
                        const disabled = !fine.canCollect || fine.balance <= 0
                        return (
                          <tr key={fine.id} className={disabled ? "opacity-50" : ""}>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={disabled}
                                onChange={() => toggleFine(fine)}
                                className="h-4 w-4 rounded border-slate-300 accent-[#556043]"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-slate-950 dark:text-slate-100">{fine.fineType}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{fine.reason}</div>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                              {formatCurrency(fine.amount)}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                              {formatCurrency(fine.paidAmount)}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-950 dark:text-slate-100">
                              {formatCurrency(fine.balance)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                max={fine.balance}
                                disabled={!isSelected}
                                value={isSelected ? selected[key] : ""}
                                onChange={(e) => updateAmount(key, Number(e.target.value), fine.balance)}
                                className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm outline-none focus:border-[oklch(0.46_0.04_125)] focus:ring-1 focus:ring-[oklch(0.46_0.04_125)] disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
                              />
                            </td>
                          </tr>
                        )
                      })}
                      {fines.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                            No fines found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary + Payment details */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Summary */}
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800/50">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Fee Outstanding</span>
                      <span className="font-medium text-slate-950 dark:text-slate-100">{formatCurrency(feeOutstanding)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Fine Outstanding</span>
                      <span className="font-medium text-slate-950 dark:text-slate-100">{formatCurrency(fineOutstanding)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-800/50">
                      <span className="font-semibold text-slate-950 dark:text-slate-100">Total Outstanding</span>
                      <span className="font-semibold text-slate-950 dark:text-slate-100">{formatCurrency(totalOutstanding)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    You can adjust each amount above — the accountant may collect a partial payment.
                  </p>
                </div>

                {/* Payment details */}
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800/50">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Payment Details
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-[#556043] hover:bg-[#556043] hover:text-white"
                      onClick={addPaymentLine}
                      disabled={payments.length >= paymentAccounts.length || paymentAccounts.length === 0}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add method
                    </Button>
                  </div>

                  {paymentAccounts.length === 0 ? (
                    <p className="mb-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                      No active payment method accounts found. Seed or create payment accounts first.
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    {payments.map((p, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={p.accountId}
                          onChange={(e) => updatePaymentAccount(index, e.target.value)}
                          className="h-9 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[oklch(0.46_0.04_125)] focus:ring-1 focus:ring-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950"
                        >
                          {paymentAccounts.map((m) => (
                            <option
                              key={m.id}
                              value={m.id}
                              disabled={payments.some((pp, i) => i !== index && pp.accountId === m.id)}
                            >
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={p.amount || ""}
                          onChange={(e) => updatePaymentAmount(index, Number(e.target.value))}
                          placeholder="0"
                          className="h-9 w-28 rounded-md border border-slate-300 bg-white px-2 text-right text-sm outline-none focus:border-[oklch(0.46_0.04_125)] focus:ring-1 focus:ring-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950"
                        />
                        {payments.length > 1 && (
                          <button
                            onClick={() => removePaymentLine(index)}
                            className="text-slate-400 hover:text-red-600"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300">Total Entered</span>
                    <span className="font-semibold text-slate-950 dark:text-slate-100">{formatCurrency(totalPayments)}</span>
                  </div>

                  {difference !== 0 && totalOutstanding > 0 && (
                    <p className={`mt-2 text-xs font-medium ${difference > 0 ? "text-amber-600" : "text-red-600"}`}>
                      {difference > 0
                        ? `${formatCurrency(difference)} remaining to allocate`
                        : `${formatCurrency(Math.abs(difference))} over the selected outstanding amount`}
                    </p>
                  )}

                  {submitError && (
                    <p className="mt-2 text-xs font-medium text-red-600">{submitError}</p>
                  )}

                  <Button
                    className="mt-4 w-full gap-2 bg-[#556043] text-white hover:bg-[#4a533b] disabled:opacity-40"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Receipt className="h-4 w-4" />
                        Collect {formatCurrency(totalOutstanding)}
                      </>
                    )}
                  </Button>
                </div>

              </div>
            </div>
          )}
        </InfoSection>
      )}

    </section>
  )
}