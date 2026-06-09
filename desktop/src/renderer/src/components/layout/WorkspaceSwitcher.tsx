import type { WorkspaceItem } from './types'

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceItem[]
}

function WorkspaceSwitcher({ workspaces }: WorkspaceSwitcherProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center gap-2 bg-[var(--slack-workspace-rail)] py-3">
      {workspaces.map((workspace) => {
        const isActive = workspace.isActive ?? false

        return (
          <button
            key={workspace.id}
            aria-label={workspace.label}
            className={[
              'relative flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]',
              isActive ? 'ring-2 ring-white/40 shadow-lg shadow-black/30' : 'opacity-80 hover:opacity-100'
            ].join(' ')}
            style={{ backgroundColor: workspace.accentColor ?? '#0E7A9E' }}
          >
            {workspace.shortName}
            {isActive ? (
              <span className="absolute -left-3 h-6 w-1 rounded-r bg-white" aria-hidden="true" />
            ) : null}
          </button>
        )
      })}

      <button
        aria-label="Add workspace"
        className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 text-xl text-[#D9CDE1] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slack-focus-ring)]"
      >
        +
      </button>
    </div>
  )
}

export type { WorkspaceSwitcherProps }
export default WorkspaceSwitcher
