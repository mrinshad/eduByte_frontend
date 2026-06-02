"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Menu, MoonStar, LogOut, SunMedium, User, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getCurrentSession } from "@/lib/auth"

type NavbarProps = {
  title: string
  subtitle: string
  academicYear: string
  userLabel?: string
  onOpenMobileMenu: () => void
  onLogout: () => void
}

export function Navbar({ title, subtitle, academicYear, userLabel, onOpenMobileMenu, onLogout }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            aria-label="Open navigation menu"
            onClick={onOpenMobileMenu}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300">
              K
            </div>
            <span className="truncate text-base font-semibold tracking-tight text-slate-950 dark:text-white sm:text-lg">kidscove</span>
          </Link>

          <span className="hidden max-w-[26rem] truncate text-sm text-slate-500 dark:text-slate-400 lg:block">
            {subtitle}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200 md:inline-flex">
            {academicYear}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDarkMode ? "light" : "dark")}
          >
            {isDarkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>

          {userLabel ? <AccountMenu userLabel={userLabel} onLogout={onLogout} /> : null}
        </div>
      </div>
    </header>
  )
}

function AccountMenu({ userLabel, onLogout }: { userLabel: string; onLogout: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [user, setUser] = React.useState<{ username?: string; email?: string | null; name?: string } | null>(null)
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    let active = true

    async function fetchUser() {
      try {
        const session = await getCurrentSession()
        if (!active) return
        setUser(session.user)
      } catch {
        if (active) setUser(null)
      }
    }

    void fetchUser()

    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (ref.current.contains(e.target as Node)) return
      setOpen(false)
    }

    document.addEventListener("mousedown", onDoc)

    return () => {
      active = false
      document.removeEventListener("mousedown", onDoc)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-1 py-0.5 text-[0.72rem] font-medium text-slate-700 hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
      >
        <Avatar>
          <AvatarImage src={undefined} alt={user?.username} />
          <AvatarFallback>{(user?.username || user?.name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <ChevronDown className="hidden sm:inline h-4 w-4 text-slate-600 dark:text-slate-300" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-black/5 bg-white shadow-lg dark:border-white/10 dark:bg-slate-950">
          <div className="px-3 py-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={undefined} alt={user?.username} />
                <AvatarFallback>{(user?.username || user?.name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{user?.username || user?.name || "User"}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email || "..."}</div>
              </div>
            </div>
          </div>
          <div className="border-t border-black/5 dark:border-white/10" />
          <ul className="p-2">
            <li>
              <button
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}