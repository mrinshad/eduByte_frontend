# Engineering & Design System Guidelines

This repository is governed by strict agent skillsets, design craft standards, code discipline, and change tracking.

## 1. Project Context & Authoritative Documents
- **Brand & Services**: docs/PRODUCT.md
- **Visual Design & Tokens**: docs/DESIGN.md
- **Agent Orchestration & Backend Coordination**: docs/ORCHESTRATION.md
- **Active State & Roadmap**: PROJECT_STATE.md
- **Version History & Changes**: CHANGELOG.md
- **Architecture Decisions**: docs/adr/
- **Codebase Knowledge Graph**: graphify-out/GRAPH_REPORT.md

## 2. Core Agent Rules
All agents operating in this repository must respect the rules in `.agents/rules/`:
1. **UI & UX Craft** (`.agents/rules/ui-craft.md`): Reject generic "AI slop", unprompted gradients, low contrast, and unverified mockups.
2. **Code Discipline** (`.agents/rules/code-discipline.md`): Enforce the Ponytail 7-step Necessity Ladder. Rely on standard library and native features before adding packages.
3. **Change Tracking** (`.agents/rules/change-tracking.md`): Log modifications in CHANGELOG.md, keep PROJECT_STATE.md updated, and record ADRs for structural changes.
4. **Knowledge Graph** (`.agents/rules/graphify.md`): Query `graphify-out/` before answering complex codebase architecture questions.

## 3. Available Skill Commands
- **UI Craft (Impeccable)**: `/audit`, `/critique`, `/polish`, `/typeset`, `/adapt`, `/bolder`, `/quieter`
- **UX Strategy (Intent)**: `/strategize`, `/wireframe`, `/articulate`, `/evaluate`, `/fortify`
- **Code Quality (Ponytail)**: `/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`
- **Knowledge Graph (Graphify)**: `/graphify`, `/graphify update`
- **Change Management**: `/track-changes`

---

# eduByte Frontend — Next.js Agent Architecture & Orchestration Guide

This guide covers the **eduByte Frontend**, a single-page school management application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## 4. Directory Structure & Key Files

```
frontend/
├── AGENTS.md                  # This file
├── app/
│   ├── AGENTS.md              # App Router pages index, routing map, portals guide
│   ├── layout.tsx             # Root HTML, fonts, ThemeProvider, Toast provider
│   ├── page.tsx               # Login page & portal redirection
│   ├── admin/                 # Admin portal (Master setup, admissions, academic config)
│   ├── workspace/             # Workspace portal (Daily fee, billing, expense operations)
│   ├── print/                 # Print-optimized receipt and report views
│   └── switch-portal/         # Portal switcher dialog/redirect
├── components/
│   ├── app-shell.tsx          # Main layout container (Navbar, Sidebar, Main Content)
│   ├── portal-shell.tsx       # Shell wrapper handling portal switching
│   ├── auth-gate.tsx          # Authentication and RBAC permission gate for routes
│   ├── navbar.tsx             # Top navigation bar, user menu, academic year selector
│   ├── sidebar.tsx            # Left navigation sidebar with active portal routes
│   ├── navbar-section-search.tsx # Global cmd+k command/section search modal
│   ├── common/                # Shared dialogs, data tables, filter toolbars, pickers
│   ├── fees/                  # Fee collection dialogs, charge lists, receipt components
│   └── ui/                    # Primitives based on Radix UI (Button, Dialog, Input, Table, etc.)
└── lib/
    ├── api.ts                 # Base HTTP client (`apiFetch`) with JWT auth headers
    ├── api-error.ts           # Standardized API error parser and error toast trigger
    ├── auth.ts                # Session management, token persistence, login state
    ├── academic-year-store.ts # Global state for selected academic year
    ├── portal.ts              # Route metadata, permissions, and sidebar navigation items
    ├── utils.ts               # Utility helpers: `cn()`, currency and date formatters
    └── services/
        └── AGENTS.md          # Complete catalog of all 31 backend API service clients
```

---

## 5. The Two-Portal Architecture

EduByte separates system capabilities into two distinct operational portals:

1. **Admin Portal (`/admin/*`)**:
   - Focus: Institutional setup, system configuration, academic definitions, master lists, user privileges.
   - Core Pages: Academic profile, classes, divisions, fee structures, charge types, accounts, staff, student directory, admissions, promotion, relieving, roles, and permissions.
2. **Workspace Portal (`/workspace/*`)**:
   - Focus: Daily high-frequency administrative and financial transactions.
   - Core Pages: Fee collection, receipt generation, student monthly charges generation, fine assessment, school expense tracking, salary slip generation, and financial reports.

*Both portals are governed by [components/auth-gate.tsx](file:///Users/apple/Byten/eduByte/frontend/components/auth-gate.tsx) which checks user authentication and verifies permission keys against user roles.*

---

## 6. Data Fetching & Service Conventions

> [!CRITICAL]
> **Never call `fetch()` directly in page components or forms.**
> All API communication must go through typed service functions in [lib/services/](file:///Users/apple/Byten/eduByte/frontend/lib/services/).

### Standard Service Invocation Pattern:
```typescript
import { useState, useEffect } from "react";
import { getActiveStudents } from "@/lib/services/student";
import { toast } from "sonner";

export default function StudentSelector() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getActiveStudents();
        setStudents(res.data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ...
}
```

---

## 7. Dual-Repo Coordination with Backend

This frontend operates in conjunction with the backend repository at `../backend`:
1. **API Contracts**: Backend endpoints return `{ success: boolean, data: any, message?: string, errors?: any[] }`. Handled through [`lib/api-error.ts`](file:///Users/apple/Byten/eduByte/frontend/lib/api-error.ts).
2. **Service Synchronization**: When backend endpoints are updated in `../backend/src/modules/`, update or create matching client methods in [`lib/services/`](file:///Users/apple/Byten/eduByte/frontend/lib/services/).
3. **No Duplicate Filtering**: Rely on backend query parameters (`page`, `limit`, `search`, `status`, `academicYearId`) rather than client-side array filtering.

---

## 8. Verification & Quality Checks

Before completing any frontend task, always execute:

```bash
cd /Users/apple/Byten/eduByte/frontend

# 1. Typecheck the entire project (Zero errors allowed)
npm run typecheck

# 2. Run ESLint
npm run lint
```
