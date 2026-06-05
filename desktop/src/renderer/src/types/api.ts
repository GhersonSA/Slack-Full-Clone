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

export interface CreateUserPayload {
  username: string
  display_name: string
}

export interface CreateChannelPayload {
  name: string
  topic?: string
  is_private?: boolean
}
