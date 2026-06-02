"use client"

import { AppShell } from "@/components/app-shell"
import { portalAreas, getPortalSection, type PortalArea } from "@/lib/portal"

type PortalShellProps = {
  area: PortalArea
  section?: string
  children: React.ReactNode
}

export function PortalShell({ area, section, children }: PortalShellProps) {
  const areaCopy = portalAreas[area]
  const activeSection = section ? getPortalSection(section) : null

  return <AppShell area={area} title={areaCopy.title} subtitle={activeSection ? activeSection.label : areaCopy.subtitle}>{children}</AppShell>
}