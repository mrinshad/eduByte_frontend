"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Marcellus } from "next/font/google"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const fontMarcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
})
import { Menu, MoonStar, LogOut, SunMedium, ChevronDown, Sparkles, Repeat } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentSession } from "@/lib/auth"
import { canSwitchPortals, type PortalArea } from "@/lib/portal"
import { NavbarSectionSearch } from "@/components/navbar-section-search"

interface NavbarProps {
  area: PortalArea
  title: string
  subtitle: string
  academicYear: string
  userLabel?: string
  userRole?: string | null
  userPermissions?: string[]
  onOpenMobileMenu: () => void
  onLogout: () => void
  onSwitchPortal?: (targetArea: PortalArea) => void
}

interface UserSession {
  username?: string
  email?: string | null
  name?: string
}

export function Navbar({
  area,
  subtitle,
  academicYear,
  userLabel,
  userRole,
  userPermissions,
  onOpenMobileMenu,
  onLogout,
  onSwitchPortal,
}: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  return (
    <div className="sticky top-0 z-40 w-full px-4 pt-3 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-7xl rounded-2xl border border-black/[0.06] bg-white/70 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/70 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="flex h-14 items-center justify-between gap-4">
          
          {/* Left Section: Brand & Subtitle */}
          <div className="flex min-w-0 items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl md:hidden hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Open navigation menu"
              onClick={onOpenMobileMenu}
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Link href="/" className="group flex min-w-0 items-center gap-2.5">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#556043] shadow-sm transition-transform group-hover:scale-105">
                <Image
                  src="/selogo.png"
                  alt="Kids covE Logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <span
                className={cn(
                  "text-lg sm:text-xl font-medium tracking-tight text-[#CA6D03] dark:text-[#E07A08] transition-colors",
                  fontMarcellus.className
                )}
              >
                Kids covE
              </span>
            </Link>

            {subtitle && (
              <>
                <div className="hidden h-4 w-[1px] bg-slate-200 dark:bg-slate-800 lg:block" />
                <span className="hidden max-w-[16rem] xl:max-w-[20rem] truncate text-xs font-medium text-slate-400 dark:text-slate-500 lg:block">
                  {subtitle}
                </span>
              </>
            )}
          </div>

          {/* Center Section: Search Bar with Autocomplete */}
          <div className="flex flex-1 items-center justify-center px-1 sm:px-2 max-w-[28rem]">
            <NavbarSectionSearch
              area={area}
              userPermissions={userPermissions}
              userRole={userRole}
            />
          </div>

          {/* Right Section: Badges & Interactions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {canSwitchPortals(userPermissions, userRole) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="group relative flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => onSwitchPortal?.(area === "admin" ? "workspace" : "admin")}
                title={`Switch to ${area === "admin" ? "Operations Workspace" : "Administration Portal"}`}
              >
                <Repeat className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline font-bold">
                  {area === "admin" ? "Workspace" : "Admin Portal"}
                </span>
              </Button>
            )}

            <div className="hidden items-center gap-1.5 rounded-xl border border-amber-500/10 bg-amber-500/[0.06] px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/[0.05] dark:text-amber-400 md:inline-flex">
              <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
              {academicYear}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-slate-500 hover:bg-black/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-50"
              aria-label="Toggle theme"
              onClick={() => setTheme(isDarkMode ? "light" : "dark")}
            >
              {isDarkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </Button>

            {userLabel && <AccountMenu onLogout={onLogout} />}
          </div>
          
        </div>
      </header>
    </div>
  )
}

function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = React.useState<UserSession | null>(null)

  React.useEffect(() => {
    let isMounted = true
    async function fetchUser() {
      try {
        const session = await getCurrentSession()
        if (isMounted) setUser(session.user)
      } catch {
        if (isMounted) setUser(null)
      }
    }
    void fetchUser()
    return () => { isMounted = false }
  }, [])

  const userInitials = (user?.username || user?.name || "U").substring(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white p-1 pr-2 shadow-sm transition-all hover:bg-slate-50 hover:shadow dark:border-white/[0.08] dark:bg-slate-900 dark:hover:bg-slate-800">
          <Avatar className="h-6 w-6 rounded-lg ring-1 ring-black/5 dark:ring-white/10">
            <AvatarImage src={undefined} alt={user?.username} />
            <AvatarFallback>
              <span className="flex h-full w-full items-center justify-center bg-slate-100 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {userInitials}
              </span>
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:inline" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60 p-1.5 mt-2 rounded-xl shadow-xl border border-black/[0.05] dark:border-white/[0.08]">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={undefined} alt={user?.username} />
              <AvatarFallback>
                <span className="flex h-full w-full items-center justify-center bg-amber-500/10 text-xs font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                  {userInitials}
                </span>
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-bold dark:text-slate-100">
                {user?.username || user?.name || "User"}
              </span>
              <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                {user?.email || "No email linked"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1 opacity-50" />
        
        <DropdownMenuItem 
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 focus:bg-rose-500/10 focus:text-rose-600 dark:text-rose-400 dark:focus:bg-rose-500/20 dark:focus:text-rose-300 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}