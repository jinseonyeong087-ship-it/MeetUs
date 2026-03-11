from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
from app.enums.meeting_status import MeetingStatus
import uuid


class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.workspace_id"),
        nullable=False
    )

    title = Column(String(255), nullable=False)

    status = Column(
        Enum(MeetingStatus, name="meeting_status"),
        nullable=False
    )

    audio_s3_key = Column(Text)
    failure_reason = Column(Text)

    created_at = Column(TIMESTAMP, server_default=func.now())
