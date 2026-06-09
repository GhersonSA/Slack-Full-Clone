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
  draftMessage?: string
  onDraftMessageChange?: (value: string) => void
  onSendMessage?: () => void
  onSidebarItemSelect?: (sectionId: string, itemId: string) => void
  onQuickCreateChannel?: () => void
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

const DEVELOPER_FALLBACK_NAMES = [
  'Sofia Torres',
  'Daniel Ruiz',
  'Valentina Castro',
  'Javier Molina',
  'Camila Vega',
  'Gherson Sanchez',
  'Renata Flores',
  'Tomas Herrera'
]

const AUTHOR_COLOR_PALETTE = ['#2D6CDF', '#0EA5A4', '#D97706', '#2563EB', '#CA8A04', '#15803D']

function hashToIndex(value: string, modulo: number): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash % modulo
}

function buildResolvedAuthorNameMap(
  users: User[],
  historyMessages: Message[],
  events: ChatEvent[]
): Map<string, string> {
  const resolved = buildUserNameMap(users)
  const usedNames = new Set([...resolved.values()].map((name) => name.toLowerCase()))

  const unknownAuthorIds = [
    ...new Set([
      ...historyMessages.map((message) => message.author_id),
      ...events
        .filter((event): event is Extract<ChatEvent, { type: 'message' }> => event.type === 'message')
        .map((event) => event.author_id)
    ])
  ].filter((authorId) => !resolved.has(authorId))

  for (const authorId of unknownAuthorIds) {
    const baseIndex = hashToIndex(authorId, DEVELOPER_FALLBACK_NAMES.length)
    let assignedName = ''

    for (let step = 0; step < DEVELOPER_FALLBACK_NAMES.length; step += 1) {
      const candidate = DEVELOPER_FALLBACK_NAMES[(baseIndex + step) % DEVELOPER_FALLBACK_NAMES.length]
      const candidateKey = candidate.toLowerCase()
      if (!usedNames.has(candidateKey)) {
        assignedName = candidate
        usedNames.add(candidateKey)
        break
      }
    }

    if (!assignedName) {
      assignedName = `Colaborador ${resolved.size + 1}`
    }

    resolved.set(authorId, assignedName)
  }

  return resolved
}

function resolveAuthorColorByName(authorName: string): string {
  return AUTHOR_COLOR_PALETTE[hashToIndex(authorName.toLowerCase(), AUTHOR_COLOR_PALETTE.length)]
}

function mapMessages(
  historyMessages: Message[],
  events: ChatEvent[],
  resolvedAuthorNameById: Map<string, string>,
  selectedChannelName: string
): AppLayoutProps['messages'] {
  const history = historyMessages.map((item) => {
    const authorName = resolvedAuthorNameById.get(item.author_id) ?? 'Colaborador'
    return {
      id: item.id,
      author: authorName,
      timestamp: new Date(item.created_at).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      content: item.body,
      avatarLabel: authorName.slice(0, 2).toUpperCase(),
      accentColor: resolveAuthorColorByName(authorName)
    }
  })

  const realtimeMessages = events
    .filter((event): event is Extract<ChatEvent, { type: 'message' }> => event.type === 'message')
    .map((event) => {
      const authorName = resolvedAuthorNameById.get(event.author_id) ?? 'Colaborador'
      return {
        id: event.id,
        author: authorName,
        timestamp: new Date(event.created_at).toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        content: event.body,
        avatarLabel: authorName.slice(0, 2).toUpperCase(),
        accentColor: resolveAuthorColorByName(authorName)
      }
    })

  const deduped = new Map<string, AppLayoutProps['messages'][number]>()
  for (const item of [...history, ...realtimeMessages]) {
    deduped.set(item.id, item)
  }

  const combined = [...deduped.values()]
  if (combined.length > 0) {
    return combined
  }

  const sampleByChannel: Record<string, AppLayoutProps['messages']> = {
    'frontend-platform': [
      {
        id: 'sample-fe-1',
        author: 'GhersonSA',
        timestamp: '12:45',
        content: 'Muevo a produccion el fix del composer responsive en 15 minutos. Necesito pulgar arriba para aprobar.',
        avatarLabel: 'GH',
        accentColor: '#2D6CDF'
      },
      {
        id: 'sample-fe-2',
        author: 'Matias Frontend',
        timestamp: '12:58',
        content: 'Listo. Tambien deje mock de estados de carga/error para revisar visualmente todos los edge cases.',
        avatarLabel: 'MG',
        accentColor: '#D97706'
      },
      {
        id: 'sample-fe-3',
        author: 'Camila QA',
        timestamp: '13:04',
        content: 'Validado en Windows 11 y macOS. Solo falta ajustar espaciado del panel de informacion.',
        avatarLabel: 'CQ',
        accentColor: '#0EA5A4'
      }
    ],
    'backend-api': [
      {
        id: 'sample-be-1',
        author: 'Felipe Backend',
        timestamp: '09:05',
        content: 'Endpoint /presence optimizado. Pasamos de 7 consultas SQL a 1 consulta agregada.',
        avatarLabel: 'FB',
        accentColor: '#0EA5A4'
      }
    ],
    'devops-ci-cd': [
      {
        id: 'sample-devops-1',
        author: 'Diego SRE',
        timestamp: '11:10',
        content: 'Pipeline release candidate en verde. Tiempo total 6m 24s.',
        avatarLabel: 'DS',
        accentColor: '#CA8A04'
      }
    ],
    'bug-triage': [
      {
        id: 'sample-bugs-1',
        author: 'Camila QA',
        timestamp: '12:45',
        content: 'Issue #824: el boton de enviar no responde cuando se pierde foco y vuelve la ventana.',
        avatarLabel: 'CQ',
        accentColor: '#2D6CDF'
      },
      {
        id: 'sample-bugs-2',
        author: 'GhersonSA',
        timestamp: '12:58',
        content: 'Lo tengo. Voy a dejarlo cubierto con test de regression + fallback local.',
        avatarLabel: 'GH',
        accentColor: '#15803D'
      }
    ]
  }

  return sampleByChannel[selectedChannelName] ?? []
}

export function mapToSlackLayoutProps(input: SlackLayoutAdapterInput): AppLayoutProps {
  const selectedChannelName = findChannelName(input.channels, input.selectedChannelId)
  const resolvedAuthorNameById = buildResolvedAuthorNameMap(
    input.users,
    input.historyMessages,
    input.events
  )
  const participantEntries = [
    ...input.historyMessages.map(
      (message) => [message.author_id, resolvedAuthorNameById.get(message.author_id) ?? 'Colaborador'] as const
    ),
    ...input.events
      .filter((event): event is Extract<ChatEvent, { type: 'message' }> => event.type === 'message')
      .map(
        (event) => [event.author_id, resolvedAuthorNameById.get(event.author_id) ?? 'Colaborador'] as const
      )
  ]
  const uniqueParticipants = new Map<string, string>(participantEntries)

  const topBarAvatars: AppLayoutProps['topBarAvatars'] = input.users.slice(0, 3).map((user) => ({
    id: user.id,
    label: user.display_name,
    hasOnlineIndicator: input.presence?.online_user_ids.includes(user.id) ?? false
  }))

  const sidebarSections: AppLayoutProps['sidebarSections'] = [
    {
      id: 'shortcuts',
      items: [
        { id: 'all-unread', label: 'Todos los mensajes', leadingIcon: '◉', isBold: true },
        { id: 'threads', label: 'Hilos', leadingIcon: '⤷' },
        { id: 'mentions', label: 'Menciones y reacciones', leadingIcon: '@' },
        { id: 'drafts', label: 'Borradores', leadingIcon: '✎', unreadCount: 2 },
        { id: 'show-more', label: 'Mostrar más', leadingIcon: '⌄' }
      ]
    },
    {
      id: 'channels',
      title: 'Canales',
      items: input.channels.map((channel) => ({
        id: channel.id,
        label: channel.name,
        prefix: '#',
        isActive: channel.id === input.selectedChannelId,
        unreadCount: channel.id === input.selectedChannelId ? 0 : 1
      }))
    },
    {
      id: 'dms',
      title: 'Mensajes directos',
      items: [
        ...input.users.slice(0, 8).map((user, index) => ({
          id: user.id,
          label: user.display_name,
          hasPresenceDot:
            input.presence?.online_user_ids.includes(user.id) ??
            (!input.presence && index < Math.min(input.users.length, 4)),
          compactLabel: user.display_name.slice(0, 2).toUpperCase()
        })),
        ...[...uniqueParticipants.entries()]
          .filter(([participantId]) => !input.users.some((user) => user.id === participantId))
          .slice(0, 6)
          .map(([participantId, participantName]) => ({
            id: participantId,
            label: participantName,
            hasPresenceDot: true,
            compactLabel: participantName.slice(0, 2).toUpperCase()
          }))
      ]
    },
    {
      id: 'apps',
      title: 'Aplicaciones',
      items: [
        { id: 'app-github', label: 'GitHub', leadingIcon: '◆' },
        { id: 'app-jira', label: 'Jira', leadingIcon: '◈' },
        { id: 'app-figma', label: 'Figma', leadingIcon: '◉' }
      ]
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
    searchPlaceholder: `Buscar ${input.workspaceName}`,
    workspaces: [
      {
        id: 'workspace-main',
        label: input.workspaceName,
        shortName: input.workspaceName.slice(0, 2).toUpperCase(),
        accentColor: '#0E7A9E',
        isActive: true
      },
      {
        id: 'workspace-infra',
        label: 'Infra Ops',
        shortName: 'IO',
        accentColor: '#2563EB'
      },
      {
        id: 'workspace-labs',
        label: 'Dev Labs',
        shortName: 'DL',
        accentColor: '#D97706'
      }
    ],
    sidebarSections,
    channelName: selectedChannelName,
    channelDescription: input.presence
      ? `${input.presence.online_count} usuarios online en este canal`
      : 'Canal sincronizado con backend FastAPI',
    channelTabs: [
      { id: 'tab-messages', label: 'Mensajes', leadingIcon: '◫', isActive: true },
      { id: 'tab-files', label: 'Archivos', leadingIcon: '▤' },
      { id: 'tab-workflow', label: 'Flujos', leadingIcon: '⇄' },
      { id: 'tab-bookmarks', label: 'Marcadores', leadingIcon: '☆' }
    ],
    notices,
    messages: mapMessages(input.historyMessages, input.events, resolvedAuthorNameById, selectedChannelName),
    composerPlaceholder: `Enviar mensaje a #${selectedChannelName}`,
    composerTools: [
      { id: 'tool-bolt', label: 'Quick actions', icon: '⚡' },
      { id: 'tool-bold', label: 'Bold', icon: 'B' },
      { id: 'tool-italic', label: 'Italic', icon: 'I' },
      { id: 'tool-strike', label: 'Strike', icon: 'S' },
      { id: 'tool-code', label: 'Code', icon: '</>' },
      { id: 'tool-list', label: 'List', icon: '≣' },
      { id: 'tool-link', label: 'Link', icon: '🔗' }
    ],
    infoPanel: {
      title: 'Información',
      subtitle: `#${selectedChannelName}`,
      actions: [
        { id: 'info-add', label: 'Añadir', icon: '⊕' },
        { id: 'info-search', label: 'Buscar', icon: '⌕' },
        { id: 'info-call', label: 'Llamar', icon: '◔' },
        { id: 'info-more', label: 'Más', icon: '⋯' }
      ],
      aboutTopic: `#${selectedChannelName}`,
      aboutDescription:
        'Canal de coordinacion developer para decisiones tecnicas, seguimiento y despliegues.',
      membersCount: Math.max(input.users.length, 1),
      createdAtLabel: 'Creado el 18 de octubre de 2019',
      organizationsCount: 3
    },
    topBarAvatars,
    density: input.density,
    sidebarCollapsed: input.sidebarCollapsed,
    hideWorkspaceRailOnNarrow: true,
    draftMessage: input.draftMessage,
    onDraftMessageChange: input.onDraftMessageChange,
    onSendMessage: input.onSendMessage,
    onSidebarItemSelect: input.onSidebarItemSelect,
    onQuickCreateChannel: input.onQuickCreateChannel
  }
}
