import type {
  ChannelTab,
  ChatInfoPanel,
  ChatMessage,
  ChatNoticeCard,
  ComposerTool,
  LayoutDensity
} from './types'

type ChatAreaProps = {
  channelName: string
  channelDescription: string
  messages: ChatMessage[]
  composerPlaceholder: string
  tabs: ChannelTab[]
  notices: ChatNoticeCard[]
  composerTools: ComposerTool[]
  infoPanel?: ChatInfoPanel
  density?: LayoutDensity
  draftMessage?: string
  onDraftMessageChange?: (value: string) => void
  onSendMessage?: () => void
}

function MessageAvatar({ message }: { message: ChatMessage }): React.JSX.Element {
  return (
    <div
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
      style={{ backgroundColor: message.accentColor ?? '#2D9CDB' }}
      aria-label={message.author}
    >
      {(message.avatarLabel ?? message.author.slice(0, 2)).toUpperCase()}
    </div>
  )
}

function ChatArea({
  channelName,
  channelDescription,
  messages,
  composerPlaceholder,
  tabs,
  notices,
  composerTools,
  infoPanel,
  density = 'comfortable',
  draftMessage,
  onDraftMessageChange,
  onSendMessage
}: ChatAreaProps): React.JSX.Element {
  const isCompact = density === 'compact'

  return (
    <div className="flex h-full min-w-0 bg-[var(--slack-canvas)] text-[var(--slack-ink)]">
      <section className="flex min-w-0 flex-1 flex-col">
      <header className={['shrink-0 border-b border-[var(--slack-line)] bg-white', isCompact ? 'px-4 py-1.5' : 'px-5 py-2'].join(' ')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[22px] font-black leading-none tracking-tight">#{channelName} <span className="text-[15px] text-[#868686]">★</span></p>
            <p className="mt-0.5 break-words text-[13px] leading-5 text-[var(--slack-muted)]">{channelDescription}</p>
                  <p className="mt-0.5 break-words text-[11px] text-[var(--slack-muted)]">8 21 • seguimiento de features, despliegues y calidad del equipo developer</p>
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[var(--slack-muted)]">
            <button className="rounded p-1.5 hover:bg-[var(--slack-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Channel members">
              ☰
            </button>
            <button className="rounded p-1.5 hover:bg-[var(--slack-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Channel info">
              ⓘ
            </button>
          </div>
        </div>

        <nav className={['flex items-center gap-1 overflow-x-auto text-[12px]', isCompact ? 'h-8' : 'h-9'].join(' ')}>
          {tabs.map((tab) => {
            const isActive = tab.isActive ?? false

            return (
              <button
                key={tab.id}
                className={[
                  'flex items-center gap-1 rounded-md px-2 py-1 whitespace-nowrap',
                  isActive
                    ? 'bg-[#E8F5FD] font-semibold text-[#1264A3]'
                    : 'text-[var(--slack-muted)] hover:bg-[var(--slack-soft)]'
                ].join(' ')}
              >
                {tab.leadingIcon ? <span>{tab.leadingIcon}</span> : null}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </header>

      <div className={['min-h-0 flex-1 overflow-y-auto', isCompact ? 'px-4 py-3' : 'px-5 py-4'].join(' ')}>
        {notices.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {notices.map((notice) => (
              <li
                key={notice.id}
                className="flex items-center gap-3 rounded-md border border-[var(--slack-line)] bg-[#FBFBFC] px-3 py-2"
              >
                <span className="text-xl">{notice.leadingEmoji ?? '📌'}</span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[var(--slack-ink)]">{notice.title}</p>
                  <p className="truncate text-sm text-[var(--slack-muted)]">{notice.subtitle}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <ul className={isCompact ? 'space-y-3' : 'space-y-4'}>
          {messages.map((message) => (
            <li key={message.id} className="flex gap-3">
              <MessageAvatar message={message} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-[var(--slack-ink)]">{message.author}</p>
                  <p className="text-xs text-[var(--slack-muted)]">{message.timestamp}</p>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-6 text-[var(--slack-ink)]">
                  {message.content}
                </p>

                {message.reactions?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.reactions.map((reaction) => (
                      <span
                        key={`${message.id}-${reaction.emoji}`}
                        className="rounded-full border border-[#D1D2D3] bg-[#F8F8F9] px-2 py-0.5 text-xs text-[#616061]"
                      >
                        {reaction.emoji} {reaction.count}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <footer className={['border-t border-[var(--slack-line)] bg-white', isCompact ? 'px-4 py-2.5' : 'px-5 py-3'].join(' ')}>
        <div className="rounded-md border border-[#CFCFD0] bg-white shadow-sm shadow-black/5">
          <div className="flex h-10 items-center px-3 text-[var(--slack-muted)]">
            <input
              aria-label="Message composer"
              className="w-full bg-transparent text-sm text-[var(--slack-ink)] placeholder:text-[var(--slack-muted)] focus:outline-none"
              placeholder={composerPlaceholder}
              value={draftMessage ?? ''}
              onChange={(event) => onDraftMessageChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  onSendMessage?.()
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between border-t border-[var(--slack-line)] px-2 py-1 text-[var(--slack-muted)]">
            <div className="flex items-center gap-1">
              {composerTools.map((tool) => (
                <button
                  key={tool.id}
                  aria-label={tool.label}
                  className="rounded p-1.5 hover:bg-[var(--slack-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]"
                >
                  {tool.icon}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button aria-label="Emoji" className="rounded p-1.5 hover:bg-[var(--slack-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]">
                ☺
              </button>
              <button aria-label="Mention" className="rounded p-1.5 hover:bg-[var(--slack-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]">
                @
              </button>
              <button aria-label="Attach" className="rounded p-1.5 hover:bg-[var(--slack-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]">
                📎
              </button>
              <button
                aria-label="Send message"
                onClick={onSendMessage}
                className="rounded bg-[#1D9BD1] px-2 py-1 text-xs font-semibold text-white hover:bg-[#1686B7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </footer>
      </section>

      {infoPanel ? (
        <aside className="hidden w-[320px] shrink-0 border-l border-[var(--slack-line)] bg-[var(--slack-info-bg)] lg:block">
          <header className="flex items-start justify-between border-b border-[var(--slack-line)] px-4 py-3">
            <div>
              <p className="text-lg font-semibold">Información</p>
              {infoPanel.subtitle ? (
                <p className="text-xs text-[var(--slack-muted)]">{infoPanel.subtitle}</p>
              ) : null}
            </div>
            <button aria-label="Close info panel" className="rounded p-1 hover:bg-[var(--slack-soft)]">
              ✕
            </button>
          </header>

          <div className="space-y-5 px-4 py-4">
            <div className="grid grid-cols-4 gap-2 text-center text-xs text-[var(--slack-muted)]">
              {infoPanel.actions.map((action) => (
                <button key={action.id} className="rounded border border-[var(--slack-line)] bg-white px-2 py-2 hover:bg-[var(--slack-soft)]">
                  <div className="text-sm">{action.icon}</div>
                  <div className="mt-1 truncate">{action.label}</div>
                </button>
              ))}
            </div>

            <section>
              <p className="text-sm font-semibold">Acerca de</p>
              <div className="mt-2 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--slack-muted)]">Tema</p>
                  <p>{infoPanel.aboutTopic}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--slack-muted)]">Descripción</p>
                  <p>{infoPanel.aboutDescription}</p>
                </div>
                {infoPanel.createdAtLabel ? (
                  <div className="rounded border border-[var(--slack-line)] bg-white px-2 py-1.5 text-xs text-[var(--slack-muted)]">
                    {infoPanel.createdAtLabel}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="flex items-center justify-between border-t border-[var(--slack-line)] pt-3 text-sm">
              <p className="font-semibold">Miembros</p>
              <p className="text-[var(--slack-muted)]">{infoPanel.membersCount}</p>
            </section>

            <section className="flex items-center justify-between border-t border-[var(--slack-line)] pt-3 text-sm">
              <p className="font-semibold">Organizaciones</p>
              <p className="text-[var(--slack-muted)]">{infoPanel.organizationsCount ?? 1}</p>
            </section>
          </div>
        </aside>
      ) : null}
    </div>
  )
}

export type { ChatAreaProps }
export default ChatArea
