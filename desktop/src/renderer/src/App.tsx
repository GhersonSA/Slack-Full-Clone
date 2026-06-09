import { useEffect, useMemo, useRef, useState } from 'react'

import { useChannelWebSocket } from '@renderer/hooks/useChannelWebSocket'
import { ApiClient } from '@renderer/services/apiClient'
import type { Channel, Message, Presence, User } from '@renderer/types/api'
import type { ChatEventPresence } from '@renderer/types/realtime'
import { SlackLayoutAdapter } from '@renderer/components/layout'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_WS_BASE_URL = 'ws://127.0.0.1:8000'

type DesktopApiBridge = {
  getAppInfo: () => Promise<{
    appName: string
    appVersion: string
    electronVersion: string
  }>
  getRuntimeConfig: () => Promise<{
    apiBaseUrl: string
    wsBaseUrl: string
  }>
}

type ElectronIpcBridge = {
  ipcRenderer?: {
    invoke?: (channel: string) => Promise<unknown>
  }
}

const LOCAL_PRIMARY_USERNAME = 'gherson.sanchez'
const LOCAL_PRIMARY_DISPLAY_NAME = 'Gherson Sánchez'

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
  const [historyMessages, setHistoryMessages] = useState<Message[]>([])
  const [localMessagesByChannel, setLocalMessagesByChannel] = useState<Record<string, Message[]>>({})
  const [restPresence, setRestPresence] = useState<Presence | null>(null)
  const [feedback, setFeedback] = useState('')
  const [sessionStatus, setSessionStatus] = useState('')
  const [runtimeMode, setRuntimeMode] = useState<'desktop' | 'web'>('desktop')
  const didBootstrapChatRef = useRef(false)
  const didSeedLocalFallbackRef = useRef(false)

  const layoutMode = import.meta.env.VITE_LAYOUT_MODE
  const isElectronRuntime = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false
    }

    return navigator.userAgent.includes('Electron')
  }, [])

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

  const makeLocalId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

  const cacheChannelMessages = (targetChannelId: string, messages: Message[]): void => {
    setLocalMessagesByChannel((current) => ({
      ...current,
      [targetChannelId]: messages
    }))
  }

  const toOperationalError = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
      const message = error.message.trim()
      if (message.toLowerCase().includes('failed to fetch')) {
        return 'Sin conexión con backend. Se activó modo local para continuar.'
      }
      return message || fallback
    }
    return fallback
  }

  const syncCatalogsWithStatus = async (
    client: ApiClient,
    mode: 'desktop' | 'web',
    apiBaseUrlForHealth: string
  ): Promise<void> => {
    try {
      await refreshCatalogs(client)
      if (mode === 'web') {
        setSessionStatus('Estado de la sesión actual: modo web (sin bridge de Electron)')
      } else {
        setSessionStatus('Estado de la sesión actual: desktop conectado')
      }
    } catch {
      setUsers([])
      setChannels([])

      let backendHealthy = false
      try {
        const healthResponse = await fetch(`${apiBaseUrlForHealth.replace(/\/$/, '')}/api/v1/health`)
        backendHealthy = healthResponse.ok
      } catch {
        backendHealthy = false
      }

      if (backendHealthy) {
        if (mode === 'web') {
          setSessionStatus(
            'Estado de la sesión actual: modo web, backend conectado (sincronización pendiente)'
          )
        } else {
          setSessionStatus('Estado de la sesión actual: desktop conectado (sincronización pendiente)')
        }
        return
      }

      if (mode === 'web') {
        setSessionStatus('Estado de la sesión actual: modo web, backend no disponible')
      } else {
        setSessionStatus('Estado de la sesión actual: desktop conectado, backend no disponible')
      }
    }
  }

  useEffect(() => {
    const loadDesktopContext = async (): Promise<void> => {
      const bridge = (window as Window & { api?: DesktopApiBridge }).api
      const electronBridge = (window as Window & { electron?: ElectronIpcBridge }).electron
      const invokeFromElectron = electronBridge?.ipcRenderer?.invoke

      if (bridge?.getAppInfo && bridge?.getRuntimeConfig) {
        setRuntimeMode('desktop')

        const [info, runtime] = await Promise.all([
          bridge.getAppInfo(),
          bridge.getRuntimeConfig()
        ])

        setApiInfo(`${info.appName} v${info.appVersion} | Electron ${info.electronVersion}`)
        setApiBaseUrl(runtime.apiBaseUrl)
        setWsBaseUrl(runtime.wsBaseUrl)

        const client = new ApiClient(runtime.apiBaseUrl)
        await syncCatalogsWithStatus(client, 'desktop', runtime.apiBaseUrl)
        return
      }

      if (invokeFromElectron) {
        setRuntimeMode('desktop')

        const [infoResult, runtimeResult] = await Promise.all([
          invokeFromElectron('app:get-info'),
          invokeFromElectron('app:get-runtime-config')
        ])

        const info = infoResult as {
          appName: string
          appVersion: string
          electronVersion: string
        }

        const runtime = runtimeResult as {
          apiBaseUrl: string
          wsBaseUrl: string
        }

        setApiInfo(`${info.appName} v${info.appVersion} | Electron ${info.electronVersion}`)
        setApiBaseUrl(runtime.apiBaseUrl)
        setWsBaseUrl(runtime.wsBaseUrl)

        const client = new ApiClient(runtime.apiBaseUrl)
        await syncCatalogsWithStatus(client, 'desktop', runtime.apiBaseUrl)
        return
      }

      const detectedMode: 'desktop' | 'web' = isElectronRuntime ? 'desktop' : 'web'
      setRuntimeMode(detectedMode)
      const fallbackApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
      const fallbackWsBaseUrl = import.meta.env.VITE_WS_BASE_URL ?? DEFAULT_WS_BASE_URL

      setApiInfo(
        isElectronRuntime
          ? 'Slack Full Clone vdev | Electron iniciado sin bridge custom'
          : 'Slack Full Clone vdev | Electron bridge no disponible'
      )
      setApiBaseUrl(fallbackApiBaseUrl)
      setWsBaseUrl(fallbackWsBaseUrl)
      const fallbackClient = new ApiClient(fallbackApiBaseUrl)
      await syncCatalogsWithStatus(fallbackClient, detectedMode, fallbackApiBaseUrl)
    }

    void loadDesktopContext().catch((error: Error) => {
      setSessionStatus(`Error cargando contexto: ${error.message}`)
    })
  }, [isElectronRuntime])

  useEffect(() => {
    if (!apiBaseUrl || !sessionStatus.includes('backend no disponible')) {
      return
    }

    const retryTimer = window.setInterval(() => {
      const client = new ApiClient(apiBaseUrl)
      void syncCatalogsWithStatus(client, runtimeMode, apiBaseUrl)
    }, 5000)

    return () => {
      window.clearInterval(retryTimer)
    }
  }, [apiBaseUrl, sessionStatus, runtimeMode])

  const canConnect = useMemo(() => {
    return wsBaseUrl.length > 0 && channelId.length > 0 && userId.length > 0
  }, [wsBaseUrl, channelId, userId])

  const { status, events, retryAttempt, connect, disconnect, sendMessage, sendPing } =
    useChannelWebSocket({
      wsBaseUrl,
      channelId,
      userId
    })

  useEffect(() => {
    if (layoutMode === 'legacy' || !canConnect) {
      return
    }

    if (status === 'connected' || status === 'connecting' || status === 'reconnecting') {
      return
    }

    connect()
  }, [layoutMode, canConnect, status, connect])

  const refreshPresence = async (targetChannelId: string): Promise<void> => {
    if (!apiClient || !targetChannelId) {
      setRestPresence(null)
      return
    }

    try {
      const payload = await apiClient.getPresence(targetChannelId)
      setRestPresence(payload)
    } catch {
      setRestPresence(null)
    }
  }

  const websocketPresence = useMemo(() => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index]
      if (event.type === 'presence') {
        const presenceEvent = event as ChatEventPresence
        if (!channelId || presenceEvent.channel_id === channelId) {
          return {
            channel_id: presenceEvent.channel_id,
            online_count: presenceEvent.online_count,
            online_user_ids: presenceEvent.online_user_ids
          } satisfies Presence
        }
      }
    }

    return null
  }, [events, channelId])

  const currentPresence = websocketPresence ?? restPresence

  useEffect(() => {
    if (!channelId && channels.length > 0) {
      setChannelId(channels[0].id)
    }
  }, [channels, channelId])

  useEffect(() => {
    if (!userId && users.length > 0) {
      setUserId(users[0].id)
    }
  }, [users, userId])

  useEffect(() => {
    if (layoutMode === 'legacy' || didSeedLocalFallbackRef.current) {
      return
    }

    if (users.length > 0 && channels.length > 0) {
      return
    }

    didSeedLocalFallbackRef.current = true

    const fallbackUser: User = {
      id: makeLocalId('user'),
      username: LOCAL_PRIMARY_USERNAME,
      display_name: LOCAL_PRIMARY_DISPLAY_NAME
    }

    const mockUsers: User[] = [
      fallbackUser,
      {
        id: makeLocalId('user'),
        username: 'laura.dev',
        display_name: 'Laura DevOps'
      },
      {
        id: makeLocalId('user'),
        username: 'matias.fe',
        display_name: 'Matias Frontend'
      },
      {
        id: makeLocalId('user'),
        username: 'felipe.be',
        display_name: 'Felipe Backend'
      },
      {
        id: makeLocalId('user'),
        username: 'camila.qa',
        display_name: 'Camila QA'
      },
      {
        id: makeLocalId('user'),
        username: 'nora.data',
        display_name: 'Nora Data'
      },
      {
        id: makeLocalId('user'),
        username: 'diego.sre',
        display_name: 'Diego SRE'
      },
      {
        id: makeLocalId('user'),
        username: 'ana.pm',
        display_name: 'Ana Product'
      }
    ]

    const mockChannels: Channel[] = [
      {
        id: makeLocalId('channel'),
        name: 'frontend-platform',
        topic: 'UI, componentes y experiencia del cliente',
        is_private: false
      },
      {
        id: makeLocalId('channel'),
        name: 'backend-api',
        topic: 'Servicios, contratos y observabilidad',
        is_private: false
      },
      {
        id: makeLocalId('channel'),
        name: 'devops-ci-cd',
        topic: 'Pipelines, despliegues y release notes',
        is_private: false
      },
      {
        id: makeLocalId('channel'),
        name: 'bug-triage',
        topic: 'Incidentes y priorizacion diaria',
        is_private: false
      },
      {
        id: makeLocalId('channel'),
        name: 'architecture-rfc',
        topic: 'Decision records y propuestas tecnicas',
        is_private: false
      },
      {
        id: makeLocalId('channel'),
        name: 'mobile-react-native',
        topic: 'App mobile, rendimiento y releases',
        is_private: false
      },
      {
        id: makeLocalId('channel'),
        name: 'security-appsec',
        topic: 'SAST, DAST y hardening',
        is_private: false
      },
      {
        id: makeLocalId('channel'),
        name: 'random-dev-memes',
        topic: 'Canal social del equipo developer',
        is_private: false
      },
      {
        id: makeLocalId('channel'),
        name: 'pair-programming',
        topic: 'Sesiones de pair y mentoring',
        is_private: false
      }
    ]

    const fallbackMessagesByChannel: Record<string, Message[]> = {
      [mockChannels[0].id]: [
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[0].id,
          author_id: mockUsers[2].id,
          body: 'Termine el refactor del sidebar para virtualizar listas grandes. Comparto PR en 10 min.',
          created_at: new Date(Date.now() - 1000 * 60 * 48).toISOString()
        },
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[0].id,
          author_id: mockUsers[4].id,
          body: 'QA reporta que el composer falla en pantallas pequenas. Ya deje video y pasos de reproduccion.',
          created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString()
        },
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[0].id,
          author_id: fallbackUser.id,
          body: 'Perfecto, lo tomo. Tambien active mocks visuales para validar UX sin backend.',
          created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString()
        },
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[0].id,
          author_id: mockUsers[1].id,
          body: 'Deploy dev completado. URL interna lista para pruebas de regresion.',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        }
      ],
      [mockChannels[1].id]: [
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[1].id,
          author_id: mockUsers[3].id,
          body: 'Abri endpoint /v2/messages con paginacion cursor. Falta documentar swagger.',
          created_at: new Date(Date.now() - 1000 * 60 * 39).toISOString()
        },
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[1].id,
          author_id: mockUsers[5].id,
          body: 'Metrica p95 estable en 180ms despues del ultimo deploy.',
          created_at: new Date(Date.now() - 1000 * 60 * 11).toISOString()
        }
      ],
      [mockChannels[2].id]: [
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[2].id,
          author_id: mockUsers[6].id,
          body: 'Pipeline nightly verde. Se actualizaron snapshots y tests e2e.',
          created_at: new Date(Date.now() - 1000 * 60 * 43).toISOString()
        },
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[2].id,
          author_id: fallbackUser.id,
          body: 'Agende release candidate para las 18:00 con rollback plan incluido.',
          created_at: new Date(Date.now() - 1000 * 60 * 17).toISOString()
        }
      ],
      [mockChannels[3].id]: [
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[3].id,
          author_id: mockUsers[4].id,
          body: 'Issue #482 reproducido en Windows + Electron. Prioridad alta para hoy.',
          created_at: new Date(Date.now() - 1000 * 60 * 27).toISOString()
        }
      ],
      [mockChannels[4].id]: [
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[4].id,
          author_id: fallbackUser.id,
          body: 'Propongo ADR para aislar el adapter de layout y desacoplar fuentes de datos.',
          created_at: new Date(Date.now() - 1000 * 60 * 21).toISOString()
        }
      ],
      [mockChannels[5].id]: [
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[5].id,
          author_id: mockUsers[2].id,
          body: 'React Native build 0.8.14 publicado en beta interna.',
          created_at: new Date(Date.now() - 1000 * 60 * 9).toISOString()
        }
      ],
      [mockChannels[6].id]: [
        {
          id: makeLocalId('msg'),
          channel_id: mockChannels[6].id,
          author_id: mockUsers[6].id,
          body: 'Dependencias auditadas. Sin criticos. Pendiente cerrar dos high en dev.',
          created_at: new Date(Date.now() - 1000 * 60 * 31).toISOString()
        }
      ],
      [mockChannels[7].id]: [],
      [mockChannels[8].id]: []
    }

    const mergedUsers = users.length > 0 ? users : mockUsers
    const mergedChannels = channels.length > 0 ? channels : mockChannels

    if (users.length === 0) {
      setUsers(mergedUsers)
    }

    if (channels.length === 0) {
      setChannels(mergedChannels)
    }

    const defaultChannelId = mergedChannels[0]?.id ?? ''
    const defaultUserId = mergedUsers[0]?.id ?? ''

    if (!defaultChannelId || !defaultUserId) {
      return
    }

    if (channels.length === 0) {
      const seededMessagesByChannel: Record<string, Message[]> = {
        ...fallbackMessagesByChannel
      }

      // Ensure every channel has an initialized bucket, even if empty.
      for (const channel of mergedChannels) {
        if (!seededMessagesByChannel[channel.id]) {
          seededMessagesByChannel[channel.id] = []
        }
      }

      setLocalMessagesByChannel(seededMessagesByChannel)
      setHistoryMessages(seededMessagesByChannel[defaultChannelId] ?? [])
    }

    setUserId(defaultUserId)
    setChannelId(defaultChannelId)
    setSessionStatus('Estado de la sesión actual: desktop conectado (modo local)')
  }, [layoutMode, users, channels])

  useEffect(() => {
    if (layoutMode === 'legacy' || !apiClient || channels.length === 0) {
      return
    }

    if (didBootstrapChatRef.current) {
      return
    }

    didBootstrapChatRef.current = true

    const bootstrapChatContext = async (): Promise<void> => {
      try {
        let resolvedUserId = userId
        let resolvedChannelId = channelId

        if (!resolvedUserId) {
          if (users.length > 0) {
            resolvedUserId = users[0].id
          } else {
            const generatedSuffix = Date.now().toString().slice(-6)
            const createdUser = await apiClient.createUser({
              username: `desktop-${generatedSuffix}`,
              display_name: 'Desktop User'
            })
            resolvedUserId = createdUser.id
          }
        }

        if (!resolvedChannelId) {
          resolvedChannelId = channels[0].id
        }

        if (!resolvedUserId || !resolvedChannelId) {
          return
        }

        setUserId(resolvedUserId)
        setChannelId(resolvedChannelId)

        try {
          await apiClient.addMemberToChannel(resolvedChannelId, { user_id: resolvedUserId })
        } catch (error) {
          const detail = error instanceof Error ? error.message : ''
          if (!detail.includes('already a member')) {
            throw error
          }
        }

        const [history] = await Promise.all([
          apiClient.listMessages(resolvedChannelId),
          refreshPresence(resolvedChannelId)
        ])
        setHistoryMessages(history)
      } catch (error) {
          setFeedback(toOperationalError(error, 'No fue posible inicializar el chat'))
      }
    }

    void bootstrapChatContext()
  }, [
    apiClient,
    channelId,
    channels,
    layoutMode,
    refreshPresence,
    userId,
    users
  ])

  const workspaceName = useMemo(() => {
    if (!apiInfo || apiInfo === 'Loading runtime info...') {
      return 'Slack Full Clone'
    }

    const separatorIndex = apiInfo.indexOf(' v')
    if (separatorIndex <= 0) {
      return apiInfo
    }

    return apiInfo.slice(0, separatorIndex)
  }, [apiInfo])

  const handleSendMessage = async (): Promise<void> => {
    try {
      if (!draftMessage.trim()) {
        return
      }

      let resolvedUserId = userId
      let resolvedChannelId = channelId
      const messageBody = draftMessage.trim()

      if (!resolvedUserId) {
        if (users.length > 0) {
          resolvedUserId = users[0].id
        } else if (apiClient) {
          const generatedSuffix = Date.now().toString().slice(-6)
          const createdUser = await apiClient.createUser({
            username: `desktop${generatedSuffix}`,
            display_name: 'Desktop User'
          })
          resolvedUserId = createdUser.id
          await refreshCatalogs(apiClient)
        } else {
          const fallbackUser: User = {
            id: makeLocalId('user'),
            username: LOCAL_PRIMARY_USERNAME,
            display_name: LOCAL_PRIMARY_DISPLAY_NAME
          }
          resolvedUserId = fallbackUser.id
          setUsers((current) => [...current, fallbackUser])
        }
        setUserId(resolvedUserId)
      }

      if (!resolvedChannelId) {
        if (channels.length > 0) {
          resolvedChannelId = channels[0].id
        } else if (apiClient) {
          try {
            const createdChannel = await apiClient.createChannel({
              name: 'general',
              topic: 'Canal sincronizado con backend FastAPI'
            })
            resolvedChannelId = createdChannel.id
          } catch {
            const refreshedChannels = await apiClient.listChannels()
            const preferred = refreshedChannels.find((channel) => channel.name === 'general')
            resolvedChannelId = preferred?.id ?? refreshedChannels[0]?.id ?? ''
          }
          await refreshCatalogs(apiClient)
        } else {
          const fallbackChannel: Channel = {
            id: makeLocalId('channel'),
            name: 'general',
            topic: 'Canal demo local activo',
            is_private: false
          }
          resolvedChannelId = fallbackChannel.id
          setChannels((current) => [...current, fallbackChannel])
        }
        setChannelId(resolvedChannelId)
      }

      if (!resolvedUserId || !resolvedChannelId) {
        setFeedback('No fue posible inicializar usuario/canal para enviar mensajes')
        return
      }

      if (layoutMode !== 'legacy' && apiClient) {
        try {
          try {
            await apiClient.addMemberToChannel(resolvedChannelId, { user_id: resolvedUserId })
          } catch (error) {
            const detail = error instanceof Error ? error.message : ''
            if (!detail.includes('already a member')) {
              throw error
            }
          }

          await apiClient.createMessage(resolvedChannelId, {
            author_id: resolvedUserId,
            body: messageBody
          })
          const history = await apiClient.listMessages(resolvedChannelId)
          setHistoryMessages(history)
          cacheChannelMessages(resolvedChannelId, history)
          await refreshPresence(resolvedChannelId)
          setFeedback('Mensaje enviado')
          setDraftMessage('')
          return
        } catch {
          // Continue with local fallback below.
        }
      }

      if (layoutMode !== 'legacy') {
        const fallbackMessage: Message = {
          id: makeLocalId('msg'),
          channel_id: resolvedChannelId,
          author_id: resolvedUserId,
          body: messageBody,
          created_at: new Date().toISOString()
        }
        const nextHistory = [...(localMessagesByChannel[resolvedChannelId] ?? historyMessages), fallbackMessage]
        setHistoryMessages(nextHistory)
        cacheChannelMessages(resolvedChannelId, nextHistory)
        setFeedback('Mensaje enviado (modo local)')
        setDraftMessage('')
        return
      }

      if (!apiClient) {
        setFeedback('Backend no disponible para enviar mensajes')
        return
      }

      connect()
      const sentOverWebSocket = sendMessage(messageBody)

      if (!sentOverWebSocket) {
        await apiClient.createMessage(resolvedChannelId, {
          author_id: resolvedUserId,
          body: messageBody
        })
        setFeedback('Mensaje enviado por fallback REST')
        const history = await apiClient.listMessages(resolvedChannelId)
        setHistoryMessages(history)
        await refreshPresence(resolvedChannelId)
      } else {
        setFeedback('Mensaje enviado por WebSocket')
      }

      setDraftMessage('')
    } catch (error) {
      setFeedback(toOperationalError(error, 'Error inesperado al enviar mensaje'))
    }
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
      setFeedback(toOperationalError(error, 'No fue posible crear usuario'))
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
      setFeedback(toOperationalError(error, 'No fue posible crear canal'))
    }
  }

  const handleJoinChannel = async (): Promise<void> => {
    if (!apiClient || !channelId || !userId) {
      return
    }

    try {
      await apiClient.addMemberToChannel(channelId, { user_id: userId })
      setFeedback('Usuario agregado al canal')
      await refreshPresence(channelId)
    } catch (error) {
      setFeedback(toOperationalError(error, 'No fue posible unir usuario al canal'))
    }
  }

  const handleLoadHistory = async (): Promise<void> => {
    if (!apiClient || !channelId) {
      return
    }

    try {
      const history = await apiClient.listMessages(channelId)
      setHistoryMessages(history)
      setFeedback(`Historial cargado: ${history.length} mensajes`)
    } catch (error) {
      setFeedback(toOperationalError(error, 'No fue posible cargar historial'))
    }
  }

  const handleSidebarItemSelect = (sectionId: string, itemId: string): void => {
    if (sectionId === 'channels') {
      setChannelId(itemId)
      setHistoryMessages(localMessagesByChannel[itemId] ?? [])
      if (apiClient) {
        void apiClient
          .listMessages(itemId)
          .then((history) => {
            setHistoryMessages(history)
            cacheChannelMessages(itemId, history)
            setFeedback(`Historial cargado: ${history.length} mensajes`)
          })
          .catch(() => {
            setHistoryMessages(localMessagesByChannel[itemId] ?? [])
          })

        void refreshPresence(itemId)
      }
      return
    }

    if (sectionId === 'dms') {
      setUserId(itemId)
      setFeedback('Usuario activo actualizado para envío de mensajes')
    }
  }

  const handleQuickCreateChannel = (): void => {
    const generatedName = `canal-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`

    if (!apiClient) {
      const localChannel: Channel = {
        id: makeLocalId('channel'),
        name: generatedName,
        topic: 'Canal creado desde la interfaz (local)',
        is_private: false
      }

      setChannels((current) => [localChannel, ...current])
      setChannelId(localChannel.id)
      setHistoryMessages([])
      setFeedback(`Canal creado: ${localChannel.name}`)
      return
    }

    void apiClient
      .createChannel({
        name: generatedName,
        topic: 'Canal creado desde la interfaz'
      })
      .then(async (created) => {
        setFeedback(`Canal creado: ${created.name}`)
        await refreshCatalogs(apiClient)
        setChannelId(created.id)
      })
      .catch((error) => {
        const localChannel: Channel = {
          id: makeLocalId('channel'),
          name: generatedName,
          topic: 'Canal creado desde la interfaz (local)',
          is_private: false
        }

        setChannels((current) => [localChannel, ...current])
        setChannelId(localChannel.id)
        setHistoryMessages([])
        setFeedback(toOperationalError(error, `Canal creado: ${localChannel.name} (modo local)`))
      })
  }

  if (layoutMode !== 'legacy') {
    return (
      <SlackLayoutAdapter
        workspaceName={workspaceName}
        users={users}
        channels={channels}
        selectedChannelId={channelId}
        historyMessages={historyMessages}
        events={events}
        presence={currentPresence}
        feedback={feedback || sessionStatus}
        draftMessage={draftMessage}
        onDraftMessageChange={setDraftMessage}
        onSendMessage={() => {
          void handleSendMessage()
        }}
        onSidebarItemSelect={handleSidebarItemSelect}
        onQuickCreateChannel={handleQuickCreateChannel}
        density="comfortable"
        sidebarCollapsed={false}
      />
    )
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
          <button
            className="w-fit rounded border border-slate-400 px-3 py-2 text-sm"
            onClick={handleCreateUser}
          >
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
          <button
            className="w-fit rounded border border-slate-400 px-3 py-2 text-sm"
            onClick={handleCreateChannel}
          >
            Crear canal
          </button>
        </article>

        <article className="grid gap-2">
          <h3 className="text-sm font-semibold">Usuarios disponibles</h3>
          <ul className="grid gap-2 text-xs">
            {users.length === 0 ? <li>No hay usuarios aún.</li> : null}
            {users.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded border border-slate-200 p-2"
              >
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
              <li
                key={item.id}
                className="flex items-center justify-between rounded border border-slate-200 p-2"
              >
                <span>
                  {item.name} {item.topic ? `- ${item.topic}` : ''}
                </span>
                <button
                  className="rounded border border-slate-300 px-2 py-1"
                  onClick={() => {
                    setChannelId(item.id)
                    void refreshPresence(item.id)
                  }}
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
            onChange={(event) => {
              const nextChannelId = event.target.value
              setChannelId(nextChannelId)
              void refreshPresence(nextChannelId)
            }}
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
            className="rounded border border-slate-400 px-3 py-2 text-sm"
            onClick={handleJoinChannel}
          >
            Unir usuario al canal
          </button>
          <button
            className="rounded border border-slate-400 px-3 py-2 text-sm"
            onClick={handleLoadHistory}
          >
            Cargar historial REST
          </button>
          <button
            className="rounded border border-slate-400 px-3 py-2 text-sm disabled:opacity-50"
            onClick={connect}
            disabled={!canConnect}
          >
            Conectar
          </button>
          <button
            className="rounded border border-slate-400 px-3 py-2 text-sm"
            onClick={disconnect}
          >
            Desconectar
          </button>
          <button
            className="rounded border border-slate-400 px-3 py-2 text-sm"
            onClick={() => {
              const pingSent = sendPing()
              setFeedback(
                pingSent ? 'Ping enviado por WebSocket' : 'Ping omitido: socket no conectado'
              )
            }}
          >
            Ping
          </button>
        </div>

        <p className="text-sm">Estado del socket: {status}</p>
        <p className="text-sm">Intentos de reconexión: {retryAttempt}</p>
        <p className="text-sm">Online en canal: {currentPresence?.online_count ?? 0}</p>
        <p className="text-sm break-all">
          Usuarios online: {currentPresence?.online_user_ids?.join(', ') || 'Sin usuarios online'}
        </p>
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
          <button
            className="rounded border border-slate-400 px-3 py-2 text-sm"
            onClick={() => {
              void handleSendMessage()
            }}
          >
            Enviar
          </button>
        </div>

        <article className="rounded border border-slate-200 p-3">
          <h3 className="mb-2 text-sm font-medium">Eventos del WebSocket</h3>
          <ul className="grid gap-2 text-xs">
            {events.length === 0 ? <li>No hay eventos aún.</li> : null}
            {events.map((event, index) => (
              <li key={`${event.type}-${index}`} className="rounded bg-slate-50 p-2">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded border border-slate-200 p-3">
          <h3 className="mb-2 text-sm font-medium">Historial REST de mensajes</h3>
          <ul className="grid gap-2 text-xs">
            {historyMessages.length === 0 ? <li>No hay historial cargado.</li> : null}
            {historyMessages.map((item) => (
              <li key={item.id} className="rounded bg-slate-50 p-2">
                <p>
                  <strong>Author:</strong> {item.author_id}
                </p>
                <p>
                  <strong>Body:</strong> {item.body}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default App
