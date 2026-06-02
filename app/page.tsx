"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, Building2, Loader2, MoonStar, ShieldCheck, SunMedium, Users } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { clearAccessToken, getCurrentSession, loginUser } from "@/lib/auth"

function portalRoute(role?: string | null) {
  const normalizedRole = (role || "").toUpperCase()

  if (normalizedRole === "STUDENT") {
    return "/student"
  }

  if (normalizedRole === "ADMIN") {
    return "/admin"
  }

  return "/workspace"
}

export default function Page() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [statusMessage, setStatusMessage] = React.useState("Sign in to continue")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [session, setSession] = React.useState<{ user: { name: string; username: string; role?: string | null } } | null>(null)

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

    try {
      const currentSession = await loginUser(username, password)
      setSession({ user: currentSession.user })
      setStatusMessage(`Welcome, ${currentSession.user.name}`)
      router.push(portalRoute(currentSession.user.role))
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
    <main className="h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(214,163,92,0.22),_transparent_30%),linear-gradient(135deg,_#f8f1e5_0%,_#ffffff_47%,_#e7f0f7_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(88,129,173,0.22),_transparent_30%),linear-gradient(135deg,_#0b1020_0%,_#111827_55%,_#1b2433_100%)] dark:text-white">
      <div className="mx-auto flex h-svh w-full max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid w-full gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-5">
          <section className="flex h-[calc(100svh-2rem)] flex-col justify-between overflow-hidden rounded-[2rem] border border-black/5 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 lg:p-7">
            <div className="max-w-2xl space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  Sunrise School Management
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="border-black/10 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {isDarkTheme ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-xl font-heading text-4xl leading-none font-semibold tracking-tight text-balance sm:text-5xl">
                  Everything a modern school needs, in one calm workspace.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                  Manage admissions, classes, fees, attendance, expenses, staff, reports, and student services from a single secure platform designed for daily school operations.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => {
                  const Icon = item.icon

                  return (
                    <div key={item.title} className="rounded-3xl border border-black/5 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                      <Icon className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                      <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/5 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              A focused school interface for administrators, office teams, teachers, accountants, and families.
            </div>
          </section>

          <section className="flex h-[calc(100svh-2rem)] items-center justify-center overflow-hidden rounded-[2rem] border border-black/5 bg-slate-950 p-5 text-white shadow-[0_24px_90px_rgba(15,23,42,0.2)] dark:border-white/10">
          {isLoading ? (
            <div className="flex h-full min-h-0 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening the school portal
              </div>
            </div>
          ) : session ? (
            <div className="flex h-full w-full flex-col justify-between gap-5">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.28em]">Signed in</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Welcome back</p>
                  <h2 className="font-heading text-4xl leading-tight font-semibold">{session.user.name}</h2>
                  <p className="text-sm text-slate-300">{session.user.role || "School user"}</p>
                </div>

                <p className="max-w-md text-sm leading-6 text-slate-300">
                  Your portal is ready. Continue to the section assigned to your role.
                </p>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full bg-white text-slate-950 hover:bg-slate-200">
                  <Link href={portalRoute(session.user.role)}>
                    Continue to portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-center text-xs uppercase tracking-[0.24em] text-slate-400">School portal access confirmed</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="mx-auto w-full max-w-md space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Sign in</p>
                  <h2 className="mt-3 font-heading text-3xl font-semibold">Access the school portal</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Use your school credentials to continue. The portal will open the correct area for your role.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                  <label className="block space-y-2 text-sm">
                    <span className="text-slate-300">Username</span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-white/25 focus:bg-white/10"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      placeholder="Enter username"
                    />
                  </label>

                  <label className="block space-y-2 text-sm">
                    <span className="text-slate-300">Password</span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-white/25 focus:bg-white/10"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter password"
                    />
                  </label>

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-white text-slate-950 hover:bg-slate-200">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign in
                  </Button>
                </form>

                <p className="text-sm text-slate-300">{statusMessage}</p>
              </div>
            </div>
          )}
        </section>
        </div>
      </div>
    </main>
  )
}