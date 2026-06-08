from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class IncomingChatEvent(BaseModel):
    type: str = Field(default="message")
    body: str = Field(min_length=1, max_length=4000)


class OutgoingChatMessage(BaseModel):
    type: str = Field(default="message")
    id: UUID
    channel_id: UUID
    author_id: UUID
    body: str
    created_at: datetime


class OutgoingSystemEvent(BaseModel):
    type: str
    detail: str


class OutgoingPresenceEvent(BaseModel):
    type: str = Field(default="presence")
    channel_id: UUID
    online_count: int
    online_user_ids: list[UUID]


class PresenceRead(BaseModel):
    channel_id: UUID
    online_count: int
    online_user_ids: list[UUID]
