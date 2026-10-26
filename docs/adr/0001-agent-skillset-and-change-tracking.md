# ADR 0001: Adoption of Agent Skillset, Engineering Discipline, and Change Tracking in Frontend

## Status
Accepted

## Context
As the eduByte Next.js frontend expands in complexity across Admin and Workspace portals, maintaining visual craftsmanship, strict minimalism, and an auditable history across autonomous and assisted AI sessions requires structured governance.

## Decision
We adopt the **Byten Agentic Engineering & Design System** for the frontend repository:
1. **Impeccable & Intent**: Standardizes UI/UX craftsmanship, eliminates unjustified gradients and card clutter, ensures WCAG AA contrast compliance, and enforces alignment with `docs/DESIGN.md` and `docs/PRODUCT.md`.
2. **Ponytail Minimalism**: Enforces the 7-Step Necessity Ladder, prioritizing standard library primitives, native platform APIs, and existing codebase utilities over new dependencies, with explicit tagging of debt (`ponytail-debt`).
3. **Graphify AST Knowledge Graph**: Indexes the frontend codebase into an AST-backed graph (`graphify-out/`) for dependency tracing, impact analysis, and architecture queries.
4. **Change Tracking & Audit System**: Maintains `CHANGELOG.md` (Keep-a-Changelog), `PROJECT_STATE.md` (living ledger), and incremental Architecture Decision Records (ADRs).
5. **Codex / IDE Hooks**: Automates quality checks and design review passes on file modifications (`.codex/hooks.json`).

## Consequences
- Every feature or refactor must be documented under `[Unreleased]` in `CHANGELOG.md`.
- `PROJECT_STATE.md` must be kept synchronized with milestone states and debt markers.
- UI modifications will undergo automated quality inspections via Impeccable hooks.
- Architecture questions and structural changes will leverage Graphify queries and graph updates.
