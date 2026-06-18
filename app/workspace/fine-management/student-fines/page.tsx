"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createFineTypes, updateFineType, getFineTypes, type FineType } from "@/lib/services/fineTypes"

export default function Page() {
  const router = useRouter()

  const [fineTypesOpen, setFineTypesOpen] = useState(false)
  const [fineTypes, setFineTypes] = useState<FineType[]>([])
  const [loading, setLoading] = useState(false)


  const [editingFineType, setEditingFineType] = useState<FineType | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [names, setNames] = useState<string[]>([""])
  const [submitting, setSubmitting] = useState(false)

  async function loadFineTypes(searchTerm?: string) {
    setLoading(true)
    try {
      const data = await getFineTypes({ search: searchTerm })
      setFineTypes(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load fine types")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  if (fineTypesOpen) {
    void loadFineTypes()
  } else {
    setEditingFineType(null)
  }
}, [fineTypesOpen])

  function openEdit(fineType: FineType) {
    setEditingFineType(fineType)
    setNames([fineType.name])
    setCreateOpen(true)
  }





  function resetAndCloseCreate() {
    setNames([""])
    setEditingFineType(null)
    setCreateOpen(false)
  }

  function updateNameAt(index: number, value: string) {
    setNames((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function addRow() {
    setNames((prev) => [...prev, ""])
  }

  function removeRow(index: number) {
    setNames((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreate() {
    const cleaned = names.map((n) => n.trim()).filter(Boolean)

    if (cleaned.length === 0) {
      toast.error("Enter at least one fine type name")
      return
    }

    setSubmitting(true)

    try {
      if (editingFineType) {
        await updateFineType(editingFineType.id, {
          name: cleaned[0],
        })

        setFineTypes((prev) =>
          prev.map((item) =>
            item.id === editingFineType.id
              ? { ...item, name: cleaned[0] }
              : item
          )
        )

        toast.success("Fine Type Updated")
      } else {
        await createFineTypes({
          names: cleaned,
        })

        toast.success("Created Fine Type")

        await loadFineTypes()
      }

      resetAndCloseCreate()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingFineType
            ? "Failed to update fine type"
            : "Failed to create fine type"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="w-full px-6 py-4 space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
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
              Student Fines
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Manage and view all student fines.
            </p>
          </div>
        </div>
        <Button
          className="shrink-0 gap-1.5 bg-background text-foreground hover:opacity-90 shadow-sm"
          size="sm"
          onClick={() => setFineTypesOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 text-foreground" />
          Fine Types
        </Button>
      </div>

      {/* Fine Types Dialog */}
      <Dialog open={fineTypesOpen} onOpenChange={setFineTypesOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-2xl text-slate-950 dark:text-slate-50">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-semibold text-white">Fine Types</DialogTitle>
                <DialogDescription>View and manage all fine types.</DialogDescription>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {loading && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            )}

            {!loading && fineTypes.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No fine types yet. Add one to get started.
              </p>
            )}

            {!loading &&
              fineTypes.map((fineType) => (
                <div
                  key={fineType.id}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-4 transition-colors",
                    "border-black/5 bg-white dark:border-white/10 dark:bg-white/5",
                  )}
                >
                  <>
                    <h3 className="font-semibold text-slate-950 dark:text-slate-100">
                      {fineType.name}
                    </h3>

                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => openEdit(fineType)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFineTypesOpen(false)} className="text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Fine Type Dialog */}
      <Dialog open={createOpen} onOpenChange={(next) => (next ? setCreateOpen(next) : resetAndCloseCreate())}>
        <DialogContent className="sm:max-w-lg text-slate-950 dark:text-slate-50" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {editingFineType ? "Edit Fine Type" : "Create Fine Type"}
            </DialogTitle>
            <DialogDescription>Create a new fine type, or add several at once.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {names.map((name, index) => (
              <div key={index} className="space-y-2">
                {index === 0 && (
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Fine Type Name
                  </label>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => updateNameAt(index, e.target.value)}
                    placeholder="e.g. Library Fine"
                    className="flex-1"
                  />
                  {names.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeRow(index)} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addRow} className="mt-1 text-white">
              <Plus className="h-3.5 w-3.5" />
              Add another
            </Button>
          </div>

          <DialogFooter>
            <Button className="text-white" variant="outline" onClick={resetAndCloseCreate}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={submitting}>
              {submitting
                ? editingFineType
                  ? "Updating..."
                  : "Creating..."
                : editingFineType
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}