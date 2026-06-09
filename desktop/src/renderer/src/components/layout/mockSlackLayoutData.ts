import type {
  AvatarItem,
  ChannelTab,
  ChatMessage,
  ChatNoticeCard,
  ComposerTool,
  SidebarSection,
  WorkspaceItem
} from './types'

const workspaceName = 'Fiktion GmbH'

const searchPlaceholder = 'Fiktion GmbH durchsuchen'

const workspaces: WorkspaceItem[] = [
  {
    id: 'w-fiktion',
    label: 'Fiktion',
    shortName: 'Fi',
    accentColor: '#0E7A9E',
    isActive: true
  },
  {
    id: 'w-spark',
    label: 'Spark',
    shortName: 'Sp',
    accentColor: '#4A154B'
  }
]

const topBarAvatars: AvatarItem[] = [
  {
    id: 'a-lisa',
    label: 'Lisa',
    accentColor: '#D97706'
  },
  {
    id: 'a-nikki',
    label: 'Nikki',
    accentColor: '#0EA5A4',
    hasOnlineIndicator: true
  }
]

const sidebarSections: SidebarSection[] = [
  {
    id: 's-core',
    items: [
      { id: 'threads', label: 'Threads', leadingIcon: '◔' },
      { id: 'dms', label: 'Alle DMs', leadingIcon: '◍', isBold: true },
      { id: 'drafts', label: 'Entwurfe', leadingIcon: '◷' },
      { id: 'mentions', label: 'Erwahnungen & Reaktionen', leadingIcon: '◌' },
      { id: 'saved', label: 'Gespeicherte Elemente', leadingIcon: '⌂' },
      { id: 'more', label: 'Mehr', leadingIcon: '▸' }
    ]
  },
  {
    id: 's-favorites',
    title: 'Favoriten',
    items: [
      { id: 'ch-design-team', label: 'design-team', prefix: '#', isBold: true },
      {
        id: 'ch-soziale-medien',
        label: 'soziale-medien',
        prefix: '#',
        isActive: true,
        trailingText: '✦'
      },
      { id: 'ch-team-finanzen', label: 'team-finanzen', prefix: '#', isBold: true },
      { id: 'dm-mia', label: 'Mia Greco', hasPresenceDot: true }
    ]
  },
  {
    id: 's-channels',
    title: 'Channels',
    items: [
      { id: 'ch-mitteilungen', label: 'mitteilungen', prefix: '#' },
      { id: 'ch-pr', label: 'pr', prefix: '#' },
      { id: 'ch-add', label: 'Channel hinzufugen', leadingIcon: '+' }
    ]
  },
  {
    id: 's-dms',
    title: 'Direktnachrichten',
    items: [
      { id: 'dm-mamadou', label: 'Mamadou Achebe du', hasPresenceDot: true },
      { id: 'dm-bea', label: 'Bea Rosner, Christian Pahls...', unreadCount: 3 },
      { id: 'dm-add', label: 'Team-Mitglieder hinzufugen', leadingIcon: '+' }
    ]
  },
  {
    id: 's-apps',
    title: 'Apps',
    items: [{ id: 'app-gcal', label: 'Google Calendar', leadingIcon: '◨' }]
  }
]

const channelName = 'soziale-medien'

const channelDescription = 'Soziale Medien verfolgen und koordinieren'

const channelTabs: ChannelTab[] = [
  { id: 'tab-zusammenfassung', label: 'Projektzusammenfassung', leadingIcon: '🧱' },
  { id: 'tab-ressourcen', label: 'Ressourcen', leadingIcon: '✣' },
  { id: 'tab-todos', label: 'To-dos', leadingIcon: '◫', isActive: true },
  { id: 'tab-jira', label: 'JIRA-Board', leadingIcon: '🛫' },
  { id: 'tab-plus', label: '+' }
]

const notices: ChatNoticeCard[] = [
  {
    id: 'notice-meeting',
    title: 'Team-Meeting zur Bestandsaufnahme',
    subtitle: 'Today from 1:00 PM to 1:30 PM',
    leadingEmoji: '🗓'
  },
  {
    id: 'notice-notes',
    title: '1/9 Meeting-Notizen',
    subtitle: 'Gerade eben zum letzten Mal bearbeitet',
    leadingEmoji: '📄'
  }
]

const messages: ChatMessage[] = [
  {
    id: 'm-1',
    author: 'Mamadou Achebe',
    timestamp: '11:52 Uhr',
    content: 'Tolle Arbeit heute von allen!',
    avatarLabel: 'MA',
    accentColor: '#15803D'
  },
  {
    id: 'm-2',
    author: 'Lisa Laurenz',
    timestamp: '11:55 Uhr',
    content:
      'Erst mal ein grosses Lob an @Nikki fur ihre Hilfe gestern bei den vielen neuen Tweets. Alle sind ganz begeistert wegen der Mitteilung.',
    avatarLabel: 'LL',
    accentColor: '#D97706',
    reactions: [
      { emoji: '🎉', count: 1 },
      { emoji: '✨', count: 1 },
      { emoji: '👏', count: 1 },
      { emoji: '😍', count: 1 }
    ]
  },
  {
    id: 'm-3',
    author: 'Nikki Kroll',
    timestamp: '11:56 Uhr',
    content: 'Ach, das war mir doch ein Vergnugen! Toll, dass ihr so viel Engagement zeigt.',
    avatarLabel: 'NK',
    accentColor: '#0EA5A4'
  },
  {
    id: 'm-4',
    author: 'Bilge Yanar',
    timestamp: '12:58 Uhr',
    content:
      'Kurze Info: Heute wird @Lisa zu unserer Team-Besprechung stossen, um uns Neuigkeiten zum Start zu geben.',
    avatarLabel: 'BY',
    accentColor: '#CA8A04'
  }
]

const composerPlaceholder = 'Nachricht an #soziale-medien'

const composerTools: ComposerTool[] = [
  { id: 'tool-bolt', label: 'Quick actions', icon: '⚡' },
  { id: 'tool-bold', label: 'Bold', icon: 'B' },
  { id: 'tool-italic', label: 'Italic', icon: 'I' },
  { id: 'tool-link', label: 'Link', icon: '🔗' },
  { id: 'tool-list', label: 'List', icon: '☰' }
]

export const slackLayoutMockData = {
  workspaceName,
  searchPlaceholder,
  workspaces,
  sidebarSections,
  channelName,
  channelDescription,
  channelTabs,
  notices,
  messages,
  composerPlaceholder,
  composerTools,
  topBarAvatars
}
