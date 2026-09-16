import { apiFetch } from "@/lib/api";

export const ASSET_CATEGORIES = [
  "VEHICLE",
  "BUILDING",
  "LAND",
  "EQUIPMENT",
  "FURNITURE",
  "IT_INFRASTRUCTURE",
  "OTHER",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export interface AssetInput {
  name: string;
  category: AssetCategory;
  initialPrice?: number;
  purchaseDate?: string;
  description?: string;
  status?: string;
  vehicleId?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  initialPrice: number;
  purchaseDate?: string | null;
  description?: string | null;
  status: string;
  vehicleId?: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: string;
    vehicleName: string;
    vehicleNumber: string;
    driverName?: string | null;
    status: string;
  } | null;
}

export interface AssetListResponse {
  assets: Asset[];
  summary: {
    totalCount: number;
    totalInitialValuation: number;
    categoryCounts: Record<string, number>;
  };
}

export interface AssetRegisterRow {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  status: string;
  purchaseDate?: string | null;
  initialPrice: number;
  maintenanceExpenses: number;
  maintenanceCount: number;
  totalCost: number;
  vehicle?: {
    id: string;
    vehicleName: string;
    vehicleNumber: string;
    driverName: string;
    driverStaff?: {
      id: string;
      name: string;
      employeeCode: string;
      phone?: string | null;
    } | null;
    status: string;
  } | null;
}

export interface AssetCategorySummary {
  category: string;
  count: number;
  initialValue: number;
  maintenanceSpend: number;
  totalCost: number;
}

export interface AssetPerformanceReport {
  academicYear: {
    id: string | null;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
  };
  academicYears: Array<{
    id: string;
    name: string;
    academicYear: string;
    isActive: boolean;
  }>;
  summary: {
    totalCapitalOutlay: number;
    totalAcademicYearMaintenance: number;
    totalCombinedCost: number;
    totalAssetsCount: number;
    activeAssetsCount: number;
  };
  categoryBreakdown: AssetCategorySummary[];
  assets: AssetRegisterRow[];
}

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function createAsset(input: AssetInput) {
  return apiFetch("/api/assets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAssets(params?: {
  category?: string;
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "ALL") query.append("category", params.category);
  if (params?.status && params.status !== "ALL") query.append("status", params.status);
  if (params?.search) query.append("search", params.search);

  const qs = query.toString();
  const url = qs ? `/api/assets?${qs}` : "/api/assets";

  const res = (await apiFetch(url)) as ApiSuccess<AssetListResponse>;
  return res.data ?? { assets: [], summary: { totalCount: 0, totalInitialValuation: 0, categoryCounts: {} } };
}

export async function getAssetById(id: string) {
  const res = (await apiFetch(`/api/assets/${id}`)) as ApiSuccess<Asset>;
  return res.data ?? null;
}

export async function updateAsset(id: string, input: Partial<AssetInput>) {
  return apiFetch(`/api/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteAsset(id: string) {
  return apiFetch(`/api/assets/${id}`, {
    method: "DELETE",
  });
}

export async function getAssetPerformanceReport(params?: {
  academicYearId?: string;
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams();
  if (params?.academicYearId) query.append("academicYearId", params.academicYearId);
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);

  const qs = query.toString();
  const url = qs ? `/api/assets/reports/performance?${qs}` : "/api/assets/reports/performance";

  const res = (await apiFetch(url)) as ApiSuccess<AssetPerformanceReport>;
  return res.data ?? null;
}
