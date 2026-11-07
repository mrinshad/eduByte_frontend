---
name: edubyte-student-lifecycle
description: Complete runbook and lifecycle state machine for student operations in eduByte (registration, admission/enrollment, promotion, relieving/withdrawing, and active filtering rules).
---

# eduByte Student Lifecycle Runbook

This skill outlines the lifecycle states, database relationships, business rules, and step-by-step procedures for managing students in eduByte.

---

## 1. Lifecycle State Machine

```
[ 1. Student Registration ] ────────── Creates `Student` record (Demographics & Admission No)
         │
         ▼
[ 2. Admission / Enrollment ] ──────── Creates `StudentEnrollment` (`status: "ACTIVE"`)
         │
         ├───► [ 3. Promotion ] ────── Updates current enrollment (`status: "PROMOTED"`),
         │                             creates next year enrollment (`status: "ACTIVE"`)
         │
         └───► [ 4. Relieving / TC ] ── Updates current enrollment (`status: "RELIEVED"`),
                                       sets `relievingDate` and `relievingReason`.
```

### Enrollment Statuses:
- **`ACTIVE`**: Currently studying in the enrolled class/division for the academic year. Eligible for fee billing, fine assessment, CCA assignment, and transport.
- **`PROMOTED`**: Historical enrollment in a previous academic year. The student was successfully promoted to a higher class.
- **`RELIEVED`**: Student has withdrawn, transferred, or completed studies. **Must be excluded from all active school operations.**

---

## 2. The Universal Active Student Filter Rule

> [!CRITICAL]
> **Withdrawn/Relieved students must NEVER appear in active selection dropdowns or batch generation tools.**

### Backend Query Patterns:
* **When querying active students in `student.controller.js`**:
  ```javascript
  const where = {
    isDeleted: false,
    enrollments: {
      some: {
        status: "ACTIVE",
        isDeleted: false,
      },
    },
  };
  ```

* **When querying available students for new admission (un-enrolled)**:
  ```javascript
  const where = {
    isDeleted: false,
    enrollments: {
      none: {
        isDeleted: false,
      },
    },
  };
  ```

* **When fetching enrollments in `stdEnrollment.controller.js`**:
  Respect the query parameter:
  ```javascript
  if (req.query.status) {
    where.status = req.query.status; // e.g. "ACTIVE"
  }
  ```

### Frontend Invocation Pattern:
Always pass `{ status: "ACTIVE" }` when fetching students for operational forms (fines, charges, CCAs, attendance):
```typescript
import { getAllStudentEnrollments } from "@/lib/services/admissions";

const res = await getAllStudentEnrollments({
  status: "ACTIVE",
  academicYearId: currentYearId,
});
```

---

## 3. Step-by-Step Operational Runbooks

### Runbook A: Registering a Student
1. **Frontend**: Navigate to [/admin/students](file:///Users/apple/Byten/eduByte/frontend/app/admin/students/page.tsx) and click **Register Student**.
2. **Backend**: Dispatches `POST /api/students` handled by [student.controller.js](file:///Users/apple/Byten/eduByte/backend/src/modules/student/student.controller.js).
3. **Database**: Inserts record into `Student` table. No `StudentEnrollment` exists yet.

### Runbook B: Admitting / Enrolling into Class
1. **Frontend**: Navigate to [/admin/admissions](file:///Users/apple/Byten/eduByte/frontend/app/admin/admissions/page.tsx) and click **New Admission**.
2. **Student Picker**: Calls `GET /api/students/admission-name`, which returns only unadmitted students.
3. **Backend**: Dispatches `POST /api/stdenrollment` handled by [stdEnrollment.controller.js](file:///Users/apple/Byten/eduByte/backend/src/modules/studentEnrollment/stdEnrollment.controller.js).
4. **Database Transaction**:
   - Inserts `StudentEnrollment` with `status: "ACTIVE"`.
   - Links agreed `FeeStructure` or creates individual `EnrollmentCharge` records for the student.

### Runbook C: Annual Batch Promotion
1. **Frontend**: Navigate to [/admin/promotion](file:///Users/apple/Byten/eduByte/frontend/app/admin/promotion/page.tsx).
2. Select Source Class + Academic Year and Target Class + Next Academic Year.
3. **Backend**: Dispatches `POST /api/promotion` handled by [promotion.controller.js](file:///Users/apple/Byten/eduByte/backend/src/modules/promotion/promotion.controller.js).
4. **Database Transaction**:
   - Updates old enrollments: `status = "PROMOTED"`.
   - Inserts new enrollments for target year: `status = "ACTIVE"`.

### Runbook D: Relieving / Transfer Certificate (TC)
1. **Frontend**: Navigate to [/admin/relieving](file:///Users/apple/Byten/eduByte/frontend/app/admin/relieving/page.tsx).
2. Select active student, enter relieving date, reason, and remarks.
3. **Backend**: Dispatches `POST /api/relieving` handled by [studentRelieving.controller.js](file:///Users/apple/Byten/eduByte/backend/src/modules/studentRelieving/studentRelieving.controller.js).
4. **Database Transaction**:
   - Updates `StudentEnrollment`: `status = "RELIEVED"`, sets `relievingDate`.
   - The student will no longer appear in active lists.
