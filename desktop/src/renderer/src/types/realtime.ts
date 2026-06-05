export interface ChatEventMessage {
  type: 'message'
  id: string
  channel_id: string
  author_id: string
  body: string
  created_at: string
}

export interface ChatEventSystem {
  type: 'system' | 'pong' | 'error'
  detail: string
}

export type ChatEvent = ChatEventMessage | ChatEventSystem
