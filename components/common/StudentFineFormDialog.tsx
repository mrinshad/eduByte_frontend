"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ReusableFormDialog } from "@/components/common/resusable-dialoge-form";
import { parseApiError } from "@/lib/api-error";

import {
  getFineTypes,
  getStudentAdmissionAndNameWithEnrollment,
  createStudentFine,
  updateStudentFine,
  type FineType,
  type StudentAdmissionAndNameWithEnrollment,
} from "@/lib/services/fineTypes";

type StudentEnrollmentOption = Omit<
  StudentAdmissionAndNameWithEnrollment,
  "enrollmentId"
> & {
  enrollmentId: string;
};

type FineFieldErrors = {
  studentId?: string;
  fineTypeId?: string;
  amount?: string;
  reason?: string;
};

type StudentFineFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  editingFineId?: string | null;

  initialValues?: {
    enrollmentId: string;
    fineTypeId: string;
    amount: string;
    reason: string;
  };

  onSaved?: () => Promise<void> | void;
};

export default function StudentFineFormDialog({
  open,
  onOpenChange,
  editingFineId,
  initialValues,
  onSaved,
}: StudentFineFormDialogProps) {
  const [students, setStudents] = useState<StudentEnrollmentOption[]>([]);
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);

  const [fineSubmitting, setFineSubmitting] = useState(false);

  const [fineForm, setFineForm] = useState({
    studentId: "",
    fineTypeId: "",
    amount: "",
    reason: "",
  });

  const [fineFieldErrors, setFineFieldErrors] =
    useState<FineFieldErrors>({});

  useEffect(() => {
    if (!open) return;

    if (editingFineId && initialValues) {
      setFineForm({
        studentId: initialValues.enrollmentId,
        fineTypeId: initialValues.fineTypeId,
        amount: initialValues.amount,
        reason: initialValues.reason,
      });
    } else {
      setFineForm({
        studentId: "",
        fineTypeId: "",
        amount: "",
        reason: "",
      });
    }

    setFineFieldErrors({});
  }, [open, editingFineId, initialValues]);

  async function loadStudents() {
    try {
      const data = await getStudentAdmissionAndNameWithEnrollment();

      setStudents(
        data.filter(
          (student): student is StudentEnrollmentOption =>
            Boolean(student.enrollmentId)
        )
      );
    } catch (error) {
      const parsed = parseApiError(error, "Failed to load students");
      toast.error(parsed.message);
    }
  }

  async function loadFineTypes() {
    try {
      const data = await getFineTypes();
      setFineTypes(data);
    } catch (error) {
      const parsed = parseApiError(error, "Failed to load fine types");
      toast.error(parsed.message);
    }
  }

  useEffect(() => {
    if (!open) return;

    void loadStudents();
    void loadFineTypes();
  }, [open]);

  function validateFineForm(): {
    valid: boolean;
    fieldErrors: FineFieldErrors;
    firstError?: string;
  } {
    const nextFieldErrors: FineFieldErrors = {};

    if (!fineForm.studentId)
      nextFieldErrors.studentId = "Please select a student";

    if (!fineForm.fineTypeId)
      nextFieldErrors.fineTypeId = "Please select a fine type";

    const amountNum = Number(fineForm.amount);

    if (
      fineForm.amount === "" ||
      Number.isNaN(amountNum) ||
      amountNum <= 0
    ) {
      nextFieldErrors.amount = "Please enter a valid amount";
    }

    if (!fineForm.reason.trim()) {
      nextFieldErrors.reason = "Please enter a reason";
    }

    const firstError =
      nextFieldErrors.studentId ??
      nextFieldErrors.fineTypeId ??
      nextFieldErrors.amount ??
      nextFieldErrors.reason;

    return {
      valid: !firstError,
      fieldErrors: nextFieldErrors,
      firstError,
    };
  }
    async function handleSaveFine() {
    const {
      valid,
      fieldErrors: nextFieldErrors,
      firstError,
    } = validateFineForm();

    setFineFieldErrors(nextFieldErrors);

    if (!valid) {
      toast.error(firstError!);
      return;
    }

    try {
      setFineSubmitting(true);

      const payload = {
        enrollmentId: fineForm.studentId,
        fineTypeId: fineForm.fineTypeId,
        amount: Number(fineForm.amount),
        reason: fineForm.reason.trim(),
      };

      if (editingFineId) {
        await updateStudentFine(editingFineId, payload);
        toast.success("Updated Student Fine");
      } else {
        await createStudentFine(payload);
        toast.success("Created Student Fine");
      }

      onOpenChange(false);

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      const parsed = parseApiError(error, "Failed to save student fine");
      toast.error(parsed.message);
    } finally {
      setFineSubmitting(false);
    }
  }

  return (
    <ReusableFormDialog
      open={open}
      onOpenChange={onOpenChange}
      theme="vehicle"
      title={editingFineId ? "Edit Student Fine" : "Create Student Fine"}
      description="Create a fine and assign it to a student."
      isEditing={!!editingFineId}
      isSaving={fineSubmitting}
      submitLabel="Create Fine"
      editSubmitLabel="Update Fine"
      errors={fineFieldErrors}
      fields={[
        {
          type: "combobox",
          name: "studentId",
          label: "Student",
          required: true,
          placeholder: "Select Student",
          searchPlaceholder: "Search by name or admission no...",
          emptyText: "No matching students found.",
          options: students.map((s) => ({
            label: `${s.admissionNumber} - ${s.studentName}`,
            value: s.enrollmentId,
          })),
        },
        {
          type: "select",
          name: "fineTypeId",
          label: "Fine Type",
          required: true,
          placeholder: "Select Fine Type",
          options: fineTypes.map((f) => ({
            label: f.name,
            value: f.id,
          })),
        },
        {
          type: "number",
          name: "amount",
          label: "Amount",
          required: true,
          placeholder: "Enter Amount",
        },
        {
          type: "text",
          name: "reason",
          label: "Reason",
          required: true,
          placeholder: "Enter Reason",
        },
      ]}
      values={fineForm}
      onChange={(name, value) => {
        setFineForm((prev) => ({
          ...prev,
          [name]: value,
        }));

        setFineFieldErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }}
      onSubmit={() => void handleSaveFine()}
    />
  );
}