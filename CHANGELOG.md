# Changelog

All notable changes to the eduByte School ERP & Fee Management system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **CCA Module Student Fee Override**:
  - Added `feeOverride Decimal? @db.Decimal(18, 2)` column to `StudentCcaAssignment` via Prisma migration `20261104052324_add_fee_override_to_student_cca_assignment`.
  - Enhanced backend controllers (`ccaAssignments.controller.js`, `ccaCharges.controller.js`, `stdEnrollment.controller.js`) to support per-student fee overrides during single assignment, bulk assignment, and enrollment, ensuring customized billing without mutating default activity rates.
  - Added automated integration test suite in `backend/tests/integration/ccaFeeOverride.test.js`.
- **PostgreSQL Concurrency Batch Fix in WhatsApp Dispatch**:
  - Refactored `dispatchFeeRemindersBatch` in [`src/modules/whatsapp/whatsapp.service.js`](file:///Users/apple/Byten/eduByte/backend/src/modules/whatsapp/whatsapp.service.js) to use CTE `WITH target AS (...) UPDATE ... FROM target WHERE ...` preventing PostgreSQL subquery re-evaluation and guaranteeing exact batch limit execution.
- Added "+ Generate Advance Fees" modal action directly to the Fee Collection Desk (`/workspace/fee-management/viewCollection`) enabling immediate advance payment collection for upcoming months.
- Authorized cashier role (`feecollection.collectButton`) on single student charge generation preview (`GET /api/stdcharge/student/:enrollmentId/generation-preview`) and generation (`POST /api/stdcharge/student/:enrollmentId/generate`).
- Backend endpoint `PATCH /api/stdcharge/:id/amount` (and alias `PATCH /api/feecollection/charges/:id`) to allow adjusting uncollected and partially collected student charge amounts before payment collection.
- Frontend Edit Charge Amount modal in Fee Collection Desk (`/workspace/fee-management/viewCollection`) allowing real-time modification of generated student charge amounts with optional audit notes.
- Comprehensive integration tests in `backend/tests/integration/studentChargeAmountEdit.test.js`.
- Byten Agentic Engineering & Design System configuration across workspace.
- Impeccable UI craftsmanship rules and automated verification hooks.
- Intent UX strategy and wireframing skillset.
- Ponytail code discipline guidelines and 7-step Necessity Ladder.
- Graphify AST knowledge graph for automated code indexing and dependency tracking.
- Track-changes audit skill and Architecture Decision Record (ADR) system.
- Authoritative documentation: `docs/DESIGN.md`, `docs/PRODUCT.md`, `docs/ORCHESTRATION.md`, and `PROJECT_STATE.md`.
- Architecture Decision Record `docs/adr/0001-agent-skillset-and-change-tracking.md`.

### Changed
- **Tuition Frequency & Scheduling Resolution**:
  - Implemented class-aware phonetic normalization in `sheets/seed_sheets_data.js` (`normPhonetic` handling Malabar naming conventions, initial concatenation, and phonetic variants), achieving 100% student resolution across 185 tuition records, 145 transport records, 65 CCA assignments, and 23 Madrasa records.
  - Resolved student name collisions across classes (e.g., `MUHAMMED ZAYAN KC` in Montessori 3 vs Grade 4) by prioritizing class-and-division scoping.
  - Corrected PostgreSQL `EnrollmentCharge.frequency` across all 189 active students: `QUARTERLY` (110 students), `MONTHLY` (46 students), `ONE_TIME` Last/Feb (10 students), `ONE_TIME` First/Jun (4 students), and `ANNUAL` Flexible (19 students).
  - Updated Student Aysha Azwa PK (Adm 86) tuition charge frequency to `QUARTERLY` (`Tuition Fee (Term Schedule)`, ₹20,000).
  - Pruned obsolete unpaid June charges for `ONE_TIME (Last / Feb)` students, ensuring their full fee demand correctly appears only in February as `PENDING`.
  - Updated forecast generator (`sheets/generate_forecast_sheets.py`) to accurately project Sheet3 Term 3 rates in December, 9-month formula installments in December/January with February remainder, advance-paid transportation, and zero future late fines.
  - Regenerated [`FORECASTED_FEES_2026_2027.xlsx`](file:///Users/apple/Byten/eduByte/FORECASTED_FEES_2026_2027.xlsx) and [`FORECAST_REPORT.html`](file:///Users/apple/Byten/eduByte/FORECAST_REPORT.html) reflecting verified figures.
- Integrated Agentic Engineering and Design System guidelines into `AGENTS.md` while preserving the eduByte Master Agent Orchestration Guide.

### Fixed
- Fixed ONE_TIME fee frequency handling across frontend and backend so one-time fees (including Tuition, Transport, Admission, and custom heads) generate once, collect once, and display once on a single month instead of repeating across 9 or 10 academic months.
- Updated `frontend/lib/feeScheduleHelper.ts`: `getFeeScheduleBreakdown` now prioritizes `ONE_TIME` before tuition/transport checks, preventing fallback to 9-month installments; `calculateStudentCompleteSchedule` correctly schedules `ONE_TIME` fees once in Month 1 (or Month 2 for quarterly reopening relief) and sets ₹0 for all other months.
- Updated `backend/src/modules/studentCharge/stdCharge.controller.js`: `getChargeAmountsForMonth` returns full amount without dividing into 9ths; `isChargeDueThisMonth` and `computeGenerationPlan` guard against duplicate generation across different months; `getPeriodLabel` maps `ONE_TIME` to `"One-Time"`.
- Updated `backend/src/modules/chargeType/chargeType.controller.js`: changing a ChargeType's frequency now synchronizes active `EnrollmentCharge` records for existing students.
- Updated `backend/src/modules/cca/charges/ccaCharges.controller.js`: respect `ONE_TIME` frequency on CCA activities to prevent recurring monthly charges.

### Removed

### Security
- Hardened RBAC authorization across unshielded and sensitive administrative routes:
  - `studentRelieving`: Restricted mass and individual student relieving to `relieving.listOnNavbar`, removing excessive read permissions (`students.listOnNavbar`).
  - `promotion`: Restricted promote and complete batch operations to `promotion.listOnNavbar`, removing broad read-only navbar permissions (`academics.listOnNavbar`).
  - `feeCollection`: Enforced `requirePermission` with cashier/viewer gates across all lookup, summary, charges, fines, and thermal print endpoints (`/:enrollmentId`, `/summary`, `/charges`, `/fines`, `/print/:transactionId`, `/stdlist`).
  - `account`: Protected financial ledger balances and account summaries (`GET /` and `GET /:id/summary`) behind strict accounting permissions (`accounts.listOnNavbar`, `accounts.createAccountButton`, `accounts.transferButton`); enabled safe access to dropdown selectors for cashier/clerk roles.
  - `studentCharge`: Guarded manual charge creation (`POST /`), previews, and collections behind `feegeneration.generateChargesButton`.
  - `reports`: Added authorization checks to all previously unshielded financial reports (`dailyCollectionReport`, `expenseSummaryReport`, `studentOutstandingReport`, `chargeTypeCollectionReport`, `expenseCategoryReport`, `vehicleFinancialReport`, and `vehicleAssignReport`).
  - `fineType`, `lateFeeFine`, `ccaCharges`, `studentEnrollment`, `expense`, and `stdFine`: Added missing permission guards on update, delete, refresh, preview, and print endpoints.
- Implemented sliding-window in-memory login rate limiter on `POST /api/auth/login` (10 attempts / 15-minute sliding window with automatic garbage collection, bypassed in test mode) using native Node.js data structures.
- Added cryptographic token secret fail-safe (`validateJwtSecretConfiguration()`) guaranteeing hard server startup abort if default or weak JWT secrets are used in production environments.
- Added comprehensive security test suite in `backend/tests/securityRemediation.test.js` validating all authorization boundaries, rate limiting, and cryptographic fail-safes.

## [0.0.1] - 2026-09-10
### Added
- Initial eduByte monorepo setup with Next.js frontend and Express backend.
- Core schema definitions for Student, Enrollment, FeeStructure, and Transactions.
