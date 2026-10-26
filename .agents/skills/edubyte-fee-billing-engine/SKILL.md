---
name: edubyte-fee-billing-engine
description: Complete runbook and operational architecture for the fee billing engine in eduByte (fee structures, heads, monthly charge generation, fee collection, receipts, and late fines).
---

# eduByte Fee Billing & Collection Engine Runbook

This skill details the end-to-end financial workflows in eduByte: configuring fee structures, generating recurring student charges, collecting payments, allocating transactions, issuing receipts, and applying fines.

---

## 1. Billing & Collection Architecture

```
[ Fee Structure Template ] ────────► [ Enrollment Charge ]
(Class + Year Standard)              (Student-Specific Overrides)
                                               │
                                               ▼
                                      [ Student Charges ]
                                 (amount, paidAmount, balanceAmount)
                                               │
                                               ▼
                                    [ Fee Collection Desk ]
                                 (Cashier records incoming payment)
                                               │
                                               ▼
         ┌─────────────────────────────────────┴─────────────────────────────────────┐
         ▼                                                                           ▼
[ Transaction & Allocation ]                                                    [ Receipt ]
Links payment to specific StudentCharge                                  Printable proof of payment
(FIFO or explicit head selection)                                        with unique receipt number
```

---

## 2. Core Entities & Invariants

| Entity | Role in Billing | Key Fields / Invariants |
| :--- | :--- | :--- |
| `ChargeType` | Master classification of fee heads | `name`, `frequency` (`MONTHLY`, `ONE_TIME`, `ANNUAL`), `accountId` |
| `FeeStructure` | Standard class-level template | `academicYearId`, `classId`, contains `FeeStructureItem` lines |
| `StudentCharge` | Actual billable charge owed by student | `amount`, `paidAmount`, `discountAmount`, `balanceAmount`, `dueDate` |
| `Transaction` | Financial payment record | `totalAmount`, `paymentMode`, `transactionNo`, `paymentDate` |
| `TransactionAllocation` | Settlement link | `transactionId`, `studentChargeId`, `allocatedAmount` |
| `Receipt` | Institutional proof of payment | `receiptNo`, `transactionId`, `studentId`, `printCount` |

### Fundamental Mathematical Invariant:
```
balanceAmount = amount - (paidAmount + discountAmount)
```
- A charge is considered **PAID** when `balanceAmount <= 0`.
- A charge is **PARTIAL** when `paidAmount > 0` and `balanceAmount > 0`.
- A charge is **UNPAID** when `paidAmount == 0`.

---

## 3. Operational Runbooks

### Runbook A: Generating Monthly Charges
1. **Frontend**: Navigate to [/workspace/student-charges/generate-charges](file:///Users/apple/Byten/eduByte/frontend/app/workspace/student-charges/generate-charges/page.tsx).
2. Select Academic Year, Class, Division, Month, and Due Date.
3. Only active enrollments (`status: "ACTIVE"`) are loaded and included in generation.
4. **Backend**: Dispatches `POST /api/student-charges/generate` in [studentCharge.controller.js](file:///Users/apple/Byten/eduByte/backend/src/modules/studentCharge/studentCharge.controller.js).
5. **Database Transaction**:
   - For each active student in the class, looks up assigned `FeeStructure` or `EnrollmentCharge` items matching the frequency.
   - Inserts `StudentCharge` with `balanceAmount = amount`. Skips duplicates if the charge for that month/year/type already exists.

### Runbook B: Collecting Student Fees & Issuing Receipts
1. **Frontend**: Navigate to [/workspace/fee-management](file:///Users/apple/Byten/eduByte/frontend/app/workspace/fee-management/page.tsx).
2. Search and select active student. View outstanding charges grouped by fee heads.
3. Enter payment amount, payment mode (Cash, Cheque, UPI, Bank Transfer), reference number, and optional remarks.
4. **Backend**: Dispatches `POST /api/fee-collection/collect` handled by [feeCollection.controller.js](file:///Users/apple/Byten/eduByte/backend/src/modules/feeCollection/feeCollection.controller.js).
5. **Database Transaction (`prisma.$transaction`)**:
   - Creates `Transaction` record.
   - Allocates payment across outstanding `StudentCharge` records (FIFO or specified heads), creating `TransactionAllocation` records.
   - Decrements `balanceAmount` and increments `paidAmount` on each touched `StudentCharge`.
   - Generates sequential receipt number and creates `Receipt` record.
   - Returns receipt data to frontend for immediate printing at [/print/receipt](file:///Users/apple/Byten/eduByte/frontend/app/print/receipt/page.tsx).

### Runbook C: Student Fines & Waivers
1. **Frontend**: Navigate to [/workspace/fine-management](file:///Users/apple/Byten/eduByte/frontend/app/workspace/fine-management/page.tsx).
2. Click **Assess Fine**. Active student search modal opens (only `status: "ACTIVE"` enrollments displayed).
3. Select Fine Type (Library, Damage, Late submission), enter amount and reason.
4. **Backend**: Dispatches `POST /api/std-fines` in [stdFine.controller.js](file:///Users/apple/Byten/eduByte/backend/src/modules/stdFine/stdFine.controller.js).
5. **Waivers**: If authorized, an admin can waive or discount a fine via `PATCH /api/std-fines/:id/waive`.
