import { apiFetch } from "@/lib/api";

export interface VehicleInput {
  vehicleName: string;
  vehicleNumber: string;
  driverName: string;
  driverStaffId?: string | null;
  initialPrice?: number;
  purchaseDate?: string;
}

export interface Vehicle {
  id: string;
  vehicleName: string;
  vehicleNumber: string;
  driverName: string;
  driverStaffId?: string | null;
  driverStaff?: {
    id: string;
    name: string;
    employeeCode: string;
    phone?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    initialPrice: number;
    purchaseDate?: string | null;
  } | null;
  _count?: {
    assignments?: number;
    expenses?: number;
  };
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};
export async function createVehicle(
  input: VehicleInput
) {
  return apiFetch("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export async function getVehicles() {
  const payload = (await apiFetch(
    "/api/vehicles"
  )) as ApiSuccess<Vehicle[]>;

  return payload.data ?? [];
}
export async function getVehicleById(
  id: string
) {
  const payload = (await apiFetch(
    `/api/vehicles/${id}`
  )) as ApiSuccess<Vehicle>;

  return payload.data ?? null;
}
export async function updateVehicle(
  id: string,
  input: VehicleInput
) {
  return apiFetch(`/api/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteVehicle(
  id: string
) {
  return apiFetch(`/api/vehicles/${id}`, {
    method: "DELETE",
  });
}