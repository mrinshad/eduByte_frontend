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

export function getCachedSessionSync(): AuthSession | null {
  return cachedSession
}

export function clearSessionCache() {
  cachedSession = null
  inFlightSessionPromise = null
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

export function clearAccessToken() {
  clearSessionCache()
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {})

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  })
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

  const session = payload.data as AuthSession
  storeAccessToken(session.accessToken)
  cachedSession = session

  return session
}

export async function refreshSession() {
  const response = await apiFetch("/api/auth/refresh", {
    method: "POST",
  })

  const payload = await response.json()

  if (!response.ok) {
    clearAccessToken()
    throw new Error(payload.message || "Session refresh failed")
  }

  const session = payload.data as AuthSession
  storeAccessToken(session.accessToken)
  cachedSession = session

  return session
}

export async function logoutUser() {
  try {
    await authFetch("/api/auth/logout", {
      method: "POST",
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
            accessToken: storedToken,
          } as AuthSession
          cachedSession = session
          return session
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

  let response = await apiFetch(path, {
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