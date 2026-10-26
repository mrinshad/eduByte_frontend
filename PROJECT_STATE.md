# Project State & Living Ledger — Frontend

This file tracks the current state, active milestones, architecture matrix, technical debt ledger, and maintenance tasks for the **eduByte Frontend**.

---

## 1. Project Overview

- **Repository**: eduByte Frontend
- **Current Version**: 0.0.1
- **Tech Stack**: Next.js 16 (Turbopack, App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI primitives.
- **Backend Service Contract**: `../backend/` Express REST API via `lib/services/`.

---

## 2. Active Milestones & Feature Status

| Milestone / Feature | Status | Notes / Progress |
| :--- | :--- | :--- |
| **Agentic Engineering System Setup** | Done | Impeccable, Intent, Ponytail, Graphify, Track-Changes configured. |
| **Admin Portal UI (`/admin`)** | Done | Master setup pages for academic year, classes, admissions, and staff. |
| **Workspace Portal UI (`/workspace`)**| Done | Fee counter, charge generation, fines, expenses, and salary slips. |
| **Print Views (`/print`)** | Done | A4 receipts, fee bills, and reports with dedicated print CSS. |
| **Design System Alignment** | Done | OKLCH Sage/Ivory tokens documented in `docs/DESIGN.md`. |
| **Knowledge Graph Synchronization** | Done | 6,890 nodes, 21,357 edges mapped at `frontend/graphify-out/`. |

---

## 3. Architecture Matrix

| Layer | Technology | Primary Directory | Key Config / Entry Point |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 16, React 19, TypeScript | `app/` | `app/layout.tsx` |
| **Styling & Tokens** | Tailwind CSS v4, OKLCH, shadcn/radix | `app/globals.css` | `docs/DESIGN.md` |
| **API Client** | Typed Fetch Services | `lib/services/` | `lib/api.ts`, `lib/api-error.ts` |
| **Auth & Routing** | RBAC AuthGate & Portal Shell | `components/` | `components/auth-gate.tsx` |

---

## 4. Technical Debt Ledger (`ponytail-debt`)

| ID | Location | Description | Severity | Plan / Target |
| :--- | :--- | :--- | :--- | :--- |
| *No outstanding debt entries currently logged.* | — | — | — | — |

---

## 5. Maintenance Checklist

- [x] Agent rules configured (`ui-craft`, `code-discipline`, `change-tracking`, `graphify`).
- [x] Custom `track-changes` skill and workflow added.
- [x] Automated IDE hooks configured in `.codex/hooks.json`.
- [x] Core governance documents established (`AGENTS.md`, `ORCHESTRATION.md`, `DESIGN.md`, `PRODUCT.md`, `CHANGELOG.md`).
- [ ] Initial AST knowledge graph generated (`graphify-out/`).
- [x] Gitignore updated with graphify cache and impeccable binaries.
