import type { LayoutDensity, WorkspaceItem } from './types'

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceItem[]
  density?: LayoutDensity
}

function WorkspaceSwitcher({
  workspaces,
  density = 'comfortable'
}: WorkspaceSwitcherProps): React.JSX.Element {
  const isCompact = density === 'compact'

  return (
    <div
      className={[
        'flex h-full flex-col items-center bg-[var(--slack-workspace-rail)]',
        isCompact ? 'gap-2 py-3' : 'gap-3 py-4'
      ].join(' ')}
    >
      {workspaces.map((workspace) => {
        const isActive = workspace.isActive ?? false

        return (
          <button
            key={workspace.id}
            aria-label={workspace.label}
            className={[
              'relative flex items-center justify-center rounded-xl text-xs font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]',
              isCompact ? 'h-10 w-10' : 'h-11 w-11',
              isActive
                ? 'ring-2 ring-white/35 shadow-lg shadow-black/30'
                : 'opacity-85 hover:opacity-100 hover:scale-[1.02]'
            ].join(' ')}
            style={{ backgroundColor: workspace.accentColor ?? '#0E7A9E' }}
          >
            {workspace.shortName}
            {isActive ? (
              <span className="absolute -left-3 h-5 w-1 rounded-r bg-white" aria-hidden="true" />
            ) : null}
          </button>
        )
      })}

      <button
        aria-label="Add workspace"
        className={[
          'mt-2 flex items-center justify-center rounded-xl border border-white/25 text-xl text-[#D9CDE1] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]',
          isCompact ? 'h-10 w-10' : 'h-11 w-11'
        ].join(' ')}
      >
        +
      </button>
    </div>
  )
}

export type { WorkspaceSwitcherProps }
export default WorkspaceSwitcher
