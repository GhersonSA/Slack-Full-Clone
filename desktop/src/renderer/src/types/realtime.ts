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

export interface ChatEventPresence {
  type: 'presence'
  channel_id: string
  online_count: number
  online_user_ids: string[]
}

export type ChatEvent = ChatEventMessage | ChatEventSystem | ChatEventPresence
