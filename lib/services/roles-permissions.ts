import { apiFetch } from "@/lib/api";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export type DefaultPortal = "admin" | "workspace" | "student";

export interface Permission {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  defaultPortal: DefaultPortal;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

export interface RoleInput {
  name: string;
  defaultPortal: DefaultPortal;
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// ---------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------

export async function createRole(input: RoleInput) {
  return apiFetch("/api/roles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getRoles(): Promise<Role[]> {
  const payload = (await apiFetch("/api/roles")) as ApiSuccess<Role[]>;
  return payload.data ?? [];
}

export async function updateRole(id: string, input: RoleInput) {
  return apiFetch(`/api/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteRole(id: string) {
  return apiFetch(`/api/roles/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------
// Role <-> Permissions
// ---------------------------------------------------------------------

export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  const payload = (await apiFetch(
    `/api/roles/${roleId}/permissions`
  )) as ApiSuccess<Permission[]>;
  return payload.data ?? [];
}

/**
 * Full-replacement sync. The backend deletes the role's existing
 * permissions and inserts this exact list atomically, so callers must
 * always pass the COMPLETE desired set of permission ids — not a delta.
 */
export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  return apiFetch(`/api/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissionIds }),
  });
}

// ---------------------------------------------------------------------
// Permissions (global catalog, read-only from this UI)
// ---------------------------------------------------------------------

export async function getPermissions(): Promise<Permission[]> {
  const payload = (await apiFetch("/api/permissions")) as ApiSuccess<Permission[]>;
  return payload.data ?? [];
}