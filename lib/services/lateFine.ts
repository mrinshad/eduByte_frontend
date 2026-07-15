import { apiFetch } from "@/lib/api";

export async function refreshLateFines(enrollmentId: string) {
  const payload = await apiFetch(
    `/api/latefines/refresh/${enrollmentId}`,
    {
      method: "POST",
    }
  );

  console.log("Refresh Late Fines Response:", payload);

  return payload;
}