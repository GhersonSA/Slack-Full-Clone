export type LayoutDensity = 'compact' | 'comfortable'

export type AvatarItem = {
  id: string
  label: string
  imageUrl?: string
  accentColor?: string
  hasOnlineIndicator?: boolean
}

export type WorkspaceItem = {
  id: string
  label: string
  shortName: string
  accentColor?: string
  isActive?: boolean
}

export type SidebarItem = {
  id: string
  label: string
  isActive?: boolean
  isBold?: boolean
  prefix?: string
  leadingIcon?: string
  trailingText?: string
  unreadCount?: number
  hasPresenceDot?: boolean
  compactLabel?: string
}

export type SidebarSection = {
  id: string
  title?: string
  items: SidebarItem[]
}

export type ChatMessage = {
  id: string
  author: string
  timestamp: string
  content: string
  avatarLabel?: string
  accentColor?: string
  reactions?: Array<{ emoji: string; count: number }>
}

export type ChannelTab = {
  id: string
  label: string
  isActive?: boolean
  leadingIcon?: string
}

export type ChatNoticeCard = {
  id: string
  title: string
  subtitle: string
  leadingEmoji?: string
}

export type ComposerTool = {
  id: string
  label: string
  icon: string
}
