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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type FieldOption = { label: string; value: string }

export type FormField =
  | { type: "text" | "number"; name: string; label: string; placeholder?: string; required?: boolean }
  | {
      type: "select"
      name: string
      label: string
      placeholder?: string
      options: FieldOption[]
      required?: boolean
      triggerClassName?: string
      contentClassName?: string
      itemClassName?: string
    }
  | { type: "checkbox"; name: string; label: string; required?: boolean }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = Record<string, any>

interface ReusableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: FormField[]
  values: FormValues
  errors?: Record<string, string | undefined>
  onChange: (name: string, value: FormValues[string]) => void
  onSubmit: () => void | Promise<void>
  isSaving?: boolean
  isEditing?: boolean
  submitLabel?: string
  editSubmitLabel?: string
  cancelLabel?: string
  contentClassName?: string
  /** "default" = plain light dialog. "vehicle" = deep-olive themed dialog. */
  theme?: "default" | "vehicle"
}

const fieldErrorClass = "!border-red-400 dark:!border-red-500/60 focus-visible:!ring-red-400"

const FieldError = ({ children }: { children?: string }) => {
  if (!children) return null
  return <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-0.5 mt-1">{children}</p>
}

const vehicleInputClass = `
  bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300
  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
`

/**
 * Generic create/edit dialog driven entirely by a `fields` config.
 * Supports "text", "number", "select", and "checkbox" field types,
 * optional per-field required markers, and optional field-level errors.
 */
export function ReusableFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  values,
  errors = {},
  onChange,
  onSubmit,
  isSaving = false,
  isEditing = false,
  submitLabel = "Save",
  editSubmitLabel = "Update",
  cancelLabel = "Cancel",
  contentClassName,
  theme = "default",
}: ReusableFormDialogProps) {
  const isVehicleTheme = theme === "vehicle"

  const contentThemeClass = isVehicleTheme
    ? "bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100 border border-[#6a7459] dark:border-slate-800 rounded-2xl p-0 overflow-hidden"
    : "rounded-2xl"

  const inputThemeClass = isVehicleTheme ? vehicleInputClass : ""

  const body = (
    <div className={isVehicleTheme ? "p-6" : ""}>
      <DialogHeader>
        <DialogTitle className={cn("text-lg sm:text-xl font-semibold", isVehicleTheme && "text-white")}>
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription className={cn("text-xs sm:text-sm", isVehicleTheme && "text-slate-200")}>
            {description}
          </DialogDescription>
        )}
      </DialogHeader>

      <div className="space-y-4 py-3">
        {fields.map((field) => {
          const error = errors[field.name]

          return (
            <div
              key={field.name}
              className={field.type === "checkbox" ? "flex items-center space-x-2" : "space-y-1.5"}
            >
              {field.type !== "checkbox" && (
                <Label className={cn("text-sm font-medium", isVehicleTheme && "text-white")}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
              )}

              {(field.type === "text" || field.type === "number") && (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  min={field.type === "number" ? 0 : undefined}
                  onWheel={field.type === "number" ? (e) => e.currentTarget.blur() : undefined}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  className={cn("rounded-xl", inputThemeClass, error && fieldErrorClass)}
                />
              )}

              {field.type === "select" && (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(value) => onChange(field.name, value)}
                >
                  <SelectTrigger
                    className={cn(
                      field.triggerClassName ?? "w-full rounded-xl",
                      inputThemeClass,
                      error && fieldErrorClass,
                    )}
                  >
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent className={field.contentClassName}>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className={field.itemClassName}>
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
                    onCheckedChange={(checked) => onChange(field.name, checked === true)}
                    className={isVehicleTheme ? "border-[#8b9478] data-[state=checked]:bg-white data-[state=checked]:text-[#556043]" : undefined}
                  />
                  <Label className={cn("text-sm font-medium", isVehicleTheme && "text-white")}>{field.label}</Label>
                </>
              )}

              <FieldError>{error}</FieldError>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          contentClassName ?? "w-[92vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto",
          contentThemeClass,
        )}
      >
        {body}

        <DialogFooter
          className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
            isVehicleTheme && "bg-[#6a7459] dark:bg-slate-950 border-t dark:border-slate-800 p-6 mt-0",
          )}
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className={cn(
              "w-full sm:w-auto rounded-xl",
              isVehicleTheme && "rounded-full border-[#8b9478] bg-transparent text-white hover:bg-white/10 hover:text-white",
            )}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className={cn(
              "w-full sm:w-auto rounded-xl",
              isVehicleTheme && "rounded-full bg-white text-[#556043] hover:bg-slate-100",
            )}
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isEditing ? "Updating..." : "Saving..."}
              </span>
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