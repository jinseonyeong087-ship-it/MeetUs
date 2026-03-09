# MeetingCreate → 요청 body
# MeetingResponse → API 응답

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class MeetingCreate(BaseModel):
    workspace_id: UUID
    title: str


class MeetingResponse(BaseModel):
    meeting_id: UUID
    workspace_id: UUID
    title: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class MeetingUploadComplete(BaseModel):
    audio_s3_key: str

class TodoResponse(BaseModel):
    todo_id: UUID
    task: str
    status: str
    
    class Config:
        from_attributes = True

class MeetingDetailResponse(BaseModel):
    meeting: MeetingResponse
    summary: Optional[str] = None
    decisions: Optional[str] = None
    transcript: Optional[str] = None
    todos: List[TodoResponse] = []

class MeetingListResponse(BaseModel):
    meetings: List[MeetingResponse]
    total: int