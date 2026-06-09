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
    <div className="h-screen w-screen overflow-hidden text-sm text-[#1D1C1D]">
      <div className="flex h-full flex-col bg-[#3F0E40]">
        <header className="h-10 shrink-0 border-b border-white/10 bg-[#2C0D2E]">
          <TopNavigation
            workspaceName={workspaceName}
            searchPlaceholder={searchPlaceholder}
            memberAvatars={topBarAvatars}
          />
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="w-16 shrink-0 bg-[#31103F]">
            <WorkspaceSwitcher workspaces={workspaces} />
          </aside>

          <aside className="w-64 shrink-0 bg-[#3F0E40] text-[#D1C4D9]">
            <Sidebar workspaceName={workspaceName} sections={sidebarSections} />
          </aside>

          <main className="min-w-0 flex-1 bg-white text-[#1D1C1D]">
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
