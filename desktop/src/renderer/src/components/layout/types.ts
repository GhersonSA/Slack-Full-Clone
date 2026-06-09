export type AvatarItem = {
  id: string
  label: string
  imageUrl?: string
  accentColor?: string
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
}
