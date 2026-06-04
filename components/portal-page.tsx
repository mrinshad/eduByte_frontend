import { portalAreas, getPortalSection, type PortalArea } from "@/lib/portal"

type PortalPageProps = {
  area: PortalArea
  section?: string
}

export function PortalPage({ area, section }: PortalPageProps) {
  const areaCopy = portalAreas[area]
  const currentSection = section ? getPortalSection(section) : null

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/70">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">{areaCopy.title}</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {currentSection ? currentSection.label : areaCopy.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          {currentSection
            ? currentSection.purpose
            : "Choose a section to continue. This area is ready for the production workflow and will expand as each module is built."}
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-slate-50 p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          This is the {currentSection ? currentSection.label : areaCopy.title} section.
        </div>
      </div>

      <div className="rounded-[2rem] border border-black/5 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] dark:border-white/10">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Access</p>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
          <p>Role-based access keeps the interface focused on each user group.</p>
          <p>Approved users only see the sections assigned to their area.</p>
          <p>When a new module is added, it can plug into the same structure without changing the shell.</p>
        </div>
      </div>
    </section>
  )
}