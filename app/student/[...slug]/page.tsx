import { PortalPage } from "@/components/portal-page"

export default async function StudentSectionPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params
  const slug = resolvedParams.slug?.join("-") || "dashboard"

  return <PortalPage area="student" section={slug} />
}