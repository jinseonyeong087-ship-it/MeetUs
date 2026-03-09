from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.meeting import Meeting
from app.enums.meeting_status import MeetingStatus
from app.services.s3_service import generate_upload_url
from app.schemas.meeting_schema import (
    MeetingUploadComplete,
    MeetingDetailResponse,
    MeetingListResponse,
    MeetingResponse,
    TodoResponse
)
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.todo import Todo
from typing import Optional

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

    db.commit()

    return result

@router.post("/{meeting_id}/upload-complete")
def upload_complete(
    meeting_id: str,
    body: MeetingUploadComplete,
    db: Session = Depends(get_db)
):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # 전달받은 S3 키 업데이트 (안전장치)
    meeting.audio_s3_key = body.audio_s3_key
    meeting.status = MeetingStatus.UPLOADED
    db.commit()
    return {"status": "UPLOADED"}


@router.get("", response_model=MeetingListResponse)
def get_meetings(
    workspace_id: Optional[str] = None,
    status: Optional[str] = None,
    query: Optional[str] = None,
    page: int = 0,
    size: int = 10,
    db: Session = Depends(get_db)
):
    stmt = db.query(Meeting)
    
    if workspace_id:
        stmt = stmt.filter(Meeting.workspace_id == workspace_id)
    if status:
        stmt = stmt.filter(Meeting.status == status)
    if query:
        stmt = stmt.filter(Meeting.title.ilike(f"%{query}%"))
        
    total = stmt.count()
    meetings = stmt.order_by(Meeting.created_at.desc()).offset(page * size).limit(size).all()
    
    return {
        "meetings": meetings,
        "total": total
    }


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting_detail(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
    summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
    todos = db.query(Todo).filter(Todo.meeting_id == meeting_id).all()
    
    return {
        "meeting": meeting,
        "transcript": transcript.full_text if transcript else None,
        "summary": summary.summary_text if summary else None,
        "decisions": summary.decisions_text if summary else None,
        "todos": todos
    }


@router.post("/{meeting_id}/process")
def process_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    meeting.status = MeetingStatus.PROCESSING
    db.commit()
    
    # TODO: SQS 메시지 전송 로직 추가 필요
    
    return {"status": "PROCESSING"}


@router.post("/{meeting_id}/retry")
def retry_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    meeting.status = MeetingStatus.PROCESSING
    db.commit()
    
    # TODO: SQS 메시지 전송 로직 추가 필요
    
    return {"status": "PROCESSING"}