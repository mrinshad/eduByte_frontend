# Project State & Living Ledger

This file tracks the current state, active milestones, architecture matrix, technical debt ledger, and maintenance tasks for **eduByte**.

---

## 1. Project Overview

- **Project**: eduByte — School Management & Financial Accounting Platform
- **Current Version**: 0.0.1 (Pre-release / Active Development)
- **Monorepo Architecture**: Dual-repository layout with Express backend (`/backend`) and Next.js frontend (`/frontend`).
- **Core Database**: PostgreSQL managed via Prisma ORM.

---

## 2. Active Milestones & Feature Status

| Milestone / Feature | Status | Notes / Progress |
| :--- | :--- | :--- |
| **Agentic Engineering System Setup** | Done | Impeccable, Intent, Ponytail, Graphify, Track-Changes configured. |
| **Student Lifecycle & Enrollment** | Done | Registration, admissions, multi-year promotion, and relieving workflows. |
| **Fee Structures & Heads** | Done | Dynamic class-based fee structures, charge types, and frequency rules. |
| **Monthly Charge Billing Generation**| Done | Automated generation of recurring monthly fees, transport, and CCA charges. |
| **Fee Collection Counter & Receipts** | Done | Thermal and A4 receipt generation, multi-head transaction allocation. |
| **Late Fines & Penalties** | Done | Rules engine, fine waiving, and automatic overdue calculations. |
| **Transport & Vehicle Fleet** | Done | Vehicle assignments, route pricing, and driver records. |
| **Co-Curricular Activities (CCA)** | Done | Student activity enrollment, charge synchronization, and per-student fee overrides. |
| **Spreadsheet Financial Data Sync** | Done | Standalone single-file JS seeder (`sheets/seed_sheets_data.js`) with 2 Dev accounts (`*` wildcard access), 29 staff logins, Chart of Accounts, Expense categories, and exact verified tuition/transport/madrasa/CCA data. Harmonized with `backend/scripts/seed_production_real.js`. |
| **Annual Fee Forecast Engine** | Done | Full academic year demand forecasting workbook (`.xlsx`) & printable report (`.html`) across 189 students. |
| **Staff & Payroll Management** | Done | Staff directory and monthly salary slip generator. |
| **Accounts & Expense Management** | Done | Expense vouchers, account categories, and payment receipts. |
| **Executive Reports (13 Modules)** | Done | Fee Defaulter, Daily Cash Summary, Head-wise Breakdown. |
| **Security Audit & Hardening (Run-1)** | Done | Remediated all High/Medium CVE/CWE authorization gaps, token secrets, and login rate limiting. |
| **Knowledge Graph Synchronization** | Done | 7,538 nodes, 23,397 edges, 226 communities mapped at `graphify-out/`. |

---

## 3. Architecture Matrix

| Layer | Technology | Primary Directory | Key Config / Entry Point |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind v4, Radix UI | `frontend/` | `app/layout.tsx`, `app/globals.css` |
| **Backend** | Express 5, Node.js (CommonJS), Zod | `backend/` | `src/server.js`, `src/app.js` |
| **Database & ORM**| PostgreSQL, Prisma ORM 6.19 | `backend/prisma/` | `schema.prisma`, `prisma.config.ts` |
| **Design System** | OKLCH Sage/Ivory palette, Cormorant Garamond, Plus Jakarta Sans | `docs/DESIGN.md` | `frontend/app/globals.css` |
| **Agent Tooling** | Impeccable, Intent, Ponytail, Graphify | `.agents/` | `AGENTS.md`, `.codex/hooks.json` |

---

## 4. Technical Debt Ledger (`ponytail-debt`)

Record any intentional shortcuts, deferred abstractions, or temporary workarounds using `shortcut:` or `ponytail:` comments in code.

| ID | Location | Description | Severity | Plan / Target |
| :--- | :--- | :--- | :--- | :--- |
| *No outstanding debt entries currently logged.* | — | — | — | — |

---

## 5. Maintenance Checklist

- [x] Git repository initialized at root.
- [x] Agent rules configured (`ui-craft`, `code-discipline`, `change-tracking`, `graphify`).
- [x] Custom `track-changes` skill and workflow added.
- [x] Automated IDE hooks configured in `.codex/hooks.json`.
- [x] Core governance documents established (`AGENTS.md`, `ORCHESTRATION.md`, `DESIGN.md`, `PRODUCT.md`, `CHANGELOG.md`).
- [x] Initial AST knowledge graph generated (`graphify-out/`).
- [x] Gitignore updated with graphify cache and impeccable binaries.
