import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@renderer/App'
import { useChannelWebSocket } from '@renderer/hooks/useChannelWebSocket'

vi.mock('@renderer/hooks/useChannelWebSocket', () => ({
  useChannelWebSocket: vi.fn()
}))

const mockedUseChannelWebSocket = vi.mocked(useChannelWebSocket)

function jsonResponse(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload
  } as Response
}

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'api', {
      writable: true,
      value: {
        getAppInfo: vi.fn().mockResolvedValue({
          appName: 'Slack Desktop',
          appVersion: '1.0.0',
          electronVersion: '39.0.0',
          chromiumVersion: '139.0.0',
          nodeVersion: '20.0.0',
          platform: 'win32'
        }),
        getRuntimeConfig: vi.fn().mockResolvedValue({
          apiBaseUrl: 'http://127.0.0.1:8000',
          wsBaseUrl: 'ws://127.0.0.1:8000'
        })
      }
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders websocket presence information when presence event exists', async () => {
    mockedUseChannelWebSocket.mockReturnValue({
      status: 'connected',
      events: [
        {
          type: 'presence',
          channel_id: 'channel-1',
          online_count: 3,
          online_user_ids: ['user-a', 'user-b', 'user-c']
        }
      ],
      retryAttempt: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendMessage: vi.fn().mockReturnValue(true),
      sendPing: vi.fn().mockReturnValue(true)
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/v1/users')) {
        return jsonResponse([])
      }
      if (url.endsWith('/api/v1/channels')) {
        return jsonResponse([])
      }
      return jsonResponse({ detail: 'Not Found' }, false, 404)
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Online en canal:/).textContent).toContain('Online en canal: 3')
    })

    expect(screen.getByText(/Usuarios online:/).textContent).toContain('user-a, user-b, user-c')
  })

  it('uses REST fallback when websocket sendMessage returns false', async () => {
    const sendMessage = vi.fn().mockReturnValue(false)

    mockedUseChannelWebSocket.mockReturnValue({
      status: 'connected',
      events: [],
      retryAttempt: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendMessage,
      sendPing: vi.fn().mockReturnValue(true)
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()

      if (url.endsWith('/api/v1/users') && !init?.method) {
        return jsonResponse([])
      }
      if (url.endsWith('/api/v1/channels') && !init?.method) {
        return jsonResponse([])
      }
      if (url.endsWith('/api/v1/realtime/channels/channel-1/presence') && !init?.method) {
        return jsonResponse({
          channel_id: 'channel-1',
          online_count: 0,
          online_user_ids: []
        })
      }
      if (url.endsWith('/api/v1/channels/channel-1/messages') && init?.method === 'POST') {
        return jsonResponse({
          id: 'message-1',
          channel_id: 'channel-1',
          author_id: 'user-1',
          body: 'hola fallback',
          created_at: '2026-06-08T10:00:00Z'
        })
      }
      if (url.endsWith('/api/v1/channels/channel-1/messages') && !init?.method) {
        return jsonResponse([
          {
            id: 'message-1',
            channel_id: 'channel-1',
            author_id: 'user-1',
            body: 'hola fallback',
            created_at: '2026-06-08T10:00:00Z'
          }
        ])
      }

      return jsonResponse({ detail: 'Unhandled URL' }, false, 404)
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/API base URL:/).textContent).toContain('http://127.0.0.1:8000')
    })

    fireEvent.change(screen.getAllByPlaceholderText('UUID del canal')[0], {
      target: { value: 'channel-1' }
    })
    fireEvent.change(screen.getAllByPlaceholderText('UUID del usuario')[0], {
      target: { value: 'user-1' }
    })
    fireEvent.change(screen.getByPlaceholderText('Mensaje de prueba'), {
      target: { value: 'hola fallback' }
    })

    fireEvent.click(screen.getByText('Enviar'))

    await waitFor(() => {
      expect(screen.getByText(/Mensaje enviado por fallback REST/)).toBeTruthy()
    })

    expect(sendMessage).toHaveBeenCalledWith('hola fallback')
    expect(screen.getByText('hola fallback')).toBeTruthy()
  })

  it('joins channel and refreshes presence via REST', async () => {
    mockedUseChannelWebSocket.mockReturnValue({
      status: 'disconnected',
      events: [],
      retryAttempt: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendMessage: vi.fn().mockReturnValue(false),
      sendPing: vi.fn().mockReturnValue(false)
    })

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()

        if (url.endsWith('/api/v1/users') && !init?.method) {
          return jsonResponse([])
        }
        if (url.endsWith('/api/v1/channels') && !init?.method) {
          return jsonResponse([])
        }
        if (url.endsWith('/api/v1/channels/channel-join/members') && init?.method === 'POST') {
          return jsonResponse({
            channel_id: 'channel-join',
            user_id: 'user-join',
            joined_at: '2026-06-08T10:00:00Z'
          })
        }
        if (url.endsWith('/api/v1/realtime/channels/channel-join/presence') && !init?.method) {
          return jsonResponse({
            channel_id: 'channel-join',
            online_count: 1,
            online_user_ids: ['user-join']
          })
        }

        return jsonResponse({ detail: 'Unhandled URL' }, false, 404)
      })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/API base URL:/).textContent).toContain('http://127.0.0.1:8000')
    })

    fireEvent.change(screen.getAllByPlaceholderText('UUID del canal')[0], {
      target: { value: 'channel-join' }
    })
    fireEvent.change(screen.getAllByPlaceholderText('UUID del usuario')[0], {
      target: { value: 'user-join' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Unir usuario al canal' }))

    await waitFor(() => {
      expect(screen.getByText(/Usuario agregado al canal/)).toBeTruthy()
    })
    expect(screen.getByText(/Online en canal:/).textContent).toContain('Online en canal: 1')
    expect(screen.getByText(/Usuarios online:/).textContent).toContain('user-join')

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/channels/channel-join/members',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('loads history messages using REST control action', async () => {
    mockedUseChannelWebSocket.mockReturnValue({
      status: 'connected',
      events: [],
      retryAttempt: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendMessage: vi.fn().mockReturnValue(true),
      sendPing: vi.fn().mockReturnValue(true)
    })

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()

        if (url.endsWith('/api/v1/users') && !init?.method) {
          return jsonResponse([])
        }
        if (url.endsWith('/api/v1/channels') && !init?.method) {
          return jsonResponse([])
        }
        if (url.endsWith('/api/v1/realtime/channels/channel-history/presence') && !init?.method) {
          return jsonResponse({
            channel_id: 'channel-history',
            online_count: 0,
            online_user_ids: []
          })
        }
        if (url.endsWith('/api/v1/channels/channel-history/messages') && !init?.method) {
          return jsonResponse([
            {
              id: 'message-history-1',
              channel_id: 'channel-history',
              author_id: 'user-history',
              body: 'mensaje desde historial',
              created_at: '2026-06-08T10:00:00Z'
            }
          ])
        }

        return jsonResponse({ detail: 'Unhandled URL' }, false, 404)
      })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/API base URL:/).textContent).toContain('http://127.0.0.1:8000')
    })

    fireEvent.change(screen.getAllByPlaceholderText('UUID del canal')[0], {
      target: { value: 'channel-history' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cargar historial REST' }))

    await waitFor(() => {
      expect(screen.getByText(/Historial cargado: 1 mensajes/)).toBeTruthy()
    })

    expect(screen.getByText('mensaje desde historial')).toBeTruthy()
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/channels/channel-history/messages',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )
  })
})
