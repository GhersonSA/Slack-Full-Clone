import ChatArea from './ChatArea'
import Sidebar from './Sidebar'
import TopNavigation from './TopNavigation'
import type {
  AvatarItem,
  ChannelTab,
  ChatMessage,
  ChatNoticeCard,
  ComposerTool,
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
  composerTools
}: AppLayoutProps): React.JSX.Element {
  return (
    <div className="h-screen w-screen overflow-hidden text-sm text-[var(--slack-ink)]">
      <div className="flex h-full flex-col bg-[var(--slack-sidebar)]">
        <header className="h-10 shrink-0 border-b border-white/10 bg-[var(--slack-topbar)]">
          <TopNavigation
            workspaceName={workspaceName}
            searchPlaceholder={searchPlaceholder}
            memberAvatars={topBarAvatars}
          />
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="w-16 shrink-0 border-r border-black/20 bg-[var(--slack-workspace-rail)]">
            <WorkspaceSwitcher workspaces={workspaces} />
          </aside>

          <aside className="w-64 shrink-0 border-r border-black/20 bg-[var(--slack-sidebar)] text-[#D1C4D9]">
            <Sidebar workspaceName={workspaceName} sections={sidebarSections} />
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
            />
          </main>
        </div>
      </div>
    </div>
  )
}

export type { AppLayoutProps }
export default AppLayout
