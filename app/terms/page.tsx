"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  FileText,
  ArrowLeft,
  Building2,
  Server,
  SunMedium,
  MoonStar,
  CheckCircle2,
  Scale,
  ShieldAlert,
  Download,
  Mail,
  HelpCircle,
  ChevronRight,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Table of Contents Definition ── */
const TOC_ITEMS = [
  { id: "licence", label: "Software Usage Licence", num: "1" },
  { id: "hosting", label: "Hosting & Maintenance", num: "2" },
  { id: "obligations", label: "School Obligations", num: "3" },
  { id: "fees", label: "Fees & Billing", num: "4" },
  { id: "data-ownership", label: "Data Ownership & Export", num: "5" },
  { id: "termination", label: "Termination & Decommissioning", num: "6" },
  { id: "liability", label: "Disclaimers & Liability", num: "7" },
  { id: "governing-law", label: "Governing Law & Contact", num: "8" },
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-bold text-blue-500/60 dark:text-blue-400/60 tabular-nums">
          §{num}
        </span>
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
          {title}
        </h2>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════ */
/*  Main Page Component                              */
/* ══════════════════════════════════════════════════ */
export default function TermsAndConditionsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("licence");

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.04),_transparent_50%)] bg-slate-50 text-slate-900 dark:bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.1),_transparent_50%)] dark:bg-slate-950 dark:text-slate-100 transition-colors">
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
              <span className="rounded bg-blue-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 uppercase tracking-widest">
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
              <Link href="/privacy">Privacy Policy</Link>
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
                    ? "bg-blue-500/10 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
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
                  href="/privacy"
                  className="group flex items-center gap-1.5 text-[11px] text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                >
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  Privacy Policy
                </Link>
              </div>
            </nav>
          </aside>

          {/* ── Main Content Column ── */}
          <main className="min-w-0 py-8 pb-16 lg:py-10">
            <div className="space-y-8">
              {/* ── Document Header ── */}
              <header className="space-y-4 border-b border-slate-200 pb-8 dark:border-slate-800">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/8 px-3 py-1">
                  <Scale className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                    Software &amp; Service Agreement
                  </span>
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">
                  Terms &amp; Conditions
                </h1>

                <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  These terms govern the institutional usage, software
                  licensing, hosting, and technical maintenance of the{" "}
                  <strong>eduByte School Management System</strong> provided by{" "}
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
              {/* §1 — Software Usage Licence & Scope          */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="licence"
                  num="1"
                  icon={Building2}
                  title="Software Usage Licence & Scope"
                />

                <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  <p>
                    Subject to the terms of the institutional service order,{" "}
                    <strong>Byten Solutions</strong> grants the client
                    educational institution (the <strong>School</strong>) a
                    non-exclusive, non-transferable, revocable licence to access
                    and use the eduByte software solely for its internal
                    educational and administrative operations.
                  </p>

                  <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-4 dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-900/30">
                    <p className="mb-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                      Intellectual Property
                    </p>
                    <p>
                      All intellectual property rights, source code, UI designs,
                      system architectures, trademarks, and database schemas
                      associated with eduByte remain the exclusive property of
                      Byten Solutions. Nothing in this agreement transfers
                      ownership of the underlying software to the School.
                    </p>
                  </div>
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §2 — Hosting & Technical Maintenance          */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="hosting"
                  num="2"
                  icon={Server}
                  title="Hosting & Technical Maintenance Services"
                />

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  Byten Solutions provides hosted application infrastructure and
                  technical maintenance under the following scope:
                </p>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
                      Cloud Infrastructure
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Hosting of application servers, Next.js frontend
                      interfaces, and PostgreSQL databases via managed cloud
                      providers (such as Render, Vercel, and Supabase / AWS).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
                      Patches &amp; Security Updates
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Application of security patches, framework maintenance,
                      RBAC hardening, and dependency bug fixes as developed by
                      Byten Solutions.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
                      Backups &amp; Disaster Recovery
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Database backups are maintained per the institutional
                      hosting tier agreed upon between Byten Solutions and the
                      School.
                    </p>

                  </div>
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §3 — School Obligations & Acceptable Use      */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="obligations"
                  num="3"
                  icon={CheckCircle2}
                  title="School Obligations & Acceptable Use"
                />

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  The School agrees to uphold the following operational
                  obligations:
                </p>

                <div className="space-y-3">
                  {[
                    {
                      title: "Account Credential Confidentiality",
                      desc: "The School is responsible for maintaining the confidentiality of staff login credentials, enforcing strong passwords, and promptly deactivating accounts of departed personnel.",
                    },
                    {
                      title: "Data Accuracy & Lawful Collection",
                      desc: "The School is solely responsible for ensuring that all student, parent, and financial records entered into the system are accurate, lawfully collected, and compliant with applicable educational regulations and parental notices.",
                    },
                    {
                      title: "Prohibition of Reverse Engineering",
                      desc: "The School and its authorized users shall not decompile, reverse engineer, disassemble, copy, or create derivative works of the eduByte software.",
                    },
                    {
                      title: "No Unauthorized Automated Access",
                      desc: "Scraping, automated vulnerability scanning against production without prior written agreement, or intentional system overload is strictly prohibited.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §4 — Fees, Billing & Service Tiers            */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="fees"
                  num="4"
                  icon={FileText}
                  title="Fees, Billing & Service Tiers"
                />

                <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  <p>
                    Subscription licence fees, implementation charges, custom
                    module development, and hosting maintenance costs are set
                    forth in the specific institutional purchase order or service
                    agreement executed between the School and Byten Solutions.
                  </p>


                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §5 — Data Ownership & Export                  */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="data-ownership"
                  num="5"
                  icon={Download}
                  title="Data Ownership & Export Rights"
                />

                <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      100% School Data Ownership
                    </p>
                    <p className="mt-1">
                      All institutional data, student files, academic grades,
                      attendance tallies, financial vouchers, and staff rosters
                      uploaded to or created within eduByte remain the exclusive
                      property of the School.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Export Provisions
                    </p>
                    <p className="mt-1">
                      Authorized school administrators may at any time export
                      student listings, fee records, daily daybooks, and payroll
                      summaries in standard open formats (e.g. CSV, printable
                      vouchers) directly from the portal interface.
                    </p>
                  </div>
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §6 — Termination & Decommissioning            */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="termination"
                  num="6"
                  icon={ShieldAlert}
                  title="Term, Termination & Decommissioning"
                />

                <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Agreement Term
                    </p>
                    <p className="mt-1">
                      This agreement commences upon the institutional effective
                      date and continues for the subscription term specified in
                      the institutional service order.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Termination for Cause
                    </p>
                    <p className="mt-1">
                      Either party may terminate upon 30 days written notice if
                      the other party materially breaches this agreement and
                      fails to remedy the breach within the notice window.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Post-Termination Transition &amp; Deletion
                    </p>
                    <p className="mt-1.5">Upon termination of services:</p>
                    <ul className="mt-2 space-y-1.5 list-disc pl-4 marker:text-slate-300 dark:marker:text-slate-600">
                      <li>
                        The School is granted a transition period of 30 days to
                        request a complete database dump or final export of
                        school records.
                      </li>
                      <li>
                        Following the transition period, Byten Solutions
                        decommissions institutional tenant storage and securely
                        purges the database per the institutional exit plan.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §7 — Disclaimers & Limitation of Liability    */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="liability"
                  num="7"
                  icon={HelpCircle}
                  title="Disclaimers & Limitation of Liability"
                />

                <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Service Availability
                    </p>
                    <p className="mt-1">
                      While Byten Solutions uses commercial best efforts and
                      robust cloud platforms to maintain uptime, software and
                      hosting services are provided on an &ldquo;as-is&rdquo;
                      and &ldquo;as-available&rdquo; basis. Byten Solutions does
                      not warrant that operation will be entirely uninterrupted
                      or error-free.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Exclusion of Consequential Damages
                    </p>
                    <p className="mt-1">
                      To the maximum extent permitted by applicable law, neither
                      party shall be liable to the other for indirect,
                      incidental, punitive, or consequential damages (including
                      loss of anticipated school revenues or third-party
                      telecommunications outages) arising out of or related to
                      this agreement.
                    </p>
                  </div>


                </div>
              </section>

              {/* ════════════════════════════════════════════ */}
              {/* §8 — Governing Law & Contact                  */}
              {/* ════════════════════════════════════════════ */}
              <section className="space-y-4">
                <SectionHeading
                  id="governing-law"
                  num="8"
                  icon={Mail}
                  title="Governing Law & Institutional Contact"
                />

                <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">


                  <p>
                    For contractual inquiries, service agreements, or
                    institutional support, please contact:
                  </p>

                  {/* Contact Card */}
                  <div className="overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent dark:border-blue-500/15 dark:from-blue-500/5">
                    <div className="p-5">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Byten Solutions
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Software &amp; Hosting Services
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <a
                          href="mailto:bytensolution@gmail.com"
                          className="text-xs font-semibold text-blue-600 underline underline-offset-2 hover:opacity-80 dark:text-blue-400"
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
                  href="/privacy"
                  className="underline underline-offset-2 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Privacy Policy
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
