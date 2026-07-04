"use client"
import { ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">
      
        <div className="flex items-center gap-4">
          <Button
            className="bg-background text-foreground hover:opacity-90 shadow-sm"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              student name
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              admission no
            </p>
          </div>
        </div>
    </section>
  )
}
