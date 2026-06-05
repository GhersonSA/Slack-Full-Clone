import { useEffect, useMemo, useState } from 'react'

import { useChannelWebSocket } from '@renderer/hooks/useChannelWebSocket'

function App(): React.JSX.Element {
  const [apiInfo, setApiInfo] = useState('Loading runtime info...')
  const [wsBaseUrl, setWsBaseUrl] = useState('')
  const [channelId, setChannelId] = useState('')
  const [userId, setUserId] = useState('')
  const [draftMessage, setDraftMessage] = useState('')

  useEffect(() => {
    const loadDesktopContext = async (): Promise<void> => {
      const [info, runtime] = await Promise.all([window.api.getAppInfo(), window.api.getRuntimeConfig()])

      setApiInfo(`${info.appName} v${info.appVersion} | Electron ${info.electronVersion}`)
      setWsBaseUrl(runtime.wsBaseUrl)
    }

    void loadDesktopContext()
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Slack Full Clone Desktop</h1>
        <p className="text-sm text-slate-600">{apiInfo}</p>
      </header>

      <section className="grid gap-4 rounded border border-slate-200 p-4">
        <h2 className="text-lg font-medium">Desktop Runtime Configuration</h2>
        <p className="text-sm">WebSocket base URL: {wsBaseUrl || 'pending...'}</p>
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
