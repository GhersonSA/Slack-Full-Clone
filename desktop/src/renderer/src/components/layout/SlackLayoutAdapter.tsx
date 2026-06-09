import type { Channel, Message, Presence, User } from '@renderer/types/api'
import type { ChatEvent } from '@renderer/types/realtime'

import AppLayout from './AppLayout'
import { mapToSlackLayoutProps } from './adapter'

type SlackLayoutAdapterProps = {
  workspaceName: string
  users: User[]
  channels: Channel[]
  selectedChannelId: string
  historyMessages: Message[]
  events: ChatEvent[]
  presence: Presence | null
  feedback: string
  density?: 'compact' | 'comfortable'
  sidebarCollapsed?: boolean
}

function SlackLayoutAdapter(props: SlackLayoutAdapterProps): React.JSX.Element {
  return <AppLayout {...mapToSlackLayoutProps(props)} />
}

export type { SlackLayoutAdapterProps }
export default SlackLayoutAdapter
