import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ChatEvent } from '@renderer/types/realtime'

const MAX_RECONNECT_DELAY_MS = 5000

interface UseChannelWebSocketParams {
  wsBaseUrl: string
  channelId: string
  userId: string
}

interface UseChannelWebSocketResult {
  status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  events: ChatEvent[]
  retryAttempt: number
  connect: () => void
  disconnect: () => void
  sendMessage: (body: string) => boolean
  sendPing: () => boolean
}

export function useChannelWebSocket({
  wsBaseUrl,
  channelId,
  userId
}: UseChannelWebSocketParams): UseChannelWebSocketResult {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldReconnectRef = useRef(false)
  const isIntentionalCloseRef = useRef(false)
  const [status, setStatus] = useState<UseChannelWebSocketResult['status']>('idle')
  const [events, setEvents] = useState<ChatEvent[]>([])
  const [retryAttempt, setRetryAttempt] = useState(0)

  const wsUrl = useMemo(() => {
    if (!wsBaseUrl || !channelId || !userId) {
      return ''
    }

    const base = wsBaseUrl.replace(/\/$/, '')
    return `${base}/api/v1/realtime/ws/channels/${encodeURIComponent(channelId)}?user_id=${encodeURIComponent(userId)}`
  }, [wsBaseUrl, channelId, userId])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const openSocket = useCallback(() => {
    if (!wsUrl || socketRef.current) {
      return
    }

    clearReconnectTimer()
    setStatus((current) => (current === 'reconnecting' ? 'reconnecting' : 'connecting'))

    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onopen = () => {
      setStatus('connected')
      setRetryAttempt(0)
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatEvent
        setEvents((current) => [...current, payload])
      } catch {
        setStatus('error')
      }
    }

    socket.onerror = () => {
      setStatus('error')
    }

    socket.onclose = () => {
      socketRef.current = null

      if (isIntentionalCloseRef.current) {
        isIntentionalCloseRef.current = false
        setStatus('disconnected')
        return
      }

      if (!shouldReconnectRef.current || !wsUrl) {
        setStatus('disconnected')
        return
      }

      setRetryAttempt((current) => {
        const nextAttempt = current + 1
        const delay = Math.min(1000 * 2 ** (nextAttempt - 1), MAX_RECONNECT_DELAY_MS)

        setStatus('reconnecting')
        reconnectTimerRef.current = setTimeout(() => {
          openSocket()
        }, delay)

        return nextAttempt
      })
    }
  }, [clearReconnectTimer, wsUrl])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    clearReconnectTimer()

    if (!socketRef.current) {
      setStatus('disconnected')
      return
    }

    isIntentionalCloseRef.current = true
    socketRef.current.close()
    socketRef.current = null
  }, [clearReconnectTimer])

  const connect = useCallback(() => {
    if (!wsUrl) {
      return
    }

    shouldReconnectRef.current = true
    isIntentionalCloseRef.current = false

    if (socketRef.current) {
      return
    }

    openSocket()
  }, [openSocket, wsUrl])

  const sendMessage = useCallback((body: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return false
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'message',
        body
      })
    )
    return true
  }, [])

  const sendPing = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return false
    }

    socketRef.current.send(JSON.stringify({ type: 'ping' }))
    return true
  }, [])

  useEffect(() => {
    shouldReconnectRef.current = false
    clearReconnectTimer()

    if (socketRef.current) {
      isIntentionalCloseRef.current = true
      socketRef.current.close()
      socketRef.current = null
    }

    setRetryAttempt(0)
    setStatus('idle')
  }, [clearReconnectTimer, wsUrl])

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false
      clearReconnectTimer()
      if (socketRef.current) {
        isIntentionalCloseRef.current = true
        socketRef.current.close()
      }
    }
  }, [clearReconnectTimer])

  return {
    status,
    events,
    retryAttempt,
    connect,
    disconnect,
    sendMessage,
    sendPing
  }
}
