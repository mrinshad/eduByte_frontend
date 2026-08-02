"use client"

import * as React from "react"
import { toast } from "sonner"
import { Tags, Layers3, Pencil, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/common/pageHeader"
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ReusableFormDialog, type FormField } from "@/components/common/resusable-dialoge-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  createExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  deleteExpenseCategory,
  createExpenseSubCategory,
  getExpenseSubCategories,
  updateExpenseSubCategory,
  deleteExpenseSubCategory,
  getExpenseAccountsNamesandIds,
  type ExpenseCategory,
  type ExpenseSubCategory,
  type AccountName,
} from "@/lib/services/expense"

// Same color language as the Academic Profile page (amber accent + soft
// text-shadow on colored headers so it stays legible over any background).
const titleTextClass = "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-100"
const supportingTextClass = "text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-300"
const editIconClass = "rounded-xl text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] hover:text-white dark:text-slate-300 dark:hover:text-amber-300"

function AddAction({ onAdd, disabled }: { onAdd: () => void; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-xl" onClick={onAdd} disabled={disabled}>
          <Plus className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add</p>
      </TooltipContent>
    </Tooltip>
  )
}

function DeleteAction({
  onDelete,
  disabled,
  disabledReason,
}: {
  onDelete: (e: React.MouseEvent) => void
  disabled?: boolean
  disabledReason?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span wrapper so the tooltip still works on a disabled button */}
        <span className="inline-flex">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:text-slate-400 disabled:hover:bg-transparent dark:disabled:text-slate-600"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(e)
            }}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{disabled && disabledReason ? disabledReason : "Delete"}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default function Page() {
  // ---------------------------------------------------------------------
  // Shared lookup data
  // ---------------------------------------------------------------------
  const [categories, setCategories] = React.useState<ExpenseCategory[]>([])
  const [subCategories, setSubCategories] = React.useState<ExpenseSubCategory[]>([])
  const [accounts, setAccounts] = React.useState<AccountName[]>([])

  const router = useRouter();

  // The category selected in the left card scopes the sub category card on
  // the right — same relationship the Class card has with the Division card.
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("")

  const selectedCategory = React.useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  )

  const selectedCategorySubCategories = React.useMemo(
    () => subCategories.filter((sc) => sc.categoryId === selectedCategoryId),
    [subCategories, selectedCategoryId]
  )

  async function loadCategories() {
    try {
      const data = await getExpenseCategories()
      setCategories(data)
      if (data.length > 0) {
        setSelectedCategoryId((current) => current || data[0].id)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load expense categories")
    }
  }

  async function loadSubCategories() {
    try {
      const data = await getExpenseSubCategories()
      setSubCategories(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load expense sub categories")
    }
  }

  async function loadAccounts() {
    try {
      const data = await getExpenseAccountsNamesandIds()
      setAccounts(data)
    } catch (error) {
      toast.error("Failed to load accounts")
    }
  }

  React.useEffect(() => {
    void loadCategories()
    void loadSubCategories()
    void loadAccounts()
  }, [])

  // ---------------------------------------------------------------------
  // Expense Category — add/edit dialog (now via ReusableFormDialog)
  // ---------------------------------------------------------------------
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false)
  const [categoryDialogMode, setCategoryDialogMode] = React.useState<"add" | "edit">("add")
  const [categoryValues, setCategoryValues] = React.useState<{ name: string; description: string }>({
    name: "",
    description: "",
  })
  const [categoryErrors, setCategoryErrors] = React.useState<Record<string, string | undefined>>({})
  const [categorySaving, setCategorySaving] = React.useState(false)

  const categoryFields: FormField[] = [
    { type: "text", name: "name", label: "Category Name", placeholder: "e.g. Office Expense", required: true },
    { type: "text", name: "description", label: "Description", placeholder: "e.g. Category for office expense" },
  ]

  function openCategoryDialog(mode: "add" | "edit") {
    setCategoryDialogMode(mode)
    setCategoryValues({
      name: mode === "edit" ? selectedCategory?.name ?? "" : "",
      description: mode === "edit" ? selectedCategory?.description ?? "" : "",
    })
    setCategoryErrors({})
    setCategoryDialogOpen(true)
  }

  function closeCategoryDialog() {
    setCategoryDialogOpen(false)
    setCategoryValues({ name: "", description: "" })
    setCategoryErrors({})
  }

  function handleCategoryFieldChange(name: string, value: string) {
    setCategoryValues((prev) => ({ ...prev, [name]: value }))
    if (categoryErrors[name]) {
      setCategoryErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSaveCategory() {
    const name = categoryValues.name.trim()
    const description = categoryValues.description.trim()

    if (!name) {
      setCategoryErrors({ name: "Enter a category name" })
      toast.error("Enter a category name")
      return
    }

    setCategorySaving(true)
    try {
      if (categoryDialogMode === "add") {
        await createExpenseCategory({ name, description })
        toast.success("Category created")
      } else if (selectedCategoryId) {
        await updateExpenseCategory(selectedCategoryId, { name, description })
        toast.success("Category updated")
      }

      await loadCategories()
      closeCategoryDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category")
    } finally {
      setCategorySaving(false)
    }
  }

  // ---------------------------------------------------------------------
  // Expense Sub Category — add/edit dialog, scoped to selectedCategoryId
  // ---------------------------------------------------------------------
  const [subCategoryDialogOpen, setSubCategoryDialogOpen] = React.useState(false)
  const [subCategoryDialogMode, setSubCategoryDialogMode] = React.useState<"add" | "edit">("add")
  const [editingSubCategoryId, setEditingSubCategoryId] = React.useState<string | null>(null)
  const [subCategoryValues, setSubCategoryValues] = React.useState<{
    name: string
    expenseAccountId: string
    description: string
  }>({ name: "", expenseAccountId: "", description: "" })
  const [subCategoryErrors, setSubCategoryErrors] = React.useState<Record<string, string | undefined>>({})
  const [subCategorySaving, setSubCategorySaving] = React.useState(false)

  const subCategoryFields: FormField[] = [
    { type: "text", name: "name", label: "Sub Category Name", placeholder: "e.g. Fuel Expense", required: true },
    {
      type: "select",
      name: "expenseAccountId",
      label: "Expense Account",
      placeholder: "Select Expense Account",
      required: true,
      options: accounts.map((account) => ({ label: account.name, value: account.id })),
    },
    {
      type: "text",
      name: "description",
      label: "Description",
      placeholder: "e.g. Vehicle subcategory: fuel expense",
    },
  ]

  function openSubCategoryDialog(mode: "add" | "edit", subCategory?: ExpenseSubCategory) {
    setSubCategoryDialogMode(mode)
    setEditingSubCategoryId(mode === "edit" ? subCategory?.id ?? null : null)
    setSubCategoryValues({
      name: mode === "edit" ? subCategory?.name ?? "" : "",
      expenseAccountId: mode === "edit" ? subCategory?.expenseAccountId ?? "" : "",
      description: mode === "edit" ? subCategory?.description ?? "" : "",
    })
    setSubCategoryErrors({})
    setSubCategoryDialogOpen(true)
  }

  function closeSubCategoryDialog() {
    setSubCategoryDialogOpen(false)
    setEditingSubCategoryId(null)
    setSubCategoryValues({ name: "", expenseAccountId: "", description: "" })
    setSubCategoryErrors({})
  }

  function handleSubCategoryFieldChange(name: string, value: string) {
    setSubCategoryValues((prev) => ({ ...prev, [name]: value }))
    if (subCategoryErrors[name]) {
      setSubCategoryErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSaveSubCategory() {
    const name = subCategoryValues.name.trim()
    const description = subCategoryValues.description.trim()
    const expenseAccountId = subCategoryValues.expenseAccountId

    if (!selectedCategoryId) {
      toast.error("Select a category first")
      return
    }

    const nextErrors: Record<string, string | undefined> = {}
    if (!name) nextErrors.name = "Enter a sub category name"
    if (!expenseAccountId) nextErrors.expenseAccountId = "Select an expense account"

    if (Object.keys(nextErrors).length > 0) {
      setSubCategoryErrors(nextErrors)
      toast.error(nextErrors.name ?? nextErrors.expenseAccountId ?? "Fix the highlighted fields")
      return
    }

    setSubCategorySaving(true)
    try {
      if (subCategoryDialogMode === "add") {
        await createExpenseSubCategory({
          categoryId: selectedCategoryId,
          name,
          expenseAccountId,
          description,
        })
        toast.success("Sub category created")
      } else if (editingSubCategoryId) {
        await updateExpenseSubCategory(editingSubCategoryId, {
          name,
          expenseAccountId,
          description,
        })
        toast.success("Sub category updated")
      }

      await loadSubCategories()
      closeSubCategoryDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save sub category")
    } finally {
      setSubCategorySaving(false)
    }
  }

  // ---------------------------------------------------------------------
  // Delete confirmation (shared for category + sub category)
  // ---------------------------------------------------------------------
  type DeleteTarget =
    | { type: "category"; id: string; name: string; subCount: number }
    | { type: "subCategory"; id: string; name: string }
    | null

  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null)
  const [deleting, setDeleting] = React.useState(false)

  function requestDeleteCategory(category: ExpenseCategory) {
    const subCount = subCategories.filter((sc) => sc.categoryId === category.id).length
    if (subCount > 0) {
      toast.error("Delete all sub categories under this category first")
      return
    }
    setDeleteTarget({ type: "category", id: category.id, name: category.name, subCount })
  }
  function requestDeleteSubCategory(subCategory: ExpenseSubCategory) {
    setDeleteTarget({ type: "subCategory", id: subCategory.id, name: subCategory.name })
  }

  function closeDeleteDialog() {
    if (deleting) return
    setDeleteTarget(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      if (deleteTarget.type === "category") {
        await deleteExpenseCategory(deleteTarget.id)
        toast.success("Category deleted")

        // If the deleted category was selected, clear selection so the
        // effect / next load can pick a sensible default.
        if (selectedCategoryId === deleteTarget.id) {
          setSelectedCategoryId("")
        }
        await loadCategories()
        await loadSubCategories()
      } else {
        await deleteExpenseSubCategory(deleteTarget.id)
        toast.success("Sub category deleted")
        await loadSubCategories()
      }
      setDeleteTarget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <TooltipProvider>
      <section className="px-4 sm:px-6 py-4">
        <PageHeader title="Expenses" description="Manage your expenses" />
        <div className="mt-6 space-y-6">
          <Card className="w-full dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-black/5  dark:border-white/10">
              <div className="flex w-full items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Expense Management
                  </CardTitle>

                  <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Manage expense categories and subcategories.
                  </CardDescription>
                </div>

                <AddAction onAdd={() =>
                  router.push("/workspace/expense-management/createExpense")
                } />
              </div>
            </CardHeader>
          </Card>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* --------------------------------------------------------- */}
            {/* Expense Categories — click a row to scope the sub category */}
            {/* card on the right, the same relationship Class has with     */}
            {/* Division.                                                   */}
            {/* --------------------------------------------------------- */}
            <Card className="w-full dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-amber-500/10">
                    <Tags className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
                  </span>
                  <div>
                    <CardTitle className={`text-2xl font-semibold ${titleTextClass}`}>
                      Category
                    </CardTitle>
                    <CardDescription className={`mt-1 ${supportingTextClass}`}>
                      Select a category to see its sub categories.
                    </CardDescription>
                  </div>
                </div>

                <AddAction onAdd={() => openCategoryDialog("add")} />
              </CardHeader>

              <CardContent
                className="
                space-y-2 pt-4 max-h-[420px] overflow-y-auto
                scrollbar-thin
                scrollbar-thumb-slate-300
                scrollbar-track-transparent
                hover:scrollbar-thumb-slate-400
                dark:scrollbar-thumb-slate-700
                dark:hover:scrollbar-thumb-slate-600
              "
              >
                {categories.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-amber-500/30 bg-amber-50/80 px-5 py-6 text-center dark:border-amber-400/25 dark:bg-amber-400/10">
                    <p className={`text-sm font-medium ${titleTextClass}`}>No categories yet</p>
                    <p className={`mt-1 text-sm ${supportingTextClass}`}>
                      Click here to add categories before creating sub categories.
                    </p>
                    <Button className="mt-4 rounded-xl" onClick={() => openCategoryDialog("add")}>
                      Click here to add categories
                    </Button>
                  </div>
                ) : (
                  categories.map((category) => {
                    const isActive = category.id === selectedCategoryId
                    const subCount = subCategories.filter((sc) => sc.categoryId === category.id).length

                    return (
                      <div
                        key={category.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCategoryId(category.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setSelectedCategoryId(category.id)
                          }
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer",
                          isActive
                            ? "border-amber-500/40 bg-amber-100/90 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10"
                            : "border-black/5 bg-white/80 hover:border-black/10 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          <Tags className={cn("h-4 w-4 shrink-0", isActive ? "text-amber-700 dark:text-amber-300" : "text-slate-400")} />

                          <div className="min-w-0">
                            <span className="font-medium truncate block text-slate-950 dark:text-slate-100">
                              {category.name}
                            </span>

                            {category.description ? (
                              <span className="text-xs truncate block text-slate-500 dark:text-slate-400">
                                {category.description}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-full border border-black/5 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                            {subCount} sub
                          </span>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={editIconClass}
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedCategoryId(category.id)
                              openCategoryDialog("edit")
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <DeleteAction
                            onDelete={() => requestDeleteCategory(category)}
                            disabled={subCount > 0}
                            disabledReason={
                              subCount > 0
                                ? `Delete ${subCount} sub ${subCount === 1 ? "category" : "categories"} first`
                                : undefined
                            }
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* --------------------------------------------------------- */}
            {/* Expense Sub Categories — scoped to the selected category. */}
            {/* --------------------------------------------------------- */}
            <Card className="w-full dark:bg-slate-900 dark:border-slate-100 dark:text-slate-100">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-amber-500/10">
                    <Layers3 className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className={`text-2xl font-semibold truncate ${titleTextClass}`}>
                      Sub Category
                    </CardTitle>
                    <CardDescription className={`mt-1 ${supportingTextClass}`}>
                      {!selectedCategory
                        ? "Select a category to see its sub categories."
                        : selectedCategorySubCategories.length === 0
                          ? "No sub categories yet."
                          : `${selectedCategory.name} sub categories are shown here.`}
                    </CardDescription>
                  </div>
                </div>

                <AddAction onAdd={() => openSubCategoryDialog("add")} disabled={!selectedCategoryId} />
              </CardHeader>

              <CardContent
                className="
                space-y-2 pt-4 max-h-[420px] overflow-y-auto
                scrollbar-thin
                scrollbar-thumb-slate-300
                scrollbar-track-transparent
                hover:scrollbar-thumb-slate-400
                dark:scrollbar-thumb-slate-700
                dark:hover:scrollbar-thumb-slate-600
              "
              >
                {!selectedCategory ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                    <p className={`text-sm font-medium ${titleTextClass}`}>No category selected</p>
                    <Button className="mt-4 rounded-xl" onClick={() => openCategoryDialog("add")}>
                      Add category
                    </Button>
                  </div>
                ) : selectedCategorySubCategories.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-6 text-center dark:border-white/10">
                    <p className={`text-sm font-medium ${titleTextClass}`}>No sub categories yet</p>
                    <Button className="mt-4 rounded-xl" onClick={() => openSubCategoryDialog("add")}>
                      Add sub category
                    </Button>
                  </div>
                ) : (
                  selectedCategorySubCategories.map((subCategory) => (
                    <div
                      key={subCategory.id}
                      className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/80 px-4 py-3 transition-all dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                          {subCategory.name.slice(0, 2).toUpperCase()}
                        </span>

                        <div className="min-w-0">
                          <p className="font-medium text-slate-950 dark:text-slate-100 truncate">
                            {subCategory.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                            {subCategory.description ? `  ${subCategory.description}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={editIconClass}
                          onClick={() => openSubCategoryDialog("edit", subCategory)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <DeleteAction onDelete={() => requestDeleteSubCategory(subCategory)} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Create / Edit Expense Category Dialog */}
        {/* ------------------------------------------------------------- */}
        <ReusableFormDialog
          open={categoryDialogOpen}
          onOpenChange={(open) => (open ? setCategoryDialogOpen(true) : closeCategoryDialog())}
          theme="vehicle"
          title={categoryDialogMode === "add" ? "Add Category" : "Edit Category"}
          description={
            categoryDialogMode === "add"
              ? "Create a new expense category."
              : "Update the selected expense category."
          }
          fields={categoryFields}
          values={categoryValues}
          errors={categoryErrors}
          onChange={handleCategoryFieldChange}
          onSubmit={handleSaveCategory}
          isSaving={categorySaving}
          isEditing={categoryDialogMode === "edit"}
          submitLabel="Add"
          editSubmitLabel="Save"
        />

        {/* ------------------------------------------------------------- */}
        {/* Create / Edit Expense Sub Category Dialog */}
        {/* ------------------------------------------------------------- */}
        <ReusableFormDialog
          open={subCategoryDialogOpen}
          onOpenChange={(open) => (open ? setSubCategoryDialogOpen(true) : closeSubCategoryDialog())}
          theme="vehicle"
          title={subCategoryDialogMode === "add" ? "Add Sub Category" : "Edit Sub Category"}
          description={
            subCategoryDialogMode === "add"
              ? `Create a sub category under ${selectedCategory?.name || "the selected category"}.`
              : "Update the selected sub category."
          }
          fields={subCategoryFields}
          values={subCategoryValues}
          errors={subCategoryErrors}
          onChange={handleSubCategoryFieldChange}
          onSubmit={handleSaveSubCategory}
          isSaving={subCategorySaving}
          isEditing={subCategoryDialogMode === "edit"}
          submitLabel="Add"
          editSubmitLabel="Save"
        />

        {/* ------------------------------------------------------------- */}
        {/* Delete Confirmation Dialog (shared for category + sub category) */}
        {/* ------------------------------------------------------------- */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && closeDeleteDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {deleteTarget?.type === "category" ? "Category" : "Sub Category"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete{" "}
                <span className="font-medium text-foreground">{deleteTarget?.name}</span>
                {deleteTarget?.type === "category"
                  ? ". Any sub categories under it may also be affected."
                  : "."}{" "}
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </TooltipProvider>
  )
}