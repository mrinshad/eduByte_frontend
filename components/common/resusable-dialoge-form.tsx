"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export type FieldOption = { label: string; value: string }

export type FormField =
  | { type: "text"; name: string; label: string; placeholder?: string }
  | {
      type: "select"
      name: string
      label: string
      placeholder?: string
      options: FieldOption[]
      triggerClassName?: string
      contentClassName?: string
      itemClassName?: string
    }
  | { type: "checkbox"; name: string; label: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = Record<string, any>

interface ReusableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: FormField[]
  values: FormValues
  onChange: (name: string, value: FormValues[string]) => void
  onSubmit: () => void | Promise<void>
  isSaving?: boolean
  isEditing?: boolean
  submitLabel?: string
  editSubmitLabel?: string
  contentClassName?: string
}

/**
 * Generic create/edit dialog driven entirely by a `fields` config.
 * Supports "text", "select", and "checkbox" field types today —
 * add more cases in the switch below if you need date pickers, textareas, etc.
 */
export function ReusableFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  values,
  onChange,
  onSubmit,
  isSaving = false,
  isEditing = false,
  submitLabel = "Save",
  editSubmitLabel = "Update",
  contentClassName = "sm:max-w-[460px]",
}: ReusableFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className={
                field.type === "checkbox"
                  ? "flex items-center space-x-2"
                  : "space-y-1.5"
              }
            >
              {field.type !== "checkbox" && (
                <label className="text-sm font-medium">{field.label}</label>
              )}

              {field.type === "text" && (
                <Input
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(e) => onChange(field.name, e.target.value)}
                />
              )}

              {field.type === "select" && (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(value) => onChange(field.name, value)}
                >
                  <SelectTrigger className={field.triggerClassName ?? "w-full"}>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent className={field.contentClassName}>
                    {field.options.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={field.itemClassName}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === "checkbox" && (
                <>
                  <Checkbox
                    checked={!!values[field.name]}
                    onCheckedChange={(checked) =>
                      onChange(field.name, checked === true)
                    }
                  />
                  <label className="text-sm font-medium">{field.label}</label>
                </>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#556043] text-white hover:bg-[#4a533b]"
            onClick={onSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Updating..." : "Saving..."}
              </>
            ) : isEditing ? (
              editSubmitLabel
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}