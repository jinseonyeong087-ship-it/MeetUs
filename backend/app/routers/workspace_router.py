from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user_email
from app.enums.meeting_status import MeetingStatus
from app.models.meeting import Meeting
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class WorkspaceCreateRequest(BaseModel):
    name: str


class WorkspaceInviteRequest(BaseModel):
    email: str


class MeetingCreateRequest(BaseModel):
    title: str


def _require_user(db: Session, user_email: str | None) -> User:
    if not user_email:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


@router.post("")
def create_workspace(
    body: WorkspaceCreateRequest,
    db: Session = Depends(get_db),
    user_email: str | None = Depends(get_current_user_email)
):
    user = _require_user(db, user_email)

    workspace = Workspace(name=body.name.strip())
    workspace.owner_id = user.user_id
    db.add(workspace)
    db.flush()

    member = WorkspaceMember(
        workspace_id=workspace.workspace_id,
        user_id=user.user_id,
        role="OWNER"
    )
    db.add(member)
    db.commit()
    db.refresh(workspace)

    return {
        "workspace_id": str(workspace.workspace_id),
        "name": workspace.name
    }


@router.get("")
def get_workspaces(
    db: Session = Depends(get_db),
    user_email: str | None = Depends(get_current_user_email)
):
    user = _require_user(db, user_email)

    rows = (
        db.query(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, Workspace.workspace_id == WorkspaceMember.workspace_id)
        .filter(WorkspaceMember.user_id == user.user_id)
        .order_by(Workspace.created_at.desc())
        .all()
    )

    return {
        "workspaces": [
            {
                "workspace_id": str(workspace.workspace_id),
                "name": workspace.name,
                "role": role
            }
            for workspace, role in rows
        ]
    }


@router.post("/{workspace_id}/invite")
def invite_workspace_member(
    workspace_id: str,
    body: WorkspaceInviteRequest,
    db: Session = Depends(get_db),
    user_email: str | None = Depends(get_current_user_email)
):
    _require_user(db, user_email)

    workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    invited_user = db.query(User).filter(User.email == body.email.strip()).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")

    exists = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace.workspace_id,
            WorkspaceMember.user_id == invited_user.user_id
        )
        .first()
    )
    if not exists:
        db.add(
            WorkspaceMember(
                workspace_id=workspace.workspace_id,
                user_id=invited_user.user_id,
                role="MEMBER"
            )
        )
        db.commit()

    return {"status": "invited"}


@router.post("/{workspace_id}/leave")
def leave_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    user_email: str | None = Depends(get_current_user_email)
):
    user = _require_user(db, user_email)

    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.user_id
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Membership not found")

    db.delete(member)
    db.commit()
    return {"status": "left"}


@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    user_email: str | None = Depends(get_current_user_email)
):
    _require_user(db, user_email)

    workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    db.delete(workspace)
    db.commit()
    return {"status": "deleted"}


@router.post("/{workspace_id}/meetings")
def create_meeting(
    workspace_id: str,
    body: MeetingCreateRequest,
    db: Session = Depends(get_db),
    user_email: str | None = Depends(get_current_user_email)
):
    _require_user(db, user_email)

    workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    meeting = Meeting(
        workspace_id=workspace.workspace_id,
        title=body.title.strip(),
        status=MeetingStatus.CREATED
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    return {
        "meeting_id": str(meeting.meeting_id),
        "workspace_id": str(meeting.workspace_id),
        "status": meeting.status.value
    }
