import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ChatEvent } from '@renderer/types/realtime'

interface UseChannelWebSocketParams {
  wsBaseUrl: string
  channelId: string
  userId: string
}

interface UseChannelWebSocketResult {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
  events: ChatEvent[]
  connect: () => void
  disconnect: () => void
  sendMessage: (body: string) => void
  sendPing: () => void
}

export function useChannelWebSocket({
  wsBaseUrl,
  channelId,
  userId
}: UseChannelWebSocketParams): UseChannelWebSocketResult {
  const socketRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState<UseChannelWebSocketResult['status']>('idle')
  const [events, setEvents] = useState<ChatEvent[]>([])

  const wsUrl = useMemo(() => {
    if (!wsBaseUrl || !channelId || !userId) {
      return ''
    }

    const base = wsBaseUrl.replace(/\/$/, '')
    return `${base}/api/v1/realtime/ws/channels/${encodeURIComponent(channelId)}?user_id=${encodeURIComponent(userId)}`
  }, [wsBaseUrl, channelId, userId])

  const disconnect = useCallback(() => {
    if (!socketRef.current) {
      return
    }

    socketRef.current.close()
    socketRef.current = null
    setStatus('disconnected')
  }, [])

  const connect = useCallback(() => {
    if (!wsUrl || socketRef.current) {
      return
    }

    setStatus('connecting')

    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onopen = () => {
      setStatus('connected')
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
      setStatus('disconnected')
    }
  }, [wsUrl])

  const sendMessage = useCallback((body: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'message',
        body
      })
    )
  }, [])

  const sendPing = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    socketRef.current.send(JSON.stringify({ type: 'ping' }))
  }, [])

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  return {
    status,
    events,
    connect,
    disconnect,
    sendMessage,
    sendPing
  }
}
