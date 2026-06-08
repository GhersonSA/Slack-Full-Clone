from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._channel_connections: dict[UUID, set[WebSocket]] = defaultdict(set)
        self._channel_user_connections: dict[UUID, dict[UUID, set[WebSocket]]] = defaultdict(
            lambda: defaultdict(set)
        )

    async def connect(self, channel_id: UUID, user_id: UUID, websocket: WebSocket) -> bool:
        await websocket.accept()
        self._channel_connections[channel_id].add(websocket)
        user_connections = self._channel_user_connections[channel_id][user_id]
        was_offline = len(user_connections) == 0
        user_connections.add(websocket)
        return was_offline

    def disconnect(self, channel_id: UUID, user_id: UUID, websocket: WebSocket) -> bool:
        channel_connections = self._channel_connections.get(channel_id)
        if channel_connections:
            channel_connections.discard(websocket)
            if not channel_connections:
                self._channel_connections.pop(channel_id, None)

        user_went_offline = False
        channel_users = self._channel_user_connections.get(channel_id)
        if channel_users:
            user_connections = channel_users.get(user_id)
            if user_connections:
                user_connections.discard(websocket)
                if not user_connections:
                    channel_users.pop(user_id, None)
                    user_went_offline = True
            if not channel_users:
                self._channel_user_connections.pop(channel_id, None)

        return user_went_offline

    def get_online_user_ids(self, channel_id: UUID) -> list[UUID]:
        channel_users = self._channel_user_connections.get(channel_id, {})
        return list(channel_users.keys())

    def get_online_count(self, channel_id: UUID) -> int:
        return len(self.get_online_user_ids(channel_id))

    async def broadcast_json(self, channel_id: UUID, payload: dict) -> None:
        channel_connections = self._channel_connections.get(channel_id, set()).copy()
        stale_connections: list[WebSocket] = []

        for connection in channel_connections:
            try:
                await connection.send_json(payload)
            except RuntimeError:
                stale_connections.append(connection)

        for stale in stale_connections:
            for user_id in self.get_online_user_ids(channel_id):
                self.disconnect(channel_id, user_id, stale)


connection_manager = ConnectionManager()
