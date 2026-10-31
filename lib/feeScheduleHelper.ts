/**
 * Helper to compute 9-month tuition installments and 3-term quarterly schedules
 * for frontend display across Fee Structures, Student Profiles, and Fee Generation.
 */

export interface FeeInstallmentBreakdown {
  isTuition: boolean;
  isTransport: boolean;
  frequency: string;
  scheduleType: "9_MONTH_TUITION" | "3_TERM_TUITION" | "10_MONTH_TRANSPORT" | "STANDARD";
  summaryText: string;
  badgeLabel: string;
  installments?: {
    label: string;
    amount: number;
    note: string;
  }[];
}

export function isTuitionHead(name: string, category?: string): boolean {
  if (category && category.toUpperCase() === "TUITION") return true;
  const lower = (name || "").toLowerCase();
  return lower.includes("tuition") || lower.includes("tution") || lower.includes("term fee");
}

export function isTransportHead(name: string, category?: string): boolean {
  if (category && category.toUpperCase() === "TRANSPORT") return true;
  const lower = (name || "").toLowerCase();
  return lower.includes("transport") || lower.includes("vehicle") || lower.includes("van") || lower.includes("bus");
}

export function getFeeScheduleBreakdown(
  chargeTypeName: string,
  frequency: string,
  totalAmount: number,
  category?: string
): FeeInstallmentBreakdown {
  const isTuition = isTuitionHead(chargeTypeName, category);
  const isTransport = isTransportHead(chargeTypeName, category);
  const freq = (frequency || "").toUpperCase();
  const amount = Number(totalAmount) || 0;

  // 1. 3-Term Quarterly Tuition
  if (isTuition && freq === "QUARTERLY") {
    const rawTerm = amount / 3;
    const roundedTerm = Math.ceil(rawTerm / 100) * 100;
    const remainder = amount - (roundedTerm * 2);
    const least = Math.min(remainder, roundedTerm);
    const regular = Math.max(remainder, roundedTerm);

    return {
      isTuition: true,
      isTransport: false,
      frequency: "QUARTERLY",
      scheduleType: "3_TERM_TUITION",
      badgeLabel: "3 Terms (Direct ÷ 3)",
      summaryText: `Term 1: ₹${least.toLocaleString("en-IN")} (least amount) • Term 2: ₹${regular.toLocaleString("en-IN")} • Term 3: ₹${regular.toLocaleString("en-IN")} (Total: ₹${amount.toLocaleString("en-IN")})`,
      installments: [
        { label: "Term 1 (June)", amount: least, note: "Least amount to ease reopening costs" },
        { label: "Term 2 (September)", amount: regular, note: "Regular term installment" },
        { label: "Term 3 (December)", amount: regular, note: "Covers Dec, Jan, Feb, March (Month 10 has no 4th term)" },
      ],
    };
  }

  // 2. 9-Month Tuition (ANNUAL or MONTHLY with amount > 5000)
  if (isTuition && (freq === "ANNUAL" || (freq === "MONTHLY" && amount >= 5000))) {
    const rawMonthly = amount / 9;
    const roundedMonthly = Math.ceil(rawMonthly / 100) * 100;
    const remainder = amount - (roundedMonthly * 8);

    let m1: number, regular: number, m9: number;
    if (remainder <= roundedMonthly) {
      m1 = roundedMonthly;
      regular = roundedMonthly;
      m9 = remainder;
    } else {
      m1 = remainder;
      regular = roundedMonthly;
      m9 = roundedMonthly;
    }

    return {
      isTuition: true,
      isTransport: false,
      frequency: freq,
      scheduleType: "9_MONTH_TUITION",
      badgeLabel: "9 Monthly Installments",
      summaryText: remainder <= roundedMonthly
        ? `Months 1–8: ₹${regular.toLocaleString("en-IN")}/mo • Month 9: ₹${m9.toLocaleString("en-IN")} (Remainder) • Month 10: ₹0 (Complete)`
        : `Month 1: ₹${m1.toLocaleString("en-IN")} • Months 2–9: ₹${regular.toLocaleString("en-IN")}/mo • Month 10: ₹0 (Complete)`,
      installments: [
        { label: "Months 1–8", amount: regular, note: `₹${regular.toLocaleString("en-IN")} / month` },
        { label: "Month 9 (February)", amount: m9, note: `₹${m9.toLocaleString("en-IN")} (Final balance)` },
        { label: "Month 10 (March)", amount: 0, note: "₹0 (Tuition completely paid off)" },
      ],
    };
  }

  // 3. 10-Month Transportation
  if (isTransport) {
    return {
      isTuition: false,
      isTransport: true,
      frequency: freq || "MONTHLY",
      scheduleType: "10_MONTH_TRANSPORT",
      badgeLabel: "10 Months (June to March)",
      summaryText: `All 10 months (June to March) @ ₹${amount.toLocaleString("en-IN")}/mo • Editable at collection desk if student visits relatives`,
      installments: [
        { label: "Months 1–10 (June to March)", amount, note: "Active all 10 academic months" },
      ],
    };
  }

  // 4. Standard Head
  return {
    isTuition,
    isTransport,
    frequency: freq,
    scheduleType: "STANDARD",
    badgeLabel: freq || "STANDARD",
    summaryText: `Billed as ${freq.toLowerCase()} charge of ₹${amount.toLocaleString("en-IN")}`,
  };
}
