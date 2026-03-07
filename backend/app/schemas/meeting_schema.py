# MeetingCreate → 요청 body
# MeetingResponse → API 응답

from pydantic import BaseModel
from uuid import UUID

class MeetingCreate(BaseModel):
    workspace_id: UUID
    title: str


class MeetingResponse(BaseModel):
    meeting_id: UUID
    workspace_id: UUID
    title: str
    status: str

    class Config:
        from_attributes = True