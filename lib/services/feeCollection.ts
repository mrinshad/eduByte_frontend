import { apiFetch } from "@/lib/api";

export interface studentFeeCollection{
    enrollmentId:string,
    admissionNumber:string,
    student:string,
    class:string,
    vehicle:string,
    TotalDue:number
}   

//get all feecollection for table

export async function getStudentFeeCollection(){

    const payload = (await apiFetch("/api/feecollection/stdlist")) as {
        success:boolean,
        message?:string,
        data?:studentFeeCollection[];
    };
    return payload.data ?? [];
}