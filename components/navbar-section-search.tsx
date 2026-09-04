"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  X,
  CornerDownLeft,
  GraduationCap,
  CircleDollarSign,
  FileText,
  Users,
  Settings,
  Home,
  BookOpen,
  Receipt,
  Bus,
  ShieldCheck,
  Building2,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  getSearchableSections,
  type PortalArea,
  type SearchableSection,
} from "@/lib/portal"

interface NavbarSectionSearchProps {
  area: PortalArea
  userPermissions?: string[]
  userRole?: string | null
}

function getSectionIcon(slug: string, area: string): LucideIcon {
  const s = slug.toLowerCase()
  if (s.includes("dashboard")) return Home
  if (s.includes("relieving") || s.includes("promotion") || s.includes("student") || s.includes("admission"))
    return GraduationCap
  if (s.includes("academic") || s.includes("class") || s.includes("division")) return BookOpen
  if (s.includes("staff") || s.includes("user")) return Users
  if (s.includes("role") || s.includes("permission")) return ShieldCheck
  if (s.includes("vehicle") || s.includes("transport")) return Bus
  if (s.includes("report") || s.includes("daybook") || s.includes("demographic") || s.includes("census"))
    return FileText
  if (s.includes("fee") || s.includes("charge") || s.includes("fine") || s.includes("cca"))
    return CircleDollarSign
  if (s.includes("expense") || s.includes("salary") || s.includes("account")) return Receipt
  return Building2
}

export function NavbarSectionSearch({
  area,
  userPermissions = [],
  userRole,
}: NavbarSectionSearchProps) {
  const router = useRouter()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isMac, setIsMac] = React.useState(true)

  // Detect OS for shortcut symbol (⌘ on Mac, Ctrl on Win/Linux)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0)
    }
  }, [])

  // All accessible sections in Admin and Workspace (100% strictly excluding Student portal)
  const accessibleSections = React.useMemo(() => {
    return getSearchableSections(userPermissions, userRole, area)
  }, [userPermissions, userRole, area])

  // Filter & score matching sections based on query
  const filteredSections = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // Curated quick recommendations when input is focused with empty query
      const prioritySlugs = [
        "relieving",
        "promotion",
        "admissions",
        "fee-management",
        "reports/daybook",
        "fee-structures/bulk-assign",
        "students",
        "expense-management",
      ]
      return accessibleSections
        .filter((s) => prioritySlugs.includes(s.slug))
        .slice(0, 8)
    }

    const scored = accessibleSections
      .map((section) => {
        const labelLower = section.label.toLowerCase()
        const purposeLower = section.purpose.toLowerCase()
        const groupLower = section.group.toLowerCase()
        const subgroupLower = (section.subgroup || "").toLowerCase()

        let score = 0
        if (labelLower === q) score += 100
        else if (labelLower.startsWith(q)) score += 60
        else if (labelLower.includes(q)) score += 40

        if (section.keywords.some((k) => k.startsWith(q))) score += 35
        else if (section.keywords.some((k) => k.includes(q))) score += 20

        if (groupLower.includes(q) || subgroupLower.includes(q)) score += 15
        if (purposeLower.includes(q)) score += 10

        // Prioritize sections in current area slightly if score is tied
        if (score > 0 && section.area === area) score += 5

        return { section, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.section)

    return scored.slice(0, 10)
  }, [accessibleSections, query, area])

  // Reset selected index on query change
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query, isOpen])

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Global Keyboard Shortcut (⌘K / Ctrl+K)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSelect = React.useCallback(
    (section: SearchableSection) => {
      setIsOpen(false)
      setQuery("")
      inputRef.current?.blur()
      router.push(section.href)
    },
    [router]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (filteredSections.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredSections.length)
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (filteredSections.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredSections.length) % filteredSections.length)
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredSections.length > 0 && filteredSections[selectedIndex]) {
        handleSelect(filteredSections[selectedIndex])
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[16rem] sm:max-w-[20rem] md:max-w-[22rem] lg:max-w-[26rem]">
      {/* Search Input Bar */}
      <div
        className={`group relative flex h-9 w-full items-center rounded-xl border transition-all ${
          isOpen
            ? "border-[#556043] bg-white ring-2 ring-[#556043]/20 dark:border-[#9ea98a] dark:bg-slate-950 dark:ring-[#9ea98a]/20"
            : "border-black/[0.08] bg-black/[0.03] hover:border-black/20 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-slate-900"
        }`}
      >
        <Search className="ml-2.5 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search sections... (e.g. Relieving, Daybook)"
          className="h-full w-full bg-transparent px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
          aria-label="Search sections"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="mr-2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="mr-2 hidden items-center gap-0.5 rounded border border-slate-200/80 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500 sm:flex">
            <span>{isMac ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </div>
        )}
      </div>

      {/* Autocomplete / Autosuggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[22rem] w-full min-w-[18rem] overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>{query ? "Matching Sections" : "Quick Sections"}</span>
            <span className="text-[9px] font-normal normal-case text-slate-400">
              {filteredSections.length} available
            </span>
          </div>

          <div className="mt-1 space-y-1 overflow-y-auto max-h-[18rem] scroll-py-1 pr-0.5">
            {filteredSections.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <p className="font-medium">No sections found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try searching for keywords like "Relieving", "Fees", "Admissions", or "Daybook"
                </p>
              </div>
            ) : (
              filteredSections.map((item, index) => {
                const isSelected = index === selectedIndex
                const Icon = getSectionIcon(item.slug, item.area)
                const isAdmin = item.area === "admin"

                return (
                  <button
                    type="button"
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    data-section-slug={item.slug}
                    data-section-area={item.area}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(item)
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      handleSelect(item)
                    }}
                    className={`w-full text-left flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#556043]/10 text-slate-950 dark:bg-[#556043]/20 dark:text-white"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isAdmin
                            ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
                            : "bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {item.purpose}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4.5 font-semibold uppercase tracking-wider ${
                          isAdmin
                            ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300"
                            : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-300"
                        }`}
                      >
                        {isAdmin ? "Admin" : "Workspace"}
                      </Badge>

                      {isSelected && (
                        <div className="hidden sm:flex items-center text-slate-400 dark:text-slate-500 pl-1">
                          <CornerDownLeft className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="mt-1.5 border-t border-slate-100 dark:border-slate-800/80 px-2 pt-1.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <kbd className="rounded border bg-slate-50 px-1 py-0.2 text-[9px] dark:bg-slate-900 dark:border-slate-800">↑</kbd>
                <kbd className="rounded border bg-slate-50 px-1 py-0.2 text-[9px] dark:bg-slate-900 dark:border-slate-800">↓</kbd> navigate
              </span>
              <span className="flex items-center gap-0.5">
                <kbd className="rounded border bg-slate-50 px-1 py-0.2 text-[9px] dark:bg-slate-900 dark:border-slate-800">↵</kbd> select
              </span>
              <span className="flex items-center gap-0.5">
                <kbd className="rounded border bg-slate-50 px-1 py-0.2 text-[9px] dark:bg-slate-900 dark:border-slate-800">esc</kbd> close
              </span>
            </div>
            <span className="text-slate-400">Portal Sections</span>
          </div>
        </div>
      )}
    </div>
  )
}
