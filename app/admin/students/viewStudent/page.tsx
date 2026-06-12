"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, } from "@/components/ui/card"
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
    getStudentById,
    type Student,
} from "@/lib/services/student";

export default function Page() {
    const router = useRouter();

    const searchParams = useSearchParams();
    const studentId = searchParams.get("id");

    const [student, setStudent] = useState<Student | null>(null);
    useEffect(() => {
        if (studentId) {
            loadStudent();
        }
    }, [studentId]);

    const loadStudent = async () => {
        try {
            const response = await getStudentById(
                studentId!
            );

            setStudent(response);
        } catch (error) {
            console.error(error);
        }
    };
    function InfoCard({
        title,
        value,
    }: {
        title: string;
        value: string;
    }) {
        return (
            <div className="rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">
                    {title}
                </p>

                <p className="mt-2 text-lg font-semibold">
                    {value}
                </p>
            </div>
        );
    }
    return (
        <section className="px-6 py-4">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div>
                    <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                        View Student
                    </h1>
                </div>
            </div>
            {student && (
                <div className="mt-6 space-y-6">
                    {/* Profile Card */}
                    <Card className="border-0  text-white">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                                        {student.studentName.charAt(0)}
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold">
                                            {student.studentName}
                                        </h2>

                                        <p className="text-white/80">
                                            Admission No : {student.admissionNumber}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span
                                        className={`rounded-full px-4 py-2 text-sm font-semibold ${student.status === "ACTIVE"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {student.status}
                                    </span>

                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student Information */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">
                                Student Information
                            </h3>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <InfoCard
                                    title="Gender"
                                    value={student.gender}
                                />

                                <InfoCard
                                    title="Date of Birth"
                                    value={new Date(
                                        student.dob
                                    ).toLocaleDateString()}
                                />

                                <InfoCard
                                    title="Blood Group"
                                    value={student.bloodGroup}
                                />

                                <InfoCard
                                    title="Whatsapp"
                                    value={student.whatsappNumber}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parents */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">
                                Parent Information
                            </h3>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="rounded-xl border p-5">
                                    <p className="text-sm text-muted-foreground">
                                        Father
                                    </p>

                                    <h4 className="mt-2 text-lg font-semibold">
                                        {student.fatherName}
                                    </h4>

                                    <p className="text-muted-foreground">
                                        {student.fatherMobile}
                                    </p>
                                </div>

                                <div className="rounded-xl border p-5">
                                    <p className="text-sm text-muted-foreground">
                                        Mother
                                    </p>

                                    <h4 className="mt-2 text-lg font-semibold">
                                        {student.motherName}
                                    </h4>

                                    <p className="text-muted-foreground">
                                        {student.motherMobile}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">
                                Address
                            </h3>
                        </CardHeader>

                        <CardContent>
                            <p>{student.address}</p>
                        </CardContent>
                    </Card>

                    {/* Dates */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">
                                    Created At
                                </p>

                                <p className="mt-2 font-semibold">
                                    {new Date(student.createdAt).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">
                                    Updated At
                                </p>

                                <p className="mt-2 font-semibold">
                                    {new Date(
                                        student.updatedAt
                                    ).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </section>
    )
}
