/**
 * Helper to compute 9-month tuition installments and 3-term quarterly schedules
 * for frontend display across Fee Structures, Student Profiles, and Fee Generation.
 * Strictly adheres to eduByte design system (Sage Green #556043 & Slate neutrals).
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

export interface StudentInstallmentPeriod {
  academicMonthNumber: number; // 1 to 10
  monthName: string; // "June", "July", etc.
  calendarMonth: number; // 1 to 12 (June=6, July=7, ..., March=3)
  periodLabel: string; // "Month 1 (June)", "Term 1 • Month 1 (June)"
  tuitionAmount: number;
  transportAmount: number;
  otherAmount: number;
  totalScheduled: number;
  notes: string;
  isRemainder?: boolean;
  isTuitionFree?: boolean;
  isTermDue?: boolean;
  termNumber?: number; // 1, 2, 3
  // Live billing status if student charges are provided
  generatedStatus?: "PAID" | "PARTIAL" | "OVERDUE" | "PENDING" | "UPCOMING";
  actualBilledAmount?: number;
  actualPaidAmount?: number;
}

export interface StudentCompleteSchedule {
  hasTuition: boolean;
  hasTransport: boolean;
  tuitionFrequency: "MONTHLY" | "QUARTERLY" | "ANNUAL" | null;
  scheduleType: "9_MONTH_TUITION" | "3_TERM_TUITION" | "STANDARD";
  totalAnnualTuition: number;
  totalAnnualTransport: number;
  totalAnnualOther: number;
  totalAnnualCommitment: number;
  monthlyTuitionRate: number;
  finalRemainderTuition: number;
  monthlyTransportRate: number;
  formulaSummary: string;
  transportSummary: string;
  termInstallments?: {
    termNumber: number;
    termLabel: string;
    monthsCovered: string;
    academicMonth: number;
    tuitionAmount: number;
    note: string;
  }[];
  monthlyPeriods: StudentInstallmentPeriod[];
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

export const ACADEMIC_MONTH_INFO: Array<{ academicMonth: number; monthName: string; calendarMonth: number }> = [
  { academicMonth: 1, monthName: "June", calendarMonth: 6 },
  { academicMonth: 2, monthName: "July", calendarMonth: 7 },
  { academicMonth: 3, monthName: "August", calendarMonth: 8 },
  { academicMonth: 4, monthName: "September", calendarMonth: 9 },
  { academicMonth: 5, monthName: "October", calendarMonth: 10 },
  { academicMonth: 6, monthName: "November", calendarMonth: 11 },
  { academicMonth: 7, monthName: "December", calendarMonth: 12 },
  { academicMonth: 8, monthName: "January", calendarMonth: 1 },
  { academicMonth: 9, monthName: "February", calendarMonth: 2 },
  { academicMonth: 10, monthName: "March", calendarMonth: 3 },
];

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

  // 2. 9-Month Tuition (ANNUAL or MONTHLY)
  if (isTuition) {
    if (freq === "ANNUAL" || (freq === "MONTHLY" && amount >= 5000)) {
      // Annual lump sum divided into 9 rounded installments
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
    } else {
      // Flat monthly tuition rate (e.g. ₹2,000/mo) collected across 9 months
      const annualTotal = amount * 9;
      return {
        isTuition: true,
        isTransport: false,
        frequency: "MONTHLY",
        scheduleType: "9_MONTH_TUITION",
        badgeLabel: "9 Monthly Installments",
        summaryText: `Months 1–9: ₹${amount.toLocaleString("en-IN")}/mo • Month 10: ₹0 (Tuition Complete • Annual Total: ₹${annualTotal.toLocaleString("en-IN")})`,
        installments: [
          { label: "Months 1–9 (June to Feb)", amount, note: `₹${amount.toLocaleString("en-IN")} / month` },
          { label: "Month 10 (March)", amount: 0, note: "₹0 (Tuition completely paid off)" },
        ],
      };
    }
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

  // 4. One-Time Head
  if (freq === "ONE_TIME") {
    return {
      isTuition: false,
      isTransport: false,
      frequency: "ONE_TIME",
      scheduleType: "STANDARD",
      badgeLabel: "One-Time Fee",
      summaryText: `One-Time fee of ₹${amount.toLocaleString("en-IN")} • Scheduled for Month 2 (July) in Quarterly plans or Month 1 (June) in Monthly plans`,
      installments: [
        { label: "One-Time", amount, note: "Billed once during the academic year" },
      ],
    };
  }

  // 5. Standard Head
  return {
    isTuition,
    isTransport,
    frequency: freq,
    scheduleType: "STANDARD",
    badgeLabel: freq || "STANDARD",
    summaryText: `Billed as ${freq.toLowerCase()} charge of ₹${amount.toLocaleString("en-IN")}`,
  };
}

/**
 * Computes the complete 10-month academic installment matrix for a student
 * based on all assigned enrollment charges and existing generated charges.
 */
export function calculateStudentCompleteSchedule(
  enrollmentCharges: Array<{
    id?: string;
    chargeTypeName?: string;
    chargeType?: string;
    frequency: string;
    amount?: number | string;
    finalAmount?: number | string;
    category?: string | null;
  }>,
  existingCharges?: Array<{
    id?: string;
    periodMonth?: number | null;
    periodYear?: number | null;
    description?: string | null;
    finalAmount?: number | string | null;
    paidAmount?: number | string | null;
    status?: string | null;
    isDeleted?: boolean;
  }>
): StudentCompleteSchedule {
  let tuitionCharge: any = null;
  let transportCharge: any = null;
  const otherCharges: any[] = [];

  for (const c of enrollmentCharges) {
    const name = c.chargeTypeName || c.chargeType || "";
    const cat = c.category || undefined;
    if (isTuitionHead(name, cat) && !tuitionCharge) {
      tuitionCharge = c;
    } else if (isTransportHead(name, cat) && !transportCharge) {
      transportCharge = c;
    } else {
      otherCharges.push(c);
    }
  }

  const hasTuition = !!tuitionCharge;
  const hasTransport = !!transportCharge;

  let tuitionFrequency: "MONTHLY" | "QUARTERLY" | "ANNUAL" | null = null;
  let scheduleType: "9_MONTH_TUITION" | "3_TERM_TUITION" | "STANDARD" = "STANDARD";
  let totalAnnualTuition = 0;
  let monthlyTuitionRate = 0;
  let finalRemainderTuition = 0;
  let formulaSummary = "";

  let termInstallments: StudentCompleteSchedule["termInstallments"] = undefined;

  // Calculate Tuition
  if (tuitionCharge) {
    const rawAmt = Number(tuitionCharge.finalAmount ?? tuitionCharge.amount ?? 0);
    const freq = (tuitionCharge.frequency || "").toUpperCase();

    if (freq === "QUARTERLY") {
      tuitionFrequency = "QUARTERLY";
      scheduleType = "3_TERM_TUITION";
      totalAnnualTuition = rawAmt;
      const rawTerm = rawAmt / 3;
      const roundedTerm = Math.ceil(rawTerm / 100) * 100;
      const remainder = rawAmt - (roundedTerm * 2);
      const least = Math.min(remainder, roundedTerm);
      const regular = Math.max(remainder, roundedTerm);

      const hasOneTimeCharge = otherCharges.some((c) => (c.frequency || "").toUpperCase() === "ONE_TIME");

      formulaSummary = `Annual Tuition ₹${rawAmt.toLocaleString("en-IN")} divided directly by 3 terms: Term 1: ₹${least.toLocaleString("en-IN")} (least amount for reopening), Term 2: ₹${regular.toLocaleString("en-IN")}, Term 3: ₹${regular.toLocaleString("en-IN")}. Month 10 has no 4th quarter (covered in Term 3).${
        hasOneTimeCharge ? " Any one-time fee (e.g. Admission) is collected in Month 2 (July) to avoid stacking initial costs on Term 1." : ""
      }`;

      termInstallments = [
        {
          termNumber: 1,
          termLabel: "Term 1 (June)",
          monthsCovered: "June, July, August (3 Months)",
          academicMonth: 1,
          tuitionAmount: least,
          note: "Least amount to ease reopening costs",
        },
        {
          termNumber: 2,
          termLabel: "Term 2 (September)",
          monthsCovered: "Sept, Oct, Nov (3 Months)",
          academicMonth: 4,
          tuitionAmount: regular,
          note: "Regular term installment",
        },
        {
          termNumber: 3,
          termLabel: "Term 3 (December)",
          monthsCovered: "Dec, Jan, Feb, March (4 Months)",
          academicMonth: 7,
          tuitionAmount: regular,
          note: "Covers through March 31 • Month 10 has no 4th term",
        },
      ];
    } else if (freq === "ANNUAL" || (freq === "MONTHLY" && rawAmt >= 5000)) {
      tuitionFrequency = freq === "ANNUAL" ? "ANNUAL" : "MONTHLY";
      scheduleType = "9_MONTH_TUITION";
      totalAnnualTuition = rawAmt;
      const rawMonthly = rawAmt / 9;
      const roundedMonthly = Math.ceil(rawMonthly / 100) * 100;
      const remainder = rawAmt - (roundedMonthly * 8);

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

      monthlyTuitionRate = regular;
      finalRemainderTuition = m9;

      formulaSummary = remainder <= roundedMonthly
        ? `Annual Tuition ₹${rawAmt.toLocaleString("en-IN")} divided across 9 months: Months 1–8 @ ₹${regular.toLocaleString("en-IN")}/mo, Month 9 @ ₹${m9.toLocaleString("en-IN")} (final balance), Month 10 @ ₹0 (Tuition Complete).`
        : `Annual Tuition ₹${rawAmt.toLocaleString("en-IN")} divided across 9 months: Month 1 @ ₹${m1.toLocaleString("en-IN")}, Months 2–9 @ ₹${regular.toLocaleString("en-IN")}/mo, Month 10 @ ₹0 (Tuition Complete).`;
    } else {
      // Flat monthly tuition rate (e.g. ₹2,000/mo) across 9 months
      tuitionFrequency = "MONTHLY";
      scheduleType = "9_MONTH_TUITION";
      monthlyTuitionRate = rawAmt;
      totalAnnualTuition = rawAmt * 9;
      formulaSummary = `Monthly Tuition of ₹${rawAmt.toLocaleString("en-IN")}/month collected across 9 academic months (June to February = Total ₹${totalAnnualTuition.toLocaleString("en-IN")}). Month 10 (March) is Tuition Free (₹0 scheduled).`;
    }
  }

  // Calculate Transport
  let monthlyTransportRate = 0;
  let totalAnnualTransport = 0;
  let transportSummary = "";

  if (transportCharge) {
    const rawAmt = Number(transportCharge.finalAmount ?? transportCharge.amount ?? 0);
    monthlyTransportRate = rawAmt;
    totalAnnualTransport = rawAmt * 10;
    transportSummary = `Transport Fee: ₹${rawAmt.toLocaleString("en-IN")}/month active across all 10 academic months (June through March = Total ₹${totalAnnualTransport.toLocaleString("en-IN")}). Cashier can adjust at collection counter if student visits relatives.`;
  }

  // Calculate Other heads (One-time, Annual, or Monthly)
  let totalAnnualOther = 0;
  for (const oc of otherCharges) {
    const amt = Number(oc.finalAmount ?? oc.amount ?? 0);
    const freq = (oc.frequency || "").toUpperCase();
    if (freq === "MONTHLY") {
      totalAnnualOther += amt * 10;
    } else {
      totalAnnualOther += amt;
    }
  }

  // Build the 10 Academic Months
  const monthlyPeriods: StudentInstallmentPeriod[] = [];

  for (const info of ACADEMIC_MONTH_INFO) {
    const m = info.academicMonth;
    const monthName = info.monthName;
    const calendarMonth = info.calendarMonth;

    let tuitionAmount = 0;
    let notes = "";
    let isRemainder = false;
    let isTuitionFree = false;
    let isTermDue = false;
    let termNumber: number | undefined = undefined;

    if (scheduleType === "3_TERM_TUITION" && termInstallments) {
      if (m === 1) {
        tuitionAmount = termInstallments[0].tuitionAmount;
        notes = "Term 1 Installment (Least amount)";
        isTermDue = true;
        termNumber = 1;
      } else if (m === 4) {
        tuitionAmount = termInstallments[1].tuitionAmount;
        notes = "Term 2 Installment";
        isTermDue = true;
        termNumber = 2;
      } else if (m === 7) {
        tuitionAmount = termInstallments[2].tuitionAmount;
        notes = "Term 3 Installment (Covers Dec–March)";
        isTermDue = true;
        termNumber = 3;
      } else if (m === 10) {
        tuitionAmount = 0;
        notes = "Covered under Term 3 (No 4th Quarter)";
        isTuitionFree = true;
      } else {
        tuitionAmount = 0;
        const currentTerm = m < 4 ? "Term 1" : m < 7 ? "Term 2" : "Term 3";
        notes = `Tuition covered under ${currentTerm}`;
      }
    } else if (scheduleType === "9_MONTH_TUITION") {
      if (m <= 8) {
        tuitionAmount = monthlyTuitionRate;
        notes = `Installment ${m} of 9`;
      } else if (m === 9) {
        if (finalRemainderTuition > 0) {
          tuitionAmount = finalRemainderTuition;
          notes = "Final 9th Installment (Remainder Balance)";
          isRemainder = true;
        } else {
          tuitionAmount = monthlyTuitionRate;
          notes = "Installment 9 of 9 (Final Month)";
        }
      } else {
        tuitionAmount = 0;
        notes = "Tuition Complete (₹0 scheduled)";
        isTuitionFree = true;
      }
    } else if (hasTuition) {
      tuitionAmount = monthlyTuitionRate;
      notes = `Monthly Tuition`;
    }

    const transportAmount = hasTransport ? monthlyTransportRate : 0;

    // Calculate other non-tuition, non-transport heads
    let otherAmount = 0;
    for (const oc of otherCharges) {
      const amt = Number(oc.finalAmount ?? oc.amount ?? 0);
      const freq = (oc.frequency || "").toUpperCase();
      if (freq === "MONTHLY") {
        otherAmount += amt;
      } else if (freq === "ONE_TIME") {
        // If 3-term quarterly tuition, one-time charges are collected on next month (Month 2 / July)
        if (scheduleType === "3_TERM_TUITION") {
          if (m === 2) {
            otherAmount += amt;
          }
        } else {
          if (m === 1) {
            otherAmount += amt;
          }
        }
      } else if (m === 1) {
        otherAmount += amt; // Annual charges bill on Month 1
      }
    }

    // In 3-Term Quarterly: if Month 2 has a one-time fee, update notes
    if (scheduleType === "3_TERM_TUITION" && m === 2 && otherAmount > 0) {
      notes = "One-Time Fee Collection • Tuition covered under Term 1";
    }

    const totalScheduled = tuitionAmount + transportAmount + otherAmount;

    let periodLabel = `Month ${m} (${monthName})`;
    if (scheduleType === "3_TERM_TUITION" && isTermDue && termNumber) {
      periodLabel = `Term ${termNumber} • Month ${m} (${monthName})`;
    }

    // Match with existingCharges if provided
    let generatedStatus: StudentInstallmentPeriod["generatedStatus"] = undefined;
    let actualBilledAmount: number | undefined = undefined;
    let actualPaidAmount: number | undefined = undefined;

    if (existingCharges && existingCharges.length > 0) {
      const matching = existingCharges.filter(
        (c) =>
          !c.isDeleted &&
          (c.periodMonth === calendarMonth ||
            (c.description && c.description.toLowerCase().includes(monthName.toLowerCase())))
      );

      if (matching.length > 0) {
        actualBilledAmount = matching.reduce((s, c) => s + Number(c.finalAmount || 0), 0);
        actualPaidAmount = matching.reduce((s, c) => s + Number(c.paidAmount || 0), 0);

        if (actualPaidAmount >= actualBilledAmount && actualBilledAmount > 0) {
          generatedStatus = "PAID";
        } else if (actualPaidAmount > 0) {
          generatedStatus = "PARTIAL";
        } else if (matching.some((c) => c.status === "OVERDUE")) {
          generatedStatus = "OVERDUE";
        } else {
          generatedStatus = "PENDING";
        }
      } else {
        generatedStatus = "UPCOMING";
      }
    }

    monthlyPeriods.push({
      academicMonthNumber: m,
      monthName,
      calendarMonth,
      periodLabel,
      tuitionAmount,
      transportAmount,
      otherAmount,
      totalScheduled,
      notes,
      isRemainder,
      isTuitionFree,
      isTermDue,
      termNumber,
      generatedStatus,
      actualBilledAmount,
      actualPaidAmount,
    });
  }

  const totalAnnualCommitment = totalAnnualTuition + totalAnnualTransport + totalAnnualOther;

  return {
    hasTuition,
    hasTransport,
    tuitionFrequency,
    scheduleType,
    totalAnnualTuition,
    totalAnnualTransport,
    totalAnnualOther,
    totalAnnualCommitment,
    monthlyTuitionRate,
    finalRemainderTuition,
    monthlyTransportRate,
    formulaSummary,
    transportSummary,
    termInstallments,
    monthlyPeriods,
  };
}
