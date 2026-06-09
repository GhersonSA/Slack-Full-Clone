import type { SidebarSection } from './types'

type SidebarProps = {
  workspaceName: string
  sections: SidebarSection[]
}

function Sidebar({ workspaceName, sections }: SidebarProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col bg-[#3F0E40] text-[#D1C4D9]">
      <header className="flex h-12 items-center border-b border-white/10 px-4">
        <h2 className="truncate text-lg font-semibold text-white">{workspaceName}</h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <section key={section.id} className="mb-4">
            {section.title ? (
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-[#A88FB2]">
                {section.title}
              </h3>
            ) : null}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.isActive ?? false

                return (
                  <li key={item.id}>
                    <button
                      className={[
                        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition',
                        isActive
                          ? 'bg-[#1164A3] text-white'
                          : 'text-[#D1C4D9] hover:bg-white/10 hover:text-white',
                        item.isBold ? 'font-semibold' : 'font-normal'
                      ].join(' ')}
                    >
                      {item.prefix ? <span className="text-xs opacity-90">{item.prefix}</span> : null}
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export type { SidebarProps }
export default Sidebar
