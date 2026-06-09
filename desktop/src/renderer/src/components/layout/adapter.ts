import type { Channel, Message, Presence, User } from '@renderer/types/api'
import type { ChatEvent } from '@renderer/types/realtime'

import type { AppLayoutProps } from './AppLayout'

export type SlackLayoutAdapterInput = {
  workspaceName: string
  users: User[]
  channels: Channel[]
  selectedChannelId: string
  historyMessages: Message[]
  events: ChatEvent[]
  presence: Presence | null
  feedback: string
  density?: AppLayoutProps['density']
  sidebarCollapsed?: boolean
}

function findChannelName(channels: Channel[], selectedChannelId: string): string {
  if (!selectedChannelId) {
    return 'general'
  }

  const selected = channels.find((channel) => channel.id === selectedChannelId)
  return selected?.name ?? selectedChannelId.slice(0, 8)
}

function buildUserNameMap(users: User[]): Map<string, string> {
  return new Map(users.map((user) => [user.id, user.display_name || user.username]))
}

function mapMessages(
  historyMessages: Message[],
  events: ChatEvent[],
  users: User[]
): AppLayoutProps['messages'] {
  const userNameById = buildUserNameMap(users)

  const history = historyMessages.map((item) => ({
    id: item.id,
    author: userNameById.get(item.author_id) ?? item.author_id,
    timestamp: new Date(item.created_at).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    content: item.body,
    avatarLabel: (userNameById.get(item.author_id) ?? item.author_id).slice(0, 2).toUpperCase()
  }))

  const realtimeMessages = events
    .filter((event): event is Extract<ChatEvent, { type: 'message' }> => event.type === 'message')
    .map((event) => ({
      id: event.id,
      author: userNameById.get(event.author_id) ?? event.author_id,
      timestamp: new Date(event.created_at).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      content: event.body,
      avatarLabel: (userNameById.get(event.author_id) ?? event.author_id).slice(0, 2).toUpperCase()
    }))

  const deduped = new Map<string, AppLayoutProps['messages'][number]>()
  for (const item of [...history, ...realtimeMessages]) {
    deduped.set(item.id, item)
  }

  return [...deduped.values()]
}

export function mapToSlackLayoutProps(input: SlackLayoutAdapterInput): AppLayoutProps {
  const selectedChannelName = findChannelName(input.channels, input.selectedChannelId)

  const topBarAvatars: AppLayoutProps['topBarAvatars'] = input.users.slice(0, 3).map((user) => ({
    id: user.id,
    label: user.display_name,
    hasOnlineIndicator: input.presence?.online_user_ids.includes(user.id) ?? false
  }))

  const sidebarSections: AppLayoutProps['sidebarSections'] = [
    {
      id: 'channels',
      title: 'Channels',
      items: input.channels.map((channel) => ({
        id: channel.id,
        label: channel.name,
        prefix: '#',
        isActive: channel.id === input.selectedChannelId
      }))
    },
    {
      id: 'dms',
      title: 'Direktnachrichten',
      items: input.users.map((user) => ({
        id: user.id,
        label: user.display_name,
        hasPresenceDot: input.presence?.online_user_ids.includes(user.id) ?? false,
        compactLabel: user.display_name.slice(0, 2).toUpperCase()
      }))
    }
  ]

  const notices: AppLayoutProps['notices'] = input.feedback
    ? [
        {
          id: 'feedback',
          title: input.feedback,
          subtitle: 'Estado de la sesión actual',
          leadingEmoji: 'ℹ️'
        }
      ]
    : []

  return {
    workspaceName: input.workspaceName,
    searchPlaceholder: `${input.workspaceName} durchsuchen`,
    workspaces: [
      {
        id: 'workspace-main',
        label: input.workspaceName,
        shortName: input.workspaceName.slice(0, 2).toUpperCase(),
        accentColor: '#0E7A9E',
        isActive: true
      }
    ],
    sidebarSections,
    channelName: selectedChannelName,
    channelDescription: input.presence
      ? `${input.presence.online_count} usuarios online en este canal`
      : 'Canal sincronizado con backend FastAPI',
    channelTabs: [
      { id: 'tab-overview', label: 'Overview', leadingIcon: '◫', isActive: true },
      { id: 'tab-resources', label: 'Ressourcen', leadingIcon: '✣' }
    ],
    notices,
    messages: mapMessages(input.historyMessages, input.events, input.users),
    composerPlaceholder: `Nachricht an #${selectedChannelName}`,
    composerTools: [
      { id: 'tool-bolt', label: 'Quick actions', icon: '⚡' },
      { id: 'tool-bold', label: 'Bold', icon: 'B' },
      { id: 'tool-link', label: 'Link', icon: '🔗' }
    ],
    topBarAvatars,
    density: input.density,
    sidebarCollapsed: input.sidebarCollapsed,
    hideWorkspaceRailOnNarrow: true
  }
}
