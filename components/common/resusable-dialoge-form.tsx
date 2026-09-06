"use client"

import { useState } from "react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type FieldOption = { label: string; value: string }

export type FormField =
  | {
      type: "text" | "number" | "password"
      name: string
      label: string
      placeholder?: string
      required?: boolean
      colSpan?: 1 | 2
      className?: string
    }
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
      colSpan?: 1 | 2
      className?: string
    }
  | {
      // Searchable version of "select" — renders a Popover + Command list
      // with a filter input, for fields with long option lists (e.g. students).
      type: "combobox"
      name: string
      label: string
      placeholder?: string
      searchPlaceholder?: string
      emptyText?: string
      options: FieldOption[]
      required?: boolean
      triggerClassName?: string
      contentClassName?: string
      /** Shown inside the popover while options are still loading. */
      loading?: boolean
      colSpan?: 1 | 2
      className?: string
    }
  | {
      type: "checkbox"
      name: string
      label: string
      required?: boolean
      colSpan?: 1 | 2
      className?: string
    }

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
  fieldsContainerClassName?: string
  /** "default" = plain light dialog. "vehicle" = deep-olive themed dialog. */
  theme?: "default" | "vehicle"
}

const fieldErrorClass = "!border-red-400 dark:!border-red-500/60 focus-visible:!ring-red-400"

const FieldError = ({ children }: { children?: string }) => {
  if (!children) return null
  return <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-0.5 mt-1">{children}</p>
}

const vehicleInputClass = `
  bg-[#667155] border-[#8b9478] text-white placeholder:text-slate-300 [&_svg]:text-white/80
  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:[&_svg]:text-slate-300
`

/**
 * Generic create/edit dialog driven entirely by a `fields` config.
 * Supports "text", "number", "select", "combobox" (searchable select),
 * and "checkbox" field types, optional per-field required markers,
 * and optional field-level errors.
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
  fieldsContainerClassName,
  theme = "default",
}: ReusableFormDialogProps) {
  const isVehicleTheme = theme === "vehicle"

  // Tracks which single combobox field (by name) currently has its popover
  // open — dialogs typically only have one combobox field open at a time.
  const [openCombobox, setOpenCombobox] = useState<string | null>(null)

  const contentThemeClass = isVehicleTheme
    ? "bg-[#5f694d] dark:bg-slate-900 text-white dark:text-slate-100 border border-[#6a7459] dark:border-slate-800 rounded-2xl p-0 overflow-hidden"
    : "rounded-2xl p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"

  const inputThemeClass = isVehicleTheme ? vehicleInputClass : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[92vw] sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl",
          contentThemeClass,
          contentClassName,
        )}
      >
        <div className="p-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-semibold", isVehicleTheme && "text-white")}>
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className={cn("text-xs sm:text-sm mt-1", isVehicleTheme ? "text-slate-200" : "text-slate-500 dark:text-slate-400")}>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        <div className={cn("space-y-4 px-6 py-2 flex-1 overflow-y-auto", fieldsContainerClassName)}>
          {fields.map((field) => {
            const error = errors[field.name]
            const colSpanClass = field.colSpan === 2 ? "sm:col-span-2" : field.colSpan === 1 ? "sm:col-span-1" : ""

            return (
              <div
                key={field.name}
                className={cn(
                  field.type === "checkbox" ? "flex items-center space-x-2" : "space-y-1.5",
                  colSpanClass,
                  field.className,
                )}
              >
                {field.type !== "checkbox" && (
                  <Label className={cn("text-sm font-medium", isVehicleTheme && "text-white")}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>
                )}

                {(field.type === "text" || field.type === "number" || field.type === "password") && (
                  <Input
                    type={field.type === "number" ? "number" : field.type === "password" ? "password" : "text"}
                    min={field.type === "number" ? 0 : undefined}
                    step={field.type === "number" ? "0.01" : undefined}
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

                {field.type === "combobox" && (
                  <Popover
                    open={openCombobox === field.name}
                    onOpenChange={(next) => setOpenCombobox(next ? field.name : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox === field.name}
                        className={cn(
                          "w-full justify-between font-normal rounded-xl",
                          field.triggerClassName,
                          inputThemeClass,
                          error && fieldErrorClass,
                        )}
                      >
                        <span
                          className={cn(
                            "truncate text-left",
                            !values[field.name] && (isVehicleTheme ? "text-slate-300" : "text-slate-400"),
                          )}
                        >
                          {values[field.name]
                            ? field.options.find((opt) => opt.value === values[field.name])?.label ??
                              field.placeholder ??
                              "Select..."
                            : field.placeholder ?? "Select..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className={cn("w-[--radix-popover-trigger-width] p-0 rounded-xl", field.contentClassName)}
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder={field.searchPlaceholder ?? "Search..."} />
                        <CommandList>
                          {field.loading ? (
                            <div className="flex items-center justify-center gap-2 p-4 text-xs text-slate-500">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>{field.emptyText ?? "No results found."}</CommandEmpty>
                              <CommandGroup>
                                {field.options.map((opt) => (
                                  <CommandItem
                                    key={opt.value}
                                    value={opt.label}
                                    onSelect={() => {
                                      onChange(field.name, opt.value)
                                      setOpenCombobox(null)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        values[field.name] === opt.value ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    {opt.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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

        <DialogFooter
          className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0",
            isVehicleTheme
              ? "bg-[#6a7459] dark:bg-slate-950 border-t border-[#8b9478]/40 dark:border-slate-800 p-6 mt-0"
              : "border-t border-slate-200 dark:border-slate-800 p-6 mt-0 bg-slate-50 dark:bg-slate-900",
          )}
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className={cn(
              "w-full sm:w-auto rounded-xl",
              isVehicleTheme && "rounded-full border-[#8b9478] bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800",
            )}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className={cn(
              "w-full sm:w-auto rounded-xl font-medium",
              isVehicleTheme && "rounded-full bg-white text-[#556043] hover:bg-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
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