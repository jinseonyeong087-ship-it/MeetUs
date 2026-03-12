from datetime import date, datetime, timedelta
import json
import os
import uuid
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError
import uuid

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
    TodoResponse,
)
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.todo import Todo
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.workspace import Workspace
from app.dependencies.auth import get_current_user_id

router = APIRouter(
    prefix="/meetings",
    tags=["meetings"],
)


def _get_sqs_client():
    return boto3.client("sqs", region_name=os.getenv("AWS_REGION"))


def _enqueue_meeting_processing(meeting: Meeting) -> None:
    queue_url = os.getenv("SQS_QUEUE_URL")
    if not queue_url:
        raise HTTPException(status_code=500, detail="SQS queue is not configured")
    if not meeting.audio_s3_key:
        raise HTTPException(status_code=400, detail="Meeting audio is not uploaded yet")

    payload = {
        "meeting_id": str(meeting.meeting_id),
        "audio_s3_key": meeting.audio_s3_key,
        "workspace_id": str(meeting.workspace_id),
        "title": meeting.title,
    }

    try:
        _get_sqs_client().send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(payload),
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=502, detail=f"Failed to enqueue meeting: {exc}") from exc


def _set_processing_and_enqueue(meeting: Meeting, db: Session) -> dict:
    previous_status = meeting.status
    previous_failure_reason = meeting.failure_reason

    meeting.status = MeetingStatus.PROCESSING
    meeting.failure_reason = None
    db.commit()

    try:
        _enqueue_meeting_processing(meeting)
    except HTTPException:
        meeting.status = previous_status
        meeting.failure_reason = previous_failure_reason
        db.commit()
        raise

    return {"status": "PROCESSING"}


@router.post("/{meeting_id}/upload-url")
def create_upload_url(
    meeting_id: str,
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.audio_s3_key = body.audio_s3_key
    meeting.status = MeetingStatus.UPLOADED
    meeting.failure_reason = None
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
    db: Session = Depends(get_db),
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
        "total": total,
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
                "assignee": assignee_name,
            }
            for todo, assignee_name in todo_rows
        ],
    }


@router.post("/{meeting_id}/process")
def process_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return _set_processing_and_enqueue(meeting, db)


@router.post("/{meeting_id}/retry")
def retry_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return _set_processing_and_enqueue(meeting, db)


@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    user_id: str | None = Depends(get_current_user_id),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Unauthorized")

    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    workspace = db.query(Workspace).filter(Workspace.workspace_id == meeting.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if workspace.owner_id != user_uuid:
        raise HTTPException(status_code=403, detail="Only workspace owner can delete meetings")

    db.query(Todo).filter(Todo.meeting_id == meeting.meeting_id).delete(synchronize_session=False)
    db.query(Transcript).filter(Transcript.meeting_id == meeting.meeting_id).delete(synchronize_session=False)
    db.query(Summary).filter(Summary.meeting_id == meeting.meeting_id).delete(synchronize_session=False)
    db.delete(meeting)
    db.commit()
    
    # TODO: SQS 메시지 전송 로직 추가 필요
    
    return {"status": "PROCESSING"}


@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    user_id: str | None = Depends(get_current_user_id)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Unauthorized")

    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    workspace = db.query(Workspace).filter(Workspace.workspace_id == meeting.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if workspace.owner_id != user_uuid:
        raise HTTPException(status_code=403, detail="Only workspace owner can delete meetings")

    db.query(Todo).filter(Todo.meeting_id == meeting.meeting_id).delete(synchronize_session=False)
    db.query(Transcript).filter(Transcript.meeting_id == meeting.meeting_id).delete(synchronize_session=False)
    db.query(Summary).filter(Summary.meeting_id == meeting.meeting_id).delete(synchronize_session=False)
    db.delete(meeting)
    db.commit()

    return {"status": "deleted"}
