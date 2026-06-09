import type { AvatarItem, LayoutDensity } from './types'

type TopNavigationProps = {
  workspaceName: string
  searchPlaceholder: string
  memberAvatars: AvatarItem[]
  density?: LayoutDensity
}

function AvatarStackItem({ avatar }: { avatar: AvatarItem }): React.JSX.Element {
  const onlineIndicator = avatar.hasOnlineIndicator ? (
    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[var(--slack-topbar)] bg-[#2BAC76]" />
  ) : null

  if (avatar.imageUrl) {
    return (
      <div className="relative">
        <img
          src={avatar.imageUrl}
          alt={avatar.label}
          className="h-6 w-6 rounded object-cover ring-2 ring-[var(--slack-topbar)]"
        />
        {onlineIndicator}
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        aria-label={avatar.label}
        className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-semibold text-white ring-2 ring-[var(--slack-topbar)]"
        style={{ backgroundColor: avatar.accentColor ?? '#6B46C1' }}
      >
        {avatar.label.slice(0, 2).toUpperCase()}
      </div>
      {onlineIndicator}
    </div>
  )
}

function TopNavigation({
  workspaceName,
  searchPlaceholder,
  memberAvatars,
  density = 'comfortable'
}: TopNavigationProps): React.JSX.Element {
  const isCompact = density === 'compact'

  return (
    <div
      className={[
        'grid h-full grid-cols-[auto_1fr_auto] items-center border-b border-white/10 bg-[var(--slack-topbar)] text-[#E9DDEA]',
        isCompact ? 'gap-2 px-3' : 'gap-3 px-4'
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5">
        <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Main menu">
          ☰
        </button>
        <span className="mx-1 h-4 w-px bg-white/20" aria-hidden="true" />
        <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Go back">
          ←
        </button>
        <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Go forward">
          →
        </button>
        <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="History">
          🕒
        </button>
      </div>

      <div className="mx-auto w-full max-w-[620px]">
        <div className="flex h-7 items-center rounded-md border border-white/20 bg-white/12 px-2.5 text-[12px] text-[#E9DDEA] shadow-inner shadow-black/15">
          <span className="mr-2 text-[#CBBED0]">⌕</span>
          <span className="truncate opacity-95">{searchPlaceholder}</span>
          <span className="sr-only">{workspaceName}</span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button className="rounded-full p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Help">
          ⍰
        </button>
        <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Minimize">
          −
        </button>
        <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Maximize">
          □
        </button>
        <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Close">
          ×
        </button>
        <div className="ml-1 hidden items-center -space-x-2 xl:flex">
          {memberAvatars.slice(0, 2).map((avatar) => (
            <AvatarStackItem key={avatar.id} avatar={avatar} />
          ))}
        </div>
      </div>
    </div>
  )
}

export type { TopNavigationProps }
export default TopNavigation
