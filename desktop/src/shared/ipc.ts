export const IPC_CHANNELS = {
  APP_GET_INFO: 'app:get-info',
  APP_GET_RUNTIME_CONFIG: 'app:get-runtime-config'
} as const

export interface AppInfo {
  appName: string
  appVersion: string
  electronVersion: string
  chromiumVersion: string
  nodeVersion: string
  platform: NodeJS.Platform
}

export interface RuntimeConfig {
  apiBaseUrl: string
  wsBaseUrl: string
}

export interface DesktopApi {
  getAppInfo: () => Promise<AppInfo>
  getRuntimeConfig: () => Promise<RuntimeConfig>
}
