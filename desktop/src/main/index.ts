import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { IPC_CHANNELS, type AppInfo, type RuntimeConfig } from '../shared/ipc'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_WS_BASE_URL = 'ws://127.0.0.1:8000'

function configureDevStoragePaths(): void {
  if (!is.dev) {
    return
  }

  const basePath = join(tmpdir(), 'slack-full-clone-dev')
  const userDataPath = join(basePath, 'user-data')
  const sessionDataPath = join(basePath, 'session-data')
  const cachePath = join(basePath, 'cache')

  mkdirSync(userDataPath, { recursive: true })
  mkdirSync(sessionDataPath, { recursive: true })
  mkdirSync(cachePath, { recursive: true })

  app.setPath('userData', userDataPath)
  app.setPath('sessionData', sessionDataPath)
  app.commandLine.appendSwitch('disk-cache-dir', cachePath)
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
}

configureDevStoragePaths()

function getRuntimeConfig(): RuntimeConfig {
  return {
    apiBaseUrl: process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
    wsBaseUrl: process.env.WS_BASE_URL ?? DEFAULT_WS_BASE_URL
  }
}

function getAppInfo(): AppInfo {
  return {
    appName: app.getName(),
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    chromiumVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    platform: process.platform
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: is.dev
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = new URL(mainWindow.webContents.getURL() || 'http://localhost')
    const targetUrl = new URL(url)

    if (targetUrl.origin !== appUrl.origin) {
      event.preventDefault()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_INFO, () => getAppInfo())
  ipcMain.handle(IPC_CHANNELS.APP_GET_RUNTIME_CONFIG, () => getRuntimeConfig())

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
