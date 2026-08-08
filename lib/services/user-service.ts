"use client"

import { apiFetch } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  roleId: string;
  role: string;
  roleDetails: {
    id: string;
    name: string;
    defaultPortal: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  name: string;
  username: string;
  password?: string;
  email: string;
  roleId: string;
  isActive: boolean;
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUsers(): Promise<User[]> {
  const payload = (await apiFetch("/api/users")) as ApiSuccess<User[]>;
  return payload.data ?? [];
}

export async function getUser(id: string): Promise<User | null> {
  const payload = (await apiFetch(`/api/users/${id}`)) as ApiSuccess<User>;
  return payload.data ?? null;
}

export async function createUser(input: UserInput) {
  return apiFetch("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateUser(id: string, input: Partial<UserInput>) {
  return apiFetch(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteUser(id: string) {
  return apiFetch(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export async function batchDeleteUsers(userIds: string[]) {
  return apiFetch("/api/users/batch", {
    method: "DELETE",
    body: JSON.stringify({ userIds }),
  });
}