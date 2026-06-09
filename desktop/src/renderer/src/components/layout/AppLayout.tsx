import ChatArea from './ChatArea'
import Sidebar from './Sidebar'
import TopNavigation from './TopNavigation'
import type {
  AvatarItem,
  ChannelTab,
  ChatMessage,
  ChatInfoPanel,
  ChatNoticeCard,
  ComposerTool,
  LayoutDensity,
  SidebarSection,
  WorkspaceItem
} from './types'
import WorkspaceSwitcher from './WorkspaceSwitcher'

type AppLayoutProps = {
  workspaceName: string
  searchPlaceholder: string
  workspaces: WorkspaceItem[]
  sidebarSections: SidebarSection[]
  channelName: string
  channelDescription: string
  messages: ChatMessage[]
  composerPlaceholder: string
  topBarAvatars: AvatarItem[]
  channelTabs: ChannelTab[]
  notices: ChatNoticeCard[]
  composerTools: ComposerTool[]
  infoPanel?: ChatInfoPanel
  density?: LayoutDensity
  sidebarCollapsed?: boolean
  hideWorkspaceRailOnNarrow?: boolean
  draftMessage?: string
  onDraftMessageChange?: (value: string) => void
  onSendMessage?: () => void
  onSidebarItemSelect?: (sectionId: string, itemId: string) => void
  onQuickCreateChannel?: () => void
}

function AppLayout({
  workspaceName,
  searchPlaceholder,
  workspaces,
  sidebarSections,
  channelName,
  channelDescription,
  messages,
  composerPlaceholder,
  topBarAvatars,
  channelTabs,
  notices,
  composerTools,
  infoPanel,
  density = 'comfortable',
  sidebarCollapsed = false,
  hideWorkspaceRailOnNarrow = true,
  draftMessage,
  onDraftMessageChange,
  onSendMessage,
  onSidebarItemSelect,
  onQuickCreateChannel
}: AppLayoutProps): React.JSX.Element {
  const isCompact = density === 'compact'

  return (
    <div className="h-screen w-screen overflow-hidden text-sm text-[var(--slack-ink)]">
      <div className="flex h-full flex-col bg-[var(--slack-sidebar)]">
        <header className={[ 'shrink-0 border-b border-white/10 bg-[var(--slack-topbar)]', isCompact ? 'h-10' : 'h-11' ].join(' ')}>
          <TopNavigation
            workspaceName={workspaceName}
            searchPlaceholder={searchPlaceholder}
            memberAvatars={topBarAvatars}
            density={density}
          />
        </header>

        <div className="flex min-h-0 flex-1">
          <aside
            className={[
              'shrink-0 border-r border-black/20 bg-[var(--slack-workspace-rail)]',
              hideWorkspaceRailOnNarrow ? 'hidden lg:block' : 'block',
              isCompact ? 'w-16' : 'w-[72px]'
            ].join(' ')}
          >
            <WorkspaceSwitcher workspaces={workspaces} density={density} />
          </aside>

          <aside
            className={[
              'shrink-0 border-r border-black/20 bg-[var(--slack-sidebar)] text-[#D1C4D9]',
              sidebarCollapsed ? 'w-[74px]' : isCompact ? 'w-64' : 'w-72'
            ].join(' ')}
          >
            <Sidebar
              workspaceName={workspaceName}
              sections={sidebarSections}
              density={density}
              collapsed={sidebarCollapsed}
              onItemSelect={onSidebarItemSelect}
              onCompose={onQuickCreateChannel}
            />
          </aside>

          <main className="min-w-0 flex-1 bg-[var(--slack-canvas)] text-[var(--slack-ink)]">
            <ChatArea
              channelName={channelName}
              channelDescription={channelDescription}
              messages={messages}
              composerPlaceholder={composerPlaceholder}
              tabs={channelTabs}
              notices={notices}
              composerTools={composerTools}
              infoPanel={infoPanel}
              density={density}
              draftMessage={draftMessage}
              onDraftMessageChange={onDraftMessageChange}
              onSendMessage={onSendMessage}
            />
          </main>
        </div>
      </div>
    </div>
  )
}

export type { AppLayoutProps }
export default AppLayout
