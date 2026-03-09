from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.enums.todo_status import TodoStatus
from app.models.meeting import Meeting
from app.models.todo import Todo
from app.models.user import User
from app.models.workspace_member import WorkspaceMember

router = APIRouter(prefix="/todos", tags=["todos"])


class TodoStatusUpdateRequest(BaseModel):
    status: TodoStatus


@router.get("")
def get_todos(
    workspace_id: str | None = Query(default=None, alias="workspaceId"),
    meeting_id: str | None = Query(default=None, alias="meetingId"),
    assignee: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    stmt = (
        db.query(Todo, User.name.label("assignee_name"))
        .join(Meeting, Meeting.meeting_id == Todo.meeting_id)
        .outerjoin(WorkspaceMember, WorkspaceMember.member_id == Todo.assignee_member_id)
        .outerjoin(User, User.user_id == WorkspaceMember.user_id)
    )

    if workspace_id:
        stmt = stmt.filter(Meeting.workspace_id == workspace_id)
    if meeting_id:
        stmt = stmt.filter(Todo.meeting_id == meeting_id)
    if status:
        try:
            stmt = stmt.filter(Todo.status == TodoStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid todo status")

    if assignee:
        stmt = stmt.filter(User.name.ilike(f"%{assignee}%"))

    rows = stmt.order_by(Todo.created_at.desc()).all()
    return {
        "todos": [
            {
                "todo_id": str(todo.todo_id),
                "task": todo.task,
                "assignee": assignee_name,
                "status": todo.status.value
            }
            for todo, assignee_name in rows
        ]
    }


@router.patch("/{todo_id}")
def update_todo_status(todo_id: str, body: TodoStatusUpdateRequest, db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.todo_id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    todo.status = body.status
    db.commit()
    db.refresh(todo)

    return {
        "todo_id": str(todo.todo_id),
        "status": todo.status.value
    }
