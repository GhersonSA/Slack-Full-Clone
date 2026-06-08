import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useChannelWebSocket } from '@renderer/hooks/useChannelWebSocket'

class MockWebSocket {
  static instances: MockWebSocket[] = []
  static OPEN = 1

  url: string
  readyState = 0
  sentMessages: string[] = []

  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string): void {
    this.sentMessages.push(data)
  }

  close(): void {
    this.readyState = 3
    this.onclose?.({} as CloseEvent)
  }

  emitOpen(): void {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.({} as Event)
  }

  emitMessage(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent)
  }

  emitUnexpectedClose(): void {
    this.readyState = 3
    this.onclose?.({} as CloseEvent)
  }
}

describe('useChannelWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('connects and sends message when websocket is open', async () => {
    const { result } = renderHook(() =>
      useChannelWebSocket({
        wsBaseUrl: 'ws://127.0.0.1:8000',
        channelId: 'channel-1',
        userId: 'user-1'
      })
    )

    act(() => {
      result.current.connect()
    })

    const socket = MockWebSocket.instances[0]
    expect(socket.url).toContain('/api/v1/realtime/ws/channels/channel-1')

    act(() => {
      socket.emitOpen()
    })

    expect(result.current.status).toBe('connected')

    let sent = false
    act(() => {
      sent = result.current.sendMessage('hello websocket')
    })

    expect(sent).toBe(true)
    expect(socket.sentMessages).toContain('{"type":"message","body":"hello websocket"}')
  })

  it('reconnects with backoff when disconnected unexpectedly', async () => {
    const { result } = renderHook(() =>
      useChannelWebSocket({
        wsBaseUrl: 'ws://127.0.0.1:8000',
        channelId: 'channel-2',
        userId: 'user-2'
      })
    )

    act(() => {
      result.current.connect()
    })

    const firstSocket = MockWebSocket.instances[0]
    act(() => {
      firstSocket.emitOpen()
    })

    expect(result.current.status).toBe('connected')

    act(() => {
      firstSocket.emitUnexpectedClose()
    })

    expect(result.current.status).toBe('reconnecting')
    expect(result.current.retryAttempt).toBe(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(MockWebSocket.instances.length).toBe(2)
  })

  it('returns false when sending without an open connection', () => {
    const { result } = renderHook(() =>
      useChannelWebSocket({
        wsBaseUrl: 'ws://127.0.0.1:8000',
        channelId: 'channel-3',
        userId: 'user-3'
      })
    )

    const sent = result.current.sendMessage('hello')
    expect(sent).toBe(false)
  })
})
