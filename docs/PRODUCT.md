# Product Specification & Institutional Guidelines — Frontend

This document outlines the core mission, target personas, functional portals, business rules, and UI invariants for the **eduByte Frontend**.

---

## 1. Product Overview & Mission

**eduByte** is a high-performance School ERP & Financial Accounting System engineered for educational institutions. The frontend provides a responsive, single-page application built on Next.js 16 (App Router) and Tailwind CSS v4 to serve administrators, accountants, principals, teachers, and students.

---

## 2. Target Personas & Primary Surfaces

| Persona | Primary Needs & Responsibilities | Key Frontend Surfaces |
| :--- | :--- | :--- |
| **School Administrator** | System configuration, academic years, classes, fee heads, RBAC permissions, staff records. | `/admin` |
| **Fee Counter Cashier** | Fast student dues lookup, counter fee collections, cash/bank receipt printing, fine waivers. | `/workspace/fee-management` |
| **Accountant / Bursar** | Expense voucher entry, chart of accounts, bank reconciliations, 13+ executive reports. | `/workspace/expense-management`, `/workspace/reports` |
| **Principal / Director** | High-level collections monitoring, defaulter lists, student retention, staff payroll oversight. | `/workspace/reports`, `/admin` |
| **Student / Parent** | Fee breakdown, transparent pending dues checking, download official receipts. | `/student` |

---

## 3. The Two Operational Portals

### 3.1 Admin Portal (`/admin/*`)
Configuration and system masters:
- `/admin/academic-year`: Setup sessions and term boundaries.
- `/admin/classes`: Class and division hierarchies.
- `/admin/students`: Master student directory and enrollment history.
- `/admin/admissions`: New student admission entry.
- `/admin/promotion`: Batch student promotion to next academic year.
- `/admin/relieving`: Transfer certificate and student relieving processing.
- `/admin/fee-structures` & `/admin/charge-types`: Class fee schedules and head definitions.
- `/admin/vehicles`: Transport fleet and student bus route assignments.
- `/admin/cca`: Co-curricular activity definitions.
- `/admin/staff`: Teacher and employee directory.
- `/admin/accounts`: Chart of accounts and expense categories.
- `/admin/roles` & `/admin/permissions`: RBAC matrix and privilege assignment.

### 3.2 Workspace Portal (`/workspace/*`)
Daily high-frequency operational transactions:
- `/workspace/fee-management`: Student counter fee collection, receipt thermal/A4 printing, multi-head allocation.
- `/workspace/student-charges`: Automated monthly billing run generator for tuition, bus, and CCA.
- `/workspace/fine-management`: Late fee rule generation, fine assessment, and penalty waivers.
- `/workspace/expense-management`: Voucher entry with category tracking and receipts.
- `/workspace/salary-slips`: Monthly payroll slip generator and printouts.
- `/workspace/reports`: 13 specialized executive reports.

---

## 4. UI Invariants

1. **Active Student Filtering**:
   - Relieved students (`status: "RELIEVED"`) must NEVER appear in active transaction dropdowns or selection lists.
2. **Never Hardcode Values**:
   - Fees, academic years, classes, and roles must be dynamically retrieved through typed services.
3. **Double-Entry Confirmation**:
   - Irrevocable financial or academic mutations (voiding payments, relieving students) require a confirmation dialog.
