from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, SQLModel, select

from app.db.models import Channel
from app.db.session import get_session

router = APIRouter()


class ChannelCreate(SQLModel):
    name: str
    topic: Optional[str] = None
    is_private: bool = False


class ChannelRead(SQLModel):
    id: UUID
    name: str
    topic: Optional[str]
    is_private: bool


@router.post("", response_model=ChannelRead, status_code=status.HTTP_201_CREATED)
def create_channel(payload: ChannelCreate, session: Session = Depends(get_session)) -> Channel:
    channel = Channel.model_validate(payload)

    session.add(channel)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Channel name already exists") from exc

    session.refresh(channel)
    return channel


@router.get("", response_model=list[ChannelRead])
def list_channels(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
) -> list[Channel]:
    query = select(Channel).offset(offset).limit(limit)
    return list(session.exec(query))


@router.get("/{channel_id}", response_model=ChannelRead)
def get_channel(channel_id: UUID, session: Session = Depends(get_session)) -> Channel:
    channel: Optional[Channel] = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    return channel
