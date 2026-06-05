from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from pydantic import ValidationError
from sqlmodel import Session, desc, select

from app.db.models import Channel, Message, User
from app.db.session import engine
from app.realtime.connection_manager import connection_manager
from app.realtime.schemas import IncomingChatEvent, OutgoingChatMessage, OutgoingSystemEvent

router = APIRouter()


def _ensure_chat_membership(session: Session, channel_id: UUID, user_id: UUID) -> tuple[Channel | None, User | None]:
    channel = session.get(Channel, channel_id)
    user = session.get(User, user_id)
    return channel, user


@router.websocket("/ws/channels/{channel_id}")
async def channel_chat(websocket: WebSocket, channel_id: UUID, user_id: UUID = Query(...)) -> None:
    with Session(engine) as session:
        channel, user = _ensure_chat_membership(session, channel_id, user_id)
        if channel is None or user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await connection_manager.connect(channel_id, websocket)

        history_query = (
            select(Message)
            .where(Message.channel_id == channel_id)
            .order_by(desc(Message.created_at))
            .limit(50)
        )
        history_items = list(session.exec(history_query))

        for item in reversed(history_items):
            history_payload = OutgoingChatMessage(
                id=item.id,
                channel_id=item.channel_id,
                author_id=item.author_id,
                body=item.body,
                created_at=item.created_at,
            )
            await websocket.send_json(history_payload.model_dump(mode="json"))

        joined_event = OutgoingSystemEvent(type="system", detail=f"{user.username} joined channel {channel.name}")
        await connection_manager.broadcast_json(channel_id, joined_event.model_dump(mode="json"))

        try:
            while True:
                incoming_payload = await websocket.receive_json()

                if incoming_payload.get("type") == "ping":
                    pong_event = OutgoingSystemEvent(type="pong", detail="pong")
                    await websocket.send_json(pong_event.model_dump(mode="json"))
                    continue

                try:
                    incoming = IncomingChatEvent.model_validate(incoming_payload)
                except ValidationError:
                    error_event = OutgoingSystemEvent(type="error", detail="Invalid payload")
                    await websocket.send_json(error_event.model_dump(mode="json"))
                    continue

                message = Message(channel_id=channel_id, author_id=user_id, body=incoming.body)
                session.add(message)
                session.commit()
                session.refresh(message)

                outgoing = OutgoingChatMessage(
                    id=message.id,
                    channel_id=message.channel_id,
                    author_id=message.author_id,
                    body=message.body,
                    created_at=message.created_at,
                )
                await connection_manager.broadcast_json(channel_id, outgoing.model_dump(mode="json"))

        except WebSocketDisconnect:
            connection_manager.disconnect(channel_id, websocket)
            left_event = OutgoingSystemEvent(type="system", detail=f"{user.username} left channel {channel.name}")
            await connection_manager.broadcast_json(channel_id, left_event.model_dump(mode="json"))
