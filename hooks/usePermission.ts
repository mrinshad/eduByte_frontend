"use client"

import * as React from "react"
import { getCurrentSession, type AuthUser } from "@/lib/auth"

/**
 * Checks whether a given set of permissions includes the requested permission.
 * Supports exact permission matches, global wildcard "*", and resource wildcards (e.g. "student.*").
 */
export function checkPermission(userPermissions: string[] = [], permission: string): boolean {
  if (!permission) return true
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) return false

  if (userPermissions.includes("*") || userPermissions.includes(permission)) {
    return true
  }

  const parts = permission.split(".")
  if (parts.length > 1) {
    const resourceWildcard = `${parts[0]}.*`
    if (userPermissions.includes(resourceWildcard)) {
      return true
    }
  }

  return false
}

/**
 * Frontend hook to inspect and evaluate user permissions and roles.
 *
 * Usage:
 *   const { can, hasRole, user, permissions } = usePermission(userPermissions);
 *   if (can("student.create")) { ... }
 */
export function usePermission(initialPermissions?: string[]) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [permissions, setPermissions] = React.useState<string[]>(initialPermissions || [])
  const [roles, setRoles] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(!initialPermissions)

  React.useEffect(() => {
    if (initialPermissions) {
      setPermissions(initialPermissions)
      setIsLoading(false)
      return
    }

    let active = true

    async function fetchSession() {
      try {
        const session = await getCurrentSession()
        if (active && session?.user) {
          setUser(session.user)
          const userPerms = session.user.permissions || []
          const userRoles = session.user.roles || (session.user.role ? [session.user.role] : [])
          setPermissions(userPerms)
          setRoles(userRoles)
        }
      } catch {
        if (active) {
          setPermissions([])
          setRoles([])
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void fetchSession()

    return () => {
      active = false
    }
  }, [initialPermissions])

  const can = React.useCallback(
    (permission: string): boolean => {
      return checkPermission(permissions, permission)
    },
    [permissions]
  )

  const hasRole = React.useCallback(
    (roleName: string): boolean => {
      if (roles.includes("ADMIN") || roles.includes("*")) return true
      return roles.includes(roleName)
    },
    [roles]
  )

  return {
    can,
    hasRole,
    user,
    permissions,
    roles,
    isLoading,
  }
}
