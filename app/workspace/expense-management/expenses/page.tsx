"use client"

import * as React from "react"
import { toast } from "sonner"
import { Tags, Layers3, Pencil, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PageHeader from "@/components/common/pageHeader"
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import {
  createExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  createExpenseSubCategory,
  getExpenseSubCategories,
  updateExpenseSubCategory,
  getExpenseAccountsNamesandIds,
  type ExpenseCategory,
  type ExpenseSubCategory,
  type AccountName,
} from "@/lib/services/expense"

// Same color language as the Academic Profile page (amber accent + soft
// text-shadow on colored headers so it stays legible over any background).
const titleTextClass = "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-100"
const supportingTextClass = "text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-300"
const subtleTextClass = "text-white/85 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] dark:text-slate-400"
const editIconClass = "rounded-xl text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] hover:text-white dark:text-slate-300 dark:hover:text-amber-300"
const inputTextClass = "text-white/95 [text-shadow:0_1px_2px_rgba(15,23,42,0.75)] placeholder:text-white/85"

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

export default function Page() {
  // ---------------------------------------------------------------------
  // Shared lookup data
  // ---------------------------------------------------------------------
  const [categories, setCategories] = React.useState<ExpenseCategory[]>([])
  const [subCategories, setSubCategories] = React.useState<ExpenseSubCategory[]>([])
  const [accounts, setAccounts] = React.useState<AccountName[]>([])

  const router = useRouter();

  const accountNameById = React.useMemo(() => {
    const map = new Map<string, string>()
    accounts.forEach((a) => map.set(a.id, a.name))
    return map
  }, [accounts])

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
  // Expense Category — add/edit dialog
  // ---------------------------------------------------------------------
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false)
  const [categoryDialogMode, setCategoryDialogMode] = React.useState<"add" | "edit">("add")
  const [categoryNameDraft, setCategoryNameDraft] = React.useState("")
  const [categoryDescriptionDraft, setCategoryDescriptionDraft] = React.useState("")
  const [categorySaving, setCategorySaving] = React.useState(false)

  function openCategoryDialog(mode: "add" | "edit") {
    setCategoryDialogMode(mode)
    setCategoryNameDraft(mode === "edit" ? selectedCategory?.name ?? "" : "")
    setCategoryDescriptionDraft(mode === "edit" ? selectedCategory?.description ?? "" : "")
    setCategoryDialogOpen(true)
  }

  function closeCategoryDialog() {
    setCategoryDialogOpen(false)
    setCategoryNameDraft("")
    setCategoryDescriptionDraft("")
  }

  async function handleSaveCategory() {
    const name = categoryNameDraft.trim()
    const description = categoryDescriptionDraft.trim()

    if (!name) {
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
  const [subCategoryNameDraft, setSubCategoryNameDraft] = React.useState("")
  const [subCategoryAccountDraft, setSubCategoryAccountDraft] = React.useState("")
  const [subCategoryDescriptionDraft, setSubCategoryDescriptionDraft] = React.useState("")
  const [subCategorySaving, setSubCategorySaving] = React.useState(false)

  function openSubCategoryDialog(mode: "add" | "edit", subCategory?: ExpenseSubCategory) {
    setSubCategoryDialogMode(mode)
    setEditingSubCategoryId(mode === "edit" ? subCategory?.id ?? null : null)
    setSubCategoryNameDraft(mode === "edit" ? subCategory?.name ?? "" : "")
    setSubCategoryAccountDraft(mode === "edit" ? subCategory?.expenseAccountId ?? "" : "")
    setSubCategoryDescriptionDraft(mode === "edit" ? subCategory?.description ?? "" : "")
    setSubCategoryDialogOpen(true)
  }

  function closeSubCategoryDialog() {
    setSubCategoryDialogOpen(false)
    setEditingSubCategoryId(null)
    setSubCategoryNameDraft("")
    setSubCategoryAccountDraft("")
    setSubCategoryDescriptionDraft("")
  }

  async function handleSaveSubCategory() {
    const name = subCategoryNameDraft.trim()
    const description = subCategoryDescriptionDraft.trim()

    if (!selectedCategoryId) {
      toast.error("Select a category first")
      return
    }
    if (!name) {
      toast.error("Enter a sub category name")
      return
    }
    if (!subCategoryAccountDraft) {
      toast.error("Select an expense account")
      return
    }

    setSubCategorySaving(true)
    try {
      if (subCategoryDialogMode === "add") {
        await createExpenseSubCategory({
          categoryId: selectedCategoryId,
          name,
          expenseAccountId: subCategoryAccountDraft,
          description,
        })
        toast.success("Sub category created")
      } else if (editingSubCategoryId) {
        await updateExpenseSubCategory(editingSubCategoryId, {
          name,
          expenseAccountId: subCategoryAccountDraft,
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
  // Render
  // ---------------------------------------------------------------------
  return (
    <TooltipProvider>
      <section className="px-4 sm:px-6 py-4">
        <PageHeader title="Expenses" description="Manage your expenses" />
        <div className="mt-6 space-y-6">
          <Card className="w-full dark:bg-background">
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
              router.push("/workspace/expense-management/expenses/createExpense")
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
            <Card className="w-full dark:bg-background">
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
            <Card className="w-full dark:bg-background">
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
                            {accountNameById.get(subCategory.expenseAccountId) ?? subCategory.expenseAccountId}
                            {subCategory.description ? ` · ${subCategory.description}` : ""}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className={editIconClass}
                        onClick={() => openSubCategoryDialog("edit", subCategory)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="sm:max-w-xl text-slate-950 dark:text-slate-50 dark:bg-background">
            <DialogHeader>
              <DialogTitle className={`text-xl font-semibold ${titleTextClass}`}>
                {categoryDialogMode === "add" ? "Add Category" : "Edit Category"}
              </DialogTitle>
              <DialogDescription className={supportingTextClass}>
                {categoryDialogMode === "add"
                  ? "Create a new expense category."
                  : "Update the selected expense category."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category Name</label>
                <Input
                  className="mt-2"
                  value={categoryNameDraft}
                  onChange={(event) => setCategoryNameDraft(event.target.value)}
                  placeholder="e.g. Office Expense"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                <Input
                  className="mt-2"
                  value={categoryDescriptionDraft}
                  onChange={(event) => setCategoryDescriptionDraft(event.target.value)}
                  placeholder="e.g. Category for office expense"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeCategoryDialog}>
                Cancel
              </Button>
              <Button onClick={() => void handleSaveCategory()} disabled={categorySaving}>
                {categorySaving ? "Saving..." : categoryDialogMode === "add" ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ------------------------------------------------------------- */}
        {/* Create / Edit Expense Sub Category Dialog */}
        {/* ------------------------------------------------------------- */}
        <Dialog open={subCategoryDialogOpen} onOpenChange={setSubCategoryDialogOpen}>
          <DialogContent className="sm:max-w-xl text-slate-950 dark:text-slate-50 dark:bg-background">
            <DialogHeader>
              <DialogTitle className={`text-xl font-semibold ${titleTextClass}`}>
                {subCategoryDialogMode === "add" ? "Add Sub Category" : "Edit Sub Category"}
              </DialogTitle>
              <DialogDescription className={supportingTextClass}>
                {subCategoryDialogMode === "add"
                  ? `Create a sub category under ${selectedCategory?.name || "the selected category"}.`
                  : "Update the selected sub category."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Sub Category Name</label>
                <Input
                  className="mt-2"
                  value={subCategoryNameDraft}
                  onChange={(event) => setSubCategoryNameDraft(event.target.value)}
                  placeholder="e.g. Fuel Expense"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Expense Account</label>
                <Select value={subCategoryAccountDraft} onValueChange={setSubCategoryAccountDraft}>
                  <SelectTrigger className="w-full rounded-xl mt-2">
                    <SelectValue placeholder="Select Expense Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                <Input
                  className="mt-2"
                  value={subCategoryDescriptionDraft}
                  onChange={(event) => setSubCategoryDescriptionDraft(event.target.value)}
                  placeholder="e.g. Vehicle subcategory: fuel expense"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeSubCategoryDialog}>
                Cancel
              </Button>
              <Button onClick={() => void handleSaveSubCategory()} disabled={subCategorySaving}>
                {subCategorySaving ? "Saving..." : subCategoryDialogMode === "add" ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </TooltipProvider>
  )
}