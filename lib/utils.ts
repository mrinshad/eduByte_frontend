import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SCHOOL_TIMEZONE = "Asia/Kolkata"

export function formatDateOnly(value?: string | Date | null) {
  if (!value) return "-"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: SCHOOL_TIMEZONE,
  }).format(date)
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: SCHOOL_TIMEZONE,
  }).format(date)
}

export function formatCurrency(value?: number | string | null) {
  if (value === null || value === undefined) return "₹0";
  const numeric = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(numeric)) return "₹0";
  return `₹${numeric.toLocaleString("en-IN")}`;
}
