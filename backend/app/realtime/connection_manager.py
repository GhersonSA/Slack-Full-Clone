from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._channel_connections: dict[UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, channel_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self._channel_connections[channel_id].add(websocket)

    def disconnect(self, channel_id: UUID, websocket: WebSocket) -> None:
        channel_connections = self._channel_connections.get(channel_id)
        if not channel_connections:
            return

        channel_connections.discard(websocket)
        if not channel_connections:
            self._channel_connections.pop(channel_id, None)

    async def broadcast_json(self, channel_id: UUID, payload: dict) -> None:
        channel_connections = self._channel_connections.get(channel_id, set()).copy()
        stale_connections: list[WebSocket] = []

        for connection in channel_connections:
            try:
                await connection.send_json(payload)
            except RuntimeError:
                stale_connections.append(connection)

        for stale in stale_connections:
            self.disconnect(channel_id, stale)


connection_manager = ConnectionManager()
