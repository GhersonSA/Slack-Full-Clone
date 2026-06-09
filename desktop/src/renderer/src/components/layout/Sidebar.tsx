import type { LayoutDensity, SidebarSection } from './types'

type SidebarProps = {
  workspaceName: string
  sections: SidebarSection[]
  density?: LayoutDensity
  collapsed?: boolean
}

function Sidebar({
  workspaceName,
  sections,
  density = 'comfortable',
  collapsed = false
}: SidebarProps): React.JSX.Element {
  const isCompact = density === 'compact'

  return (
    <div className="flex h-full flex-col bg-[var(--slack-sidebar)] text-[#D1C4D9]">
      <header
        className={[
          'flex items-center border-b border-white/10',
          collapsed ? 'h-12 justify-center px-2' : 'h-12 justify-between px-4'
        ].join(' ')}
      >
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-xs font-bold text-white">
            {workspaceName.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <h2 className="truncate text-[22px] font-bold leading-none text-white">{workspaceName}</h2>
        )}

        <button
          aria-label="Compose"
          className={[
            'flex items-center justify-center rounded-full bg-white text-[var(--slack-sidebar)] shadow-sm shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]',
            collapsed ? 'absolute -left-[9999px]' : 'h-7 w-7'
          ].join(' ')}
        >
          ✎
        </button>
      </header>

      <div
        className={[
          'min-h-0 flex-1 overflow-y-auto',
          collapsed ? 'px-1 py-2' : isCompact ? 'px-2 py-2' : 'px-2 py-3'
        ].join(' ')}
      >
        {sections.map((section) => (
          <section key={section.id} className="mb-4 last:mb-0">
            {section.title && !collapsed ? (
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-[#A88FB2]">
                {section.title}
              </h3>
            ) : null}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.isActive ?? false
                const unreadCount = item.unreadCount ?? 0

                return (
                  <li key={item.id}>
                    <button
                      aria-label={item.label}
                      className={[
                        'flex w-full items-center gap-2 rounded text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]',
                        collapsed ? 'justify-center px-1.5 py-2' : isCompact ? 'px-2 py-1.5' : 'px-2 py-1.5',
                        isActive
                          ? 'bg-[var(--slack-active)] text-white shadow-sm shadow-black/20'
                          : 'text-[#D1C4D9] hover:bg-white/10 hover:text-white',
                        item.isBold ? 'font-semibold' : 'font-normal'
                      ].join(' ')}
                    >
                      {item.leadingIcon ? (
                        <span className="text-xs opacity-90">{item.leadingIcon}</span>
                      ) : item.prefix ? (
                        <span className="text-xs opacity-90">{item.prefix}</span>
                      ) : null}

                      {item.hasPresenceDot ? (
                        <span className="h-2 w-2 rounded-full bg-[#2BAC76]" aria-hidden="true" />
                      ) : null}

                      {!collapsed ? <span className="truncate">{item.label}</span> : null}

                      {collapsed && !item.leadingIcon && !item.prefix ? (
                        <span className="text-xs opacity-90">{item.compactLabel ?? item.label.slice(0, 2)}</span>
                      ) : null}

                      {item.trailingText && !collapsed ? (
                        <span className="ml-auto text-[11px] opacity-80">{item.trailingText}</span>
                      ) : null}

                      {unreadCount > 0 && !collapsed ? (
                        <span className="ml-auto rounded-full bg-white/20 px-1.5 text-[10px] font-semibold text-white">
                          {unreadCount}
                        </span>
                      ) : null}
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
