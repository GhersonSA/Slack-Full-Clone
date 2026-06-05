from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    username: str = Field(index=True, unique=True, min_length=3, max_length=50)
    display_name: str = Field(min_length=1, max_length=100)
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class Channel(SQLModel, table=True):
    __tablename__ = "channels"

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    name: str = Field(index=True, unique=True, min_length=1, max_length=80)
    topic: Optional[str] = Field(default=None, max_length=255)
    is_private: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    channel_id: UUID = Field(foreign_key="channels.id", index=True)
    author_id: UUID = Field(foreign_key="users.id", index=True)
    body: str = Field(min_length=1, max_length=4000)
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class ChannelMember(SQLModel, table=True):
    __tablename__ = "channel_members"
    __table_args__ = (UniqueConstraint("channel_id", "user_id", name="uq_channel_members_channel_user"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    channel_id: UUID = Field(foreign_key="channels.id", index=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
