"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PageHeader from "@/components/common/pageHeader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Search, Loader2, X } from "lucide-react"

import {
  createExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  createExpenseSubCategory,
  getExpenseSubCategories,
  updateExpenseSubCategory,
  getAccountNames,
  type ExpenseCategory,
  type ExpenseSubCategory,
  type AccountName,
} from "@/lib/services/expense"

export default function Page() {
  // ---------------------------------------------------------------------
  // Shared lookup data
  // ---------------------------------------------------------------------
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [subCategories, setSubCategories] = useState<ExpenseSubCategory[]>([])
  const [accounts, setAccounts] = useState<AccountName[]>([])

  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(true)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>()
    accounts.forEach((a) => map.set(a.id, a.name))
    return map
  }, [accounts])

  async function loadCategories() {
    setCategoriesLoading(true)
    try {
      const data = await getExpenseCategories()
      setCategories(data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load expense categories"
      )
    } finally {
      setCategoriesLoading(false)
    }
  }

  async function loadSubCategories() {
    setSubCategoriesLoading(true)
    try {
      const data = await getExpenseSubCategories()
      setSubCategories(data)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load expense sub categories"
      )
    } finally {
      setSubCategoriesLoading(false)
    }
  }

  async function loadAccounts() {
    try {
      const data = await getAccountNames()
      setAccounts(data)
    } catch (error) {
      toast.error("Failed to load accounts")
    }
  }

  useEffect(() => {
    void loadCategories()
    void loadSubCategories()
    void loadAccounts()
  }, [])

  // ---------------------------------------------------------------------
  // Expense Category — search + create/edit dialog
  // ---------------------------------------------------------------------
  const [categorySearch, setCategorySearch] = useState("")
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [categorySubmitting, setCategorySubmitting] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" })

  const filteredCategories = categories.filter((c) => {
    const term = categorySearch.trim().toLowerCase()
    if (!term) return true
    return (
      c.name.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term)
    )
  })

  function openCreateCategory() {
    setEditingCategory(null)
    setCategoryForm({ name: "", description: "" })
    setCategoryDialogOpen(true)
  }

  function openEditCategory(category: ExpenseCategory) {
    setEditingCategory(category)
    setCategoryForm({ name: category.name, description: category.description })
    setCategoryDialogOpen(true)
  }

  function resetAndCloseCategoryDialog() {
    setCategoryDialogOpen(false)
    setEditingCategory(null)
    setCategoryForm({ name: "", description: "" })
  }

  async function handleSaveCategory() {
    const name = categoryForm.name.trim()
    const description = categoryForm.description.trim()

    if (!name) {
      toast.error("Enter a category name")
      return
    }

    setCategorySubmitting(true)
    try {
      if (editingCategory) {
        await updateExpenseCategory(editingCategory.id, { name, description })
        toast.success("Updated Expense Category")
      } else {
        await createExpenseCategory({ name, description })
        toast.success("Created Expense Category")
      }

      await loadCategories()
      resetAndCloseCategoryDialog()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingCategory
            ? "Failed to update expense category"
            : "Failed to create expense category"
      )
    } finally {
      setCategorySubmitting(false)
    }
  }

  // ---------------------------------------------------------------------
  // Expense Sub Category — search + create/edit dialog
  // ---------------------------------------------------------------------
  const [subCategorySearch, setSubCategorySearch] = useState("")
  const [subCategoryDialogOpen, setSubCategoryDialogOpen] = useState(false)
  const [editingSubCategory, setEditingSubCategory] = useState<ExpenseSubCategory | null>(null)
  const [subCategorySubmitting, setSubCategorySubmitting] = useState(false)
  const [subCategoryForm, setSubCategoryForm] = useState({
    categoryId: "",
    name: "",
    expenseAccountId: "",
    description: "",
  })

  const filteredSubCategories = subCategories.filter((sc) => {
    const term = subCategorySearch.trim().toLowerCase()
    if (!term) return true
    const categoryName = categoryNameById.get(sc.categoryId) ?? ""
    const accountName = accountNameById.get(sc.expenseAccountId) ?? ""
    return (
      sc.name.toLowerCase().includes(term) ||
      sc.description.toLowerCase().includes(term) ||
      categoryName.toLowerCase().includes(term) ||
      accountName.toLowerCase().includes(term)
    )
  })

  function openCreateSubCategory() {
    setEditingSubCategory(null)
    setSubCategoryForm({ categoryId: "", name: "", expenseAccountId: "", description: "" })
    setSubCategoryDialogOpen(true)
  }

  function openEditSubCategory(subCategory: ExpenseSubCategory) {
    setEditingSubCategory(subCategory)
    setSubCategoryForm({
      categoryId: subCategory.categoryId,
      name: subCategory.name,
      expenseAccountId: subCategory.expenseAccountId,
      description: subCategory.description,
    })
    setSubCategoryDialogOpen(true)
  }

  function resetAndCloseSubCategoryDialog() {
    setSubCategoryDialogOpen(false)
    setEditingSubCategory(null)
    setSubCategoryForm({ categoryId: "", name: "", expenseAccountId: "", description: "" })
  }

  async function handleSaveSubCategory() {
    const name = subCategoryForm.name.trim()
    const description = subCategoryForm.description.trim()

    if (!subCategoryForm.categoryId) {
      toast.error("Select a category")
      return
    }
    if (!name) {
      toast.error("Enter a sub category name")
      return
    }
    if (!subCategoryForm.expenseAccountId) {
      toast.error("Select an expense account")
      return
    }

    setSubCategorySubmitting(true)
    try {
      if (editingSubCategory) {
        await updateExpenseSubCategory(editingSubCategory.id, {
          name,
          expenseAccountId: subCategoryForm.expenseAccountId,
          description,
        })
        toast.success("Updated Expense Sub Category")
      } else {
        await createExpenseSubCategory({
          categoryId: subCategoryForm.categoryId,
          name,
          expenseAccountId: subCategoryForm.expenseAccountId,
          description,
        })
        toast.success("Created Expense Sub Category")
      }

      await loadSubCategories()
      resetAndCloseSubCategoryDialog()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingSubCategory
            ? "Failed to update expense sub category"
            : "Failed to create expense sub category"
      )
    } finally {
      setSubCategorySubmitting(false)
    }
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">
      <PageHeader title="Expenses" description="Manage your expenses" />

      {/* ------------------------------------------------------------- */}
      {/* Expense Categories */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Expense Categories</h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 shadow-sm rounded-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
              <Input
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[oklch(0.46_0.04_125)] focus-visible:border-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <Button
              className="shrink-0 gap-1.5 bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm font-medium tracking-tight h-10 sm:h-9 px-4 rounded-xl text-xs w-full sm:w-auto"
              onClick={openCreateCategory}
            >
              <Plus className="h-4 w-4 text-white dark:text-slate-900" />
              New Category
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="max-h-[292px] overflow-y-auto">
              <Table className="w-full min-w-[560px]">
                <TableHeader>
                  <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none sticky top-0 z-10">
                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap w-[25%]">
                      Name
                    </TableHead>
                    <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[55%]">
                      Description
                    </TableHead>
                    <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap text-center w-[20%]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {categoriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                          <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                          <p className="text-sm">Fetching expense categories...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-40 text-center text-slate-500">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow
                        key={category.id}
                        className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                      >
                        <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                          {category.name}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-[320px] truncate">
                          {category.description}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditCategory(category)}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                            title="Edit Category"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Expense Sub Categories */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Expense Sub Categories</h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 shadow-sm rounded-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 z-10" />
              <Input
                placeholder="Search sub categories..."
                value={subCategorySearch}
                onChange={(e) => setSubCategorySearch(e.target.value)}
                className="pl-10 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[oklch(0.46_0.04_125)] focus-visible:border-[oklch(0.46_0.04_125)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <Button
              className="shrink-0 gap-1.5 bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm font-medium tracking-tight h-10 sm:h-9 px-4 rounded-xl text-xs w-full sm:w-auto"
              onClick={openCreateSubCategory}
            >
              <Plus className="h-4 w-4 text-white dark:text-slate-900" />
              New Sub Category
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="max-h-[292px] overflow-y-auto">
              <Table className="w-full min-w-[760px]">
                <TableHeader>
                  <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none sticky top-0 z-10">
                    <TableHead className="px-4 sm:px-6 h-12 text-white dark:text-foreground font-semibold tracking-tight whitespace-nowrap w-[18%]">
                      Category
                    </TableHead>
                    <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[18%]">
                      Name
                    </TableHead>
                    <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[16%]">
                      Expense Account
                    </TableHead>
                    <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap w-[33%]">
                      Description
                    </TableHead>
                    <TableHead className="px-4 sm:px-6 h-12 text-[oklch(0.98_0.01_95)] font-semibold tracking-tight whitespace-nowrap text-center w-[15%]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {subCategoriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                          <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                          <p className="text-sm">Fetching expense sub categories...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSubCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-slate-500">
                        No sub categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubCategories.map((subCategory) => (
                      <TableRow
                        key={subCategory.id}
                        className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                      >
                        <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                          {categoryNameById.get(subCategory.categoryId) ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                          {subCategory.name}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-[140px] truncate">
                          {accountNameById.get(subCategory.expenseAccountId) ?? subCategory.expenseAccountId}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-[280px] truncate">
                          {subCategory.description}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditSubCategory(subCategory)}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#556043] hover:bg-[#556043]/10 dark:text-slate-400"
                            title="Edit Sub Category"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit Expense Category Dialog */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(next) => (next ? setCategoryDialogOpen(next) : resetAndCloseCategoryDialog())}
      >
        <DialogContent className="w-[92vw] sm:max-w-lg rounded-2xl p-4 sm:p-6" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {editingCategory ? "Edit Expense Category" : "Create Expense Category"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingCategory
                ? "Update this expense category."
                : "Add a new expense category."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <Input
                placeholder="e.g. Office Expense"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <Input
                placeholder="e.g. Category for office expense"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl"
              onClick={resetAndCloseCategoryDialog}
            >
              
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveCategory()}
              disabled={categorySubmitting}
              className="w-full sm:w-auto rounded-xl"
            >
              {categorySubmitting
                ? editingCategory ? "Updating..." : "Creating..."
                : editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit Expense Sub Category Dialog */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={subCategoryDialogOpen}
        onOpenChange={(next) => (next ? setSubCategoryDialogOpen(next) : resetAndCloseSubCategoryDialog())}
      >
        <DialogContent className="w-[92vw] sm:max-w-lg rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {editingSubCategory ? "Edit Expense Sub Category" : "Create Expense Sub Category"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingSubCategory
                ? "Update this expense sub category."
                : "Add a new expense sub category under a category."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <Select
                value={subCategoryForm.categoryId}
                onValueChange={(value) =>
                  setSubCategoryForm((prev) => ({ ...prev, categoryId: value }))
                }
                disabled={!!editingSubCategory}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <Input
                placeholder="e.g. Fuel Expense"
                value={subCategoryForm.name}
                onChange={(e) =>
                  setSubCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Expense Account
              </label>
              <Select
                value={subCategoryForm.expenseAccountId}
                onValueChange={(value) =>
                  setSubCategoryForm((prev) => ({ ...prev, expenseAccountId: value }))
                }
              >
                <SelectTrigger className="w-full rounded-xl">
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <Input
                placeholder="e.g. Vehicle subcategory: fuel expense"
                value={subCategoryForm.description}
                onChange={(e) =>
                  setSubCategoryForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl"
              onClick={resetAndCloseSubCategoryDialog}
            >
              
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveSubCategory()}
              disabled={subCategorySubmitting}
              className="w-full sm:w-auto rounded-xl"
            >
              {subCategorySubmitting
                ? editingSubCategory ? "Updating..." : "Creating..."
                : editingSubCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}