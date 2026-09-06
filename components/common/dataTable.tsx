"use client"

import { ReactNode } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

/**
 * ---------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------
 */
export interface DataTableColumn<T> {
  /** Unique key for this column (also used as React key) */
  key: string
  /** Column header label */
  header: string
  /** Tailwind width class, e.g. "w-[15%]" */
  widthClassName?: string
  /** How to align the header/cell content */
  align?: "left" | "center" | "right"
  /** Prevent wrapping */
  nowrap?: boolean
  /** Truncate long content with a max width, e.g. "max-w-[180px]" */
  truncateClassName?: string
  /** Render the cell. Receives the row and its index. */
  cell: (row: T, index: number) => ReactNode
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  /** Unique key extractor for each row */
  rowKey: (row: T) => string | number

  isLoading?: boolean
  loadingLabel?: string
  error?: string | null
  emptyLabel?: string

  /** Current page (1-indexed) */
  page: number
  onPageChange: (page: number) => void
  /** Rows per page */
  limit: number
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]

  /** Total row count and total pages (server-paginated) or omit for client pagination */
  total: number
  totalPages: number
  startEntry: number
  endEntry: number

  className?: string
}

/**
 * ---------------------------------------------------------------------
 * DataTable
 * ---------------------------------------------------------------------
 * A generic, reusable table with the same visual language used across
 * the app: olive-green header, rounded card, loading/error/empty
 * states, and a pagination footer with a rows-per-page selector.
 *
 * Usage:
 *
 * <DataTable
 *   columns={[
 *     { key: "admissionNumber", header: "Admission No", cell: (row) => row.admissionNumber },
 *     { key: "student", header: "Name", cell: (row) => row.student, truncateClassName: "max-w-[180px]" },
 *     {
 *       key: "actions",
 *       header: "Actions",
 *       align: "center",
 *       cell: (row) => (
 *         <div className="flex items-center justify-center gap-0.5">
 *           <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
 *         </div>
 *       ),
 *     },
 *   ]}
 *   data={fines}
 *   rowKey={(row) => row.id}
 *   isLoading={isLoading}
 *   error={error}
 *   page={page}
 *   onPageChange={setPage}
 *   limit={limit}
 *   onLimitChange={(l) => { setLimit(l); setPage(1) }}
 *   total={total}
 *   totalPages={totalPages}
 *   startEntry={startEntry}
 *   endEntry={endEntry}
 * />
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  loadingLabel = "Loading...",
  error = null,
  emptyLabel = "No data found",
  page,
  onPageChange,
  limit,
  onLimitChange,
  limitOptions = [5, 10, 25, 50],
  total,
  totalPages,
  startEntry,
  endEntry,
  className,
}: DataTableProps<T>) {
  const colCount = columns.length

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 overflow-hidden",
        className
      )}
    >
      <div className="w-full overflow-x-auto [scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-[#556043] hover:bg-[#556043] dark:bg-background dark:hover:bg-background border-none">
              {columns.map((col, i) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "px-4 sm:px-6 h-12 font-semibold tracking-tight whitespace-nowrap",
                    i === 0
                      ? "text-white dark:text-foreground"
                      : "text-[oklch(0.98_0.01_95)]",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.widthClassName
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-7 w-7 animate-spin text-[#556043]" />
                    <p className="text-sm">{loadingLabel}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="h-40 text-center text-red-500"
                >
                  <p className="text-sm font-medium">{error}</p>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="h-40 text-center text-slate-500"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={rowKey(row)}
                  className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300",
                        col.nowrap !== false && "whitespace-nowrap",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                        col.truncateClassName && `truncate ${col.truncateClassName}`
                      )}
                    >
                      {col.cell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-t border-slate-200 px-4 sm:px-6 py-4 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center lg:text-left order-2 lg:order-1">
          {total === 0 ? (
            "No entries"
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {startEntry}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {endEntry}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {total}
              </span>{" "}
              entries
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 order-1 lg:order-2 w-full sm:w-auto justify-end">
          {onLimitChange && (
            <div className="flex items-center gap-2 justify-center w-full sm:w-auto">
              <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Rows per page:
              </span>
              <Select
                value={String(limit)}
                onValueChange={(value) => onLimitChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px] rounded-lg bg-white dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {limitOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
            <Button
              className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 h-9 disabled:opacity-40 rounded-lg px-3 flex-1 sm:flex-none"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(page - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap px-2">
              Page {page} of {totalPages}
            </span>

            <Button
              className="bg-[#556043] text-white hover:bg-[#4a533b] dark:bg-background dark:text-foreground dark:hover:bg-background/80 shadow-sm gap-1 h-9 disabled:opacity-40 rounded-lg px-3 flex-1 sm:flex-none"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}