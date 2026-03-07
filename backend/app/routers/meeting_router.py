from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.meeting_schema import MeetingCreate, MeetingResponse
from app.services.meeting_service import create_meeting

router = APIRouter(
    prefix="/meetings",
    tags=["meetings"]
)


@router.post("", response_model=MeetingResponse)
def create_meeting_api(
    meeting: MeetingCreate,
    db: Session = Depends(get_db)
):
    return create_meeting(db, meeting.workspace_id, meeting.title)