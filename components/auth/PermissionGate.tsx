"use client"

import * as React from "react"
import { usePermission } from "@/hooks/usePermission"

type PermissionGateProps = {
  permission: string
  userPermissions?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * UI Wrapper component for declarative frontend RBAC rendering.
 *
 * Example:
 *   <PermissionGate permission="student.create">
 *     <Button>Add Student</Button>
 *   </PermissionGate>
 */
export function PermissionGate({
  permission,
  userPermissions,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, isLoading } = usePermission(userPermissions)

  if (isLoading) {
    return null
  }

  if (!can(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
