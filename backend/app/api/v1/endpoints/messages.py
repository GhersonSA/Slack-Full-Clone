from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, SQLModel, desc, select

from app.db.models import Channel, ChannelMember, Message, User
from app.db.session import get_session

router = APIRouter()


class MessageCreate(SQLModel):
    author_id: UUID
    body: str


class MessageRead(SQLModel):
    id: UUID
    channel_id: UUID
    author_id: UUID
    body: str
    created_at: datetime


def _ensure_message_context(session: Session, channel_id: UUID, author_id: UUID) -> None:
    channel: Optional[Channel] = session.get(Channel, channel_id)
    if channel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    user: Optional[User] = session.get(User, author_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    membership_query = select(ChannelMember).where(
        ChannelMember.channel_id == channel_id,
        ChannelMember.user_id == author_id,
    )
    membership = session.exec(membership_query).first()
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a channel member")


@router.post("/channels/{channel_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def create_channel_message(
    channel_id: UUID,
    payload: MessageCreate,
    session: Session = Depends(get_session),
) -> Message:
    _ensure_message_context(session, channel_id, payload.author_id)

    message = Message(channel_id=channel_id, author_id=payload.author_id, body=payload.body)
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


@router.get("/channels/{channel_id}/messages", response_model=list[MessageRead])
def list_channel_messages(
    channel_id: UUID,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    session: Session = Depends(get_session),
) -> list[Message]:
    query = (
        select(Message)
        .where(Message.channel_id == channel_id)
        .order_by(desc(Message.created_at))
        .offset(offset)
        .limit(limit)
    )
    items = list(session.exec(query))
    items.reverse()
    return items
