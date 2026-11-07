# Frontend Agent Orchestration & Cross-Repo Coordination Guide

This guide establishes how Intent, Impeccable, Ponytail, Graphify, and Change Tracking operate within the **eduByte Frontend** repository and coordinate with the Backend repository (`../backend`).

---

## 1. The 5-Phase Coordination Lifecycle

```
[Phase 1: Strategy & Structure] (Intent UX: /strategize, /wireframe, /articulate)
               │
               ▼
[Phase 2: Visual Craft & Design Tokens] (Impeccable UI: /polish, /audit, docs/DESIGN.md)
               │
               ▼
[Phase 3: Minimalist Implementation] (Ponytail Code: 7-Step Ladder, /ponytail, typed services)
               │
               ▼
[Phase 4: Knowledge Graph Synchronization] (Graphify: AST update, frontend symbol graph)
               │
               ▼
[Phase 5: Change Audit & Decision Records] (Track Changes: CHANGELOG.md, PROJECT_STATE.md, ADRs)
```

---

## 2. Cross-Repo Coordination with Backend (`../backend`)

Because frontend and backend live in separate Git repositories:
1. **Contract Alignment**:
   - Backend exposes REST endpoints under `/api`.
   - Never call `fetch()` directly in UI components. All calls route through [`lib/services/`](file:///Users/apple/Byten/eduByte/frontend/lib/services/).
   - Response envelope `{ success, data, message, errors }` is consumed by [`lib/api-error.ts`](file:///Users/apple/Byten/eduByte/frontend/lib/api-error.ts).
2. **Feature Branching**:
   - When a feature spans both repositories (e.g. `feature/edit-student-charge-amount`), keep branch names identical across both repositories to maintain traceability.
3. **Changelog & ADR Separation**:
   - Log frontend-specific UI, service, and routing changes in `frontend/CHANGELOG.md`.
   - Architectural decisions concerning client state, bundling, or design systems belong in `frontend/docs/adr/`.

---

## 3. Specialized Subagents
| Subagent | Role | Framework | Focus Area |
| :--- | :--- | :--- | :--- |
| **`ux-strategist`** | UX Strategist | Intent | User journeys, wireframing, content articulation |
| **`ui-craftsman`** | UI Craftsman | Impeccable | Visual polish, typography, tokens, contrast check |
| **`ponytail-engineer`** | Minimalist Dev | Ponytail | 7-step Necessity Ladder, clean code, native APIs |
| **`system-auditor`** | Change Auditor | Change Tracking + Graphify | Git diff audit, CHANGELOG.md, PROJECT_STATE.md, ADRs |
