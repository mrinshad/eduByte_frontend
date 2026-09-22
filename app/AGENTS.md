# eduByte Frontend Routes & Portals — Agent Guide

This directory contains the **Next.js App Router** pages, layout hierarchy, and navigation routing for eduByte.

---

## 1. Complete Route & Page Map

### A. Admin Portal Routes (`/admin/*`)
The Admin portal manages institutional setup, academic hierarchy, master records, and student lifecycle transitions:

| Route Path | Page File | Purpose & Components |
| :--- | :--- | :--- |
| `/admin/dashboard` | [dashboard/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/dashboard/page.tsx) | Administrative overview, KPIs, active students/staff metrics. |
| `/admin/academic-profile` | [academic-profile/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/academic-profile/page.tsx) | Academic years, active session toggle, class & division hierarchy. |
| `/admin/students` | [students/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/students/page.tsx) | Student demographic master directory, registration dialog, profile editor. |
| `/admin/admissions` | [admissions/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/admissions/page.tsx) | Class admission/enrollment list, admission dialog, status filter (`ACTIVE`, `PROMOTED`, `RELIEVED`). |
| `/admin/promotion` | [promotion/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/promotion/page.tsx) | Batch promotion tool: moves enrolled students from one class/year to the next. |
| `/admin/relieving` | [relieving/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/relieving/page.tsx) | Relieving / TC management: withdraws active students, sets reason and relieving date. |
| `/admin/charge-types` | [charge-types/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/charge-types/page.tsx) | Fee heads management (Tuition, Library, Exam, Admission fee). |
| `/admin/fee-structures` | [fee-structures/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/fee-structures/page.tsx) | Class fee templates: binds charge types and standard amounts to classes. |
| `/admin/cca` | [cca/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/cca/page.tsx) | Co-curricular activities registry and student CCA enrollments (active students only). |
| `/admin/vehicles` | [vehicles/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/vehicles/page.tsx) | Fleet vehicles, route assignment, pickup points. |
| `/admin/staff` | [staff/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/staff/page.tsx) | Staff & faculty directory, employee profile dialog. |
| `/admin/departments` | [departments/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/departments/page.tsx) | Academic and administrative departments. |
| `/admin/designations` | [designations/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/designations/page.tsx) | Staff roles and designations (Principal, Teacher, Accountant, Guard). |
| `/admin/accounts` | [accounts/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/accounts/page.tsx) | Chart of accounts (Cash in hand, Bank accounts, Revenue accounts). |
| `/admin/assets` | [assets/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/assets/page.tsx) | School physical assets register, depreciation tracking. |
| `/admin/users` | [users/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/users/page.tsx) | User accounts administration, credentials, role assignment. |
| `/admin/roles` | [roles/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/roles/page.tsx) | RBAC roles and permissions assignment matrix. |
| `/admin/permissions` | [permissions/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/permissions/page.tsx) | System permission catalog viewer. |
| `/admin/audit-logs` | [audit-logs/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/audit-logs/page.tsx) | Security audit trail and action history. |
| `/admin/receipt-numbers` | [receipt-numbers/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/receipt-numbers/page.tsx) | Sequential receipt prefix and numbering rules. |
| `/admin/transaction-numbers` | [transaction-numbers/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/transaction-numbers/page.tsx) | Transaction ID prefix and sequence configuration. |
| `/admin/expense-numbers` | [expense-numbers/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/admin/expense-numbers/page.tsx) | Expense voucher numbering configuration. |

---

### B. Workspace Portal Routes (`/workspace/*`)
The Workspace portal handles day-to-day cashiering, billing, fee collections, expenses, and reporting:

| Route Path | Page File | Purpose & Components |
| :--- | :--- | :--- |
| `/workspace/dashboard` | [dashboard/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/dashboard/page.tsx) | Daily cashier KPIs (today's collections, pending charges, expenses). |
| `/workspace/fee-management` | [fee-management/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/fee-management/page.tsx) | Student fee collection desk, student search, outstanding dues, payment collection dialog, receipt generation. |
| `/workspace/student-charges` | [student-charges/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/student-charges/page.tsx) | Student charges ledger, individual charge details. |
| `/workspace/student-charges/generate-charges` | [generate-charges/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/student-charges/generate-charges/page.tsx) | Batch monthly fee generation tool across classes and divisions. |
| `/workspace/fine-management` | [fine-management/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/fine-management/page.tsx) | Student fine assessment, payment collection, and waivers. |
| `/workspace/expense-management` | [expense-management/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/expense-management/page.tsx) | Operational expenses recording, payee tracking, payment receipts. |
| `/workspace/salary-slips` | [salary-slips/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/salary-slips/page.tsx) | Staff payroll processing, monthly salary slip generation, print preview. |
| `/workspace/refund-management` | [refund-management/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/refund-management/page.tsx) | Student fee refund processing and credit note generation. |
| `/workspace/receipt` | [receipt/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/receipt/page.tsx) | Receipt finder and reprint terminal. |
| `/workspace/reports` | [reports/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/reports/page.tsx) | Operational reports (Daily collection, Class dues, Fee registers). |
| `/workspace/financial-reports` | [financial-reports/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/workspace/financial-reports/page.tsx) | Income vs Expense balance sheets, ledger reports, account summaries. |

---

### C. Other Routes
- `/`: [app/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/page.tsx) — Main landing page & Authentication login modal.
- `/switch-portal`: [app/switch-portal/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/switch-portal/page.tsx) — Portal selector dialog between Admin and Workspace.
- `/print/receipt`: [app/print/receipt/page.tsx](file:///Users/apple/Byten/eduByte/frontend/app/print/receipt/page.tsx) — Printable clean receipt format.

---

## 2. Layout & Shell Architecture

The layout nesting guarantees security, theming, and responsive navigation:

```
[ Root Layout (app/layout.tsx) ]
  ├── ThemeProvider (Dark / Light Mode)
  ├── Toaster (Sonner notifications)
  └── [ Portal Shell (app/admin/layout.tsx OR app/workspace/layout.tsx) ]
        └── [ AuthGate (components/auth-gate.tsx) ]
              └── [ AppShell (components/app-shell.tsx) ]
                    ├── Navbar (Academic Year selector, User Menu, Command Search)
                    ├── Sidebar (Portal routes, Collapsible navigation)
                    └── Page Component (<page>.tsx)
```

---

## 3. Navigation Indexing (Search Modal & Sidebar)

When adding a new route:
1. Create the page folder: `app/<portal>/<route-name>/page.tsx`.
2. Register the route metadata and icon in [lib/portal.ts](file:///Users/apple/Byten/eduByte/frontend/lib/portal.ts).
3. Ensure the search index in [components/navbar-section-search.tsx](file:///Users/apple/Byten/eduByte/frontend/components/navbar-section-search.tsx) includes the new route keywords.
