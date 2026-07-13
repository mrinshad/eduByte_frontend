import { apiFetch } from "@/lib/api";

type ApiSuccess<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

//
// Vehicle Reports
//

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
  driverName: string;
  totalStudents: number; // list endpoint returns this per vehicle
}

export interface VehicleListsResponse {
  success: boolean;
  message: string;
  data: Vehicle[];
}

// Get vehicle list
export async function getVehicleLists() {
  const payload = (await apiFetch(
    "/api/reports/vehicles"
  )) as VehicleListsResponse;

  return payload.data ?? [];
}

//
// Students By Vehicle
//

export interface VehicleInfo {
  vehicleId: string;
  vehicleNumber: string;
  vehicleName: string;
  driverName: string;
}

export interface VehicleStudent {
  admissionNumber: string;
  studentName: string;
  whatsappNumber: string;
  class: string;
}

export interface StudentsByVehicleData {
  vehicle: VehicleInfo;
  Students: VehicleStudent[]; // fixed: API returns "Students" (capital S)
}

export interface StudentsByVehicleResponse {
  success: boolean;
  message: string;
  data: StudentsByVehicleData;
}

// Get students by vehicle
export async function getStudentsByVehicle(vehicleId: string) {
  const payload = (await apiFetch(
    `/api/reports/students-by-vehicle/${vehicleId}`
  )) as StudentsByVehicleResponse;

  return payload.data;
}

//
// Daily Collection Report (now a date range: fromDate -> toDate)
//

export interface PaymentMethodData {
    paymentMethod: string;
    amount: number;
}

export interface ChargeTypeData {
    chargeType: string;
    amount: number;
}

export interface DailyCollectionData {
    fromDate: string;
    toDate: string;
    totalCollection: number;
    paymentMethodData: PaymentMethodData[];
    collectionByChargeType: ChargeTypeData[];
}

// Get Daily Collection Report
export async function getDailyCollectionReport(
    fromDate: string,
    toDate: string
): Promise<DailyCollectionData> {
    const payload = (await apiFetch(
        `/api/reports/daily-collection?fromDate=${fromDate}&toDate=${toDate}`
    )) as ApiSuccess<DailyCollectionData>;

    return (
        payload.data ?? {
            fromDate,
            toDate,
            totalCollection: 0,
            paymentMethodData: [],
            collectionByChargeType: [],
        }
    );
}


//
// Expense By Category Report
//
 
export interface SubCategoryExpense {
    name: string;
    amount: number;
}
 
export interface CategoryExpense {
    category: string;
    amount: number;
    subCategories: SubCategoryExpense[];
}
 
export interface ExpenseByCategoryData {
    fromDate: string;
    toDate: string;
    totalExpense: number;
    categories: CategoryExpense[];
}
 
// Get Expense By Category Report
export async function getExpenseByCategoryReport(
    fromDate: string,
    toDate: string
): Promise<ExpenseByCategoryData> {
    const payload = (await apiFetch(
        `/api/reports/expense-by-category?fromDate=${fromDate}&toDate=${toDate}`
    )) as ApiSuccess<ExpenseByCategoryData>;
 
    return (
        payload.data ?? {
            fromDate,
            toDate,
            totalExpense: 0,
            categories: [],
        }
    );
}