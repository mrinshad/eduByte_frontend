"use client"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Cake,
    Droplet,
    MessageCircle,
    User,
    Phone,
    MapPin,
    Calendar,
    Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
            const response = await getStudentById(studentId!);
            setStudent(response);
        } catch (error) {
            console.error(error);
        }
    };

    function FactRow({
        icon: Icon,
        label,
        value,
    }: {
        icon: React.ElementType;
        label: string;
        value: string;
    }) {
        return (
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                </div>
                <span className="text-sm font-medium">{value || "—"}</span>
            </div>
        );
    }

    function ContactCard({
        role,
        name,
        mobile,
    }: {
        role: string;
        name: string;
        mobile: string;
    }) {
        return (
            <div className="flex items-center gap-4 rounded-xl border p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {name ? name.charAt(0) : "?"}
                </div>
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {role}
                    </p>
                    <p className="truncate font-semibold">{name || "—"}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{mobile || "—"}</span>
                    </div>
                </div>
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
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    {/* Left: Profile panel */}
                    <div className="lg:sticky lg:top-4 lg:self-start">
                        <Card>
                            <CardContent className="p-6 text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                                    {student.studentName.charAt(0)}
                                </div>

                                <h2 className="mt-4 text-xl font-bold tracking-tight">
                                    {student.studentName}
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Admission No: {student.admissionNumber}
                                </p>

                                <span
                                    className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                        student.status === "ACTIVE"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {student.status}
                                </span>

                                <div className="mt-6 divide-y border-t pt-2 text-left">
                                    <FactRow icon={User} label="Gender" value={student.gender} />
                                    <FactRow
                                        icon={Cake}
                                        label="Date of birth"
                                        value={new Date(student.dob).toLocaleDateString()}
                                    />
                                    <FactRow icon={Droplet} label="Blood group" value={student.bloodGroup} />
                                    <FactRow
                                        icon={MessageCircle}
                                        label="Whatsapp"
                                        value={student.whatsappNumber}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Details */}
                    <div className="space-y-6">
                        {/* Parents */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Parent information</h3>
                            </CardHeader>

                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <ContactCard
                                        role="Father"
                                        name={student.fatherName}
                                        mobile={student.fatherMobile}
                                    />
                                    <ContactCard
                                        role="Mother"
                                        name={student.motherName}
                                        mobile={student.motherMobile}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Address</h3>
                            </CardHeader>

                            <CardContent>
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <p className="text-sm leading-relaxed">{student.address}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Record metadata */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Record details</h3>
                            </CardHeader>

                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-center gap-3 rounded-xl border p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Created at</p>
                                            <p className="font-semibold">
                                                {new Date(student.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl border p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <Clock className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Updated at</p>
                                            <p className="font-semibold">
                                                {new Date(student.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </section>
    )
}