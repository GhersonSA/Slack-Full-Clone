import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiClient } from '@renderer/services/apiClient'

describe('ApiClient', () => {
  const client = new ApiClient('http://127.0.0.1:8000')

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends createMessage request with correct URL and payload', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'message-1',
        channel_id: 'channel-1',
        author_id: 'user-1',
        body: 'hello',
        created_at: '2026-06-08T10:00:00Z'
      })
    } as Response)

    const result = await client.createMessage('channel-1', {
      author_id: 'user-1',
      body: 'hello'
    })

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/api/v1/channels/channel-1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author_id: 'user-1',
        body: 'hello'
      })
    })
    expect(result.body).toBe('hello')
  })

  it('returns detail message when API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'User is not a channel member' })
    } as Response)

    await expect(
      client.createMessage('channel-1', {
        author_id: 'user-1',
        body: 'hello'
      })
    ).rejects.toThrow('User is not a channel member')
  })

  it('calls presence endpoint with expected URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        channel_id: 'channel-1',
        online_count: 2,
        online_user_ids: ['user-1', 'user-2']
      })
    } as Response)

    const result = await client.getPresence('channel-1')

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/api/v1/realtime/channels/channel-1/presence', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    expect(result.online_count).toBe(2)
  })
})
