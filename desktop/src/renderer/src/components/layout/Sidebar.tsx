import type { LayoutDensity, SidebarSection } from './types'

type SidebarProps = {
  workspaceName: string
  sections: SidebarSection[]
  density?: LayoutDensity
  collapsed?: boolean
  onItemSelect?: (sectionId: string, itemId: string) => void
  onCompose?: () => void
}

function Sidebar({
  workspaceName,
  sections,
  density = 'comfortable',
  collapsed = false,
  onItemSelect,
  onCompose
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
          <div className="min-w-0 mt-1">
            <h2 className="truncate text-[19px] font-black leading-none tracking-tight text-white">{workspaceName}</h2>
            <p className="truncate text-[11px] text-[#BCA7C7]">• Gherson Sanchez</p>
          </div>
        )}

        <button
          aria-label="Compose"
          onClick={onCompose}
          className={[
            'flex items-center justify-center rounded-full bg-white text-[var(--slack-sidebar)] shadow-sm shadow-black/20 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]',
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
              <div className="mb-1 flex items-center justify-between px-2">
                <h3 className="text-[11px] font-semibold tracking-wide text-[#A88FB2]">{section.title}</h3>
                {section.id === 'channels' ? <span className="text-xs text-[#A88FB2]">＋</span> : null}
                {section.id === 'apps' ? (
                  <span className="flex items-center gap-1 text-[10px] text-[#BCA7C7]" aria-label="App icons">
                    <span title="GitHub">🐙</span>
                    <span title="Jira">🌀</span>
                    <span title="Figma">🎨</span>
                  </span>
                ) : null}
              </div>
            ) : null}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.isActive ?? false
                const unreadCount = item.unreadCount ?? 0

                return (
                  <li key={item.id}>
                    <button
                      aria-label={item.label}
                      onClick={() => onItemSelect?.(section.id, item.id)}
                      className={[
                        'flex w-full items-center gap-2 rounded-md text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]',
                        collapsed ? 'justify-center px-1.5 py-2' : isCompact ? 'px-2 py-1.5' : 'px-2 py-1.5',
                        isActive
                          ? 'bg-[var(--slack-active)] text-white shadow-sm shadow-black/20'
                          : 'text-[#D1C4D9] hover:bg-[var(--slack-sidebar-hover)] hover:text-white',
                        item.isBold ? 'font-semibold' : 'font-normal'
                      ].join(' ')}
                    >
                      {item.leadingIcon ? (
                        <span className="w-3 text-center text-[11px] opacity-90">{item.leadingIcon}</span>
                      ) : item.prefix ? (
                        <span className="w-3 text-center text-[11px] opacity-90">{item.prefix}</span>
                      ) : null}

                      {item.hasPresenceDot ? (
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-[#0f5132] bg-[#2EB67D] shadow-[0_0_0_1px_rgba(0,0,0,0.18)]"
                          aria-hidden="true"
                        />
                      ) : null}

                      {!collapsed ? <span className="truncate">{item.label}</span> : null}

                      {collapsed && !item.leadingIcon && !item.prefix ? (
                        <span className="text-xs opacity-90">{item.compactLabel ?? item.label.slice(0, 2)}</span>
                      ) : null}

                      {item.trailingText && !collapsed ? (
                        <span className="ml-auto text-[11px] opacity-80">{item.trailingText}</span>
                      ) : null}

                      {unreadCount > 0 && !collapsed ? (
                        <span className="ml-auto rounded-full bg-[#E01E5A] px-1.5 text-[10px] font-semibold text-white">
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
        {/* Watermark / branding */}
        <div className="mt-4 px-3 py-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 mt-2">
          <a
            href="https://www.linkedin.com/in/gherson-sa/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-brand-muted transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zm7 0h3.8v1.7h.1c.5-.9 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"
            />
            </svg>
          </a>

          <a
            href="https://github.com/GhersonSA"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-brand-muted transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M12 .5A11.5 11.5 0 0 0 .5 12.2c0 5.2 3.3 9.6 7.9 11.2.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1.1.1-.8.4-1.4.8-1.7-2.6-.3-5.3-1.4-5.3-6a4.8 4.8 0 0 1 1.2-3.3c-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.3a11 11 0 0 1 6 0c2.3-1.6 3.3-1.3 3.3-1.3.6 1.6.2 2.8.1 3.1a4.8 4.8 0 0 1 1.2 3.3c0 4.6-2.7 5.7-5.3 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6a11.7 11.7 0 0 0 7.9-11.2A11.5 11.5 0 0 0 12 .5z"
            />
            </svg>
          </a>
          </div>

          <p className="text-xs text-brand-muted">
          <a
            href="https://www.ghersonsa.com/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-300 hover:text-white"
          >
            © Powered by GhersonSA. 2026.
          </a>
          </p>
        </div>
        </div>
    </div>
  )
}

export type { SidebarProps }
export default Sidebar
