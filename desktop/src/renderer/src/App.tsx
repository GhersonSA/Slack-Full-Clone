import { useEffect, useMemo, useState } from 'react'

import { useChannelWebSocket } from '@renderer/hooks/useChannelWebSocket'
import { ApiClient } from '@renderer/services/apiClient'
import type { Channel, User } from '@renderer/types/api'

function App(): React.JSX.Element {
  const [apiInfo, setApiInfo] = useState('Loading runtime info...')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [wsBaseUrl, setWsBaseUrl] = useState('')
  const [channelId, setChannelId] = useState('')
  const [userId, setUserId] = useState('')
  const [draftMessage, setDraftMessage] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [channelName, setChannelName] = useState('')
  const [channelTopic, setChannelTopic] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [feedback, setFeedback] = useState('')

  const apiClient = useMemo(() => {
    if (!apiBaseUrl) {
      return null
    }
    return new ApiClient(apiBaseUrl)
  }, [apiBaseUrl])

  const refreshCatalogs = async (client: ApiClient): Promise<void> => {
    const [nextUsers, nextChannels] = await Promise.all([client.listUsers(), client.listChannels()])
    setUsers(nextUsers)
    setChannels(nextChannels)
  }

  useEffect(() => {
    const loadDesktopContext = async (): Promise<void> => {
      const [info, runtime] = await Promise.all([window.api.getAppInfo(), window.api.getRuntimeConfig()])

      setApiInfo(`${info.appName} v${info.appVersion} | Electron ${info.electronVersion}`)
      setApiBaseUrl(runtime.apiBaseUrl)
      setWsBaseUrl(runtime.wsBaseUrl)

      const client = new ApiClient(runtime.apiBaseUrl)
      await refreshCatalogs(client)
    }

    void loadDesktopContext().catch((error: Error) => {
      setFeedback(`Error cargando contexto: ${error.message}`)
    })
  }, [])

  const canConnect = useMemo(() => {
    return wsBaseUrl.length > 0 && channelId.length > 0 && userId.length > 0
  }, [wsBaseUrl, channelId, userId])

  const { status, events, connect, disconnect, sendMessage, sendPing } = useChannelWebSocket({
    wsBaseUrl,
    channelId,
    userId
  })

  const handleSendMessage = (): void => {
    if (!draftMessage.trim()) {
      return
    }

    sendMessage(draftMessage.trim())
    setDraftMessage('')
  }

  const handleCreateUser = async (): Promise<void> => {
    if (!apiClient || !username.trim() || !displayName.trim()) {
      return
    }

    try {
      const created = await apiClient.createUser({
        username: username.trim(),
        display_name: displayName.trim()
      })

      setFeedback(`Usuario creado: ${created.username}`)
      setUsername('')
      setDisplayName('')
      setUserId(created.id)
      await refreshCatalogs(apiClient)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible crear usuario')
    }
  }

  const handleCreateChannel = async (): Promise<void> => {
    if (!apiClient || !channelName.trim()) {
      return
    }

    try {
      const created = await apiClient.createChannel({
        name: channelName.trim(),
        topic: channelTopic.trim() ? channelTopic.trim() : undefined
      })

      setFeedback(`Canal creado: ${created.name}`)
      setChannelName('')
      setChannelTopic('')
      setChannelId(created.id)
      await refreshCatalogs(apiClient)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible crear canal')
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Slack Full Clone Desktop</h1>
        <p className="text-sm text-slate-600">{apiInfo}</p>
      </header>

      <section className="grid gap-4 rounded border border-slate-200 p-4">
        <h2 className="text-lg font-medium">Desktop Runtime Configuration</h2>
        <p className="text-sm">API base URL: {apiBaseUrl || 'pending...'}</p>
        <p className="text-sm">WebSocket base URL: {wsBaseUrl || 'pending...'}</p>
        <p className="text-sm text-slate-700">{feedback || 'Sin novedades'}</p>
      </section>

      <section className="grid gap-4 rounded border border-slate-200 p-4">
        <h2 className="text-lg font-medium">REST Setup (Usuarios y Canales)</h2>

        <article className="grid gap-3">
          <h3 className="text-sm font-semibold">Crear usuario</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="username"
            />
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="display name"
            />
          </div>
          <button className="w-fit rounded border border-slate-400 px-3 py-2 text-sm" onClick={handleCreateUser}>
            Crear usuario
          </button>
        </article>

        <article className="grid gap-3">
          <h3 className="text-sm font-semibold">Crear canal</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={channelName}
              onChange={(event) => setChannelName(event.target.value)}
              placeholder="nombre del canal"
            />
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={channelTopic}
              onChange={(event) => setChannelTopic(event.target.value)}
              placeholder="topic opcional"
            />
          </div>
          <button className="w-fit rounded border border-slate-400 px-3 py-2 text-sm" onClick={handleCreateChannel}>
            Crear canal
          </button>
        </article>

        <article className="grid gap-2">
          <h3 className="text-sm font-semibold">Usuarios disponibles</h3>
          <ul className="grid gap-2 text-xs">
            {users.length === 0 ? <li>No hay usuarios aún.</li> : null}
            {users.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
                <span>
                  {item.username} ({item.display_name})
                </span>
                <button
                  className="rounded border border-slate-300 px-2 py-1"
                  onClick={() => setUserId(item.id)}
                >
                  Usar ID
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="grid gap-2">
          <h3 className="text-sm font-semibold">Canales disponibles</h3>
          <ul className="grid gap-2 text-xs">
            {channels.length === 0 ? <li>No hay canales aún.</li> : null}
            {channels.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
                <span>
                  {item.name} {item.topic ? `- ${item.topic}` : ''}
                </span>
                <button
                  className="rounded border border-slate-300 px-2 py-1"
                  onClick={() => setChannelId(item.id)}
                >
                  Usar ID
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-3 rounded border border-slate-200 p-4">
        <h2 className="text-lg font-medium">WebSocket Session Controls</h2>
        <label className="grid gap-1 text-sm">
          Channel ID
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={channelId}
            onChange={(event) => setChannelId(event.target.value)}
            placeholder="UUID del canal"
          />
        </label>

        <label className="grid gap-1 text-sm">
          User ID
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="UUID del usuario"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded border border-slate-400 px-3 py-2 text-sm disabled:opacity-50"
            onClick={connect}
            disabled={!canConnect}
          >
            Conectar
          </button>
          <button className="rounded border border-slate-400 px-3 py-2 text-sm" onClick={disconnect}>
            Desconectar
          </button>
          <button className="rounded border border-slate-400 px-3 py-2 text-sm" onClick={sendPing}>
            Ping
          </button>
        </div>

        <p className="text-sm">Estado del socket: {status}</p>
      </section>

      <section className="grid gap-3 rounded border border-slate-200 p-4">
        <h2 className="text-lg font-medium">Aquí va el chat</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-slate-300 px-3 py-2"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder="Mensaje de prueba"
          />
          <button className="rounded border border-slate-400 px-3 py-2 text-sm" onClick={handleSendMessage}>
            Enviar
          </button>
        </div>

        <article className="rounded border border-slate-200 p-3">
          <h3 className="mb-2 text-sm font-medium">Eventos del WebSocket</h3>
          <ul className="grid gap-2 text-xs">
            {events.length === 0 ? <li>No hay eventos aún.</li> : null}
            {events.map((event, index) => (
              <li key={`${event.type}-${index}`} className="rounded bg-slate-50 p-2">
                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(event, null, 2)}</pre>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default App
