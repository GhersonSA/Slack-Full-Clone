import type { ChannelTab, ChatMessage, ChatNoticeCard, ComposerTool } from './types'

type ChatAreaProps = {
  channelName: string
  channelDescription: string
  messages: ChatMessage[]
  composerPlaceholder: string
  tabs: ChannelTab[]
  notices: ChatNoticeCard[]
  composerTools: ComposerTool[]
}

function MessageAvatar({ message }: { message: ChatMessage }): React.JSX.Element {
  return (
    <div
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded text-xs font-semibold text-white"
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
  composerTools
}: ChatAreaProps): React.JSX.Element {
  return (
    <div className="flex h-full min-w-0 flex-col bg-white text-[#1D1C1D]">
      <header className="shrink-0 border-b border-[#E6E6E6] px-6 pt-2">
        <div className="flex h-10 items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-[25px] font-bold leading-none">#{channelName}</p>
            <p className="truncate text-sm text-[#616061]">{channelDescription}</p>
          </div>

          <div className="flex items-center gap-1 text-[#616061]">
            <button className="rounded p-1.5 hover:bg-[#F3F3F4]" aria-label="Channel members">
              👥
            </button>
            <button className="rounded p-1.5 hover:bg-[#F3F3F4]" aria-label="Channel info">
              ⓘ
            </button>
          </div>
        </div>

        <nav className="flex h-9 items-center gap-1 overflow-x-auto text-[13px]">
          {tabs.map((tab) => {
            const isActive = tab.isActive ?? false

            return (
              <button
                key={tab.id}
                className={[
                  'flex items-center gap-1 rounded-md px-2 py-1 whitespace-nowrap',
                  isActive
                    ? 'bg-[#E8F5FD] font-semibold text-[#1264A3]'
                    : 'text-[#616061] hover:bg-[#F3F3F4]'
                ].join(' ')}
              >
                {tab.leadingIcon ? <span>{tab.leadingIcon}</span> : null}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {notices.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {notices.map((notice) => (
              <li
                key={notice.id}
                className="flex items-center gap-3 rounded-md border border-[#E6E6E6] bg-[#FBFBFC] px-3 py-2"
              >
                <span className="text-xl">{notice.leadingEmoji ?? '📌'}</span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#1D1C1D]">{notice.title}</p>
                  <p className="truncate text-sm text-[#616061]">{notice.subtitle}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <ul className="space-y-4">
          {messages.map((message) => (
            <li key={message.id} className="flex gap-3">
              <MessageAvatar message={message} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-[#1D1C1D]">{message.author}</p>
                  <p className="text-xs text-[#616061]">{message.timestamp}</p>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-6 text-[#1D1C1D]">
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

      <footer className="border-t border-[#E6E6E6] px-6 py-3">
        <div className="rounded-md border border-[#CFCFD0]">
          <div className="flex h-12 items-center px-3 text-[#616061]">
            <span className="truncate">{composerPlaceholder}</span>
          </div>

          <div className="flex items-center justify-between border-t border-[#E6E6E6] px-2 py-1.5 text-[#616061]">
            <div className="flex items-center gap-1">
              {composerTools.map((tool) => (
                <button
                  key={tool.id}
                  aria-label={tool.label}
                  className="rounded p-1.5 hover:bg-[#F3F3F4]"
                >
                  {tool.icon}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button aria-label="Emoji" className="rounded p-1.5 hover:bg-[#F3F3F4]">
                ☺
              </button>
              <button aria-label="Mention" className="rounded p-1.5 hover:bg-[#F3F3F4]">
                @
              </button>
              <button aria-label="Attach" className="rounded p-1.5 hover:bg-[#F3F3F4]">
                📎
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export type { ChatAreaProps }
export default ChatArea
