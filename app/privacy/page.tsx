"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Building2,
  Users,
  Database,
  FileText,
  Mail,
  SunMedium,
  MoonStar,
  CheckCircle2,
  Server,
  KeyRound,
  Eye,
  ChevronRight,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Table of Contents Definition ── */
const TOC_ITEMS = [
  { id: "parties", label: "Respective Responsibilities", num: "1" },
  { id: "categories", label: "Categories of Information", num: "2" },
  { id: "purposes", label: "Purposes of Processing", num: "3" },
  { id: "access-controls", label: "Access Controls & Masking", num: "4" },
  { id: "infrastructure", label: "Infrastructure & Sub-Processors", num: "5" },
  { id: "retention", label: "Retention, Export & Deletion", num: "6" },
  { id: "contact", label: "Privacy Inquiries & Contact", num: "7" },
];



/* ── Section Heading Component ── */
function SectionHeading({
  id,
  num,
  icon: Icon,
  title,
}: {
  id: string;
  num: string;
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-700/50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#556043]/10 text-[#556043] dark:bg-emerald-500/15 dark:text-emerald-400">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-bold text-[#556043]/60 dark:text-emerald-500/60 tabular-nums">
          §{num}
        </span>
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
          {title}
        </h2>
      </div>
    </div>
  );
}

/* ── Info Card Component ── */
function InfoCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-150 bg-gradient-to-b from-slate-50/80 to-white p-4 dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-900/30">
      {title && (
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
      )}
      <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════ */
/*  Main Page Component                              */
/* ══════════════════════════════════════════════════ */
export default function PrivacyPolicyPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("parties");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  /* Intersection Observer for active TOC tracking */
  React.useEffect(() => {
    if (!mounted) return;
    const sections = TOC_ITEMS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted]);

  const isDarkTheme = mounted && resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDarkTheme ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(85,96,67,0.06),_transparent_50%)] bg-slate-50 text-slate-900 dark:bg-[radial-gradient(ellipse_at_top,_rgba(85,96,67,0.15),_transparent_50%)] dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* ── Sticky Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <Link href="/">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back to Sign In</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                eduByte
              </span>
              <span className="rounded bg-[#556043]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#556043] dark:bg-emerald-500/20 dark:text-emerald-300 uppercase tracking-widest">
                Legal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 rounded-lg text-[11px] border-slate-200 text-slate-200 dark:border-slate-800 dark:text-slate-300"
            >
              <Link href="/terms">Terms &amp; Conditions</Link>
            </Button>
            {mounted && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {isDarkTheme ? (
                  <SunMedium className="h-4 w-4" />
                ) : (
                  <MoonStar className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Document Layout: TOC Sidebar + Content ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10 xl:grid-cols-[240px_1fr]">
          {/* ── Sticky Table of Contents (Desktop) ── */}
          <aside className="hidden lg:block">
            <nav className="sticky top-20 space-y-1 py-10">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                On this page
              </p>
              {TOC_ITEMS.map(({ id, label, num }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] leading-snug transition-all duration-200 ${activeSection === id
                    ? "bg-[#556043]/10 font-semibold text-[#556043] dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                    }`}
                >
                  <span className="w-4 shrink-0 text-right tabular-nums text-[10px] opacity-60">
                    {num}
                  </span>
                  <span>{label}</span>
                </a>
              ))}

              {/* Quick Link */}
              <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Link
                  href="/terms"
                  className="group flex items-center gap-1.5 text-[11px] text-slate-400 transition-colors hover:text-[#556043] dark:text-slate-500 dark:hover:text-emerald-400"
                >
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  Terms &amp; Conditions
                </Link>
              </div>
            </nav>
          </aside>

          {/* ── Main Content Column ── */}
          <main className="min-w-0 py-8 pb-16 lg:py-10">
            <div className="space-y-8">
              {/* ── Document Header ── */}
              <header className="space-y-4 border-b border-slate-200 pb-8 dark:border-slate-800">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Data Protection &amp; Privacy
                  </span>
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">
                  Privacy Policy
                </h1>

                <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  This document outlines how student, parent, and staff data is
                  managed within the eduByte School Management System provided by{" "}
                  <strong>Byten Solutions</strong> to client educational
                  institutions.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Effective: October 2026</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span>Version 1.0</span>
                </div>
              </header>



              {/* ── Mobile Table of Contents ── */}
              <details className="group rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:hidden">
                <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    Table of Contents
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <nav className="mt-3 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {TOC_ITEMS.map(({ id, label, num }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <span className="w-4 shrink-0 text-right tabular-nums text-[10px] text-slate-400">
                        {num}
                      </span>
                      {label}
                    </a>
                  ))}
                </nav>
              </details>

              {/* ════════════════════════════════════════════ */}
              {/* §1 — Respective Responsibilities            */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="parties"
                  num="1"
                  icon={Building2}
                  title="Respective Responsibilities: School vs. Byten Solutions"
                />

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  In the context of school management software, privacy law
                  distinguishes between the party that controls the purposes of
                  data processing (the <strong>School</strong>) and the
                  technology provider processing data on their behalf (
                  <strong>Byten Solutions</strong>).
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard title="The School (Data Controller / Fiduciary)">
                    <ul className="space-y-1.5 list-disc pl-4 marker:text-slate-300 dark:marker:text-slate-600">
                      <li>
                        Directly establishes relationships with students,
                        parents, guardians, and staff.
                      </li>
                      <li>
                        Determines what records are entered into eduByte for
                        academic and administrative operations.
                      </li>
                      <li>
                        Obtains necessary parental consents and provides
                        statutory privacy disclosures.
                      </li>
                      <li>
                        Creates and assigns user accounts, designations, and
                        administrative permissions.
                      </li>
                      <li>
                        Receives and handles requests for data access,
                        correction, or deletion from data subjects.
                      </li>
                    </ul>
                  </InfoCard>

                  <InfoCard title="Byten Solutions (Software & Hosting Provider)">
                    <ul className="space-y-1.5 list-disc pl-4 marker:text-slate-300 dark:marker:text-slate-600">
                      <li>
                        Provides and maintains the eduByte software, database
                        storage, and hosting environment.
                      </li>
                      <li>
                        Processes school data solely on instructions from
                        authorized school administrators.
                      </li>
                      <li>
                        Implements technical access controls, Role-Based Access
                        Control (RBAC), and encryption.
                      </li>
                      <li>
                        Never sells, rents, commercializes, or uses student or
                        school data for advertising.
                      </li>
                      <li>
                        Assists the school with technical data export and
                        deletion upon contract termination.
                      </li>
                    </ul>
                  </InfoCard>
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §2 — Categories of Information               */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="categories"
                  num="2"
                  icon={Database}
                  title="Categories of Information Handled"
                />

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  eduByte processes only the institutional data entered by
                  authorized school staff to facilitate educational operations:
                </p>

                <div className="space-y-3">
                  <InfoCard title="Student & Minor Records">
                    Student full name, date of birth, gender, admission number,
                    enrollment class and division, academic records, attendance,
                    transportation assignments, disciplinary notes, and optional
                    demographic or identification fields (such as Aadhaar
                    number, religion, community, or category when configured by
                    the school for official reporting).
                  </InfoCard>

                  <InfoCard title="Parent & Guardian Information">
                    Guardian names, primary contact phone numbers, email
                    addresses, residential address, fee billing history,
                    transaction receipts, and student pickup/relieving
                    verifications.
                  </InfoCard>

                  <InfoCard title="Staff & Personnel Records">
                    Staff member name, employee code, designation, contact
                    numbers, official email, date of joining, employment status,
                    and basic salary / disbursed payroll vouchers (which are
                    strictly restricted to authorized payroll personnel).
                  </InfoCard>

                  <InfoCard title="System Activity & Security Audit Logs">
                    User login timestamps, administrative actions performed
                    (creation, editing, or deletion of records), IP addresses,
                    and session identifiers. System audit logs are sanitized to
                    exclude sensitive personal values from raw change diffs.
                  </InfoCard>
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §3 — Purposes of Processing                 */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="purposes"
                  num="3"
                  icon={FileText}
                  title="Operational Purposes of Data Processing"
                />

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  Data entered into eduByte is processed strictly to support
                  genuine school operations:
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Student admissions, enrollment management, and academic promotion tracking",
                    "Fee generation, receipt reconciliation, and daybook accounting",
                    "School transportation, bus route allocation, and fleet management",
                    "Staff remuneration records and institutional expense tracking",
                    "Administrative auditing, error tracking, and system security monitoring",
                    "Communication with parents regarding student dues, notices, or relieving status",
                  ].map((purpose) => (
                    <div
                      key={purpose}
                      className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {purpose}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §4 — Access Controls & Masking               */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="access-controls"
                  num="4"
                  icon={KeyRound}
                  title="Technical Access Controls & Masking"
                />

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  eduByte implements granular Role-Based Access Control (RBAC)
                  enforced on the application server. Access to sensitive data
                  is compartmentalized:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#556043] dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
                        Staff Salary Masking
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        Users without explicit payroll permissions (e.g. general
                        staff viewers or administrative assistants) cannot view
                        staff basic salaries, disbursed voucher amounts, or
                        generate salary slips. The API returns{" "}
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          basicSalary: null
                        </code>{" "}
                        and the interface displays &ldquo;No Access&rdquo;.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <Eye className="mt-0.5 h-4 w-4 shrink-0 text-[#556043] dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
                        Aadhaar Privacy &amp; Masking
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        In bulk student directory views, Aadhaar numbers are
                        masked by default. On individual student detail
                        profiles, authorized staff see a masked format (
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          •••• •••• 1234
                        </code>
                        ) with a manual unmask toggle to facilitate authorized
                        institutional verifications.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#556043] dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
                        Audit Redaction
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        Internal audit logging automatically redacts sensitive
                        attributes (including Aadhaar, mobile numbers,
                        demographics, salaries, and credentials) before storing
                        records in database audit trails.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §5 — Infrastructure & Sub-Processors         */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="infrastructure"
                  num="5"
                  icon={Server}
                  title="Third-Party Infrastructure & Sub-Processors"
                />

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  Byten Solutions utilizes vetted third-party cloud
                  infrastructure to deliver the eduByte application:
                </p>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60">
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-900 dark:text-slate-100">
                          Service Layer
                        </th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-900 dark:text-slate-100">
                          Provider
                        </th>
                        <th className="hidden px-4 py-2.5 text-left font-semibold text-slate-900 dark:text-slate-100 sm:table-cell">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr className="bg-white dark:bg-slate-900/30">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          Frontend Delivery
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          Vercel Inc.
                        </td>
                        <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 sm:table-cell">
                          Static assets and Next.js interfaces over HTTPS with
                          edge caching
                        </td>
                      </tr>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          Application Runtime
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          Render Services Inc.
                        </td>
                        <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 sm:table-cell">
                          Node.js Express API, business logic, and RBAC
                          authorization
                        </td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-900/30">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          Database Storage
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          Supabase Inc. / AWS
                        </td>
                        <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 sm:table-cell">
                          PostgreSQL databases, connection pooling, and storage
                          volumes
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>


              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §6 — Retention, Export & Deletion             */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="retention"
                  num="6"
                  icon={FileText}
                  title="Data Retention, Export & Deletion"
                />

                <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      School-Controlled Retention
                    </p>
                    <p className="mt-1">
                      Because educational records are subject to state
                      educational regulations, tax audits, and statutory
                      requirements, retention schedules are determined by the
                      School as the data fiduciary. eduByte retains school
                      records for the duration of the institutional contract.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Soft Deletion vs Permanent Purge
                    </p>
                    <p className="mt-1">
                      Daily operational deletions (such as archiving a student
                      or staff record) currently mark records as soft-deleted (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        isDeleted: true
                      </code>
                      ) to preserve financial audit integrity and prevent
                      accidental data loss.
                    </p>
                  </div>


                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §7 — Privacy Inquiries & Contact              */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="contact"
                  num="7"
                  icon={Mail}
                  title="Privacy Inquiries & Contact Channels"
                />

                <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      For Students, Parents &amp; Staff
                    </p>
                    <p className="mt-1">
                      Because your data was provided to your educational
                      institution, all requests for data review, correction,
                      leaving certificate export, or account deactivation must
                      be directed to your{" "}
                      <strong>School Administration Office</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      For Schools &amp; Institutional Administrators
                    </p>
                    <p className="mt-1">
                      School administrators with questions regarding software
                      security, technical data processing, or sub-processor
                      updates may contact Byten Solutions:
                    </p>
                  </div>

                  {/* Contact Card */}
                  <div className="overflow-hidden rounded-xl border border-[#556043]/20 bg-gradient-to-br from-[#556043]/5 to-transparent dark:border-emerald-500/20 dark:from-emerald-500/5">
                    <div className="p-5">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Byten Solutions
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Software Provider &amp; Technology Partner
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#556043] dark:text-emerald-400" />
                        <a
                          href="mailto:bytensolution@gmail.com"
                          className="text-xs font-semibold text-[#556043] underline underline-offset-2 hover:opacity-80 dark:text-emerald-400"
                        >
                          bytensolution@gmail.com
                        </a>
                      </div>


                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Page Footer ── */}
            <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row">
              <p>
                &copy; {new Date().getFullYear()} Byten Solutions. All rights
                reserved.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/terms"
                  className="underline underline-offset-2 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Terms &amp; Conditions
                </Link>
                {/* <span className="text-slate-300 dark:text-slate-700">•</span>
                <Link
                  href="/"
                  className="underline underline-offset-2 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Sign In Portal
                </Link> */}
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
