from sqlalchemy.orm import Session
from app.models.meeting import Meeting
from app.enums.meeting_status import MeetingStatus


def create_meeting(db: Session, workspace_id, title):

    meeting = Meeting(
        workspace_id=workspace_id,
        title=title,
        status=MeetingStatus.CREATED
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    return meeting