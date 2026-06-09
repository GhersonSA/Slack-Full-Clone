import { describe, expect, it } from 'vitest'

import { mapToSlackLayoutProps } from './adapter'

describe('mapToSlackLayoutProps', () => {
  it('maps selected channel and messages into AppLayout contract', () => {
    const result = mapToSlackLayoutProps({
      workspaceName: 'Fiktion GmbH',
      users: [
        { id: 'u-1', username: 'lisa', display_name: 'Lisa' },
        { id: 'u-2', username: 'nikki', display_name: 'Nikki' }
      ],
      channels: [
        { id: 'c-1', name: 'soziale-medien', topic: null, is_private: false },
        { id: 'c-2', name: 'team-finanzen', topic: null, is_private: false }
      ],
      selectedChannelId: 'c-1',
      historyMessages: [
        {
          id: 'm-1',
          channel_id: 'c-1',
          author_id: 'u-1',
          body: 'Historico',
          created_at: '2026-01-01T10:00:00.000Z'
        }
      ],
      events: [
        {
          type: 'message',
          id: 'm-2',
          channel_id: 'c-1',
          author_id: 'u-2',
          body: 'Realtime',
          created_at: '2026-01-01T10:10:00.000Z'
        }
      ],
      presence: {
        channel_id: 'c-1',
        online_count: 1,
        online_user_ids: ['u-2']
      },
      feedback: 'Conectado',
      density: 'compact',
      sidebarCollapsed: true
    })

    expect(result.channelName).toBe('soziale-medien')
    expect(result.messages).toHaveLength(2)
    expect(result.notices[0]?.title).toBe('Conectado')
    expect(result.density).toBe('compact')
    expect(result.sidebarCollapsed).toBe(true)
  })

  it('falls back when selected channel is unknown', () => {
    const result = mapToSlackLayoutProps({
      workspaceName: 'Fiktion GmbH',
      users: [],
      channels: [],
      selectedChannelId: 'channel-x',
      historyMessages: [],
      events: [],
      presence: null,
      feedback: ''
    })

    expect(result.channelName).toBe('channel-')
    expect(result.notices).toHaveLength(0)
    expect(result.messages).toHaveLength(0)
  })
})
