# desktop

Electron desktop shell for the Slack clone MVP (infrastructure only, no final UI).

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

## Runtime Environment Variables

The main process exposes runtime config to the renderer over secure IPC:

- `API_BASE_URL` default: `http://127.0.0.1:8000`
- `WS_BASE_URL` default: `ws://127.0.0.1:8000`

Example (PowerShell):

```powershell
$env:API_BASE_URL = "http://127.0.0.1:8000"
$env:WS_BASE_URL = "ws://127.0.0.1:8000"
npm run dev
```

## Desktop Architecture Notes

- `src/main/index.ts`: secure BrowserWindow configuration + typed IPC handlers.
- `src/preload/index.ts`: minimal bridge exposed through `window.api`.
- `src/shared/ipc.ts`: shared IPC contract types/channels.
- `src/renderer/src/hooks/useChannelWebSocket.ts`: reusable realtime connection hook.

## MVP E2E Flow (Current)

1. Load runtime config through IPC (`window.api.getRuntimeConfig`).
2. Create user and channel from renderer via REST to FastAPI.
3. Select the generated user/channel IDs.
4. Open WebSocket connection to `/api/v1/realtime/ws/channels/{channel_id}?user_id={user_id}`.
5. Send test chat messages and inspect incoming websocket events.

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
