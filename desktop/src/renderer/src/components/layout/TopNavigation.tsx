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
        'flex h-full items-center bg-[var(--slack-topbar)] text-[#E9DDEA]',
        isCompact ? 'gap-2 px-3' : 'gap-3 px-4'
      ].join(' ')}
    >
      <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Open menu">
        <span className="block h-0.5 w-4 bg-current" />
        <span className="mt-1 block h-0.5 w-4 bg-current" />
        <span className="mt-1 block h-0.5 w-4 bg-current" />
      </button>

      <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Go back">
        ←
      </button>

      <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Go forward">
        →
      </button>

      <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="History">
        ◷
      </button>

      <div className="w-full max-w-xl">
        <div className="flex h-7 items-center rounded-md border border-white/15 bg-white/10 px-2 text-xs text-[#E9DDEA] shadow-inner shadow-black/10">
          <span className="mr-2 text-[#CBBED0]">⌕</span>
          <span className="truncate opacity-85">{searchPlaceholder}</span>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 text-xs text-[#CBBED0] md:flex">
        <span className="truncate">{workspaceName}</span>
      </div>

      <button className="rounded-full p-1 text-[#C6B5CC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]" aria-label="Help">
        ?
      </button>

      <div className="ml-auto flex items-center">
        <div className="flex -space-x-2">
          {memberAvatars.map((avatar) => (
            <AvatarStackItem key={avatar.id} avatar={avatar} />
          ))}
        </div>
      </div>
    </div>
  )
}

export type { TopNavigationProps }
export default TopNavigation
