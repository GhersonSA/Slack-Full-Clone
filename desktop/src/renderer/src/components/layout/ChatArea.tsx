import type { ChatMessage } from './types'

type ChatAreaProps = {
  channelName: string
  channelDescription: string
  messages: ChatMessage[]
  composerPlaceholder: string
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
  composerPlaceholder
}: ChatAreaProps): React.JSX.Element {
  return (
    <div className="flex h-full min-w-0 flex-col bg-white text-[#1D1C1D]">
      <header className="flex h-12 shrink-0 items-center border-b border-[#E6E6E6] px-6">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">#{channelName}</p>
          <p className="truncate text-xs text-[#616061]">{channelDescription}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
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
              </div>
            </li>
          ))}
        </ul>
      </div>

      <footer className="border-t border-[#E6E6E6] px-6 py-3">
        <div className="flex h-11 items-center rounded-md border border-[#CFCFD0] px-3 text-[#616061]">
          <span className="truncate">{composerPlaceholder}</span>
        </div>
      </footer>
    </div>
  )
}

export type { ChatAreaProps }
export default ChatArea
