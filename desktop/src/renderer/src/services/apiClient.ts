import type {
  AddChannelMemberPayload,
  Channel,
  ChannelMember,
  CreateChannelPayload,
  CreateUserPayload,
  Message,
  User
} from '@renderer/types/api'

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as { detail?: string }
      if (payload.detail) {
        message = payload.detail
      }
    } catch {
      // no-op: keep default message
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private api(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}/api/v1${path}`
  }

  listUsers(): Promise<User[]> {
    return requestJson<User[]>(this.api('/users'))
  }

  createUser(payload: CreateUserPayload): Promise<User> {
    return requestJson<User>(this.api('/users'), {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  listChannels(): Promise<Channel[]> {
    return requestJson<Channel[]>(this.api('/channels'))
  }

  createChannel(payload: CreateChannelPayload): Promise<Channel> {
    return requestJson<Channel>(this.api('/channels'), {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  addMemberToChannel(channelId: string, payload: AddChannelMemberPayload): Promise<ChannelMember> {
    return requestJson<ChannelMember>(this.api(`/channels/${channelId}/members`), {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  listMessages(channelId: string): Promise<Message[]> {
    return requestJson<Message[]>(this.api(`/channels/${channelId}/messages`))
  }
}
