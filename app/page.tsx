"use client"

import * as React from "react"
import { Loader2, RefreshCw, ShieldCheck, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  authFetch,
  clearAccessToken,
  getStoredAccessToken,
  loginUser,
  logoutUser,
  refreshSession,
  type AuthSession,
} from "@/lib/auth"

export default function Page() {
  const [session, setSession] = React.useState<AuthSession | null>(null)
  const [username, setUsername] = React.useState("admin")
  const [password, setPassword] = React.useState("admin123")
  const [statusMessage, setStatusMessage] = React.useState("Ready to sign in")
  const [isBootstrapping, setIsBootstrapping] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  React.useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const hasStoredToken = Boolean(getStoredAccessToken())

        if (!hasStoredToken) {
          await refreshSession()
        }

        const response = await authFetch("/api/auth/me")
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || "Unable to restore session")
        }

        if (active) {
          setSession({
            user: payload.data.user,
            accessToken: getStoredAccessToken() || "",
          })
          setStatusMessage("Session restored")
        }
      } catch {
        clearAccessToken()
        if (active) {
          setSession(null)
          setStatusMessage("Sign in to continue")
        }
      } finally {
        if (active) {
          setIsBootstrapping(false)
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
      const nextSession = await loginUser(username, password)
      setSession(nextSession)
      setStatusMessage(`Welcome, ${nextSession.user.name}`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    setStatusMessage("Refreshing session...")

    try {
      const nextSession = await refreshSession()
      setSession(nextSession)
      setStatusMessage("Access token refreshed")
    } catch (error) {
      clearAccessToken()
      setSession(null)
      setStatusMessage(error instanceof Error ? error.message : "Refresh failed")
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleLogout() {
    await logoutUser()
    setSession(null)
    setStatusMessage("Logged out")
  }

  const panelCopy = session
    ? "Your session is authenticated with a short-lived access token and an httpOnly refresh token cookie."
    : "Use the seeded admin account to test the full access-token and refresh-token flow."

  return (
    <main className="min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(42,68,121,0.16),_transparent_32%),linear-gradient(135deg,_#0b1120_0%,_#111827_45%,_#f5f0e8_45%,_#f8f4ef_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(120,119,198,0.2),_transparent_30%),linear-gradient(135deg,_#06070d_0%,_#111827_50%,_#1f2937_100%)] dark:text-slate-50">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-between rounded-[2rem] border border-white/15 bg-white/70 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-current/10 bg-current/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-current/70">
                ERP Core Auth
              </div>
              <div className="space-y-4">
                <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  Access control with rotating refresh tokens.
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
                  This login flow keeps the access token in memory/local storage and uses an httpOnly refresh token cookie to restore sessions without exposing the long-lived credential to the browser.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-current/10 bg-white/65 p-4 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Access</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">15 minute bearer token</p>
                </div>
                <div className="rounded-2xl border border-current/10 bg-white/65 p-4 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Refresh</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Rotated httpOnly cookie</p>
                </div>
                <div className="rounded-2xl border border-current/10 bg-white/65 p-4 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Bootstrap</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Silent session restore</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-current/10 bg-white/60 p-4 text-sm leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {panelCopy}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/15 bg-slate-950/95 p-6 text-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
            {isBootstrapping ? (
              <div className="flex min-h-[34rem] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Restoring session
                </div>
              </div>
            ) : session ? (
              <div className="flex min-h-[34rem] flex-col justify-between gap-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-emerald-300">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm uppercase tracking-[0.25em]">Authenticated</span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold">{session.user.name}</h2>
                    <p className="text-sm text-slate-300">@{session.user.username}</p>
                    <p className="text-sm text-slate-300">Role: {session.user.role || "Unknown"}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Access token</p>
                      <p className="mt-2 break-all text-xs leading-5 text-slate-200">{session.accessToken || "Stored in browser memory"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Status</p>
                      <p className="mt-2 text-sm text-slate-200">Cookie-backed refresh flow is active.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-300">{statusMessage}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-white text-slate-950 hover:bg-slate-200">
                      {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Refresh session
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="border-white/15 bg-transparent text-white hover:bg-white/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[34rem] flex-col justify-center">
                <div className="max-w-md space-y-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Sign in</p>
                    <h2 className="mt-3 text-3xl font-semibold">Open the ERP shell</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Seeded credentials are prefilled so you can verify the backend login and refresh flow immediately.</p>
                  </div>

                  <form className="space-y-4" onSubmit={handleLogin}>
                    <label className="block space-y-2 text-sm">
                      <span className="text-slate-300">Username</span>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-white/25 focus:bg-white/10"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="username"
                        placeholder="admin"
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
                        placeholder="admin123"
                      />
                    </label>

                    <Button type="submit" disabled={isSubmitting} className="w-full bg-white text-slate-950 hover:bg-slate-200">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Continue
                    </Button>
                  </form>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <p>Seeded login:</p>
                    <p className="mt-2 font-mono text-xs leading-5 text-slate-200">username: admin</p>
                    <p className="font-mono text-xs leading-5 text-slate-200">password: admin123</p>
                  </div>

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
