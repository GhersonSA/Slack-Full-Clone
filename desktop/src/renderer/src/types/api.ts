export interface User {
  id: string
  username: string
  display_name: string
}

export interface Channel {
  id: string
  name: string
  topic: string | null
  is_private: boolean
}

export interface ChannelMember {
  id: string
  channel_id: string
  user_id: string
}

export interface Message {
  id: string
  channel_id: string
  author_id: string
  body: string
}

export interface CreateUserPayload {
  username: string
  display_name: string
}

export interface CreateChannelPayload {
  name: string
  topic?: string
  is_private?: boolean
}

export interface AddChannelMemberPayload {
  user_id: string
}
