import type { AvatarItem } from './types'

type TopNavigationProps = {
  workspaceName: string
  searchPlaceholder: string
  memberAvatars: AvatarItem[]
}

function AvatarStackItem({ avatar }: { avatar: AvatarItem }): React.JSX.Element {
  if (avatar.imageUrl) {
    return (
      <img
        src={avatar.imageUrl}
        alt={avatar.label}
        className="h-6 w-6 rounded object-cover ring-2 ring-[#2C0D2E]"
      />
    )
  }

  return (
    <div
      aria-label={avatar.label}
      className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-semibold text-white ring-2 ring-[#2C0D2E]"
      style={{ backgroundColor: avatar.accentColor ?? '#6B46C1' }}
    >
      {avatar.label.slice(0, 2).toUpperCase()}
    </div>
  )
}

function TopNavigation({
  workspaceName,
  searchPlaceholder,
  memberAvatars
}: TopNavigationProps): React.JSX.Element {
  return (
    <div className="flex h-full items-center gap-3 bg-[#2C0D2E] px-3 text-[#E9DDEA]">
      <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10" aria-label="Open menu">
        <span className="block h-0.5 w-4 bg-current" />
        <span className="mt-1 block h-0.5 w-4 bg-current" />
        <span className="mt-1 block h-0.5 w-4 bg-current" />
      </button>

      <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10" aria-label="Go back">
        ←
      </button>

      <button className="rounded p-1 text-[#C6B5CC] hover:bg-white/10" aria-label="Go forward">
        →
      </button>

      <div className="w-full max-w-xl">
        <div className="flex h-7 items-center rounded-md border border-white/15 bg-white/10 px-2 text-xs text-[#E9DDEA]">
          <span className="mr-2 text-[#CBBED0]">⌕</span>
          <span className="truncate opacity-85">{searchPlaceholder}</span>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 text-xs text-[#CBBED0] md:flex">
        <span className="truncate">{workspaceName}</span>
      </div>

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
