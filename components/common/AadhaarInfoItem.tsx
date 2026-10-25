"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

export function AadhaarInfoItem({
  value,
  label = "Aadhaar no.",
}: {
  value?: string | null
  label?: string
}) {
  const [isUnmasked, setIsUnmasked] = React.useState(false)

  if (!value || value.trim() === "" || value === "—") {
    return (
      <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="mt-2 text-sm font-medium text-slate-950 dark:text-slate-100">—</div>
      </div>
    )
  }

  const rawClean = value.replace(/[\s-]+/g, "")
  const maskedValue =
    rawClean.length >= 4
      ? `•••• •••• ${rawClean.slice(-4)}`
      : "•••• •••• ••••"

  const displayValue = isUnmasked
    ? rawClean.replace(/(\d{4})(?=\d)/g, "$1 ")
    : maskedValue

  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <button
          type="button"
          onClick={() => setIsUnmasked(!isUnmasked)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title={isUnmasked ? "Mask Aadhaar" : "Unmask Aadhaar for verification"}
          aria-label={isUnmasked ? "Mask Aadhaar" : "Unmask Aadhaar"}
        >
          {isUnmasked ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span>{isUnmasked ? "Hide" : "Show"}</span>
        </button>
      </div>
      <div className="mt-2 font-mono text-sm font-medium tracking-wide text-slate-950 dark:text-slate-100">
        {displayValue}
      </div>
    </div>
  )
}
