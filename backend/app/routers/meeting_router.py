from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
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
from app.models.user import User
from app.models.workspace_member import WorkspaceMember

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

    meeting.audio_s3_key = result.get("audio_key") or result.get("s3_key")

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
    workspace_id: Optional[str] = Query(default=None, alias="workspaceId"),
    status: Optional[str] = None,
    query: Optional[str] = None,
    from_date: Optional[date] = Query(default=None, alias="fromDate"),
    to_date: Optional[date] = Query(default=None, alias="toDate"),
    sort: Optional[str] = Query(default="date-desc"),
    page: int = 0,
    size: int = 10,
    db: Session = Depends(get_db)
):
    stmt = db.query(Meeting)
    
    if workspace_id:
        stmt = stmt.filter(Meeting.workspace_id == workspace_id)
    if status:
        try:
            stmt = stmt.filter(Meeting.status == MeetingStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid meeting status")
    if query:
        stmt = stmt.filter(Meeting.title.ilike(f"%{query}%"))
    if from_date:
        stmt = stmt.filter(Meeting.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        to_date_exclusive = datetime.combine(to_date + timedelta(days=1), datetime.min.time())
        stmt = stmt.filter(Meeting.created_at < to_date_exclusive)
        
    total = stmt.count()
    if sort == "date-asc":
        stmt = stmt.order_by(Meeting.created_at.asc())
    elif sort == "status":
        stmt = stmt.order_by(Meeting.status.asc(), Meeting.created_at.desc())
    else:
        stmt = stmt.order_by(Meeting.created_at.desc())

    meetings = stmt.offset(page * size).limit(size).all()
    
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
    todo_rows = (
        db.query(Todo, User.name.label("assignee_name"))
        .outerjoin(WorkspaceMember, WorkspaceMember.member_id == Todo.assignee_member_id)
        .outerjoin(User, User.user_id == WorkspaceMember.user_id)
        .filter(Todo.meeting_id == meeting_id)
        .all()
    )
    
    return {
        "meeting": meeting,
        "transcript": transcript.full_text if transcript else None,
        "summary": summary.summary_text if summary else None,
        "decisions": summary.decisions_text if summary else None,
        "todos": [
            {
                "todo_id": todo.todo_id,
                "task": todo.task,
                "status": todo.status.value,
                "due_date": todo.due_date,
                "assignee": assignee_name
            }
            for todo, assignee_name in todo_rows
        ]
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
