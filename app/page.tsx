"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, Building2, Loader2, MoonStar, ShieldCheck, SunMedium, Users } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { clearAccessToken, getCurrentSession, loginUser } from "@/lib/auth"
import { getPortalRoute } from "@/lib/portal"

export default function Page() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [statusMessage, setStatusMessage] = React.useState("Sign in to continue")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [session, setSession] = React.useState<{ user: { name: string; username: string; role?: string | null; defaultPortal?: string } } | null>(null)

  React.useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const currentSession = await getCurrentSession()

        if (!active) {
          return
        }

        setSession({ user: currentSession.user })
        setStatusMessage(`Welcome back, ${currentSession.user.name}`)
        router.replace(getPortalRoute(currentSession.user.defaultPortal))
      } catch {
        clearAccessToken()
        if (active) {
          setSession(null)
          setStatusMessage("Sign in to continue")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage("Signing in...")

    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    try {
      const currentSession = await loginUser(trimmedUsername, trimmedPassword)
      setSession({ user: currentSession.user })
      setStatusMessage(`Welcome, ${currentSession.user.name}`)
      router.replace(getPortalRoute(currentSession.user.defaultPortal))
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to sign in")
    } finally {
      setIsSubmitting(false)
    }
  }

  const highlights = [
    { icon: BookOpen, title: "Learning records", detail: "Track classes, sections, and student progress in one place." },
    { icon: Users, title: "Daily operations", detail: "Manage admissions, attendance, billing, and staff workflows." },
    { icon: Building2, title: "Institution ready", detail: "A clean structure that can scale across departments and future modules." },
  ]

  const isDarkTheme = resolvedTheme === "dark"

  function toggleTheme() {
    setTheme(isDarkTheme ? "light" : "dark")
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.15),_transparent_40%)] text-white dark:bg-[radial-gradient(circle_at_top_left,_rgba(88,129,173,0.15),_transparent_30%),linear-gradient(135deg,_#0b1020_0%,_#111827_55%,_#1b2433_100%)] dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid w-full gap-4 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] lg:gap-5">
          
          {/* KidsCove Management Info Section - ONLY visible on desktop/large views */}
          <section className="hidden lg:flex lg:h-[calc(100vh-2rem)] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-[0_24px_90px_rgba(40,50,38,0.15)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 lg:p-7">
            <div className="max-w-2xl space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                   KidsCove Portal
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {isDarkTheme ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-xl font-heading text-4xl leading-none font-semibold tracking-tight text-balance sm:text-5xl text-white">
                  Everything modern school management needs, in one calm workspace.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/80 dark:text-slate-300 sm:text-base">
                  Manage admissions, classes, fees, attendance, expenses, staff, reports, and student services from a single secure platform designed for daily operation.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {highlights.map((item) => {
                  const Icon = item.icon

                  return (
                    <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xs">
                      <Icon className="h-5 w-5 text-white dark:text-amber-300" />
                      <p className="mt-3 text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-2 text-xs leading-5 text-white/70 dark:text-slate-300">{item.detail}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4 text-sm leading-6 text-white/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              A focused school interface for administrators, office teams, teachers, accountants, and families.
            </div>
          </section>

          {/* Sign In Portal Section - Fully responsive and matches background layout */}
          <section className="relative flex min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-black/15 dark:bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.1)] dark:border-white/10">
            
            {/* Mobile-only Theme Switcher floating button */}
            <div className="absolute top-6 right-6 lg:hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                {isDarkTheme ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex h-full min-h-0 items-center justify-center">
                <div className="flex items-center gap-3 text-white/80 dark:text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening the KidsCove portal
                </div>
              </div>
            ) : session ? (
              <div className="flex h-full w-full flex-col justify-between gap-8 py-4">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-white dark:text-emerald-300">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-[0.28em]">Signed in</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.24em] text-white/70 dark:text-slate-400">Welcome back</p>
                    <h2 className="font-heading text-3xl sm:text-4xl leading-tight font-semibold text-white">{session.user.name}</h2>
                    <p className="text-sm text-white/80 dark:text-slate-300">{session.user.role || "KidsCove user"}</p>
                  </div>

                  <p className="max-w-md text-sm leading-6 text-white/80 dark:text-slate-300">
                    Your portal is ready. Continue to the section assigned to your role.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button asChild className="w-full bg-white text-stone-800 hover:bg-white/90 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 py-6 text-base font-medium rounded-2xl shadow-md">
                    <Link href={getPortalRoute(session.user.defaultPortal)}>
                      Continue to portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-center text-xs uppercase tracking-[0.24em] text-white/60 dark:text-slate-400">KidsCove portal access confirmed</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center py-4">
                <div className="mx-auto w-full max-w-md space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70 dark:text-slate-400">Sign in</p>
                    <h2 className="mt-3 font-heading text-2xl sm:text-3xl font-semibold text-white">Access KidsCove portal</h2>
                    <p className="mt-3 text-sm leading-6 text-white/80 dark:text-slate-300">
                      Use your school credentials to continue. The portal will open the correct area for your role.
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleLogin}>
                    <label className="block space-y-2 text-sm">
                      <span className="text-white/90">Username</span>
                      <input
                        className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="username"
                        placeholder="Enter username"
                      />
                    </label>

                    <label className="block space-y-2 text-sm">
                      <span className="text-white/90">Password</span>
                      <input
                        className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        placeholder="Enter password"
                      />
                    </label>

                    <Button type="submit" disabled={isSubmitting} className="w-full bg-white text-stone-800 hover:bg-white/90 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 py-6 text-base font-medium rounded-2xl mt-2 shadow-md">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sign in
                    </Button>
                  </form>

                  <p className="text-sm text-white/80 dark:text-slate-300 text-center sm:text-left">{statusMessage}</p>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}