import { apiFetch } from "@/lib/api";

type ApiSuccess<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

// =========================================================================
// 1. Daybook (Cashbook) Types
// =========================================================================

export interface DaybookEntry {
    id: string;
    timestamp: string;
    entryType: "INFLOW" | "OUTFLOW";
    voucherNumber: string;
    entityName: string;
    entityDetail: string;
    category: string;
    paymentMethod: string;
    cashAmount: number;
    bankAmount: number;
    inflowAmount: number;
    outflowAmount: number;
    runningBalance: number;
    notes: string;
}

export interface DaybookReportResponse {
    date: string;
    summary: {
        openingBalance: { cash: number; bank: number; total: number };
        todayInflow: { cash: number; bank: number; total: number; receiptCount: number };
        todayOutflow: { cash: number; bank: number; total: number; voucherCount: number };
        netFlow: { cash: number; bank: number; total: number };
        closingBalance: { cash: number; bank: number; total: number };
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    entries: DaybookEntry[];
}

export async function getDaybookReport(params: {
    date?: string;
    paymentMethod?: string;
    page?: number;
    limit?: number;
}): Promise<DaybookReportResponse> {
    const sp = new URLSearchParams();
    if (params.date) sp.append("date", params.date);
    if (params.paymentMethod && params.paymentMethod !== "ALL") sp.append("paymentMethod", params.paymentMethod);
    if (params.page) sp.append("page", String(params.page));
    if (params.limit) sp.append("limit", String(params.limit));

    const qs = sp.toString() ? `?${sp.toString()}` : "";
    const res = (await apiFetch(`/api/reports/financial/daybook${qs}`)) as ApiSuccess<DaybookReportResponse>;
    if (!res?.data) throw new Error(res?.message || "Failed to fetch Daybook report");
    return res.data;
}

// =========================================================================
// 2. Fee Defaulters & Aging Types
// =========================================================================

export interface FeeDefaulterItem {
    studentId: string;
    admissionNumber: string;
    studentName: string;
    gender: string;
    rollNumber: string;
    className: string;
    classId?: string;
    fatherName: string;
    fatherMobile: string;
    motherName: string;
    motherMobile: string;
    whatsappNumber: string;
    feeDues: number;
    fineDues: number;
    totalOutstanding: number;
    bucket0_30: number;
    bucket31_60: number;
    bucket61_90: number;
    bucket90Plus: number;
    maxDaysOverdue: number;
    unpaidItemsCount: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface FeeDefaultersReportResponse {
    summary: {
        totalDefaulters: number;
        totalOutstanding: number;
        agingSummary: {
            bucket0_30: { amount: number; studentCount: number };
            bucket31_60: { amount: number; studentCount: number };
            bucket61_90: { amount: number; studentCount: number };
            bucket90Plus: { amount: number; studentCount: number };
        };
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    defaulters: FeeDefaulterItem[];
}

export async function getFeeDefaultersReport(params: {
    academicYearId?: string;
    classId?: string;
    agingBracket?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<FeeDefaultersReportResponse> {
    const sp = new URLSearchParams();
    if (params.academicYearId) sp.append("academicYearId", params.academicYearId);
    if (params.classId && params.classId !== "ALL") sp.append("classId", params.classId);
    if (params.agingBracket && params.agingBracket !== "ALL") sp.append("agingBracket", params.agingBracket);
    if (params.search) sp.append("search", params.search);
    if (params.page) sp.append("page", String(params.page));
    if (params.limit) sp.append("limit", String(params.limit));

    const qs = sp.toString() ? `?${sp.toString()}` : "";
    const res = (await apiFetch(`/api/reports/income/fee-defaulters${qs}`)) as ApiSuccess<FeeDefaultersReportResponse>;
    if (!res?.data) throw new Error(res?.message || "Failed to fetch Fee Defaulters report");
    return res.data;
}

// =========================================================================
// 3. Fines & Penalties Register Types
// =========================================================================

export interface FineTypeSummaryItem {
    fineTypeId: string;
    fineTypeName: string;
    billedAmount: number;
    collectedAmount: number;
    waivedAmount: number;
    balanceAmount: number;
    count: number;
}

export interface FineRecordItem {
    fineId: string;
    leviedDate: string;
    fineTypeName: string;
    reason: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    rollNumber: string;
    parentContact: string;
    amount: number;
    paidAmount: number;
    waivedAmount: number;
    balanceAmount: number;
    status: string;
    lastReceiptNumber: string;
    lastPaymentDate: string | null;
}

export interface FinesRegisterReportResponse {
    summary: {
        totalLevied: number;
        totalCollected: number;
        totalWaived: number;
        totalOutstanding: number;
        count: number;
    };
    fineTypeBreakdown: FineTypeSummaryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    fines: FineRecordItem[];
}

export async function getFinesRegisterReport(params: {
    academicYearId?: string;
    fineTypeId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<FinesRegisterReportResponse> {
    const sp = new URLSearchParams();
    if (params.academicYearId) sp.append("academicYearId", params.academicYearId);
    if (params.fineTypeId && params.fineTypeId !== "ALL") sp.append("fineTypeId", params.fineTypeId);
    if (params.status && params.status !== "ALL") sp.append("status", params.status);
    if (params.fromDate) sp.append("fromDate", params.fromDate);
    if (params.toDate) sp.append("toDate", params.toDate);
    if (params.search) sp.append("search", params.search);
    if (params.page) sp.append("page", String(params.page));
    if (params.limit) sp.append("limit", String(params.limit));

    const qs = sp.toString() ? `?${sp.toString()}` : "";
    const res = (await apiFetch(`/api/reports/income/fines-register${qs}`)) as ApiSuccess<FinesRegisterReportResponse>;
    if (!res?.data) throw new Error(res?.message || "Failed to fetch Fines Register report");
    return res.data;
}

// =========================================================================
// 4. Transportation Reports Types
// =========================================================================

export interface VehicleSummaryItem {
    vehicleId: string;
    vehicleName: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    capacity: number;
    assignedCount: number;
    availableSeats: number;
    status: string;
}

export interface PassengerRosterItem {
    assignmentId: string;
    vehicleId: string;
    vehicleName: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    studentId: string;
    studentName: string;
    admissionNumber: string;
    gender: string;
    className: string;
    rollNumber: string;
    parentName: string;
    parentPhone: string;
    whatsappNumber: string;
    address: string;
    assignedDate: string | null;
}

export interface VehicleRouteRosterResponse {
    summary: {
        totalVehicles: number;
        totalCapacity: number;
        totalPassengers: number;
        availableSeats: number;
    };
    vehiclesSummary: VehicleSummaryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    passengers: PassengerRosterItem[];
}

export async function getVehicleRouteRosterReport(params: {
    academicYearId?: string;
    vehicleId?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<VehicleRouteRosterResponse> {
    const sp = new URLSearchParams();
    if (params.academicYearId) sp.append("academicYearId", params.academicYearId);
    if (params.vehicleId && params.vehicleId !== "ALL") sp.append("vehicleId", params.vehicleId);
    if (params.search) sp.append("search", params.search);
    if (params.page) sp.append("page", String(params.page));
    if (params.limit) sp.append("limit", String(params.limit));

    const qs = sp.toString() ? `?${sp.toString()}` : "";
    const res = (await apiFetch(`/api/reports/transport/route-roster${qs}`)) as ApiSuccess<VehicleRouteRosterResponse>;
    if (!res?.data) throw new Error(res?.message || "Failed to fetch Vehicle Route Roster");
    return res.data;
}

export interface VehicleProfitabilityItem {
    vehicleId: string;
    vehicleName: string;
    vehicleNumber: string;
    capacity: number;
    passengerCount: number;
    revenueCollected: number;
    fuelCost: number;
    maintenanceCost: number;
    driverSalary: number;
    totalExpenses: number;
    netMargin: number;
    status: "SURPLUS" | "DEFICIT";
}

export interface VehicleProfitabilityResponse {
    summary: {
        totalRevenue: number;
        totalExpenses: number;
        fuelExpenses: number;
        maintenanceExpenses: number;
        driverSalaries: number;
        netFleetMargin: number;
    };
    vehicles: VehicleProfitabilityItem[];
}

export async function getVehicleProfitabilityReport(params: {
    academicYearId?: string;
    fromDate?: string;
    toDate?: string;
}): Promise<VehicleProfitabilityResponse> {
    const sp = new URLSearchParams();
    if (params.academicYearId) sp.append("academicYearId", params.academicYearId);
    if (params.fromDate) sp.append("fromDate", params.fromDate);
    if (params.toDate) sp.append("toDate", params.toDate);

    const qs = sp.toString() ? `?${sp.toString()}` : "";
    const res = (await apiFetch(`/api/reports/transport/vehicle-profitability${qs}`)) as ApiSuccess<VehicleProfitabilityResponse>;
    if (!res?.data) throw new Error(res?.message || "Failed to fetch Vehicle Profitability report");
    return res.data;
}

// =========================================================================
// 5. Admissions & Demographic Reports Types
// =========================================================================

export interface DivisionDemographicItem {
    divisionId: string;
    divisionName: string;
    totalStudents: number;
    boysCount: number;
    girlsCount: number;
    activeCount: number;
    withdrawnCount: number;
}

export interface ClassDemographicItem {
    classId: string;
    className: string;
    totalStudents: number;
    boysCount: number;
    girlsCount: number;
    activeCount: number;
    withdrawnCount: number;
    divisions: DivisionDemographicItem[];
}

export interface BloodGroupItem {
    bloodGroup: string;
    studentCount: number;
}

export interface ClassDemographicsResponse {
    summary: {
        totalStudents: number;
        totalBoys: number;
        totalGirls: number;
        totalOther: number;
        totalClasses: number;
    };
    classMatrix: ClassDemographicItem[];
    bloodGroupSummary: BloodGroupItem[];
}

export async function getClassDemographicsReport(params: {
    academicYearId?: string;
}): Promise<ClassDemographicsResponse> {
    const sp = new URLSearchParams();
    if (params.academicYearId) sp.append("academicYearId", params.academicYearId);

    const qs = sp.toString() ? `?${sp.toString()}` : "";
    const res = (await apiFetch(`/api/reports/admissions/class-demographics${qs}`)) as ApiSuccess<ClassDemographicsResponse>;
    if (!res?.data) throw new Error(res?.message || "Failed to fetch Class Demographics report");
    return res.data;
}

export interface StudentProgressionItem {
    enrollmentId: string;
    studentId: string;
    studentName: string;
    admissionNumber: string;
    gender: string;
    className: string;
    rollNumber: string;
    parentContact: string;
    enrollmentStatus: string;
    studentStatus: string;
    nextStage: string;
    admissionDate: string;
    lastUpdated: string;
}

export interface StudentProgressionResponse {
    summary: {
        totalEnrollments: number;
        activeCount: number;
        promotedCount: number;
        withdrawnCount: number;
        completedCount: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    students: StudentProgressionItem[];
}

export async function getStudentProgressionReport(params: {
    academicYearId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<StudentProgressionResponse> {
    const sp = new URLSearchParams();
    if (params.academicYearId) sp.append("academicYearId", params.academicYearId);
    if (params.status && params.status !== "ALL") sp.append("status", params.status);
    if (params.search) sp.append("search", params.search);
    if (params.page) sp.append("page", String(params.page));
    if (params.limit) sp.append("limit", String(params.limit));

    const qs = sp.toString() ? `?${sp.toString()}` : "";
    const res = (await apiFetch(`/api/reports/admissions/student-progression${qs}`)) as ApiSuccess<StudentProgressionResponse>;
    if (!res?.data) throw new Error(res?.message || "Failed to fetch Student Progression report");
    return res.data;
}
