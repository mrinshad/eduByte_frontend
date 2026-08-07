import { apiFetch } from "@/lib/api";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface Permission {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionInput {
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Permission[];
}

export interface RoleInput {
  name: string;
  description?: string;
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

export async function getRoleById(id: string): Promise<Role | null> {
  const payload = (await apiFetch(`/api/roles/${id}`)) as ApiSuccess<Role>;
  return payload.data ?? null;
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
// Role Permissions
// ---------------------------------------------------------------------

export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  const payload = (await apiFetch(
    `/api/roles/${roleId}/permissions`
  )) as ApiSuccess<Permission[]>;
  return payload.data ?? [];
}

export async function addPermissionsToRole(roleId: string, permissionIds: string[]) {
  return apiFetch(`/api/roles/${roleId}/permissions`, {
    method: "POST",
    body: JSON.stringify({ permissionIds }),
  });
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  return apiFetch(`/api/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissionIds }),
  });
}

export async function removePermissionsFromRole(roleId: string, permissionIds: string[]) {
  return apiFetch(`/api/roles/${roleId}/permissions`, {
    method: "DELETE",
    body: JSON.stringify({ permissionIds }),
  });
}

// ---------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------

export async function createPermission(input: PermissionInput) {
  return apiFetch("/api/permissions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPermissions(): Promise<Permission[]> {
  const payload = (await apiFetch("/api/permissions")) as ApiSuccess<Permission[]>;
  return payload.data ?? [];
}

export async function getPermissionById(id: string): Promise<Permission | null> {
  const payload = (await apiFetch(`/api/permissions/${id}`)) as ApiSuccess<Permission>;
  return payload.data ?? null;
}

export async function updatePermission(id: string, input: PermissionInput) {
  return apiFetch(`/api/permissions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deletePermission(id: string) {
  return apiFetch(`/api/permissions/${id}`, {
    method: "DELETE",
  });
}