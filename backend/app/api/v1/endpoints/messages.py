from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, SQLModel, desc, select

from app.db.models import Message
from app.db.session import get_session

router = APIRouter()


class MessageRead(SQLModel):
    id: UUID
    channel_id: UUID
    author_id: UUID
    body: str


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
