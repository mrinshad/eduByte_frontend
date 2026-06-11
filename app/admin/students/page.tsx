"use client";
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
export default function Page(){
  const router = useRouter()
  return (
    <section className="px-6 py-4">
            <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Students</h1>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-600">View and manage student records, enrollment details, and academic information.</p>
                </div>
            </div>
    </section>
  )
}
