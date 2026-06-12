"use client";
import * as React from "react"
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    createStudent,
    updateStudent,
    getStudentById,
    StudentInput,
} from "@/lib/services/student";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

const bloodGroups = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
];

export default function Page() {
    const [date, setDate] = React.useState<Date>()
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    const fieldClass = `
  h-12
  rounded-xl
  border-[#788164]
  bg-[#6D755F]
  text-white
  placeholder:text-white/70
  focus:ring-0
  focus:ring-offset-0
`;

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] =
        useState<StudentInput>({
            admissionNumber: "",
            studentName: "",
            gender: "Male",
            dob: "",
            bloodGroup: "",
            fatherName: "",
            fatherMobile: "",
            motherName: "",
            motherMobile: "",
            whatsappNumber: "",
            address: "",
        });

    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const handleSubmit = async () => {
        try {
            setLoading(true);

            if (id) {
                await updateStudent(id, formData);
                toast.success("Student updated successfully");
            } else {
                await createStudent(formData);
                toast.success("Student created successfully");
            }

            router.push("/admin/students");
        } catch (error) {
            console.error(error);

            toast.error("Failed to create student");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadStudent = async () => {
            if (!id) return;

            const student = await getStudentById(id);

            if (student) {
                setFormData({
                    admissionNumber: student.admissionNumber,
                    studentName: student.studentName,
                    gender: student.gender,
                    dob: student.dob,
                    bloodGroup: student.bloodGroup,
                    fatherName: student.fatherName,
                    fatherMobile: student.fatherMobile,
                    motherName: student.motherName,
                    motherMobile: student.motherMobile,
                    whatsappNumber: student.whatsappNumber,
                    address: student.address,
                });

                setDate(new Date(student.dob));
            }
        };

        loadStudent();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

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
                        {id ? "Edit Student" : "Create Student"}
                    </h1>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {id
                            ? "Update this student's record."
                            : "Add a new student record."}
                    </p>
                </div>
            </div>

            {/* Main Card */}
            <Card className="mt-6 border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Basic information
                        </h2>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="admissionNumber">
                                    Admission Number
                                </Label>
                                <Input
                                    id="admissionNumber"
                                    name="admissionNumber"
                                    value={formData.admissionNumber}
                                    onChange={handleChange}
                                    placeholder="Admission Number"
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="studentName">
                                    Student Name
                                </Label>
                                <Input
                                    id="studentName"
                                    name="studentName"
                                    value={formData.studentName}
                                    onChange={handleChange}
                                    placeholder="Student Name"
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">
                                    Gender
                                </Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            gender: value as "Male" | "Female",
                                        }))
                                    }
                                >
                                    <SelectTrigger id="gender" className={`w-full ${fieldClass}`}>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>

                                    <SelectContent className="bg-white border-[#788164] rounded-3xl shadow-lg p-2">
                                        <SelectItem
                                            value="Male"
                                            className="
                                                rounded-full
                                                text-black
                                                data-[highlighted]:bg-[#8a9770]
                                                data-[highlighted]:text-white
                                                data-[state=checked]:bg-[#8a9770]
                                                data-[state=checked]:text-white
                                            "
                                        >
                                            Male
                                        </SelectItem>

                                        <SelectItem
                                            value="Female"
                                            className="
                                                rounded-full
                                                text-black
                                                data-[highlighted]:bg-[#8a9770]
                                                data-[highlighted]:text-white
                                                data-[state=checked]:bg-[#8a9770]
                                                data-[state=checked]:text-white
                                            "
                                        >
                                            Female
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bloodGroup">
                                    Blood Group
                                </Label>
                                <Select
                                    value={formData.bloodGroup}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            bloodGroup: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="bloodGroup" className={`w-full ${fieldClass}`}>
                                        <SelectValue placeholder="Select Blood Group" />
                                    </SelectTrigger>

                                    <SelectContent className="bg-white border-[#788164] rounded-3xl shadow-lg p-2">
                                        {bloodGroups.map((group) => (
                                            <SelectItem
                                                key={group}
                                                value={group}
                                                className="
                                                    rounded-full
                                                    text-black
                                                    data-[highlighted]:bg-[#8a9770]
                                                    data-[highlighted]:text-white
                                                    data-[state=checked]:bg-[#8a9770]
                                                    data-[state=checked]:text-white
                                                "
                                            >
                                                {group}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Date Of Birth</Label>

                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`w-full justify-start text-left font-normal ${fieldClass}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : "Select Date of Birth"}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            captionLayout="dropdown"
                                            onSelect={(selectedDate) => {
                                                if (!selectedDate) return;

                                                setDate(selectedDate);

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    dob: selectedDate.toISOString(),
                                                }));

                                                setOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsappNumber">
                                    Whatsapp Number
                                </Label>
                                <Input
                                    id="whatsappNumber"
                                    name="whatsappNumber"
                                    value={formData.whatsappNumber}
                                    onChange={handleChange}
                                    placeholder="Pls Enter whatsapp no..."
                                    className={fieldClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    {/* Parent Details */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Parent details
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Father
                                </p>

                                <div className="space-y-2">
                                    <Label htmlFor="fatherName">
                                        Father Name
                                    </Label>
                                    <Input
                                        id="fatherName"
                                        name="fatherName"
                                        value={formData.fatherName}
                                        onChange={handleChange}
                                        placeholder="Father Name"
                                        className={fieldClass}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fatherMobile">
                                        Father Phone no
                                    </Label>
                                    <Input
                                        id="fatherMobile"
                                        name="fatherMobile"
                                        value={formData.fatherMobile}
                                        onChange={handleChange}
                                        placeholder="Father Mobile"
                                        className={fieldClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Mother
                                </p>

                                <div className="space-y-2">
                                    <Label htmlFor="motherName">
                                        Mother Name
                                    </Label>
                                    <Input
                                        id="motherName"
                                        name="motherName"
                                        value={formData.motherName}
                                        onChange={handleChange}
                                        placeholder="Mother Name"
                                        className={fieldClass}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="motherMobile">
                                        Mother Phone no
                                    </Label>
                                    <Input
                                        id="motherMobile"
                                        name="motherMobile"
                                        value={formData.motherMobile}
                                        onChange={handleChange}
                                        placeholder="Mother Mobile"
                                        className={fieldClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    {/* Address */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Address
                        </h2>

                        <div className="space-y-2">
                            <Label htmlFor="address">
                                Address
                            </Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Address"
                                className={`min-h-[120px] ${fieldClass}`}
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading
                            ? id
                                ? "Updating..."
                                : "Saving..."
                            : id
                                ? "Update"
                                : "Save"}
                    </Button>
                </CardFooter>
            </Card>
        </section>
    );
}