export type AuthUser = {
  id: string
  name: string
  username: string
  email?: string | null
  role?: string | null
  defaultPortal?: string
  roles?: string[]
  permissions?: string[]
  isActive: boolean
}

export type AuthSession = {
  user: AuthUser
  accessToken: string
}

const ACCESS_TOKEN_KEY = "edubyte_access_token"
const REFRESH_TOKEN_KEY = "edubyte_refresh_token"
const DEFAULT_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 120000

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured")
  }

  return apiBaseUrl
}

function isBrowser() {
  return typeof window !== "undefined"
}

let cachedSession: AuthSession | null = null
let inFlightSessionPromise: Promise<AuthSession> | null = null
let inFlightRefreshPromise: Promise<AuthSession> | null = null

export function getCachedSessionSync(): AuthSession | null {
  return cachedSession
}

export function clearSessionCache() {
  cachedSession = null
  inFlightSessionPromise = null
  inFlightRefreshPromise = null
}

export function getStoredAccessToken() {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function storeAccessToken(token: string) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getStoredRefreshToken() {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function storeRefreshToken(token: string) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearAccessToken() {
  clearSessionCache()
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {})

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const signal = init.signal || AbortSignal.timeout(DEFAULT_TIMEOUT_MS)

  try {
    return await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal,
    })
  } catch (err: unknown) {
    if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
      if (!init.signal) {
        throw new Error("Request timed out. The server might be waking up or busy, please try again.")
      }
    }
    throw err
  }
}

export async function loginUser(username: string, password: string) {
  clearSessionCache()
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.message || "Login failed")
  }

  const session = payload.data as AuthSession & { refreshToken?: string }
  storeAccessToken(session.accessToken)
  if (session.refreshToken) {
    storeRefreshToken(session.refreshToken)
  }
  const cleanSession: AuthSession = { user: session.user, accessToken: session.accessToken }
  cachedSession = cleanSession

  return cleanSession
}

export async function refreshSession(): Promise<AuthSession> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise
  }

  inFlightRefreshPromise = (async () => {
    try {
      const storedRefreshToken = getStoredRefreshToken()
      const headers = new Headers()
      let body: string | undefined

      if (storedRefreshToken) {
        headers.set("x-refresh-token", storedRefreshToken)
        body = JSON.stringify({ refreshToken: storedRefreshToken })
      }

      const response = await apiFetch("/api/auth/refresh", {
        method: "POST",
        headers,
        body,
      })

      const payload = await response.json()

      if (!response.ok) {
        clearAccessToken()
        throw new Error(payload.message || "Session refresh failed")
      }

      const session = payload.data as AuthSession & { refreshToken?: string }
      storeAccessToken(session.accessToken)
      if (session.refreshToken) {
        storeRefreshToken(session.refreshToken)
      }
      const finalSession: AuthSession = { user: session.user, accessToken: session.accessToken }
      cachedSession = finalSession

      return finalSession
    } finally {
      inFlightRefreshPromise = null
    }
  })()

  return inFlightRefreshPromise
}

export async function logoutUser() {
  try {
    const storedRefreshToken = getStoredRefreshToken()
    const headers = new Headers()
    let body: string | undefined

    if (storedRefreshToken) {
      headers.set("x-refresh-token", storedRefreshToken)
      body = JSON.stringify({ refreshToken: storedRefreshToken })
    }

    await authFetch("/api/auth/logout", {
      method: "POST",
      headers,
      body,
    })
  } catch {
    // Ignore network error on logout
  } finally {
    clearAccessToken()
  }
}

export async function getCurrentSession(forceRefresh = false): Promise<AuthSession> {
  if (!forceRefresh && cachedSession) {
    return cachedSession
  }

  if (inFlightSessionPromise) {
    return inFlightSessionPromise
  }

  inFlightSessionPromise = (async () => {
    try {
      const storedToken = getStoredAccessToken()

      if (storedToken) {
        const currentResponse = await authFetch("/api/auth/me")
        const currentPayload = await currentResponse.json()

        if (currentResponse.ok && currentPayload?.data?.user) {
          const session = {
            user: currentPayload.data.user,
            accessToken: getStoredAccessToken() || storedToken,
          } as AuthSession
          cachedSession = session
          return session
        }
      }

      if (!storedToken && !forceRefresh) {
        // Fast fallback for unauthenticated visits: don't hang page on sleeping backend
        const storedRefreshToken = getStoredRefreshToken()
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 10000)
        try {
          const headers = new Headers()
          let body: string | undefined

          if (storedRefreshToken) {
            headers.set("x-refresh-token", storedRefreshToken)
            body = JSON.stringify({ refreshToken: storedRefreshToken })
          }

          const res = await apiFetch("/api/auth/refresh", {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          })
          clearTimeout(timer)
          const payload = await res.json()
          if (!res.ok) throw new Error(payload.message || "No active session")
          const session = payload.data as AuthSession & { refreshToken?: string }
          storeAccessToken(session.accessToken)
          if (session.refreshToken) {
            storeRefreshToken(session.refreshToken)
          }
          const finalSession: AuthSession = { user: session.user, accessToken: session.accessToken }
          cachedSession = finalSession
          return finalSession
        } catch {
          clearTimeout(timer)
          throw new Error("No active session")
        }
      }

      const refreshedSession = await refreshSession()
      cachedSession = refreshedSession
      return refreshedSession
    } catch (err) {
      cachedSession = null
      throw err
    } finally {
      inFlightSessionPromise = null
    }
  })()

  return inFlightSessionPromise
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {})
  const storedToken = getStoredAccessToken()

  if (storedToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${storedToken}`)
  }

  const response = await apiFetch(path, {
    ...init,
    headers,
  })

  if (response.status !== 401) {
    return response
  }

  const session = await refreshSession()
  const retryHeaders = new Headers(init.headers || {})
  retryHeaders.set("Authorization", `Bearer ${session.accessToken}`)

  return apiFetch(path, {
    ...init,
    headers: retryHeaders,
  })
}