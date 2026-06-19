"use client"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
export default function Page(){
    const router = useRouter()
  return (
     <section className="w-full px-6 py-4 space-y-6">

      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              Create Fines
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
             Create and Update students student fines.
            </p>
          </div>
        </div>
        </div>
        </section>
  )
}
