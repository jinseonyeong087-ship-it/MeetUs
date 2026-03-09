from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.meeting import Meeting
from app.services.s3_service import generate_upload_url

router = APIRouter(
    prefix="/meetings",
    tags=["meetings"]
)


@router.post("/{meeting_id}/upload-url")
def create_upload_url(
    meeting_id: str,
    db: Session = Depends(get_db)
):

    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    result = generate_upload_url(meeting_id)

    meeting.audio_s3_key = result["s3_key"]
    meeting.status = "UPLOADED"

    db.commit()

    return result