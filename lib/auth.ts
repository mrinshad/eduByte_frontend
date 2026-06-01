export type AuthUser = {
  id: string
  name: string
  username: string
  email?: string | null
  role?: string | null
  isActive: boolean
}

export type AuthSession = {
  user: AuthUser
  accessToken: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
const ACCESS_TOKEN_KEY = "edubyte_access_token"

function isBrowser() {
  return typeof window !== "undefined"
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

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  })
}

export async function loginUser(username: string, password: string) {
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

  return session
}

export async function logoutUser() {
  await apiFetch("/api/auth/logout", {
    method: "POST",
  })

  clearAccessToken()
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