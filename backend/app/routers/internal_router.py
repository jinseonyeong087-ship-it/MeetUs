from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import date
from sqlalchemy.orm import Session

from app.database import get_db
from app.enums.meeting_status import MeetingStatus
from app.enums.todo_status import TodoStatus
from app.models.meeting import Meeting
from app.models.summary import Summary
from app.models.todo import Todo
from app.models.transcript import Transcript
from app.models.user import User
from app.models.workspace_member import WorkspaceMember

router = APIRouter(prefix="/internal", tags=["internal"])


class AiTodoPayload(BaseModel):
    task: str
    assignee: str | None = None
    due_date: date | None = None


class AiResultRequest(BaseModel):
    meeting_id: str
    transcript: str
    summary: str
    decisions: str
    todos: list[AiTodoPayload] = []


@router.post("/ai/result")
def save_ai_result(body: AiResultRequest, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == body.meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting.meeting_id).first()
    if transcript:
        transcript.full_text = body.transcript
    else:
        db.add(
            Transcript(
                meeting_id=meeting.meeting_id,
                full_text=body.transcript
            )
        )

    summary = db.query(Summary).filter(Summary.meeting_id == meeting.meeting_id).first()
    if summary:
        summary.summary_text = body.summary
        summary.decisions_text = body.decisions
    else:
        db.add(
            Summary(
                meeting_id=meeting.meeting_id,
                summary_text=body.summary,
                decisions_text=body.decisions
            )
        )

    db.query(Todo).filter(Todo.meeting_id == meeting.meeting_id).delete()
    for todo_payload in body.todos:
        assignee_member_id = None
        if todo_payload.assignee:
            member = (
                db.query(WorkspaceMember.member_id)
                .join(User, User.user_id == WorkspaceMember.user_id)
                .filter(
                    WorkspaceMember.workspace_id == meeting.workspace_id,
                    User.name == todo_payload.assignee.strip()
                )
                .first()
            )
            if member:
                assignee_member_id = member.member_id

        db.add(
            Todo(
                meeting_id=meeting.meeting_id,
                assignee_member_id=assignee_member_id,
                task=todo_payload.task,
                due_date=todo_payload.due_date,
                status=TodoStatus.PENDING
            )
        )

    meeting.status = MeetingStatus.COMPLETED
    meeting.failure_reason = None
    db.commit()

    return {"status": "saved"}


class AiFailedRequest(BaseModel):
    meeting_id: str
    reason: str | None = None


@router.post("/ai/failed")
def mark_ai_failed(body: AiFailedRequest, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == body.meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.status = MeetingStatus.FAILED
    meeting.failure_reason = body.reason
    db.commit()

    return {"status": "failed"}
