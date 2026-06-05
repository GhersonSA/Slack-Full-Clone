from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, SQLModel, select

from app.db.models import Channel, ChannelMember, User
from app.db.session import get_session

router = APIRouter()


class ChannelMemberCreate(SQLModel):
    user_id: UUID


class ChannelMemberRead(SQLModel):
    id: UUID
    channel_id: UUID
    user_id: UUID


@router.post("/channels/{channel_id}/members", response_model=ChannelMemberRead, status_code=status.HTTP_201_CREATED)
def add_member_to_channel(
    channel_id: UUID,
    payload: ChannelMemberCreate,
    session: Session = Depends(get_session),
) -> ChannelMember:
    channel: Optional[Channel] = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    user: Optional[User] = session.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    membership = ChannelMember(channel_id=channel_id, user_id=payload.user_id)
    session.add(membership)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member") from exc

    session.refresh(membership)
    return membership


@router.get("/channels/{channel_id}/members", response_model=list[ChannelMemberRead])
def list_channel_members(
    channel_id: UUID,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
) -> list[ChannelMember]:
    query = select(ChannelMember).where(ChannelMember.channel_id == channel_id).offset(offset).limit(limit)
    return list(session.exec(query))
